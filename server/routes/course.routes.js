import { Router } from 'express';
import authen from '../libs/Auth/Auth.js';
import isAdmin from '../libs/Auth/isAdmin.js';
import {courseMulterUpload} from "../controllers/upload.controller";

const router = new Router();

import * as LessonController from '../controllers/lesson.controller';
import * as CourseController from '../controllers/course.controller';
import * as ReviewCourseController from '../controllers/reviewCourse.controller';

router.route('/courses/create')
  .post(authen.auth(), courseMulterUpload, CourseController.createCourse);

router.route('/courses/:id/join')
  .post(authen.auth(), CourseController.joinCourse);

router.route('/courses/:id/clone')
  .get(authen.auth(), CourseController.cloneCourse);

router.route('/courses/:id/generate-lesson-live')
  .post(authen.auth(), CourseController.generalLessonLive);

router.route('/courses')
  .get(CourseController.getCourses);

router.route('/courses/search')
  .get(CourseController.searchCourses);

router.route('/courses/:id')
  .delete(authen.auth(), CourseController.deleteCourse);

router.get('/courses/detail', CourseController.getCourse);
router.get('/courses/updateBrokenLesson/:courseId/:lessonId', CourseController.updateBrokenLesson);

router.get('/courses/detail-update', CourseController.getCourseToUpdate);
router.get('/course-meta-by-slug/:slug', CourseController.getMetaCourse);

router.route('/courses/mine')
  .get(authen.auth(), CourseController.getMyCourses);

router.route('/courses/get-lessons')
  .get(authen.auth(), CourseController.getLessonsCourse);

router.route('/courses/all-mine')
  .get(authen.auth(), CourseController.getAllMyCourses);

router.route('/courses/joined')
  .get(authen.auth(), CourseController.getJoinedCourses);

router.route('/courses/:id/refund')
  .post(authen.auth(), CourseController.requestRefund);

router.route('/courses/:id/update')
  .put(authen.auth(), CourseController.updateCourse);

router.route('/courses/:id/approve')
  .post(isAdmin.auth(), CourseController.adminConsiderCourse);

router.route('/courses/:id/check-buy')
  .get(authen.auth(), CourseController.checkBuyAble);

router.route('/courses/:id/approve-delete')
  .post(isAdmin.auth(), CourseController.adminApproveDeleteCourse);

router.route('/courses/check-can-start')
  .get(authen.auth(), CourseController.checkCanStartLesson);

router.route('/admin/courses')
  .get(isAdmin.auth(), CourseController.adminGetCourses)
  .delete(isAdmin.auth(), CourseController.adminDeleteCourse);

router.route('/admin/course/:id')
  .get(isAdmin.auth(), CourseController.adminGetCourse);

router.route('/course/:id')
  .get(CourseController.adminGetCourse);

router.route('/admin/course/:id/addUser')
  .post(isAdmin.auth(), CourseController.addUsersToCourse);

router.route('/admin/course/:id/edit')
  .put(isAdmin.auth(), CourseController.editUserToCourse);

router.route('/admin/course/:id/note')
  .post(isAdmin.auth(), CourseController.addNoteCourse);

router.route('/admin/view/edit')
  .put(isAdmin.auth(), CourseController.editUserViewToCourse);

router.route('/admin/course/:id/removeUser')
  .post(isAdmin.auth(), CourseController.removeUserToCourse);

router.route('/admin/course/:id/getUsers')
  .get(isAdmin.auth(), CourseController.getUsersByCourse);

router.route('/admin/course/:id/getTracking')
  .get(isAdmin.auth(), CourseController.getTrackingByCourse);

router.route('/course/:id/getTracking')
  .get(authen.auth(), CourseController.getTrackingByCourse);

router.route('/admin/courses/updateMembership')
  .get(isAdmin.auth(), CourseController.adminUpdateMembership);

router.route('/admin/courses/tracking')
  .get(isAdmin.auth(), CourseController.getAvailableCourses);

