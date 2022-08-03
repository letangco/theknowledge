import { Router } from 'express';
import * as Exercise from '../controllers/exercise.controller.js';
import authen from "../libs/Auth/Auth";
import {exerciseMulterUpload} from "../controllers/upload.controller";
import isAdmin from "../libs/Auth/isAdmin";
const router = new Router();

router.route('/exercise/create-exercise')
  .post(authen.auth(), Exercise.createExercise);

router.route('/exercise/update-exercise/:id')
  .put(authen.auth(), Exercise.editExercise);

router.route('/exercise/delete-exercise/:id/:type')
  .delete(authen.auth(), Exercise.deleteExercise);

router.route('/exercise/get-exercise/:id/:type')
    .get(authen.auth(), Exercise.getExerciseById);

router.route('/exercise/get-exercise-test')
    .get(authen.auth(), Exercise.getExerciseTest);

router.route('/exercise/get-exercise-voa/:id/:type')
    .get(authen.auth(), Exercise.getExerciseVOAQuestion);

router.route('/exercise/get-exercise-to-update/:id/:type')
    .get(authen.auth(), Exercise.getExerciseToUpdate);

router.route('/exercise/get-exercises')
    .get(authen.auth(), Exercise.getExercises);

router.route('/exercise/get-exercises-study')
    .get(authen.auth(), Exercise.getExercisesStudy);

router.route('/exercise/get-exercise-question/:id/:type')
    .get(authen.auth(), Exercise.getExerciseQuestion);

router.route('/exercise/send-exercise-result/:id')
  .post(authen.auth(), Exercise.sendExercise);

router.route('/exercise/add-exercise-teacher/:id')
  .post(authen.auth(), Exercise.addTeacherReport);

router.route('/exercise/add-exercise-student-report/:id')
  .post(authen.auth(), Exercise.addStudentReport);

router.route('/exercise/get-report-student/:id')
  .get(authen.auth(), Exercise.getStudentReport);

router.route('/exercise/get-report-exercise-by-course/:course')
  .get(authen.auth(), Exercise.getReportExerciseByCourse)

router.route('/exercise/change-status-report-student')
  .put(authen.auth(), Exercise.changeStatusStudentReport)
router.route('/exercise/get-exercise-result/:id/:type')
  .get(authen.auth(), Exercise.getExerciseResult);

router.route('/exercise/get-exercise-report/:id/:type')
  .get(authen.auth(), Exercise.getExerciseReportByid)

router.route('/exercise/get-exercises-report')
  .get(authen.auth(), Exercise.getExercisesReport);

router.route('/trial-test/get-list')
  .get(authen.auth(), Exercise.getListReportTrialTest);

router.route('/trial-test/:id')
  .get(authen.auth(), Exercise.getReportTrialTest)

router.route('/trial-test/point/:id')
  .put(authen.auth(), Exercise.updatePointSectionTest)

router.route('/send-mail-result-test/:id')
  .get(authen.auth(), Exercise.sendMailResultTest)

router.route('/result-trial-test')
  .get(authen.auth(), Exercise.getResultTrialTest);

router.route('/user-get-trial-test')
  .get(authen.auth(), Exercise.userGetResultTrialTest);

router.route('/exercise/convert-file-to-pdf')
    .post(Exercise.convertPDF);

export default router;
