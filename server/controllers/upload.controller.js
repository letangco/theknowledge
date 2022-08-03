/**
 * Created by ntnhan on 14/07/2017.
 */
import {serverSocketStaticInstance} from '../routes/socket_routes/chat_socket';
import {addMessageFiles} from '../controllers/message.controller';
import {updateAvatar} from '../controllers/user.controller';
import cuid from 'cuid';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import slug from 'limax';
import {buildSlug as buildCourseSlug} from "../services/course.services";
import {buildSlug as buildLessonSlug} from "../services/liveStream.services";
import {getCourseModelById} from "../services/course.services";
import {getLessonsSlugMapper} from "../services/liveStream.services";
import StringHelper from '../util/StringHelper';
import rimraf from 'rimraf';
import {addDocuments, addVideos} from "../services/document.services";
import * as CommentLiveStream from "../services/commentLiveStream.services";
import Mongoose from 'mongoose';
import { mkDir } from '../util/file.helper';
export const uploadURL = 'uploads/';

export function handleUploadAvatar(req, res) {
  let userPreviousAvatarPath = req.body.userPreviousAvatarPath;
  let userID = req.body.userID;
  let ext = '';
  switch (req.files[0].mimetype) {
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
  let filePath = 'uploads/avatar/' + req.files[0].filename;
  Promise.resolve(updateAvatar(userID, filePath)).then((result) => {
    removeFile(path.resolve(__dirname, '../../' + userPreviousAvatarPath));
    res.status(200).send({avatarPath: filePath, dateModify: Date.now()});
  });
}

export function handleFileUploadRequest(req, res) {
  let files = [];
  // Browse all file, to make the content for message
  req.files.map((file) => {
    // Lower case the name to correct compare
    let fileName = file.originalname.toLowerCase();
    // Check the file extension is image or not?
    let isImage = fileName.match(/\.(jpg|jpeg|png|gif|ico)$/);
    const imageID = cuid();
    // If the file is an image, push type for it
    if(isImage) {
      files.push({
        cuid: imageID,
        name: file.originalname,
        filePath: uploadURL + file.filename,
        type: 'image'
      });
    }
    // If file is not an image, no need to set type, mean it have same type of parent(file)
    else {
      files.push({
        cuid: imageID,
        name: file.originalname,
        filePath: uploadURL + file.filename
      });
    }
  });
  let userSend = req.body.userSend;
  let userReceive = req.body.userReceive;
  let chatGroup = req.body.chatGroup;
  // Build message
  let message = {
    userSend: userSend,
    chatGroup: chatGroup,
    content: files,
    type: 'files'
  };

  addMessageFiles(message).then((message) => {
    // Send notify when file uploaded
    if (serverSocketStaticInstance !== null) {
      if (userSend) {
        serverSocketStaticInstance.emitFileUploaded(userSend, message);
      }
      if (userReceive) {
        serverSocketStaticInstance.emitFileUploaded(userReceive, message);
      }
    }
  });
  res.status(204).end();
}

export function handleKnowledgeResourceUploadRequest(req, res) {
  if(req.files && req.files[0]) {
    res.status(200).send({filePath: `uploads/knowledge/${req.query.userSend}/${req.files[0].filename}`});
    return;
  }
  res.status(204).end();
}

function removeFile(filePath) {
  fs.unlink(filePath, (err) => {
    // if(err){
    //   console.log('Upload avatar failed with error:');
    //   console.log(err);
    // }
  });
}

// Create router for upload course resource
const courseSubDest = 'courses';
export const courseDestUpload = path.resolve(__dirname, '../../' + uploadURL + courseSubDest);
const courseStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // This function call on each file on files upload,
    // So let parse data one time
    if ( ! req.data ) {
      try {
        // Get data and create slug here
        req.cuidMapper = {};
        req.data = JSON.parse(req.body.data);
        let promises = [];
        // req.data: data parsed
        if(req.method === 'PUT') {
          let course = await getCourseModelById(req.data.courseId);
          req.courseSlug = course.slug;
          let lessonIds = req.data.lessons.map(lesson => lesson._id);
          lessonIds = lessonIds.filter(id => StringHelper.isObjectId(id));
          let lessonSlugMapper = await getLessonsSlugMapper(lessonIds);

          promises = req.data.lessons.map(async lesson => {
            if(lesson.type !== 'multiple'){
              lesson.slug = lesson._id ? lessonSlugMapper[lesson._id.toString()].slug : await buildLessonSlug(lesson.title);
              req.cuidMapper[lesson.cuid] = lesson.slug;
              return lesson;
            } else {
              return lesson;
            }
          });
        } else {
          // Generate your slug here
          req.courseSlug = await buildCourseSlug(req.data.title); // Pass data to controller
          promises = req.data.lessons.map(async lesson => {
            if(lesson.type !== 'multiple'){
              // console.log('lesson cuid:', lesson.cuid);
              lesson.slug = await buildLessonSlug(lesson.title);
              // console.log('lesson:', lesson);
              req.cuidMapper[lesson.cuid] = lesson.slug;
              return lesson;
            } else {
              return lesson;
            }
          });
        }
        req.data.lessons = await Promise.all(promises);
      } catch (error) {
        cb(error.toString());
      }

    }
// console.log('req.data.lessons:', req.data.lessons);
    // file.fieldname Ship the course temp cuid via fieldname
    // console.log('====== cuidMapper:', req.cuidMapper);
    // console.log('====== file.fieldname:', file.fieldname);
    // console.log('====== lesson slug:', req.cuidMapper[file.fieldname]);
    let destUpload = `${uploadURL}${courseSubDest}/${req.courseSlug}/`;
    mkDir(destUpload);
    if(file.fieldname !== 'thumbnail') {
      let cuid = file.fieldname.split('_').shift();
      destUpload += `${req.cuidMapper[cuid]}`;
    }
    req.destination = destUpload;
    mkDir(destUpload);
    cb(null, destUpload);
  },
  filename: function (req, file, cb) {
    // console.log('file');
    // console.log(file);
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName);
    const slugName = slug(path.basename(file.originalname, fileExtension), { lowercase: true });
    const fileName = Date.now() + '-' + slugName + fileExtension;
    // If have lesson match with file's lesson cuid
    if ( ! req.lessonFiles ) {
      req.lessonFiles = {};
    }
    let lessonFiles = req.lessonFiles;
    if ( ! lessonFiles[file.fieldname] ) {
      lessonFiles[file.fieldname] = [];
    }
    let splitedFieldName = file.fieldname.split('_'), privacy = 'private';
    if(splitedFieldName.length > 1 && splitedFieldName[1] === 'public') {
      privacy = splitedFieldName[1];
    }

    let finalUrl = `${req.destination}/${fileName}`;
    lessonFiles[file.fieldname].push({user: req.user._id, address: finalUrl, title: originalName, type: 'file', privacy});

    req.lessonFiles = lessonFiles;

    cb(null, fileName);
  }
});

