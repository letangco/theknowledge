import { Router } from 'express';
import * as NotificationController from '../controllers/notification.controller.js';
import authen from '../libs/Auth/Auth.js';
const router = new Router();

// router.route('/notification/get-by-user/:userID').get(NotificationController.getNotificationByUser);
router.route('/notification/get-by-user-v2').get(authen.auth(),NotificationController.getNotificationByUserV2);
router.route('/notification/update-status-by-user').put(authen.auth(),NotificationController.updateStatusByUser);
router.route('/notification/update-view-status').post(NotificationController.updateViewStatus);
router.route('/notification/update-message-notify-status').post(NotificationController.updateMessageNotifyStatus);
router.route('/notification/get-notify-chat-group/:userID/:token').get(NotificationController.getNotifyChatGroup);
router.route('/notification/get-message-list/:userID/:token').get(authen.auth(),NotificationController.getMessageNotifyInfo);
router.post('/notification/test/:userId', NotificationController.testPushNotify);
export default router;
