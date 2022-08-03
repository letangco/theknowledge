import { body, param, query } from 'express-validator';
import { ERR_CODE } from '../../../config/globalConstants';
import validatorErrorHandler from '../../virtual_agent/validator/validatorErrorHandler';

export const createQuestionPointTest = [
  body('subject').notEmpty().isString().withMessage(ERR_CODE.SUBJECT_IS_NOT_EMPTY),
  body('question').notEmpty().isString().withMessage(ERR_CODE.QUESTION_IS_NOT_EMPTY),
  body('typeSelect').notEmpty().withMessage(ERR_CODE.TYPE_SELECTION_POINT_TEST),
  body('answers').notEmpty().isArray().withMessage(ERR_CODE.QUESTION_IS_NOT_EMPTY),
  validatorErrorHandler
];

export const deleteQuestionPointTest = [
  param('id').isMongoId().withMessage('Point Test id is invalid'),
  validatorErrorHandler,
];

export const getDetailQuestionPointTest = [
  param('id').isMongoId().withMessage('Point Test id is invalid'),
  validatorErrorHandler,
];

export const updateQuestionPointTest = [
  param('id').isMongoId().withMessage('Point Test id is invalid'),
  body('answers').isArray().withMessage('Answer is not empty.'),
  validatorErrorHandler,
];

export const createTagsAgent = [
  body('tagName').notEmpty().isString().withMessage(ERR_CODE.TAG_IS_NOT_EMPTY),
  body('type').notEmpty().isString().isIn(['agent', 'university']).withMessage(ERR_CODE.TYPE_TAG_INVALID),
  validatorErrorHandler
];

export const getDetailById = [
  param('id').isMongoId().withMessage('Id is invalid'),
  validatorErrorHandler,
];

export const editTagsAgent = [
  body('tagName').notEmpty().isString().withMessage(ERR_CODE.TAG_IS_NOT_EMPTY),
  body('type').notEmpty().isString().isIn(['agent', 'university']).withMessage(ERR_CODE.TYPE_TAG_INVALID),
  body('sort').notEmpty().isNumeric().withMessage(ERR_CODE.SORT_INDEX_NOT_EMPTY),
  validatorErrorHandler
];

export const getUsersAgentPageByAdmin = [
  query('role').notEmpty().isString().isIn(['user', 'agent', 'university']).withMessage('Role không được trống : user/agent/university.'),
  query('status').notEmpty().isString().isIn(['all', 'active', 'pending', 'ban']).withMessage('status không được trống: all/active/ban/pending'),
  query('sort').isIn(['1', '-1', '']).withMessage('Sort: 1/-1/'),
  validatorErrorHandler
];

export const updateStatusUserVirtualAgentByAdmin = [
  param('id').isMongoId().withMessage('Id is invalid'),
  param('status').notEmpty().isIn(['1', '-1']).withMessage('Status is in [1, -1]'),
  validatorErrorHandler,
];