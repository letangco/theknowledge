import User from '../models/user';
import LiveStream from '../models/liveStream';
import Video from '../models/videos';
import StringHelper from '../util/StringHelper';
import * as GDrive from "../gdrive/GDrive";
import globalConstants from "../../config/globalConstants";
import {getDocumentDownloadFileId, getDocumentUploadPermission, getVideoDownloadFileId} from "../services/document.services";
import {getCommentUploadPermission} from '../services/commentLiveStream.services';
import HistoryActionUser from '../models/historyActionUser';
import logger from '../util/log';

export async function downloadLessonDocument(req, res) {
  try {
    const docId = req.params.docId;
    if ( ! StringHelper.isObjectId(docId) ) {
      console.error('Download lesson document: document Id is not valid');
      return res.status(404).send();
    }
    // Check the download permission
    let fileId;
    try {
      fileId = await getDocumentDownloadFileId(docId);
      if ( fileId === false ) {
        console.error('Download lesson document: file not found');
        return res.status(404).send();
      }
    } catch ( error ) {
      console.error('Download lesson document error0:', error.message);
      return res.status(500).send();
    }
    logger.logX('fileId:', fileId);
    const reqHeaders = req.headers;
    const fileRes = await GDrive.downloadFile(fileId, reqHeaders);
    if ( reqHeaders.range && reqHeaders['user-agent'] ) {
      // Enable seek on video
      res.set('Accept-Ranges', 'bytes');
      res.set(fileRes.headers);
      res.status(fileRes.status);
    }
    return fileRes.data
      .on('error', error => {
        console.error('Download lesson document error1:', error.message);
        return res.status(500).send();
      })
      .pipe(res);
  } catch ( error ) {
    if ( error.message.statusCode ) {
      console.error('Download lesson document error2:', error.message.statusMessage);
      return res.status(error.message.statusCode).send();
    } else {
      console.error('Download lesson document error3:', error.message);
      return res.status(500).send();
    }
  }
}
export async function downloadStreamCommentFile(req, res) {
  try {
    const commentId = req.params.commentId;
    if ( ! StringHelper.isObjectId(commentId) ) {
      console.error('Download stream comment file: comment Id is not valid');
      return res.status(404).send();
    }
    // Todo: Check the download permission
    // The fileId is in comment and user have permission to read this comment?
    const fileId = req.params.fileId;
    logger.logX('fileId:', fileId);
    const reqHeaders = req.headers;
    const fileRes = await GDrive.downloadFile(fileId, reqHeaders);
    if ( reqHeaders.range && reqHeaders['user-agent'] ) {
      // Enable seek on video
      res.set('Accept-Ranges', 'bytes');
      res.set(fileRes.headers);
      res.status(fileRes.status);
    }
    return fileRes.data
      .on('error', error => {
        console.error('Download stream comment file error1:', error.message);
        return res.status(500).send();
      })
      .pipe(res);
  } catch ( error ) {
    if ( error.message.statusCode ) {
      console.error('Download stream comment file error2:', error.message.statusMessage);
      return res.status(error.message.statusCode).send();
    } else {
      console.error('Download stream comment file error3:', error.message);
      return res.status(500).send();
    }
  }
}

export async function downloadLessonVideo(req, res) {
  try {
    const docId = req.params.docId;
    if ( ! StringHelper.isObjectId(docId) ) {
      console.error('Download lesson document: document Id is not valid');
      return res.status(404).send();
    }
    // Check the download permission
    let fileId;
    try {
      fileId = await getVideoDownloadFileId(docId);
      if ( fileId === false ) {
        console.error('Download lesson video: file not found');
        return res.status(404).send();
      }
    } catch ( error ) {
      console.error('Download lesson video error0:', error.message);
      return res.status(500).send();
    }
    logger.logX('fileId:', fileId);
    let video = await Video.findOne({fileId}).lean();
    if(video){
      let totalView = video.totalView;
      await LiveStream.update({
        _id: video.lesson
      },{
        $set: {
          totalView: totalView + 1
        }
      });
      if(req.headers.token){
        let user = await User.findOne({token: req.headers.token}).lean();
        if(user){
          await HistoryActionUser.create({
            user: user._id,
            object: video.lesson,
            type: globalConstants.ACTIONS.CLICK_VIDEO,
            time: Date.now()
          });
        }
      }
    }
    const reqHeaders = req.headers;
    const fileRes = await GDrive.downloadFile(fileId, reqHeaders);
    if ( reqHeaders.range && reqHeaders['user-agent'] ) {
      // Enable seek on video
      res.set('Accept-Ranges', 'bytes');
      res.set(fileRes.headers);
      res.status(fileRes.status);
    }

    return fileRes.data
      .on('error', error => {
        console.error('Download lesson video error1:', error.message);
        return res.status(500).send();
      })
      .pipe(res);
  } catch ( error ) {
    if ( error.message.statusCode ) {
      console.error('Download lesson video error2:', error.message.statusMessage);
      return res.status(error.message.statusCode).send();
    } else {
      console.error('Download lesson video error3:', error.message);
      return res.status(500).send();
    }
  }
}