router.route('/courses/delete-review/:id')
  .get(authen.auth(), ReviewCourseController.deleteReview);

router.route('/courses/:id/reviews')
  .get(ReviewCourseController.getReviewsByCourse)
  .post(authen.auth(), ReviewCourseController.addReviewCourse);

router.route('/courses/:id/review-options')
  .get(authen.auth(), ReviewCourseController.getReviewCourseOptions);

router.route('/courses/:id/my-reviewed-options')
  .get(authen.auth(), ReviewCourseController.getRatingMyCourse);

router.route('/courses/adhoc-review/:slug')
  .get(CourseController.adminAddHocApproveCourse);

router.route('/courses/:id/video-tracking')
  .post(authen.auth(), CourseController.trackingVideoCourse)

router.route('/courses/:id/students')
  .get(authen.auth(), CourseController.getCourseStudents);

router.route('/courses/export-students')
  .get(authen.auth(), CourseController.exportCourseStudents);

router.route('/courses/delete-video/:videoId/:lessonId')
  .get(authen.auth(), CourseController.deleteCourseVideo);
router.route('/courses/:id/code')
  .get(authen.auth(), CourseController.getCourseCode);

router.route('/admin/courses/:id/code')
  .get(isAdmin.auth(), CourseController.getCourseCode);

router.route('/courses/:id/generate-code')
  .post(authen.auth(), CourseController.generateCourseCode);

router.route('/admin/courses/:id/generate-code')
  .post(isAdmin.auth(), CourseController.generateCourseCode);

router.route('/courses/delete-code/:code')
  .delete(authen.auth(), CourseController.deleteCourseCode);

router.route('/admin/courses/:code')
  .delete(isAdmin.auth(), CourseController.deleteCourseCode)
  .put(isAdmin.auth(), CourseController.editCodeCourse);

router.route('/admin/send-sms')
  .post(isAdmin.auth(), CourseController.sendSMSToUser);

router.route('/admin/general-course')
  .get(isAdmin.auth(), CourseController.getGeneralCourse);

router.route('/courses/:id/validation-course-code')
  .get(authen.auth(), CourseController.validationCourseCode);

router.route('/courses/:id/validation-course-code-by-stream')
  .get(authen.auth(), CourseController.validationCourseCodeByStream);

router.route('/courses/:id/validation-course-password')
  .get(authen.auth(), CourseController.validationCoursePassword);

router.route('/courses/:id/validation-course-password-by-id')
  .get(authen.auth(), CourseController.validationCoursePasswordById);
router.route('/courses/get-scheduled')
  .post(CourseController.getScheduledMembership);
router.route('/courses/get-schedule-user')
  .post(authen.auth(), CourseController.getScheduledByUser)

router.route('/lesson-comment/:id/comments')
  .get(LessonController.getCommentsByLeson)
  .post(authen.auth(), LessonController.submit);

router.route('/lesson-comment/:id')
  .put(authen.auth(), LessonController.updateComment)
  .delete(authen.auth(), LessonController.deleteComment);
router.route('/review-comment/:id')
  .get(ReviewCourseController.getCommentReviewCourse)
  .post(authen.auth(), ReviewCourseController.addCommentReview)
  .delete(authen.auth(), ReviewCourseController.deleteCommentReview);

router.route('/lesson-comment/:id/replies')
  .get(LessonController.getCommentReplies)
  .post(authen.auth(), LessonController.submitReply);

router.route('/update-time-video/:id')
  .get(authen.auth(), CourseController.getCurrentTime)
  .post(authen.auth(), CourseController.updateCurrentTime);

router.route('/courses/complete-course/:id')
  .get(authen.auth(), CourseController.getCompleteCourse);

router.route('/courses/complete-process/:id')
  .get(authen.auth(), CourseController.getCompleteProcess);

router.route('/course/get-total-user/:id')
  .get(CourseController.getTotalUser);

export default router;
