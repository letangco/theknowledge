import { Router } from 'express';
import * as QuestionController from '../controllers/question.controller';
import * as QuestionAnswerController from '../controllers/questionAnswer.controller';
import * as QuestionUpvoteController from '../controllers/questionUpvote.controller';
import authen from '../libs/Auth/Auth.js';

const router = new Router();

router.route('/questions/add')
  .post(authen.auth(), QuestionController.addQuestion);

router.route('/questions/get')
  .get(QuestionController.getQuestion);

router.route('/questions/:questionId/answers')
  .post(authen.auth(), QuestionAnswerController.addAnswer)
  .get(QuestionAnswerController.getAnswersByQuestion);

router.route('/questions/:id/edit')
  .put(authen.auth(), QuestionController.editQuestion);

router.route('/questions/:id/delete')
  .delete(authen.auth(), QuestionController.deleteQuestion);

router.route('/questions/:id/upvotes')
  .post(authen.auth(), QuestionUpvoteController.addQuestionUpvote);

router.route('/questions/meta/:slug')
  .get(QuestionController.getQuestionMeta);

export default router;
