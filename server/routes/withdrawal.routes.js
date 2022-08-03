import * as WithdrawalController from '../controllers/withdrawal.controller.js';
import isAdmin from '../libs/Auth/isAdmin.js';
import authen from '../libs/Auth/Auth';
import { Router } from 'express';

const router = new Router();

router.route('/admin/create_auto_withdrawals')
    .post(isAdmin.auth(), WithdrawalController.adminCreateAutoWithdrawals);

router.route('/admin/withdrawals')
        .get(isAdmin.auth(), WithdrawalController.adminGetWithdrawals);

router.route('/admin/withdrawals/approve')
        .post(isAdmin.auth(), WithdrawalController.adminApproveWithdrawal);

router.route('/admin/withdrawals/reject')
        .post(isAdmin.auth(), WithdrawalController.adminRejectWithdrawal);

router.route('/withdrawal')
  .get(authen.auth(), WithdrawalController.getWithdrawals);

router.route('/withdrawal/:id/cancel')
  .post(authen.auth(), WithdrawalController.cancelSingleWithdrawal);

router.route('/withdrawal/total-amount-in-month')
  .get(authen.auth(), WithdrawalController.getTotalAmountInMonth);

export default router;