export async function uploadLessonDocumentValidate(req, res, next) {
  // Check the upload data is valid?
  const courseId = req.query.courseId;
  try {
    // Check the course and stream is valid: existed and stream id have course id
    // Get stream by streamId
    try {
      const havePermission = await getDocumentUploadPermission(courseId, req.user._id);
      if ( havePermission === false ) {
        throw Error('You have no permission to upload document for this lesson!');
      }
    } catch( error ) {
      throw error;
    }
    const reqBody = {};
    try {
      const documentFolderId = await GDrive.getCourseDocumentFolderId(courseId);
      logger.logX('documentFolderId:', documentFolderId);
      if ( documentFolderId ) {
        reqBody.parents = [ documentFolderId ];
      }
      reqBody.appProperties = {
        courseId: courseId,
      }
    } catch ( error ) {
      throw error;
    }
    req.reqBody = reqBody;
    req.courseId = courseId;
    logger.logX('reqBody:');
    logger.logX(reqBody);
  } catch ( error ) {
    return res.status(500).send({
      success: false,
      error: error.message
    });
  }
  next();
}


export async function uploadLessonVideoValidate(req, res, next) {
  // Check the upload data is valid?
  const courseId = req.query.courseId;
  try {
    // Check the course and stream is valid: existed and stream id have course id
    // Get stream by streamId
    try {
      const havePermission = await getDocumentUploadPermission(courseId, req.user._id);
      if ( havePermission === false ) {
        throw Error('You have no permission to upload video for this lesson!');
      }
    } catch( error ) {
      throw error;
    }
    const reqBody = {};
    try {
      const documentFolderId = await GDrive.getCourseDocumentFolderId(courseId);
      logger.logX('documentFolderId:', documentFolderId);
      if ( documentFolderId ) {
        reqBody.parents = [ documentFolderId ];
      }
      reqBody.appProperties = {
        courseId: courseId,
      }
    } catch ( error ) {
      throw error;
    }
    req.reqBody = reqBody;
    req.courseId = courseId;
    logger.logX('reqBody:');
    logger.logX(reqBody);
  } catch ( error ) {
    console.error('uploadLessonDocumentValidate error');
    console.error(error);
    return res.status(500).send({
      success: false,
      error: 'Internal error'
    });
  }
  next();
}

export async function uploadStreamCommentFileValidate(req, res, next) {
  // Check the upload data is valid?
  const streamId = req.query.streamId;
  if ( ! StringHelper.isObjectId(streamId) ) {
    return res.status(500).json({
      success: false,
      error: 'Stream id is not valid',
    });
  }
  let courseId = req.query.courseId;
  if ( courseId === 'undefined' ) {
    courseId = undefined;
  }
  try {
    // Check the course and stream is valid: existed and stream id have course id
    // Get stream by streamId
    try {
      const havePermission = await getCommentUploadPermission(streamId, req.user._id);
      if ( havePermission === false ) {
        throw Error('You have no permission to upload document for this lesson!');
      }
    } catch( error ) {
      console.error('getCommentUploadPermission error');
      console.error(error);
      throw error;
    }
    const reqBody = {};
    try {
      const streamCmtFolderId = await GDrive.getStreamCommentFileFolderId(streamId, courseId);
      logger.logX('streamCmtFolderId:', streamCmtFolderId);
      if ( streamCmtFolderId ) {
        reqBody.parents = [ streamCmtFolderId ];
      }
      reqBody.appProperties = {
        streamId: streamId,
      };
      if ( courseId ) {
        reqBody.appProperties.courseId = courseId;
      }
    } catch ( error ) {
      throw error;
    }
    req.reqBody = reqBody;
    req.courseId = courseId;
    req.streamId = streamId;
    logger.logX('reqBody:');
    logger.logX(reqBody);
  } catch ( error ) {
    console.error('uploadStreamCommentFileValidate error');
    console.error(error);
    return res.status(500).send({
      success: false,
      error: 'Internal error'
    });
  }
  next();
}

export async function streamPlayback(req, res) {
  const streamId = req.query.id;
  if ( ! StringHelper.isObjectId(streamId) ) {
    return res.status(404).json({success: false, error: 'Stream id is not valid.'});
  }
  try {
    // Check user permission on this file
    // const isMemberShip = await checkUserIsMemberShip(req.user._id);
    // if ( ! isMemberShip ) {
    //   return res.status(404).send({
    //     success: false,
    //     error: 'Permission denied!'
    //   });
    // }
    const fileId = req.query.fileId;
    if ( ! fileId ) {
      return res.status(404).send();
    }
    const reqHeaders = req.headers;
    // console.log('reqHeaders', reqHeaders);
    // if ( ! reqHeaders.range ) {
    //   return res.status(404).send();
    // }
    const fileRes = await GDrive.videoPlayback( fileId, reqHeaders );
    res.set('Accept-Ranges', 'bytes');
    res.set(fileRes.headers);
    res.status(fileRes.status);
    return fileRes.data
      .on('error', error => {
        console.error('Error when play video0:', error.message);
        return res.status(500).send();
      })
      .pipe(res);
  } catch ( error ) {
    if ( error.message.statusCode ) {
      console.error('Error when play video1:', error.message.statusMessage);
      return res.status(error.message.statusCode).send();
    } else {
      console.error('Error when play video2:', error.message);
      return res.status(500).send();
    }
  }
}
