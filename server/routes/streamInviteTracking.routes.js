import { Router } from 'express';
import isAdmin from '../libs/Auth/isAdmin.js';
import auth from '../libs/Auth/Auth';
import * as StreamInviteTrackingController from '../controllers/streamInviteTracking.controller';
import * as UserViewStreamTrackingController from '../controllers/userViewStreamTracking.controller';

const router = new Router();

router.route('/live-stream/stream-invite-tracking/add')
  .post(StreamInviteTrackingController.addStreamInviteTracking);

router.route('/admin/live-stream/stream-invite-tracking/available-courses')
  .get(isAdmin.auth(), StreamInviteTrackingController.getCourseHaveInviteTracking);

router.route('/admin/live-stream/stream-invite-tracking/streams')
  .get(isAdmin.auth(), StreamInviteTrackingController.getStreamsOfCourse);

router.route('/admin/live-stream/stream-invite-tracking/details')
  .get(isAdmin.auth(), StreamInviteTrackingController.getStreamInviteTrackingData);

// Allow admin call this api from FE
router.route('/live-stream/stream-invite-tracking/stream')
  .get(auth.auth(), StreamInviteTrackingController.getStreamOfCourseUser);
// Allow admin call this api from FE
router.route('/live-stream/stream-invite-tracking/details')
  .get(auth.auth(), StreamInviteTrackingController.getStreamInviteTrackingDataUser);
router.route('/live-stream/tracking/user-view-tracking-info')
  .get(auth.auth(), UserViewStreamTrackingController.getUserViewStreamTrackingInfo);

export default router;
