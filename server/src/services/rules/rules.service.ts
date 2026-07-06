import {
  createRule as createRuleRecord,
  fetchExecutionLogs,
  fetchRules,
  runRuleEngine,
  simulateRuleEngine,
} from './engine';
import { RulePayload } from './types';

export async function getRules(userId: string) {
  return fetchRules(userId);
}

export async function createRule(userId: string, payload: RulePayload) {
  return createRuleRecord(userId, payload);
}

export async function executeRules(userId: string) {
  return runRuleEngine(userId, false);
}

export async function simulateRules(userId: string) {
  return simulateRuleEngine(userId);
}

export async function getRuleLogs(userId: string, limit = 50) {
  return fetchExecutionLogs(userId, limit);
}
