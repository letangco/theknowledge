import { Router } from 'express';
import * as CommentController from '../controllers/comment.controller.js';
import authen from '../libs/Auth/Auth.js';

const router = new Router();
router.use(authen.init());

//router.route('/comment')
//    .post(authen.auth(), CommentController.submit);

router.route('/comment/:id')
    .put(authen.auth(), CommentController.updateComment)
    .delete(authen.auth(), CommentController.deleteComment);
    
router.route('/comment/:id/replies')
        .get(CommentController.getCommentReplies)
        .post(authen.auth(), CommentController.submitReply);

router.route('/comment/:id/upvote')
    .post(authen.auth(), CommentController.upVote);
    
router.route('/comment/:id/downvote')
    .post(authen.auth(), CommentController.downVote);

export default router;