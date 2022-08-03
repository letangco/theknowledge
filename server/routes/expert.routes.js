import { Router } from 'express';
import * as ExpertController from '../controllers/expert.controller.js';
const router = new Router();
import auth from '../libs/Auth/Auth';
import * as UserController from "../controllers/user.controller";

router.route('/join-expert/:email').get(ExpertController.joinExpert);
router.route('/confirm-expert/:token').get(ExpertController.confirmExpert);
router.route('/experts/search').get(ExpertController.searchExpertV2);
router.route('/experts/get_by_cate/:cuid').get(ExpertController.getExpertsByCategory);
router.route('/experts/get_by_cate_slug/:slug').get(ExpertController.getSuggestedExpertsBySlugV2);
router.route('/experts/get_all_expert').get(ExpertController.getAllExperts);

// Feed
router.route('/experts/get-by-skills').post(auth.auth(), ExpertController.getBySkills);
//Home
router.route('/experts/home/').get(ExpertController.getExpertHomePage);

router.route('/mobile/experts/suggested-by-cate/')
  .get(ExpertController.mobileGetSuggestedExperts);
router.route('/mobile/experts/suggested-by-cate/:slug')
  .get(ExpertController.mobileGetSuggestedExpertsBySlug);

router.route('/experts/countries-global')
  .get(ExpertController.countriesGlobal);

router.route('/experts/innotek/get-user').get(ExpertController.getUserInnotek);

export default router;
