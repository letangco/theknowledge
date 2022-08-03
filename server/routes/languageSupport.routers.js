import { Router } from 'express';
import * as SkillController from '../controllers/languageSupport.controller.js';
const router = new Router();

router.route('/languageSupport/getLanguageSupport').get(SkillController.getLanguageSupport);
router.route('/language-support/import-language-support').post(SkillController.importlanguageSupport);
router.route('/language-support/get-list').get(SkillController.getList);
router.route('/language-support/get-list-expert').get(SkillController.getListExpert);

export default router;
