export type Comparator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
export type ConditionGroupOperator = 'AND' | 'OR';

export type RuleConditionNode =
  | {
      type: 'group';
      operator: ConditionGroupOperator;
      conditions: RuleConditionNode[];
    }
  | {
      type: 'condition';
      field: string;
      comparator: Comparator;
      value: string | number | boolean;
    };

export type RuleActionType =
  | 'pause_campaign'
  | 'resume_campaign'
  | 'increase_budget'
  | 'decrease_budget'
  | 'send_notification'
  | 'enable_rule'
  | 'disable_rule';

export interface RuleAction {
  type: RuleActionType;
  params?: Record<string, any>;
}

export interface RulePayload {
  name: string;
  description?: string;
  enabled?: boolean;
  priority?: number;
  cooldownMinutes?: number;
  conditions: RuleConditionNode[];
  actions: RuleAction[];
}

export interface RuleExecutionSummary {
  ruleId: string;
  ruleName: string;
  targetType: string;
  targetId: string;
  targetName: string;
  matched: boolean;
  simulated: boolean;
  actions: RuleAction[];
  error?: string;
  durationMs: number;
}
