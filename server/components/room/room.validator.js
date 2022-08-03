import { query } from 'express-validator';
import validatorErrorHandler from '../../api/validatorErrorHandler';

export const getJoinUrl = [
  query('streamId').isMongoId().withMessage('Stream id is invalid'),
  validatorErrorHandler,
];
