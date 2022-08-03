import { Router } from 'express';
import * as TransactionController from '../controllers/transaction.controller.js';
import isAdmin from '../libs/Auth/isAdmin.js';
const router = new Router();

router.route('/transaction/getTransactionByUser/:userID').get(TransactionController.getTransactionByUser);
router.route('/admin/transactions')
    .get(isAdmin.auth(), TransactionController.adminGetTransactions);
    
export default router;
