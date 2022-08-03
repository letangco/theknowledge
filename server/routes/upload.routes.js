import { Router } from 'express';
import * as UploadController from '../controllers/upload.controller';
import * as LiveStream from '../controllers/liveStream.controller';
import path from 'path';
import multer from 'multer';
import slug from 'limax';
import auth from '../libs/Auth/Auth.js';
import isAdmin from '../libs/Auth/isAdmin.js';
import { mkDir } from '../util/file.helper';
import {
  courseMulterUpload, officeFileUploader, officeFileDestination, exerciseMulterUpload,
  handleUploadOfficeFileSuccess, // removeOfficeFileApi
} from '../controllers/upload.controller';
import * as ExerciseController from '../controllers/exercise.controller';
import { createCourse, updateCourse } from '../controllers/course.controller';
import { uploadSpeakingAnswer } from '../controllers/exercise.controller';
import configs from '../config';

const router = new Router();

const destAvatar = path.resolve(__dirname, '../../uploads/avatar');
const storageAvatar = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, destAvatar);
  },
  filename: function (req, file, cb) {
    // Mimetype stores the file type, set extensions according to filetype
    const userID = req.body.userID || 'unknown';
    let ext = '';
    switch (file.mimetype) {
      case 'image/jpeg':
        ext = '.jpeg';
        break;
      case 'image/png':
        ext = '.png';
        break;
      case 'image/gif':
        ext = '.gif';
        break;
    }
    cb(null, userID + '-' + Date.now() + ext);
  }
});
const uploadAvatar = multer({storage: storageAvatar});
const multipleUploadAvatar = uploadAvatar.any();
router.post('/upload-avatar', multipleUploadAvatar, UploadController.handleUploadAvatar);
//=================================================================
const destUploadFile = path.resolve(__dirname, '../../' + UploadController.uploadURL);
const storageUploadFile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, destUploadFile)
  },
  filename: function (req, file, cb) {
    // todo: check the file extension
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName);
    const slugName = slug(originalName, {lowercase: true});
    cb(null, Date.now()+'-'+slugName+fileExtension);
  }
});
const uploadFile = multer({storage: storageUploadFile});
// var multipleUpload = upload.fields([{name: 'chatUploadFile', maxCount: 10}, {name: 'userID', maxCount: 1}]);
const multipleUploadFile = uploadFile.any();
router.route('/upload-file').post(multipleUploadFile, UploadController.handleFileUploadRequest);
//=================================================================
const destKnowledgeUpload = path.resolve(__dirname, '../../' + UploadController.uploadURL + '/knowledge');
const storageKnowledge = multer.diskStorage({
  destination: function (req, file, cb) {
    let destUpload = destKnowledgeUpload + '/' + req.query.userSend;
    mkDir(destUpload);
    cb(null, destUpload);
  },
  filename: function (req, file, cb) {
    // Todo: check the file extension
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName);
    const slugName = slug(originalName, {lowercase: true});
    const finalName = Date.now() + '-' + slugName + fileExtension;
    cb(null, finalName);
  }
});
const uploadKnowledge = multer({storage: storageKnowledge});
const multipleUploadKnowledge = uploadKnowledge.any();
router.route('/upload-knowledge-resource').post(multipleUploadKnowledge, UploadController.handleKnowledgeResourceUploadRequest);
//=================================================================
// Create router for upload stream thumbnail
const streamSubDest = 'stream-thumb';
const destStreamUpload = path.resolve(__dirname, '../../' + UploadController.uploadURL + streamSubDest);
const storageStream = multer.diskStorage({
  destination: function (req, file, cb) {
    let userId = req.user._id;
    if ( userId ) {
      let destUpload = destStreamUpload + '/' + userId;
      mkDir(destUpload);
      req.destination = UploadController.uploadURL + streamSubDest + '/' + userId;
      cb(null, destUpload);
    } else {
      cb('User id is not defined!');
    }
  },
  filename: function (req, file, cb) {
    // Todo: check the file extension
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName) || '.png';
    const slugName = slug(originalName, {lowercase: true});
    const finalName = Date.now() + '-' + slugName + fileExtension;
    if ( slugName === 'stream-thumbnail' ) {
      req.fileName = finalName;
    } else {
      req.fileNameForMetaCEO = finalName;
    }
    cb(null, finalName);
  }
});
const uploadStream = multer({storage: storageStream});
const multipleUploadStream = uploadStream.any();
router.route('/upload-stream-resource').post( auth.auth(), multipleUploadStream, LiveStream.addLiveStream );
//=================================================================
// Create router for upload stream thumbnail
const scheduleSubDest = 'schedule-thumb';
const destScheduleUpload = path.resolve(__dirname, '../../' + UploadController.uploadURL + scheduleSubDest);
const storageSchedule = multer.diskStorage({
  destination: function (req, file, cb) {
    let userId = req.user._id;
    if ( userId ) {
      let destUpload = destScheduleUpload + '/' + userId;
      mkDir(destUpload);
      req.destination = UploadController.uploadURL + scheduleSubDest + '/' + userId;
      cb(null, destUpload);
    } else {
      cb('User id is not defined!');
    }
  },
  filename: function (req, file, cb) {
    // Todo: check the file extension
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName) || '.png';
    const slugName = slug(originalName, {lowercase: true});
    const finalName = Date.now() + '-' + slugName + fileExtension;
    if ( slugName === 'schedule-thumbnail' ) {
      req.fileName = finalName;
    } else {
      req.fileNameForMetaCEO = finalName;
    }
    cb(null, finalName);
  }
});
const uploadSchedule = multer({storage: storageSchedule});
const multipleUploadSchedule = uploadSchedule.any();
router.route('/upload-schedule-resource')
  .put(auth.auth(), multipleUploadSchedule, LiveStream.updateScheduleStream )
  .post( auth.auth(), multipleUploadSchedule, LiveStream.addScheduleStream );
