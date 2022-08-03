import { Router } from 'express';
import * as TransactionController from '../controllers/transactionDetail.controller.js';
const router = new Router();

router.route('/transaction-detail/add').post(TransactionController.add);

export default router;
