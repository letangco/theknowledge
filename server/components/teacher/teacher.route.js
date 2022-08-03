import { Router } from 'express';
import * as TeacherController from './teacher.controller';
import auth from '../../libs/Auth/Auth.js';

const router = new Router();

/**
 * @swagger
 * /teachers/dashboard-report:
 *   get:
 *     summary: Get teacher dashboard report
 *     tags:
 *       - Teacher
 *     responses:
 *       200:
 *         description: Teacher dashboard report data
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             payload:
 *               type: object
 *               properties:
 *                 totalCourse:
 *                   type: number
 *                 totalExercise:
 *                   type: object
 *                   properties:
 *                     writingCount:
 *                       type: number
 *                     multipleChoiceCount:
 *                       type: number
 *                     multipleChoiceUploadCount:
 *                       type: number
 *                     total:
 *                       type: number
 *                 totalUserRegistryCourse:
 *                   type: number
 *                 totalIncome:
 *                   type: number
 *       400:
 *         description: Bad Request
 *         schema:
 *           type: string
 *           example: Bad Request
 *       500:
 *         description: When got server exception
 *         schema:
 *           type: string
 *           example: Internal server error
 */
router.route('/dashboard-report')
  .get(
    auth.auth(),
    TeacherController.getTeacherDashboardReport,
  );

export default router;