//=================================================================

router.route('/upload-course-resource')
  .post( auth.auth(), courseMulterUpload, createCourse )
  .put( auth.auth(), courseMulterUpload, updateCourse );

router.route('/send-exercise-result/:id')
  .post( auth.auth(), exerciseMulterUpload, uploadSpeakingAnswer )

//=================================================================
router.route('/office-file-to-pdf')
  .post( auth.auth(),
    function(req, res, next) {
      officeFileUploader(req, res, function(error) {
        if (error) {
          // An error occurred when uploading
          return res.status(500).send({success: false, error: error.message});
        }
        // Everything went fine
        next();
      });
    },
    handleUploadOfficeFileSuccess
  );

//=================================================================
// Create router for upload popup for ads
const popupUploadSubDest = 'popup';
export const destPopupUpload = path.resolve(__dirname, '../../' + UploadController.uploadURL + popupUploadSubDest);
const storagePopupUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, destPopupUpload);
  },
  filename: function (req, file, cb) {
    // Todo: check the file extension
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName) || '.png';
    const slugName = slug(path.basename(file.originalname, fileExtension), { lowercase: true });
    const finalName = Date.now() + '-' + slugName + fileExtension;
    req.fileName = finalName;
    cb(null, finalName);
  }
});
const uploadPopup = multer({storage: storagePopupUpload});
const multipleUploadPopup = uploadPopup.any();
router.route('/upload-popup-image')
  .post( isAdmin.auth(), multipleUploadPopup, function(req, res, next) {
    res.json({
      success: true,
      fileName: req.fileName,
      fileUrl: `${UploadController.uploadURL + popupUploadSubDest}/${req.fileName}`
    })
  });
//=================================================================
// Create router for upload audio for multiple choice
const questionsUploadSubDest = 'multiple-choice';
export const destQuestitonUpload = path.resolve(__dirname, '../../' + UploadController.uploadURL + questionsUploadSubDest);
const storageQuestionUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, destQuestitonUpload);
  },
  filename: function (req, file, cb) {
    // Todo: check the file extension
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName) || '.mp3';
    const slugName = slug(path.basename(file.originalname, fileExtension), { lowercase: true });
    const finalName = Date.now() + '-' + slugName + fileExtension;
    req.fileName = finalName;
    cb(null, finalName);
  }
});
const uploadQuestion = multer({storage: storageQuestionUpload});
const multipleUploadQuestion = uploadQuestion.any();
router.route('/upload-audio-multiple')
  .post( multipleUploadQuestion, function(req, res, next) {
    res.json({
      success: true,
      fileName: req.fileName,
      fileUrl: `${UploadController.uploadURL + questionsUploadSubDest}/${req.fileName}`
    })
  });

//=================================================================
// Create router for upload image for news
const newsUploadDest = 'news-image';
export const destNewsUpload = path.resolve(__dirname, '../../' + UploadController.uploadURL + newsUploadDest);
const storageNewsUpload = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, destNewsUpload);
  },
  filename: function (req, file, cb) {
    // Todo: check the file extension
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName) || '.png';
    const slugName = slug(path.basename(file.originalname, fileExtension), { lowercase: true });
    const finalName = Date.now() + '-' + slugName + fileExtension;
    req.fileName = finalName;
    cb(null, finalName);
  }
});
const uploadNews = multer({storage: storageNewsUpload});
const multipleUploadNews = uploadNews.any();
router.route('/upload-news')
  .post(
    multipleUploadNews, function(req, res, next) {
    res.json({
      success: true,
      fileName: req.fileName,
      fileUrl: `${configs.domainHttpHost}/${UploadController.uploadURL + newsUploadDest}/${req.fileName}`
    })
  });

(function createUploadFolder() {
  mkDir(destUploadFile);
  mkDir(destAvatar);
  mkDir(destKnowledgeUpload);
  mkDir(destStreamUpload);
  mkDir(destScheduleUpload);
  mkDir(officeFileDestination);
  mkDir(destPopupUpload);
  mkDir(destNewsUpload);
})();

export default router;
