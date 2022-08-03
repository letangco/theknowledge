import { Router } from 'express';
import * as UserGiftsController from '../controllers/gift.controller'
const router = new Router();
import auth from '../libs/Auth/Auth.js';

// router.route('/gifts/buy')
//   .post(auth.auth(), UserGiftsController.buyGift);
//
// router.route('/gifts/sell')
//   .post(auth.auth(), UserGiftsController.sellGift);
//
// router.route('/points/buy')
//   .post(auth.auth(), UserGiftsController.buyPoint);

router.get('/gifts/price', UserGiftsController.getGiftsPrice);

router.route('/gifts/send')
  .post(auth.auth(), UserGiftsController.sendGift);

export default router;
