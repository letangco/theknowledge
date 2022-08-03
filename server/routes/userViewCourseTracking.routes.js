import { Router } from 'express';
import * as UserViewCourseTrackingController from '../controllers/userViewCourseTracking.controller';
import isAdmin from '../libs/Auth/isAdmin.js';

const router = new Router();

router.route('/admin/courses/user-view-tracking-data')
  .get(isAdmin.auth(), UserViewCourseTrackingController.getUserViewedCourse);

export default router;