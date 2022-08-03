import { Router } from 'express';
import * as DashboardController from '../controllers/dashboard.controller.js';
import isAdmin from '../libs/Auth/isAdmin.js';
import authentication from '../libs/Auth/Auth.js';
const router = new Router();

router.route('/admin/dashboard')
    .get(isAdmin.auth(), DashboardController.adminGetDashboard);

router.route('/admin/user-chart')
  .get(isAdmin.auth(), DashboardController.adminGetUserLineChart);

router.route('/get-memberShip')
  .get(DashboardController.getMemberShips);

router.route('/admin/get-memberShip-auth')
  .get(isAdmin.auth(), DashboardController.getMemberShips);

router.route('/setting/saveSettingApp')
  .post(isAdmin.auth(), DashboardController.saveSettingApp);

router.route('/app/version')
  .get(isAdmin.auth(), DashboardController.getAppVersion);

router.route('/setting/saveSettingPopup')
  .post(isAdmin.auth(), DashboardController.saveSettingPopup);

router.route('/setting/get-mini-game')
  .get(DashboardController.getMiniGameSetting);

router.route('/setting/saveSettingGame')
  .post(isAdmin.auth(), DashboardController.saveSettingGame);

router.route('/setting/getSettingGame')
  .get(isAdmin.auth(), DashboardController.editSettingGame);

router.route('/setting/saveSettingCareer')
  .post(isAdmin.auth(), DashboardController.saveSettingCareer);

router.route('/setting/saveSettingPromotion')
  .post(isAdmin.auth(), DashboardController.saveSettingPromotion);

router.route('/setting/saveSettingEbooks')
  .post(isAdmin.auth(), DashboardController.saveSettingEbooks);

router.route('/setting/saveSettingAdd')
  .post(isAdmin.auth(), DashboardController.saveSettingAdd);

router.route('/setting/getSettingAdd')
  .get(DashboardController.getSettingAdd);

router.route('/setting/promotion')
  .get(isAdmin.auth(), DashboardController.getPromotionSetting);

router.route('/setting/popup')
  .get(isAdmin.auth(), DashboardController.getPopupSetting);

router.route('/setting/career')
  .get(isAdmin.auth(), DashboardController.getPopupCareer);

router.route('/setting/ebooks')
  .get(isAdmin.auth(), DashboardController.getPopupEbooks);
router.route('/setting/popup-website')
  .get(DashboardController.getPopupSettingWebsite);

router.route('/setting/membershipInvite')
  .get(DashboardController.getMemberShipSetting);

router.route('/setting/popup-application')
  .get(DashboardController.getPopupSettingApplication);

router.route('/ebook/contact')
  .get(DashboardController.getContactEbook);

router.route('/app/version-checker')
  .get(DashboardController.checkAppVersion);

router.route('/setting/turn-config')
  .get(authentication.auth(), DashboardController.getTurnConfig);

export default router;