// Create router for upload exercise resource
const exerciseSubDest = 'exercise';
export const exerciseDestUpload = path.resolve(__dirname, '../../' + uploadURL + exerciseSubDest);
const exerciseStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    let destUpload = `${uploadURL}${exerciseSubDest}`;
    mkDir(destUpload);
    cb(null, destUpload);
  },
  filename: function (req, file, cb) {
    const fileName = file.fieldname + '_' + Date.now() + '.oga';
    // if ( ! req.files ) {
    //   req.files = {};
    // }
    // let files = req.files;
    // if ( ! files[file.fieldname] ) {
    //   files[file.fieldname] = [];
    // }
    // files[file.fieldname].push({ fileName });
    // console.log('files: ', files)
    // req.files = files;
    cb(null, fileName);
  }
});
export const courseMulterUpload = multer({storage: courseStorage}).any();
export const exerciseMulterUpload = multer({storage: exerciseStorage}).any();

export async function handleUploadCourseDocuments(req, res) {
  try {
    if(!req.files || !req.files.length) {
      return res.status(404).json({success: false, error: 'Have no file to upload'});
    }
    let documentOptions = req.files.map(file => {
      return {
        user: req.user._id,
        course: req.params.id,
        fileName: file.fileData.name,
        type: 'file',
        fileId: file.fileData.id,
      }
    });

    let documents = await addDocuments(documentOptions);
    documents = documents.map((document, index) => {
      document = JSON.parse(JSON.stringify(document));
      document.fieldName = req.files[index].fieldname;
      return document;
    });

    return res.status(200).json({success: true, data: documents});
  } catch (err) {
    console.error('handleUploadCourseDocuments error:');
    console.error(err);
    return res.status(err.status || 500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
export async function handleUploadCourseVideos(req, res) {
  try {
    if(!req.files || !req.files.length) {
      return res.status(404).json({success: false, error: 'Have no file to upload'});
    }
    let videoOptions = req.files.map(file => {
      return {
        user: req.user._id,
        course: req.params.id,
        fileName: file.fileData.name,
        type: 'file',
        fileId: file.fileData.id,
      }
    });

    let videos = await addVideos(videoOptions);
    videos = videos.map((video, index) => {
      video = JSON.parse(JSON.stringify(video));
      video.fieldName = req.files[index].fieldname;
      return video;
    });
    return res.status(200).json({success: true, data: videos});
  } catch (err) {
    console.error('handleUploadCourseVideo error:');
    console.error(err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message,
    });
  }
}

// **************************************************************************************************************************
// Create multer upload for upload office file: ppt/pptx, doc/docx, pdf
const officeFileDomain = `${uploadURL}office-file`;
export const officeFileDestination = path.resolve(__dirname, `../../${officeFileDomain}`);
const officeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const subFolderName = req.body.subFolderName;
    let fullPath = officeFileDestination;
    let uploadURL = `${officeFileDomain}`;
    if ( subFolderName ) {
      fullPath = `${officeFileDestination}/${subFolderName}`;
      uploadURL = `${officeFileDomain}/${subFolderName}`;
    }
    mkDir(fullPath);
    req.destination = fullPath;
    req.uploadURL = uploadURL;
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    if ( req.fileName ) {
      req.filePath = `${req.destination}/${req.fileName}`;
      req.fileURL = `${req.uploadURL}/${req.fileName}`;
      cb(null, req.fileName);
    } else {
      cb('File name must be defined!');
    }
  }
});
const acceptOfficeExt = [
  '.ppt', '.pptx',
  '.doc', '.docx'
];
const acceptDocExt = [
  '.pdf'
];
function officeFilter(req, file, cb) {
  const subFolderName = req.body.subFolderName;
  if ( ! subFolderName ) {
    return cb(new Error('Error: subFolderName must be defined!'));
  }

  const originalName = file.originalname;
  const fileExtension = path.extname(originalName);
  if ( ! fileExtension ) {
    return cb(new Error('File extension was not found!'));
  }
  if ( acceptOfficeExt.includes(fileExtension) || acceptDocExt.includes(fileExtension) ) {
    const slugName = slug(path.basename(originalName, fileExtension), {lowercase: true});
    req.fileName = slugName + '-' + Date.now() + fileExtension;
    cb(null, true);
  } else {
    cb(new Error('File type is not valid, it must be: ppt/pptx, doc/docx or pdf'));
  }
}
export async function handleUploadOfficeFileSuccess(req, res) {
  if ( req.filePath ) {
    let result = await convertOfficeToPDF(req.filePath, req.fileURL, req.uploadURL);
    result.fileURL = req.fileURL;
    result.fileName = req.fileName;
    res.json(result);
  } else {
    res.status(500).json({
      success: false,
      error: 'Upload file failed!'
    });
  }
}
const converter = require('office-converter')();
/**
 * Try to convert office file: ppt/pptx, doc/docx to pdf
 * @param filePath
 * @param fileURL
 * @param uploadURL
 * @returns {Promise}
 */
