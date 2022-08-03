import { Router } from 'express';
import * as SuggestSkillController from '../controllers/suggestSkill.controller.js';
import isAdmin from '../libs/Auth/isAdmin.js';
import isAuth from '../libs/Auth/Auth';

const router = new Router();

router.route('/suggest-skill/add').post(SuggestSkillController.addNew);
// router.route('/suggest-skill/get-list/:skip/:limit').get(SuggestSkillController.getList);

router.route('/admin/suggest_skills')
    .get(isAdmin.auth(), SuggestSkillController.adminGetList);

router.route('/admin/suggest_skills/reject')
    .post(isAdmin.auth(), SuggestSkillController.adminRejectSuggestSkill);

router.route('/admin/suggest_skills/approve')
    .post(isAdmin.auth(), SuggestSkillController.adminApproveSuggestSkill);

router.route('/suggest-skill/get')
  .get(isAuth.auth(), SuggestSkillController.getMySuggestSkills);

export default router;
