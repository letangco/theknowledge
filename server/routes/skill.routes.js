import { Router } from 'express';
import * as SkillController from '../controllers/skill.controller.js';
import * as RatingController from '../controllers/rating.controller.js';
const router = new Router();
import auth from '../libs/Auth/Auth.js';
import isAdmin from '../libs/Auth/isAdmin';

router.route('/getSkillByCategoryID/:catID/:languageID').get(SkillController.getSkillByCategoryID);
router.route('/getAllSkill/:languageID').get(SkillController.getAllSkill);
router.route('/getAllSkillKnowLedge/:languageID').get(SkillController.getAllSkillKnowLedge);
router.route('/getAllSkillKnowLedgeByText/:textSearch/:languageID').get(SkillController.getAllSkillByTextSearch);
router.route('/get-skill-by-category-admin/:catID/:languageID').get(SkillController.getSkillByCategoryIDAdmin);
// router.route('/getSkillsByTextSearch/:textSearch/:catID/:languageID').get(SkillController.getSkillsByTextSearch);
router.route('/skill/add').post(isAdmin.auth(), SkillController.addSkill);
router.route('/skill/import').post(isAdmin.auth(), SkillController.importSkill);
router.route('/skill/delete').post(isAdmin.auth(), SkillController.deleteSkill);

router.route('/skill/test-rate')
  .get(RatingController.test);

// Feed
router.route('/skill/get-by-cat-cuids').post(auth.auth(), SkillController.getSkillByCatCuids);
router.route('/skill/save-skill-for-feed').post(auth.auth(), SkillController.saveSkillForFeed);

//admin
router.route('/skill/get-all').get(isAdmin.auth(),SkillController.getAllSkillAdmin);
router.route('/skill/search/:text').get(SkillController.searchSkills);
router.route('/skill/update').post(isAdmin.auth(),SkillController.updateSkill);

export default router;
