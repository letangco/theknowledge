import {Router} from 'express';
import * as Membership_Controller from '../controllers/membership.controller';
import isAdmin from '../libs/Auth/isAdmin';
import isAuth from '../libs/Auth/Auth';
import isTelesalAndAdmin from '../libs/Auth/isSuperUserAndAdmin';
import * as UserController from "../controllers/user.controller";

const router = new Router();

router.route('/membership/:payment/active')
  .get(isAdmin.auth(),Membership_Controller.activeMemberShip);
router.route('/membership/:payment/updateStatus')
  .get(isAdmin.auth(),Membership_Controller.updateStatus);

router.route('/membership/:payment/generalCode')
  .get(isAdmin.auth(),Membership_Controller.generalCode);

router.route('/membership/renew')
  .post(isAdmin.auth(),Membership_Controller.activeMemberShipSchedule);
router.route('/membership/createCodeMemberShip')
  .post(isAdmin.auth(),Membership_Controller.createCodeMemberShip);
router.route('/membership/getmembership')
  .get(isAdmin.auth(), Membership_Controller.getListMembership);
router.route('/membership/report')
  .get(isTelesalAndAdmin.auth(),Membership_Controller.report);

router.route('/membership/check-promotion/:inviteCode').get(Membership_Controller.checkPromotion);
router.route('/membership/setting-promotion').get(Membership_Controller.getPromotionSetting);
router.route('/membership/stats').get(Membership_Controller.getStats);
router.route('/membership/admin/stats').get(isAdmin.auth(), Membership_Controller.getStatsAdmin);
router.route('/membership/report-memnership-by-month').get(Membership_Controller.reportMemnershipByMonth);
router.route('/teacher-membership/registry-trial').get(isAuth.auth(), Membership_Controller.registryTrial);
export default router;
