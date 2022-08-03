import { Router } from 'express';
import * as QuestionAnswerController from '../controllers/questionAnswer.controller';
import * as QuestionAnswerUpvoteController from '../controllers/questionAnswerUpvote.controller';
import authen from '../libs/Auth/Auth.js';

const router = new Router();

router.route('/answers/:id/edit')
  .put(authen.auth(), QuestionAnswerController.editAnswer);

router.route('/answers/:id/delete')
  .delete(authen.auth(), QuestionAnswerController.deleteAnswer);

router.route('/answers/:id/upvotes')
  .post(authen.auth(), QuestionAnswerUpvoteController.addAnswerUpvote);

router.route('/answers/:id/replies')
  .get(QuestionAnswerController.getReplies)
  .post(authen.auth(), QuestionAnswerController.replyAnswer);

export default router;
