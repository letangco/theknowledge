import { body, param } from 'express-validator';
import { ERR_CODE } from '../../../config/globalConstants';
import { USER_MIN_PASSWORD_LENGTH } from '../../constants';
import validatorErrorHandler from '../../virtual_agent/validator/validatorErrorHandler';
import globalConstants from '../../../config/globalConstants';
export const userRegisterAgent = [
    body('email').notEmpty().isEmail().withMessage(ERR_CODE.EMAIL_IS_NOT_EMPTY),
    body('telephone').notEmpty().isMobilePhone().withMessage(ERR_CODE.PHONE_INVALID),
    body('organization').notEmpty().withMessage(ERR_CODE.ORGANIZATION_NOT_EMPTY),
    body('ABNNumber').notEmpty().withMessage(ERR_CODE.ABN_NUMBER_NOT_EMPTY),
    body('address').notEmpty().withMessage(ERR_CODE.ADDRESS_NOT_EMPTY),
    body('role').notEmpty().isIn([globalConstants.role.AGENT, globalConstants.role.UNIVERSITY])
    .withMessage(ERR_CODE.ROLE_INVALID + ' - in [' +
    [globalConstants.role.AGENT, globalConstants.role.UNIVERSITY].toString() + ']'),
    body('tags').isArray().withMessage(ERR_CODE.TAG_IS_NOT_EMPTY),
    body('country').isMongoId().notEmpty().withMessage(ERR_CODE.COUNTRY_NOT_EMPTY),
    body('state').isMongoId().notEmpty().withMessage(ERR_CODE.STATE_NOT_EMPTY),
    validatorErrorHandler,
];

export const loginAgent = [
  body('email').notEmpty().isEmail().withMessage(ERR_CODE.EMAIL_IS_NOT_EMPTY),
  body('password').isLength({ min: USER_MIN_PASSWORD_LENGTH }).withMessage([
    ERR_CODE.PASSWORD_INVALID_LENGTH,
    [USER_MIN_PASSWORD_LENGTH]
  ]),
  validatorErrorHandler
];

export const createNewsAgent = [
  body('title').notEmpty().isString().withMessage(ERR_CODE.TITLE_IS_NOT_EMPTY),
  body('content').notEmpty().isString().withMessage(ERR_CODE.CONTENT_IS_NOT_EMPTY),
  body('shortDescription').notEmpty().isString().withMessage(ERR_CODE.SHORT_DESCRIPTION_IS_NOT_EMPTY),
  validatorErrorHandler
];

export const deleteNewsAgentByAuthor = [
  param('id').isMongoId().withMessage('News Agent id is invalid'),
  validatorErrorHandler,
];

export const updateNewsAgentByAuthor = [
  body('title').notEmpty().isString().withMessage(ERR_CODE.TITLE_IS_NOT_EMPTY),
  body('content').notEmpty().isString().withMessage(ERR_CODE.CONTENT_IS_NOT_EMPTY),
  body('shortDescription').notEmpty().isString().withMessage(ERR_CODE.SHORT_DESCRIPTION_IS_NOT_EMPTY),
  validatorErrorHandler
];

export const updateStatusNewsAgentByAuthor = [
  param('id').isMongoId().withMessage('News Agent id is invalid'),
  validatorErrorHandler,
];

export const getById = [
  param('id').isMongoId().withMessage('Id is invalid'),
  validatorErrorHandler,
];