import { body } from 'express-validator';

const comparatorPattern = /^(gt|gte|lt|lte|eq|neq)$/;
const operatorPattern = /^(AND|OR)$/;

export const createRuleValidator = [
  body('name').isString().isLength({ min: 3 }).withMessage('Name is required and must be at least 3 characters'),
  body('enabled').optional().isBoolean().withMessage('enabled must be a boolean'),
  body('priority').optional().isInt().withMessage('priority must be an integer'),
  body('cooldownMinutes').optional().isInt().withMessage('cooldownMinutes must be an integer'),
  body('conditions').isArray({ min: 1 }).withMessage('At least one condition group is required'),
  body('conditions.*.type').isIn(['group', 'condition']).withMessage('Condition node type invalid'),
  body('conditions.*.operator').optional().matches(operatorPattern).withMessage('Group operator must be AND or OR'),
  body('conditions.*.field').optional().isString().withMessage('Condition field must be a string'),
  body('conditions.*.comparator').optional().matches(comparatorPattern).withMessage('Comparator invalid'),
  body('conditions.*.value').optional().notEmpty().withMessage('Condition value required'),
  body('actions').isArray({ min: 1 }).withMessage('At least one action is required'),
  body('actions.*.type').isIn(['pause_campaign','resume_campaign','increase_budget','decrease_budget','send_notification','enable_rule','disable_rule']).withMessage('Action type invalid'),
];
