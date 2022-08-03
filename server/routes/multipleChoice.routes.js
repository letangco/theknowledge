import { Router } from 'express';
import * as MultipleChoiceController from '../controllers/multipleChoice.controller.js';
import isAdmin from '../libs/Auth/isAdmin.js';
import auth from '../libs/Auth/Auth.js';
const router = new Router();

router.route('/admin/multiple-choice')
  .post(isAdmin.auth(), MultipleChoiceController.addMultipleChoice)
  .delete(isAdmin.auth(), MultipleChoiceController.deleteMultipleChoice);

router.route('/user/multiple-choice')
  .post(auth.auth(), MultipleChoiceController.addMultipleChoice)
  .delete(auth.auth(), MultipleChoiceController.deleteMultipleChoice);

router.route('/user/multiple-choices-by-user')
  .get(auth.auth(), MultipleChoiceController.getMultipleChoiceByUser)

router.route('/user/report-multiple-choices/:slug')
  .get( MultipleChoiceController.getReportsMultipleChoice)

router.route('/admin/getMultipleChoices')
  .get(isAdmin.auth(), MultipleChoiceController.getMultipleChoices);

router.route('/admin/getMultipleChoicesReport/:id')
  .get(isAdmin.auth(), MultipleChoiceController.getMultipleChoicesReport);

router.route('/user/multiple-choices')
  .get(MultipleChoiceController.userGetMultipleChoices);

router.route('/user/multiple-choice/:slug')
  .get(MultipleChoiceController.getMetaMultipleChoiceBySlug);

router.route('/ebook/send-info-ebook/:key')
  .post(MultipleChoiceController.sendInfoEbook);

router.route('/user/multiple-choice-questions/:slug')
  .get(MultipleChoiceController.getMultipleChoiceQuestionBySlug);

router.route('/user/multiple-choice-questions-course/:slug')
  .get(auth.auth(), MultipleChoiceController.getMultipleChoiceQuestionCoursenBySlug);

router.route('/user/upload-multiple-choice-report/:id')
  .post(MultipleChoiceController.uploadImageShare);

router.route('/user/report-multiple-choice/:id')
  .get( MultipleChoiceController.getReportMultipleChoice);

router.route('/user/send-multiple-choice')
  .post(MultipleChoiceController.sendMultipleChoice);

router.route('/user/multiple-choice-by-id/:id')
  .get( MultipleChoiceController.getMultipleChoice)
  .put(auth.auth(), MultipleChoiceController.editMultipleChoice);

router.route('/user/remove-multiple-choice-course/:id')
  .get(auth.auth(), MultipleChoiceController.removeMultipleChoiceCourse)

router.route('/admin/multiple-choice/:id')
  .get(isAdmin.auth(), MultipleChoiceController.getMultipleChoice)
  .put(isAdmin.auth(), MultipleChoiceController.editMultipleChoice);
export default router;