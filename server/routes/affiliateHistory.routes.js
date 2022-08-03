import { Router } from 'express';
import * as AffiliateHistoryControllers from '../controllers/affiliateHistory.controller';
import authen from '../libs/Auth/Auth.js';
import isAdmin from '../libs/Auth/isAdmin';

const router = new Router();

router.route('/affiliate-histories')
  .get(authen.auth(), AffiliateHistoryControllers.getMyAffiliateHistories);
router.route('/affiliate/getAll')
  .get(isAdmin.auth(),AffiliateHistoryControllers.getAllAffiliates);
router.route('/affiliate/approve')
  .post(isAdmin.auth(), AffiliateHistoryControllers.approveAffiliate);

export default router;