function convertOfficeToPDF(filePath, fileURL, uploadURL) {
  return new Promise( function(resolve) {
    // Check the file is valid?
    let fileExtension = path.extname(filePath);
    if ( acceptDocExt.includes(fileExtension) ) {
      resolve({
        success: true,
        pdfURL: fileURL
      });
    }
    if ( acceptOfficeExt.includes(fileExtension) ) {
      // Begin convert
      converter.generatePdf(filePath, function(err, result) {
        if ( err ) {
          return resolve({
            success: false,
            error: err.toString()
          })
        }

        // Process result if no error
        if (result.status === 0) {
          resolve({
            success: true,
            pdfURL: `${uploadURL}/${path.basename(result.outputFile)}`
          });
        } else {
          resolve({
            success: false,
            error: 'Not receive output file'
          })
        }
      });
    } else {
      resolve({
        success: false,
        error: 'File type is not valid, it must be: ppt/pptx, doc/docx or pdf'
      })
    }
  });
}

/**
 * Remove all file in subFolderName when the office file used
 * @param subFolderName
 */
export function removeOfficeFile(subFolderName) {
  return new Promise(resolve => {
    return rimraf(`${officeFileDestination}/${subFolderName}`, function(error) {
      resolve(error);
    });
  });
}

export async function removeOfficeFileApi(req, res) {
  if ( req.body.subFolderName ) {
    const removeResult = await removeOfficeFile(req.body.subFolderName);
    return res.json({
      success: true,
      removeResult: removeResult
    })
  }
  res.status(500).send({
    success: false,
    error: 'subFolderName is not defined!'
  })
}
const uploadStreamOffice = multer({fileFilter: officeFilter, storage: officeStorage});
export const officeFileUploader = uploadStreamOffice.single('office-file');

export async function handleUploadStreamCommentFile(req, res) {
  try {
    if(!req.files || !req.files.length) {
      return res.status(500).json({success: false, error: 'No file'});
    }
    const filesFormatted = req.files.map(file => {
      return {
        id: file.fileData.id,
        name: file.fileData.name,
      }
    });

    const commentInfo = {
      files: filesFormatted,
      liveStream: req.streamId,
      user: req.user._id,
    };

    let comment = await CommentLiveStream.addCommentTypeFile(commentInfo);
    if ( comment instanceof Mongoose.Model ) {
      comment = comment.toObject();
    }
    // Reformat the file url
    const files = comment.files;
    if ( files instanceof Array ) {
      files.map(file => {
        file.url = `cloud/files/stream-comment/${comment._id.toString()}/${file.id}/${file.name}`;
        delete file.id;
        delete file._id;
      });
    }
    comment.files = files;
    return res.status(200).json({success: true, data: comment});
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}
