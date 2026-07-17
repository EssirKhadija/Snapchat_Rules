export type ConditionField = 'spend' | 'ctr' | 'cpc' | 'cpa' | 'cpm' | 'roas' | 'conversions' | 'clicks' | 'impressions' | 'status';
export type ConditionOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

export interface RuleCondition {
  id: string;
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
}

export type ActionType = 'pause_campaign' | 'resume_campaign' | 'increase_budget' | 'decrease_budget' | 'send_notification' | 'enable_rule' | 'disable_rule';

export interface RuleAction {
  id: string;
  type: ActionType;
  params?: Record<string, any>;
}

export interface RuleDTO {
  id?: string;
  name: string;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority?: number;
  cooldownMinutes?: number;
}
