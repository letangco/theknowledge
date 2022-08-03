import { Router } from 'express';
import * as UserOptionController from '../controllers/userOption.controller.js';
import authen from '../libs/Auth/Auth.js';
const router = new Router();

router.route('/user-option/add').post(UserOptionController.add);
router.route('/user/updateLanguageSetting/:id').get(authen.auth(), UserOptionController.updateLanguageSetting);
router.route('/user-option/get-by-user/:userID').get(UserOptionController.getOptionByUserID);
router.route('/user-option/change-lang').post(authen.auth(), UserOptionController.updateLanguageSetting);

export default router;
