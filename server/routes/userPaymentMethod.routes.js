import * as UserPaymentMethodController from '../controllers/userPaymentMethod.controller';
import auth from '../libs/Auth/Auth.js';
import { Router } from 'express';

const router = new Router();

router.route('/payment-method/add')
  .post(auth.auth(), UserPaymentMethodController.addUserPaymentMethod);

router.route('/payment-method/:id/default')
  .post(auth.auth(), UserPaymentMethodController.setDefaultPaymentMethod);

router.route('/payment-method/:id/update')
  .put(auth.auth(), UserPaymentMethodController.updatePaymentMethod);

router.route('/payment-method/:id/delete')
  .delete(auth.auth(), UserPaymentMethodController.deletePaymentMethod);

router.route('/payment-method/:id')
  .get(auth.auth(), UserPaymentMethodController.getPaymentMethod);

router.route('/payment-method/')
  .get(auth.auth(), UserPaymentMethodController.getPaymentMethods);

export default router;
