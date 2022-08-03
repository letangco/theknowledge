import { Router } from 'express';
import isAdmin from "../libs/Auth/isAdmin";
import * as Report_Student from '../controllers/report_student.controller';

const router = new Router();

router.route('/admin/report-student')
  .get(isAdmin.auth(), Report_Student.getReportStudent);
router.route('/admin/report/get-course-by-user/:id')
  .get(isAdmin.auth(), Report_Student.getCourseByUser);
router.route('/admin/report/edit')
  .post(isAdmin.auth(), Report_Student.editReportStudent);
router.route('/admin/report/note')
  .post(isAdmin.auth(), Report_Student.adminNoteUser);
router.route('/admin/report/note/:id')
  .delete(isAdmin.auth(), Report_Student.adminDeleteNote);

export default router;
