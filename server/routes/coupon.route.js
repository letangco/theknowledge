import * as Coupon_Controller from '../controllers/coupon.controller';
import isAuth from '../libs/Auth/isUserAndAdmin';
import {Router} from 'express';
import * as Membership_Controller from "../controllers/membership.controller";

const router = new Router();

router.route('/coupon/:role/create')
  .post(isAuth.auth(),Coupon_Controller.createCoupon);
router.route('/coupon/:role/:id')
  .put(isAuth.auth(),Coupon_Controller.updateCoupon);
router.route('/report-coupon/:object')
  .get(isAuth.auth(),Coupon_Controller.reportCoupon);
router.route('/coupons')
  .get(isAuth.auth(),Coupon_Controller.getCoupons);
router.route('/get-coupon/:id')
  .get(isAuth.auth(),Coupon_Controller.getCoupon)
  .delete(isAuth.auth(),Coupon_Controller.deleteCoupon);
router.route('/get-history-of-coupon/:id')
  .get(isAuth.auth(),Coupon_Controller.getHistoryOfCoupon);
router.route('/get-coupon-of-user')
  .get(isAuth.auth(),Coupon_Controller.getHistoryCouponOfUser);
router.route('/update-status/:id')
  .put(isAuth.auth(), Coupon_Controller.updateStatusCoupon);
router.route('/coupon/check-couponCode')
  .post(Coupon_Controller.checkCouponCode);

export default router;
