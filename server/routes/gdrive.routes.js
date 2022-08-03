import * as GDriveUploadController from '../controllers/gdrive.controller';
import uploadFileMulter from '../gdrive/multer-gdrive';
import {Router} from 'express';
import auth from '../libs/Auth/Auth.js';
import * as UploadController from "../controllers/upload.controller";

const router = new Router();
// Course lesson document file handle
router.route('/files/lesson-document').post( auth.auth(), GDriveUploadController.uploadLessonDocumentValidate, function(req, res, next) {
  req.setTimeout(0); // https://stackoverflow.com/questions/45910084/ajax-neterr-empty-response-after-waiting-for-response-for-2-mins-node-js-ser
  next();
}, uploadFileMulter, UploadController.handleUploadCourseDocuments );
router.route('/files/lesson-document/:docId/:filename').get( GDriveUploadController.downloadLessonDocument );

// Handle upload for file on stream comment
router.route('/files/stream-comment').post( auth.auth(), GDriveUploadController.uploadStreamCommentFileValidate, function(req, res, next) {
  req.setTimeout(0); // https://stackoverflow.com/questions/45910084/ajax-neterr-empty-response-after-waiting-for-response-for-2-mins-node-js-ser
  next();
}, uploadFileMulter, UploadController.handleUploadStreamCommentFile );
router.route('/files/stream-comment/:commentId/:fileId/:filename').get( GDriveUploadController.downloadStreamCommentFile );

//Upload File video lesson
router.route('/files/lesson-video').post( auth.auth(), GDriveUploadController.uploadLessonVideoValidate, function(req, res, next) {
  req.setTimeout(0);
  next();
}, uploadFileMulter, UploadController.handleUploadCourseVideos );
router.route('/files/lesson-video/:docId/:filename').get( GDriveUploadController.downloadLessonVideo );

export default router;
