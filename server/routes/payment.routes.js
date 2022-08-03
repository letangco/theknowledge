import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';
import authen from '../libs/Auth/Auth.js';
import isAdmin from '../libs/Auth/isAdmin.js';

const router = new Router();

//Than: stripe payment
router.route('/payment/saveStripeToken').post(authen.auth(), PaymentController.saveStripeToken);
router.route('/payment/stripe-token').get(PaymentController.getStripToken);
router.route('/payment/stripe-plan').get(PaymentController.getProductsAndPlans);
router.route('/payment/create-setup-intent').get(authen.auth(), PaymentController.createSetupIntent);

router.route('/payment/checkout-stripe-plan')
  .post(authen.auth(), PaymentController.createCheckoutPlan);

router.route('/payment/re-payment-stripe')
  .post(authen.auth(), PaymentController.rePaymentStripe);

router.route('/payment/delete-stripe-plan')
  .delete(authen.auth(), PaymentController.deleteCreditCard);

router.route('/payment/change-credit-card').post(authen.auth(),PaymentController.stripeChangeCreditCard);
router.route('/payment/webhook').post(PaymentController.stripeWebhook);
router.route('/payment/get-payment-history').get(authen.auth(),PaymentController.getPaymentHistory);
router.route('/payment/saveStripe').get(PaymentController.saveStripe);
router.route('/payment/savePaypal').post(authen.auth(), PaymentController.savePaypal);
router.route('/payment/saveVtcPay').post(PaymentController.saveVtcPay);
router.route('/payment/postPaypal').post(authen.auth(), PaymentController.postPaypal);
router.route('/payment/postVtcPay').post( PaymentController.postVtcPay);
router.route('/payment/postTransferPay').post(PaymentController.postTransferPay);
router.route('/payment/postOnePay').post(authen.auth(), PaymentController.postOnePay);
router.route('/payment/createWithdrawal').post(authen.auth(), PaymentController.createWithdrawal);
router.route('/payment/gmailContact').post(authen.auth(), PaymentController.gmailContact);
router.route('/payment/checkEmailInvite/:email').get(authen.auth(), PaymentController.checkEmailInvite);
router.route('/payment/get-full-withdrawl-status').get(authen.auth(), PaymentController.getFullWithdrawalStatus);

router.route('/admin/payments')
    .get(isAdmin.auth(), PaymentController.adminGetPayments);

router.route('/payment/cancel-full-withdrawl').post(authen.auth(), PaymentController.cancelFullWithdrawal);
export default router;
