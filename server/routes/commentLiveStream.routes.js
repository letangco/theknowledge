import { Router } from 'express';
import * as CommentLiveStreamController from '../controllers/commentLiveStream.controller';
import authen from '../libs/Auth/Auth.js';

const router = new Router();

router.route('/comment-live-stream/:id/update')
  .put(authen.auth(), CommentLiveStreamController.updateComment);

router.route('/comment-live-stream/:id/delete')
  .delete(authen.auth(), CommentLiveStreamController.deleteComment);

export default router;
