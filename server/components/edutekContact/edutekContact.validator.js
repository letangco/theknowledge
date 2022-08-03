import { body } from 'express-validator';
import validatorErrorHandler from '../../api/validatorErrorHandler';

export const sendEmailContact = [
  body('name').isLength({ min: 1 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Email is invalid'),
  body('phone').isLength({ min: 1 }).withMessage('Phone is required'),
  body('message').isLength({ min: 1 }).withMessage('Message is required'),
  validatorErrorHandler,
];
