import { Router } from 'express';
import authen from '../libs/Auth/Auth.js';
import isAdmin from '../libs/Auth/isAdmin.js';
import * as RefundController from '../controllers/refund.controller';

const router = new Router();

router.route('/refund')
  .get(isAdmin.auth(), RefundController.adminGetRefunds);

router.route('/refund/:id/approve')
  .post(isAdmin.auth(), RefundController.adminApproveRefund);

export default router;
