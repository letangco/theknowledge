import * as UserUseInviteCodeController from '../controllers/userUseInviteCode.controller';
import auth from '../libs/Auth/Auth.js';
import { Router } from 'express';

const router = new Router();

router.route('/use-invite-code/add')
  .post(auth.auth(), UserUseInviteCodeController.addUserUseCode);

export default router;
