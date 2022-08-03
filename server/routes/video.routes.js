import { Router } from 'express';
import * as VideoController from '../controllers/video.controller';
import authen from '../libs/Auth/Auth.js';
const router = new Router();

router.route('/video/view')
  .post(authen.auth(), VideoController.viewVideo);

router.route('/video/get-view-video/:id')
  .get(VideoController.getViewVideo);

export default router;
