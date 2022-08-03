import { body, param } from 'express-validator';
import { ERR_CODE } from '../../../config/globalConstants';
import validatorErrorHandler from '../../virtual_agent/validator/validatorErrorHandler';


export const getDetailById = [
  param('id').isMongoId().withMessage('Id is invalid'),
  validatorErrorHandler,
];
