import { Router } from 'express';
import * as UserViewTrackingController from '../controllers/userViewTracking.controller';
import isAdmin from '../libs/Auth/isAdmin.js';

const router = new Router();

router.route('/admin/user-view-tracking')
  .get(isAdmin.auth(), UserViewTrackingController.getUserViewTracking);

export default router;