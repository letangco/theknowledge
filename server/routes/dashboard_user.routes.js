import {Router} from "express";
import authen from '../libs/Auth/Auth.js';
import * as DashboardUser from '../controllers/dashboard_user.controller';
const router = new Router();

router.route('/dashboard-user/chart')
  .get(authen.auth(), DashboardUser.getChart);
router.route('/dashboard-user/history-course')
  .get(authen.auth(), DashboardUser.getHistoryCourse);
router.route('/dashboard-user/history-action')
  .get(authen.auth(), DashboardUser.getHistoryAction);

export default router;
