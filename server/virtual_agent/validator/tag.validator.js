import { body, param } from 'express-validator';
import { ERR_CODE } from '../../../config/globalConstants';
import validatorErrorHandler from '../../virtual_agent/validator/validatorErrorHandler';


export const filterRoleTag = [
    param('role').notEmpty().isString().isIn(['agent', 'university']).withMessage(ERR_CODE.TYPE_TAG_INVALID),
    validatorErrorHandler,
];

export const getById = [
    param('id').isMongoId().withMessage('Tag Agent id is invalid'),
    validatorErrorHandler,
];
  