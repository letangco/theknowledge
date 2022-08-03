import { Router } from 'express';
import * as LiveStreamController from '../controllers/liveStream.controller';
import * as AntStreamController from '../controllers/ant.controller';
import * as LikeStreamController from '../controllers/likelivestream.controllers';
import authen from '../libs/Auth/Auth.js';
import isAdmin from '../libs/Auth/isAdmin.js';
import { checkStreamPermission } from "../libs/Auth/Auth";

const router = new Router();

router.route('/live-stream/add')
  .post(authen.auth(), LiveStreamController.addLiveStream);
router.route('/live-stream/:id/like')
      .post(authen.auth(), LikeStreamController.addLike);

router.route('/live-stream/:id/update-password')
      .post(authen.auth(), LiveStreamController.updatePassword);

router.route('/live-stream')
  .get(LiveStreamController.getLivingStream);

router.route('/get-live-stream/:id')
  .get(LiveStreamController.getStream)
  .put(authen.auth(), LiveStreamController.updateLiveStream);
router.route('/live-stream/:id/privacy')
  .put(authen.auth(), LiveStreamController.updateLiveStreamPrivacy);

router.route('/live-stream/:id/comments')
  .post(authen.auth(), LiveStreamController.addComment)
  .get(LiveStreamController.getComments);

router.route('/live-stream/:id/viewer').get(LiveStreamController.getViewer);
router.route('/live-stream/:id/totalViewed').get(LiveStreamController.getTotalViewed);
router.route('/livestream-meta-by-id/:id').get(LiveStreamController.getStreamMeta);

router.route('/schedule-stream/add')
  .post(authen.auth(), LiveStreamController.addScheduleStream);
router.route('/schedule-stream/:id/live')
  .put(authen.auth(), LiveStreamController.updateIsLive);
router.route('/schedule-stream/:id')
  .delete(authen.auth(), LiveStreamController.deleteScheduleStream)
  .put(authen.auth(), LiveStreamController.updateScheduleStream);
router.route('/get-schedule-stream/')
  .get(LiveStreamController.getScheduleStream);
router.route('/get-schedule-stream-of-user/')
  .get(authen.auth(), LiveStreamController.getScheduleOfUser);
router.route('/get-stream-home/')
  .get(LiveStreamController.getStreamHome);
router.route('/get-streams')
  .get(LiveStreamController.getListStream);

router.route('/get-events')
  .get(LiveStreamController.getEvents);

router.route('/live-stream/:id/stop')
  .get(authen.auth(), LiveStreamController.stopStream);

router.route('/live-stream/:id/status')
  .put(LiveStreamController.changeStreamStatus);

router.route('/live-stream/:id/permission')
  .get(checkStreamPermission, LiveStreamController.checkStreamPermission);

router.route('/live-stream/create-stream-queue-job')
  .post(LiveStreamController.createStreamQueueJob);

router.route('/live-stream/check-buy')
  .get(authen.auth(), LiveStreamController.checkWebinarBuyAble);

router.route('/live-stream/buy-ticket')
  .post(authen.auth(), LiveStreamController.buyWebinarTicket);

router.route('/live-stream/histories')
  .get(authen.auth(), LiveStreamController.getStreamHistory);

router.route('/live-stream/booked')
  .get(authen.auth(), LiveStreamController.getBookedWebinar);

router.route('/live-stream/:id/tickets')
  .get(authen.auth(), LiveStreamController.getBookedTickets);

router.route('/live-stream/:id/statistics')
  .get(authen.auth(), LiveStreamController.getWebinarStatistic);

router.route('/live-stream/:id/validate-ticket')
  .post(LiveStreamController.validateTicket);

router.route('/live-stream/:id/validate-password')
  .post(LiveStreamController.validatePassword);

router.route('/live-stream/:id/interact')
  .get(LiveStreamController.getWebinarInteractions)
  .post(authen.auth(), LiveStreamController.interactWebinar);

router.route('/live-stream/blank-stream/create')
  .post(authen.auth(), LiveStreamController.createBlankStream);

router.route('/live-stream/broadcast/:id/info')
  .get(authen.auth(), AntStreamController.getBroadcastInfo);

router.route('/live-stream/export-ticket')
  .get(authen.auth(), LiveStreamController.exportTicket);

router.route('/live-stream/broadcast/:id/remove')
  .post(authen.auth(), AntStreamController.removeBroadcast);

router.route('/live-stream/:id/update-stream-file')
  .post(LiveStreamController.updateStreamFiles);

router.route('/live-stream/:id/stream-course')
  .get(LiveStreamController.getStreamCourse);

router.route('/admin/live-stream/lessons-by-course')
  .get(isAdmin.auth(), LiveStreamController.getStreamCourseForAdmin);

export default router;
