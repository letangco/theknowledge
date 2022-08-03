import { Router } from 'express';
import isAdmin from '../libs/Auth/isAdmin.js';
import * as TeacherRegistrationController from '../controllers/teacherRegistration.controller';
const router = new Router();

router.route('/teacher-registrations')
  .get(isAdmin.auth(), TeacherRegistrationController.getTeacherRegistration);
router.route('/teacher-registrations/:id/status')
  .put(isAdmin.auth(), TeacherRegistrationController.updateTeacherRegistrationStatus);

export default router;
