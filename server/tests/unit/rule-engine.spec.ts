import { compareValues, evaluateConditionNode } from '../../src/services/rules/engine';
import { RuleConditionNode } from '../../src/services/rules/types';

describe('Rule Engine Unit Tests', () => {
  describe('compareValues', () => {
    it('should compare greater than', () => {
      expect(compareValues('gt', 100, 50)).toBe(true);
      expect(compareValues('gt', 50, 100)).toBe(false);
      expect(compareValues('gt', 100, 100)).toBe(false);
    });

    it('should compare greater than or equal', () => {
      expect(compareValues('gte', 100, 100)).toBe(true);
      expect(compareValues('gte', 100, 50)).toBe(true);
      expect(compareValues('gte', 50, 100)).toBe(false);
    });

    it('should compare less than', () => {
      expect(compareValues('lt', 50, 100)).toBe(true);
      expect(compareValues('lt', 100, 50)).toBe(false);
    });

    it('should compare less than or equal', () => {
      expect(compareValues('lte', 100, 100)).toBe(true);
      expect(compareValues('lte', 50, 100)).toBe(true);
      expect(compareValues('lte', 100, 50)).toBe(false);
    });

    it('should compare equals', () => {
      expect(compareValues('eq', 'active', 'active')).toBe(true);
      expect(compareValues('eq', 'active', 'paused')).toBe(false);
      expect(compareValues('eq', 100, '100')).toBe(true);
    });

    it('should compare not equals', () => {
      expect(compareValues('neq', 'active', 'paused')).toBe(true);
      expect(compareValues('neq', 'active', 'active')).toBe(false);
    });

    it('should return false for null/undefined values', () => {
      expect(compareValues('gt', null, 100)).toBe(false);
      expect(compareValues('eq', undefined, 'value')).toBe(false);
    });
  });

  describe('evaluateConditionNode', () => {
    it('should evaluate simple condition', () => {
      const condition: RuleConditionNode = {
        type: 'condition',
        field: 'spent',
        comparator: 'gt',
        value: 100,
      };
      const metrics = { spent: 150 };

      const result = evaluateConditionNode(condition, metrics);

      expect(result).toBe(true);
    });

    it('should evaluate AND group (all true)', () => {
      const conditions: RuleConditionNode[] = [
        { type: 'condition', field: 'spent', comparator: 'gt', value: 100 },
        { type: 'condition', field: 'clicks', comparator: 'lt', value: 50 },
      ];
      const group: RuleConditionNode = {
        type: 'group',
        operator: 'AND',
        conditions,
      };
      const metrics = { spent: 150, clicks: 30 };

      const result = evaluateConditionNode(group, metrics);

      expect(result).toBe(true);
    });

    it('should evaluate AND group (one false)', () => {
      const conditions: RuleConditionNode[] = [
        { type: 'condition', field: 'spent', comparator: 'gt', value: 100 },
        { type: 'condition', field: 'clicks', comparator: 'lt', value: 50 },
      ];
      const group: RuleConditionNode = {
        type: 'group',
        operator: 'AND',
        conditions,
      };
      const metrics = { spent: 150, clicks: 60 };

      const result = evaluateConditionNode(group, metrics);

      expect(result).toBe(false);
    });

    it('should evaluate OR group (one true)', () => {
      const conditions: RuleConditionNode[] = [
        { type: 'condition', field: 'spent', comparator: 'gt', value: 100 },
        { type: 'condition', field: 'clicks', comparator: 'lt', value: 50 },
      ];
      const group: RuleConditionNode = {
        type: 'group',
        operator: 'OR',
        conditions,
      };
      const metrics = { spent: 150, clicks: 60 };

      const result = evaluateConditionNode(group, metrics);

      expect(result).toBe(true);
    });

    it('should evaluate OR group (all false)', () => {
      const conditions: RuleConditionNode[] = [
        { type: 'condition', field: 'spent', comparator: 'gt', value: 200 },
        { type: 'condition', field: 'clicks', comparator: 'lt', value: 10 },
      ];
      const group: RuleConditionNode = {
        type: 'group',
        operator: 'OR',
        conditions,
      };
      const metrics = { spent: 150, clicks: 30 };

      const result = evaluateConditionNode(group, metrics);

      expect(result).toBe(false);
    });

    it('should handle nested groups', () => {
      const innerGroup: RuleConditionNode = {
        type: 'group',
        operator: 'AND',
        conditions: [
          { type: 'condition', field: 'spent', comparator: 'gt', value: 100 },
          { type: 'condition', field: 'clicks', comparator: 'gt', value: 20 },
        ],
      };
      const outerGroup: RuleConditionNode = {
        type: 'group',
        operator: 'OR',
        conditions: [
          innerGroup,
          { type: 'condition', field: 'status', comparator: 'eq', value: 'paused' },
        ],
      };
      const metrics = { spent: 150, clicks: 25, status: 'active' };

      const result = evaluateConditionNode(outerGroup, metrics);

      expect(result).toBe(true);
    });
  });
});
