import prisma from '../../prisma/client';
import logger from '../../utils/logger';
import { RuleAction, RuleConditionNode, RulePayload, RuleExecutionSummary } from './types';

function compareValues(comparator: string, actual: unknown, expected: unknown): boolean {
  if (actual === null || actual === undefined) return false;

  if (['gt', 'gte', 'lt', 'lte'].includes(comparator)) {
    const actualNumber = Number(actual);
    const expectedNumber = Number(expected);
    if (Number.isNaN(actualNumber) || Number.isNaN(expectedNumber)) return false;

    switch (comparator) {
      case 'gt':
        return actualNumber > expectedNumber;
      case 'gte':
        return actualNumber >= expectedNumber;
      case 'lt':
        return actualNumber < expectedNumber;
      case 'lte':
        return actualNumber <= expectedNumber;
    }
  }

  if (comparator === 'eq') return String(actual) === String(expected);
  if (comparator === 'neq') return String(actual) !== String(expected);

  return false;
}

function evaluateConditionNode(node: RuleConditionNode, metrics: Record<string, any>): boolean {
  if (node.type === 'group') {
    const results = node.conditions.map(child => evaluateConditionNode(child, metrics));
    if (node.operator === 'AND') {
      return results.every(Boolean);
    }
    return results.some(Boolean);
  }

  const actualValue = metrics[node.field];
  return compareValues(node.comparator, actualValue, node.value);
}

function buildMetricsFromCampaign(campaign: any) {
  return {
    spent: campaign.spent,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    ctr: campaign.ctr ?? 0,
    cpc: campaign.cpc ?? 0,
    dailyBudget: campaign.dailyBudget ?? 0,
    status: campaign.status,
    name: campaign.name,
    roas: campaign.roas ?? 0,
    conversions: campaign.conversions ?? 0,
    cpm: campaign.impressions ? (campaign.spent / campaign.impressions) * 1000 : 0,
    cpa: campaign.clicks ? campaign.spent / campaign.clicks : 0,
  };
}

async function executeActionForCampaign(
  ruleId: string,
  campaign: any,
  action: RuleAction,
  simulate: boolean,
): Promise<{ action: RuleAction; result: Record<string, any> }> {
  const target = { id: campaign.id, name: campaign.name, type: 'campaign' };
  const params = action.params || {};

  if (simulate) {
    return {
      action,
      result: { simulated: true, target, params },
    };
  }

  switch (action.type) {
    case 'pause_campaign': {
      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'PAUSED' },
      });
      return { action, result: { updatedStatus: updated.status, target } };
    }
    case 'resume_campaign': {
      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'ACTIVE' },
      });
      return { action, result: { updatedStatus: updated.status, target } };
    }
    case 'increase_budget': {
      const amount = Number(params.amount ?? 0);
      if (!amount || amount <= 0) {
        return { action, result: { error: 'Missing or invalid amount parameter', target } };
      }
      const unit = params.unit === 'percent' ? 'percent' : 'absolute';
      const currentBudget = campaign.dailyBudget ?? 0;
      const nextBudget = unit === 'percent' ? currentBudget * (1 + amount / 100) : currentBudget + amount;
      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: { dailyBudget: nextBudget },
      });
      return { action, result: { previousBudget: currentBudget, nextBudget: updated.dailyBudget, unit, target } };
    }
    case 'decrease_budget': {
      const amount = Number(params.amount ?? 0);
      if (!amount || amount <= 0) {
        return { action, result: { error: 'Missing or invalid amount parameter', target } };
      }
      const unit = params.unit === 'percent' ? 'percent' : 'absolute';
      const currentBudget = campaign.dailyBudget ?? 0;
      const nextBudget = unit === 'percent' ? currentBudget * (1 - amount / 100) : currentBudget - amount;
      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: { dailyBudget: nextBudget < 0 ? 0 : nextBudget },
      });
      return { action, result: { previousBudget: currentBudget, nextBudget: updated.dailyBudget, unit, target } };
    }
    case 'send_notification': {
      logger.info('Rule engine notification', { ruleId, campaignId: campaign.id, params });
      return { action, result: { notification: params, target } };
    }
    case 'enable_rule': {
      await prisma.rule.update({ where: { id: ruleId }, data: { enabled: true } });
      return { action, result: { ruleEnabled: true, target } };
    }
    case 'disable_rule': {
      await prisma.rule.update({ where: { id: ruleId }, data: { enabled: false } });
      return { action, result: { ruleEnabled: false, target } };
    }
    default:
      return { action, result: { error: 'Unsupported action type', target } };
  }
}

