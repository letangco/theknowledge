import { Router } from 'express';
import * as UserViewStreamTrackingController from '../controllers/userViewStreamTracking.controller';
import isAdmin from '../libs/Auth/isAdmin.js';

const router = new Router();

router.route('/live-stream/user-view-tracking/add')
  .post(UserViewStreamTrackingController.addUserViewStreamTracking);

router.route('/admin/live-stream/user-view-tracking-data')
  .get(isAdmin.auth(), UserViewStreamTrackingController.getUserViewStreamTrackingData);

router.route('/admin/live-stream/tracking/user-view-tracking-info')
  .get(isAdmin.auth(), UserViewStreamTrackingController.getUserViewStreamTrackingInfo);

router.route('/admin/live-stream/export/user-view-tracking-by-course')
  .get(isAdmin.auth(), UserViewStreamTrackingController.exportUserViewStreamTrackingByCourse);

export default router;