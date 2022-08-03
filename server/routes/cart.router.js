import {Router} from 'express';
import isAuth from '../libs/Auth/Auth';
import isAdmin from "../libs/Auth/isAdmin";
import * as HistoryCartController from '../controllers/historyCart.controller';
const router = new Router();

router.route('/cart')
  .post(HistoryCartController.createCart);
router.route('/get-products-by-id')
  .post(HistoryCartController.getListProductById);
router.route('/cart/get-list-order')
  .get(isAdmin.auth(), HistoryCartController.getListOrder);
router.route('/cart/:id')
  .put(isAdmin.auth(), HistoryCartController.editOrder)
  .delete(isAdmin.auth(), HistoryCartController.deleteOrder);

export default router;