export async function runRuleEngine(userId: string, simulate = false) {
  const rules = await prisma.rule.findMany({
    where: { userId, enabled: true },
    orderBy: { priority: 'desc' },
  });

  const campaigns = await prisma.campaign.findMany({
    where: {
      snapchatAccount: {
        userId,
      },
    },
  });

  const summaries: RuleExecutionSummary[] = [];

  for (const campaign of campaigns) {
    const metrics = buildMetricsFromCampaign(campaign);

    for (const rule of rules) {
      const start = Date.now();
      let matched = false;
      let actions: RuleAction[] = [];
      let error: string | undefined;

      try {
        const conditions: RuleConditionNode[] = rule.conditions as RuleConditionNode[];
        matched = evaluateConditionNode({ type: 'group', operator: 'AND', conditions }, metrics);

        if (matched) {
          actions = rule.actions as RuleAction[];
          if (!simulate) {
            for (const action of actions) {
              const result = await executeActionForCampaign(rule.id, campaign, action, false);
              logger.info('Rule action executed', { ruleId: rule.id, action: result.action.type, result: result.result });
            }

            await prisma.rule.update({
              where: { id: rule.id },
              data: { lastExecutedAt: new Date() },
            });
          }
        }
      } catch (err: any) {
        matched = false;
        error = err?.message || 'Rule evaluation failed';
        logger.error('Rule evaluation error', { ruleId: rule.id, campaignId: campaign.id, err });
      }

      const durationMs = Date.now() - start;
      summaries.push({
        ruleId: rule.id,
        ruleName: rule.name,
        targetType: 'campaign',
        targetId: campaign.id,
        targetName: campaign.name,
        matched,
        simulated: simulate,
        actions: actions ?? [],
        error,
        durationMs,
      });

      await prisma.ruleExecutionLog.create({
        data: {
          ruleId: rule.id,
          userId,
          targetType: 'campaign',
          targetId: campaign.id,
          targetName: campaign.name,
          simulated: simulate,
          matched,
          actions: actions as any,
          result: {
            matched,
            simulated: simulate,
            error,
            actionCount: actions.length,
          },
          executedAt: new Date(),
          durationMs,
        },
      });
    }
  }

  return {
    runAt: new Date(),
    rulesEvaluated: rules.length,
    campaignsEvaluated: campaigns.length,
    summaries,
  };
}

export async function simulateRuleEngine(userId: string) {
  return runRuleEngine(userId, true);
}

export async function createRule(userId: string, payload: RulePayload) {
  return prisma.rule.create({
    data: {
      userId,
      name: payload.name,
      description: payload.description ?? '',
      enabled: payload.enabled ?? true,
      priority: payload.priority ?? 0,
      cooldownMinutes: payload.cooldownMinutes ?? 0,
      conditions: payload.conditions as any,
      actions: payload.actions as any,
    },
  });
}

export async function fetchRules(userId: string) {
  return prisma.rule.findMany({
    where: { userId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function fetchExecutionLogs(userId: string, limit = 50) {
  return prisma.ruleExecutionLog.findMany({
    where: { userId },
    orderBy: { executedAt: 'desc' },
    take: limit,
  });
}
