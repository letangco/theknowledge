import { Router } from 'express';
import * as LiveStreamTrackingController from '../controllers/liveStreamTracking.controller';
import isAdmin from '../libs/Auth/isAdmin.js';
import auth from '../libs/Auth/Auth';

const router = new Router();

router.route('/live-stream/tracking/add')
  .post(LiveStreamTrackingController.addViewTracking);

router.route('/admin/live-stream/tracking-data')
  .get(isAdmin.auth(), LiveStreamTrackingController.getStreamTrackingData);

router.route('/live-stream/tracking-data')
  .get(auth.auth(), LiveStreamTrackingController.getStreamTrackingDataUser);

export default router;