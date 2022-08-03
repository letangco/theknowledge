import path from 'path';
import slug from 'limax';
import Document from '../models/documents';
import Video from '../models/videos';
import globalConstants from '../../config/globalConstants';
import {Q} from '../libs/Queue';
// import {checkBoughtCourse} from "./course.services";
// import User from '../models/user';
// import LiveStream from '../models/liveStream';
import {getCourseModelById} from "./course.services";
import StringHelper from '../util/StringHelper';

export async function addDocuments(documentOptions) {
  try {
    if(!(documentOptions instanceof Array)) {
      documentOptions = [documentOptions];
    }

    return await Document.create(documentOptions);
  } catch (err) {
    console.log('err on addDocuments:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addVideos(videoOptions) {
  try {
    if(!(videoOptions instanceof Array)) {
      videoOptions = [videoOptions];
    }

    return await Video.create(videoOptions);
  } catch (err) {
    console.log('err on addVideos:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

/**
 * Check the user have permission to download document from lesson
 * Only member ship, user bought, lectures, admin or owner can download
 * If the user have permission, let return the fileId
 * @param docId string Id or ObjectId
 * @param requesterId ObjectId
 * @returns {Promise.<boolean>}
 */
export async function getDocumentDownloadFileId(docId, requesterId) {
  // Public for now
  let document;
  if ( docId ) {
    document = await Document.findById(docId, 'fileId');
  }
  if ( ! document ) {
    return false;
  }

  return document && document.fileId ? document.fileId : false;


  // let requester;
  // if ( requesterId ) {
  //   requester = await User.findById(requesterId, 'role memberShip');
  // }
  // if ( ! requester ) {
  //   return false;
  // }
  //
  // let document;
  // if ( docId ) {
  //   document = await Document.findById(docId, 'course fileId');
  // }
  // if ( ! document ) {
  //   return false;
  // }
  //
  // let course = await getCourseModelById(document.course);
  // if ( ! course ) {
  //   return false;
  // }
  //
  // const lectures = course.lectures.map(e => e.toString());
  //
  // const isJoined = await checkBoughtCourse(requesterId, document.course);
  //
  // return (
  //   requester.role === 'admin'
  //   || (requester.memberShip && requester.memberShip > new Date().getTime())
  //   || isJoined
  //   || requesterId.toString() === course.creator.toString()
  //   || lectures.indexOf(requesterId.toString()) !== -1
  // ) ? document.fileId : false;
}

export async function getVideoDownloadFileId(docId) {
  // Public for now
  let document;
  if ( docId ) {
    document = await Video.findById(docId, 'fileId');
  }
  if ( ! document ) {
    return false;
  }

  return document && document.fileId ? document.fileId : false;

}

/**
 * Check the user have permission to upload document for lesson of course
 * Only owner of lectures can upload document for lesson of course
 * @param courseId string Id or ObjectId
 * @param requesterId ObjectId
 * @returns {Promise.<boolean>}
 */
export async function getDocumentUploadPermission(courseId, requesterId) {
  if ( ! StringHelper.isObjectId(courseId) ) {
    return false;
  }
  let course = await getCourseModelById(courseId);
  if ( ! course ) {
    return false;
  }
  let lectures = course.lectures.map(e => e.toString());
  return (requesterId.toString() === course.creator.toString() || lectures.indexOf(requesterId.toString()) !== -1) ? course._id.toString() : false;
}

export async function getDocumentsByLessons(lessonIds, viewPermission) {
  try {
    if(!(lessonIds instanceof Array)) {
      lessonIds = [lessonIds];
    }
    if(!lessonIds.length) {
      return [];
    }
    let docs = await Document.find({lesson: {$in: lessonIds}}).lean();
    return docs.map(doc => {
      if (doc.type === 'link') {
        if(!viewPermission && doc.privacy === 'private') {
          delete doc.address;
        } else {
          doc.title = doc.title || doc.address;
        }
      } else {
        doc.title = doc.title || doc.fileName;
        if (!doc.address ) {
          doc.address = `cloud/files/lesson-document/${doc._id.toString()}/${doc.fileName}`;
        }
        if(!viewPermission && doc.privacy === 'private') {
          delete doc.address;
        }
      }
      delete doc.fileId;
      return doc;
    });
  } catch (err) {
    console.log('err on getDocumentsByLessons:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getVideosByLessons(lessonIds, viewPermission) {
  try {
    if(!(lessonIds instanceof Array)) {
      lessonIds = [lessonIds];
    }

    if(!lessonIds.length) {
      return [];
    }
    let videos = await Video.find({lesson: {$in: lessonIds}}).lean();

    return videos.map(video =>{
      video.title = video.title ? video.title : video.fileName;
      if (!video.address ) {
        const originalName = video.fileName;
        const fileExtension = path.extname(originalName);
        const slugName = slug(originalName, {lowercase: true});
        video.address = `cloud/files/lesson-video/${video._id.toString()}/${slugName+fileExtension}`;
      }
      if(!viewPermission && video.privacy === 'private') {
        delete video.address;
      }
      delete video.fileId;
      return video;
    });
  } catch (err) {
    console.log('err on getVideosByLessons:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function deleteDocuments(documents) {
  try {
    if(!(documents instanceof Array)) {
      documents = [documents];
    }
    let documentIds = documents.map(document => {
      if ( document.address ) {
        // Old data
        Q.create(globalConstants.jobName.DELETE_FILE, {filePath: document.address}).removeOnComplete(true).save();
      } else {
        Q.create(globalConstants.jobName.DELETE_FILE, {fileId: document.fileId}).removeOnComplete(true).save();
      }
      return document._id;
    });
    return await Document.remove({_id: {$in: documentIds}});
  } catch (err) {
    console.log('err on deleteDocumentsByIds:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function deleteVideos(videos) {
  try {
    if(!(videos instanceof Array)) {
      videos = [videos];
    }
    let videoIds = videos.map(video => {
      if ( video.address ) {
        // Old data
        Q.create(globalConstants.jobName.DELETE_FILE, {filePath: video.address}).removeOnComplete(true).save();
      } else {
        Q.create(globalConstants.jobName.DELETE_FILE, {fileId: video.fileId}).removeOnComplete(true).save();
      }
      return video._id;
    });
    return await Video.remove({_id: {$in: videoIds}});
  } catch (err) {
    console.log('err on deleteVideosByIds:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getDocumentsByIds(documentIds) {
  try {
    if(!(documentIds instanceof Array)) {
      documentIds = [documentIds];
    }

    return await Document.find({_id: {$in: documentIds}}).lean();
  } catch (err) {
    console.log('err on getDocumentsByIds:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getVideosByIds(videoIds) {
  try {
    if(!(videoIds instanceof Array)) {
      videoIds = [videoIds];
    }

    return await Video.find({_id: {$in: videoIds}}).lean();
  } catch (err) {
    console.log('err on getVideosByIds:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getDocumentModelsByIds(documentIds) {
  try {
    if(!(documentIds instanceof Array)) {
      documentIds = [documentIds];
    }

    return await Document.find({_id: {$in: documentIds}});
  } catch (err) {
    console.log('err on getDocumentsByIds:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getStreamDocuments(streamId) {
  try {
    const docs = await Document.find({lesson: streamId});
    return docs.map(doc =>{
      if (doc.type === 'link'){
        doc.title = doc.title ? doc.title : doc.address;
      } else {
        doc.title = doc.title ? doc.title : doc.fileName;
        // Keep the old data from server disk
        if ( ! doc.address ) {
          doc.address = `cloud/files/lesson-document/${doc._id.toString()}/${doc.fileName}`;
        }
      }
      delete doc.fileId;
      return doc;
    });
  } catch ( error ) {
    return error;
  }
}

export async function getVideoModelsByIds(videoIds) {
  try {
    if(!(videoIds instanceof Array)) {
      videoIds = [videoIds];
    }

    return await Video.find({_id: {$in: videoIds}});
  } catch (err) {
    console.log('err on getVideoModelsByIds:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
