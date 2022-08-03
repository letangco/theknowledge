import { query, body } from 'express-validator';
import validatorErrorHandler from '../../api/validatorErrorHandler';
import { MAX_PAGE_LIMIT, TEACHER_REGISTRATION_STATUS } from '../../../config/globalConstants';

export const getTeacherMemberShip = [
  query('page')
    .isInt({ min: 1 })
    .withMessage('Page number must be a number minimum is 1'),
  query('rowPerPage')
    .optional()
    .isInt({ min: 1, max: MAX_PAGE_LIMIT})
    .withMessage('Row per page must be a number'),
  query('search')
    .optional(),
  query('status')
    .optional()
    .isIn(Object.values(TEACHER_REGISTRATION_STATUS))
    .withMessage('Order status is invalid'),
  validatorErrorHandler,
];

export const addTeacherMemberShipManually = [
  body('userId')
    .isMongoId()
    .withMessage('User id is not valid'),
  body('days')
    .isInt({ min: 1 })
    .withMessage('Number of days must be positive integer number'),
  body('note')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Note is required and minimum is 10 characters'),
  validatorErrorHandler,
];
