import { body } from 'express-validator';

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isString().isLength({ min: 6 }).withMessage('Password min 6 chars')
];

export const registerValidator = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isString().isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('fullName').optional().isString()
];

export const refreshValidator = [
  body('refreshToken').isString().withMessage('refreshToken required')
];
