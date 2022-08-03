import { Router } from 'express';
import * as HistoryController from '../controllers/history.controller.js';
const router = new Router();
import auth from '../libs/Auth/Auth.js';

// router.route('/history/get-history/:userID/:collection/:skip/:limit').get(HistoryController.getHistory);
// router.route('/history/get-full-history/:userCuid/:userId/:skip/:limit').get(HistoryController.getFullHistory);

router.route('/history/learning').get(auth.auth(), HistoryController.getLearning);
router.route('/history/sharing').get(auth.auth(), HistoryController.getSharing);

router.route('/history')
  .get(auth.auth(), HistoryController.getAllHistory);

export default router;
