import { drive_v3 } from 'googleapis';
import {getOAuth} from "./oAuth";
import logger from '../util/log';
import config from '../config';
//================Get auth==================
let rootFolderIds = {};
const jwtClient = getOAuth(function() {
  Object.values(config.gdrive.rootFolder).map((_rootFolder) => {
    getRootFolder(_rootFolder.property, _rootFolder.name).then( folderId => {
      rootFolderIds[_rootFolder.property] = folderId;
      console.log(`Get root folder succeed: property ${_rootFolder.property}, name ${_rootFolder.name}`);
      console.log(folderId);
    }).catch( error => {
      console.error(`Get root folder failed: property ${_rootFolder.property}, name ${_rootFolder.name}`);
      console.error(error);
    });
  });
});
export default jwtClient;
export const drive = new drive_v3.Drive({ auth : jwtClient});
const FolderQuery = 'mimeType="application/vnd.google-apps.folder"';
//================End get auth==================
export function insertPermission( fileId, emailAddress, type, role, authClient ) {
  return new Promise((resolve, reject) => {
    const body = {
      'type': type,
      'role': role,
      'emailAddress': emailAddress
    };
    drive.permissions.create({
      'fileId': fileId,
      'resource': body,
      'auth': authClient
    }, function (err, response) {
      if ( err ) {
        return reject(err);
      }
      return resolve(response);
    });
  })
}

/**
 * Create gdrive folder
 * @param name display name for this folder
 * @param params
 * @param params.parents parent folder id
 * @param params.appProperties
 * @returns {Promise}
 */
export function createFolder( name, params ) {
  return new Promise( ( resolve, reject ) => {
    try {
      const fileMetadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder'
      };
      if ( params ) {
        if ( params.parents ) {
          fileMetadata.parents = [ params.parents ];
        }
        if ( params.appProperties ) {
          fileMetadata.appProperties = params.appProperties;
        }
      }
      drive.files.create({
        resource: fileMetadata,
        fields: 'id, kind, name, mimeType, appProperties, parents'
      }, function( err, res ) {
        if ( err ) {
          return reject( err );
        } else {
          return resolve( res.data );
        }
      });
    } catch ( error ) {
      return reject( error );
    }
  })
}
/**
 * Get the root folder if it existed
 * If existed return folder info
 * @param rootFolderProperty
 * @returns {Promise}
 */
function getExistedRootFolder(rootFolderProperty) {
  return new Promise((resolve, reject) => {
    const parameters = {};
    let query = FolderQuery;
    if (rootFolderProperty) {
      if (query) {
        query += ' and ';
      }
      query += `( appProperties has { key="rootFolder" and value="${rootFolderProperty}" } )`;
    } else {
      return reject(Error('You must config the root folder properties'));
    }
    parameters.q = query;
    drive.files.list(parameters, (error, res) => {
      if (error) {
        return reject(error);
      }
      const resData = res.data;
      if ( resData && resData.files instanceof Array && resData.files.length > 0 ) {
        return resolve(resData.files[0]);
      } else {
        return resolve(null);
      }
    });
  });
}

/**
 * Get the root folderId
 * @param rootFolderProperty
 * @param rootFolderName
 * @returns {Promise.<void>}
 */
export async function getRootFolder(rootFolderProperty, rootFolderName) {
  // Return folderId if we already got it
  if ( rootFolderIds[rootFolderProperty] ) {
    return rootFolderIds[rootFolderProperty];
  }
  // Check the folder is existed
  let existedRootFolder;
  try {
    existedRootFolder = await getExistedRootFolder(rootFolderProperty);
  } catch ( error ) {
    throw error;
  }
  if ( existedRootFolder && existedRootFolder.id ) {
    rootFolderIds[rootFolderProperty] = existedRootFolder.id;
    return existedRootFolder.id;
  }
  // If root folder is not exists, let create new one
  try {
    const rootFolder = await createFolder(rootFolderName, {
      appProperties: {
        rootFolder: rootFolderProperty
      },
    });
    rootFolderIds[rootFolderProperty] = rootFolder.id;
    return rootFolder.id;
  } catch (err) {
    throw err;
  }
}

export function deleteFile( fileId ) {
  return new Promise(( resolve, reject ) => {
    drive.files.delete({
      fileId: fileId
    }, ( error, res ) => {
      if ( error ) {
        return reject( error );
      }
      return resolve(res.data);
    });
  });
}

/**
 * @param fileId
 * @param reqHeaders
 * @returns {Promise}
 */
export function videoPlayback( fileId, reqHeaders ) {
  const headers = {};
  if ( reqHeaders.range ) {
    headers.range = reqHeaders.range;
  }
  if ( reqHeaders['user-agent'] ) {
    headers['user-agent'] = reqHeaders['user-agent'];
  }
  // console.log('headers');
  // console.log(headers);
  return drive.files.get(
    {
      fileId: fileId,
      alt: 'media',
      headers: headers,
    },
    {responseType: 'stream'}
  )
}

/**
 * Download or play media file
 * @param fileId
 * @param reqHeaders
 * @returns {Promise}
 */
export function downloadFile( fileId, reqHeaders ) {
  let headers = {};
  if ( reqHeaders.range && reqHeaders['user-agent'] ) {
    headers = {
      range: reqHeaders.range,
      'user-agent': reqHeaders['user-agent'],
    };
  }
  return drive.files.get(
    {
      fileId: fileId,
      alt: 'media',
      headers: headers,
    },
    { responseType: 'stream' }
  )
}

// =====================Find folder for lesson document======================
/**
 * Get folders by appProperties: courseId or streamId
 * This function required courseId or streamId must be defined
 * @param params
 * @param params.courseId
 * @param params.streamId
 * @param params.parents the courseFolderId or streamFolderId of this stream if have
 * @returns {Promise}
 */
export function getFolders(params) {
  return new Promise((resolve, reject) => {
    const parameters = {};
    if (typeof params === 'object') {
      let query = FolderQuery;
      if (params.courseId) {
        if (query) {
          query += ' and ';
        }
        query += `( appProperties has { key="courseId" and value="${params.courseId}" } )`;
        if (params.parents) {
          if (query) {
            query += ' and ';
          }
          query += `parents="${params.parents}"`;
        }
        if (params.streamId) {
          if (query) {
            query += ' and ';
          }
          query += `( appProperties has { key="streamId" and value="${params.streamId}" } )`;
        }
      } else if (params.streamId) {
        if (params.parents) {
          if (query) {
            query += ' and ';
          }
          query += `( appProperties has { key="streamId" and value="${params.streamId}" } ) and parents="${params.parents}"`;
        } else {
          if (query) {
            query += ' and ';
          }
          query += `( appProperties has { key="streamId" and value="${params.streamId}" } )`;
        }
      } else {
        // Not have both courseId and streamId
        return reject(Error('Not have both courseId and streamId'));
      }
      parameters.q = query;
    }
    drive.files.list(parameters, (error, res) => {
      if (error) {
        return reject(error);
      }
      return resolve(res.data);
    });
  });
}

async function getCourseFolderId(courseId, parents) {
  let courseFolders;
  try {
    courseFolders = await getFolders({
      courseId: courseId,
      parents: parents,
    });
  } catch (err) {
    console.error('Err on get course Folders:', err.message);
    throw err;
  }

  if ( courseFolders && courseFolders.files instanceof Array && courseFolders.files.length > 0 ) {
    return courseFolders.files[0].id;
  }

  // Create new one folder
  try {
    const courseFolder = await createFolder(courseId, {
      appProperties: {
        courseId: courseId
      },
      parents: parents,
    });
    return courseFolder.id;
  } catch (err) {
    console.error('Err on create course Folder:', err.message);
    throw err;
  }
}

/**
 * Get stream folderId for streamId and courseId
 * @param streamId
 * @param courseId
 * @returns {Promise.<void>}
 */
export async function getStreamCommentFileFolderId(streamId, courseId) {
  const rootFolderId = await getRootFolder(config.gdrive.rootFolder.streamCommentFile.property, config.gdrive.rootFolder.streamCommentFile.name);
  logger.logX('rootFolderId:', rootFolderId);
  let courseFolderId;
  if (courseId) {
    try {
      courseFolderId = await getCourseFolderId(courseId, rootFolderId);
    } catch (err) {
      console.error('Err on get course stream Folders:', err.message);
      throw err;
    }
  }

  let streamFolders;
  let getStreamFolderOptions = {};
  if (courseFolderId) {
    getStreamFolderOptions.parents = courseFolderId;
    getStreamFolderOptions.courseId = courseId;
    getStreamFolderOptions.streamId = streamId;
  } else {
    getStreamFolderOptions.parents = rootFolderId;
    getStreamFolderOptions.streamId = streamId;
  }

  try {
    streamFolders = await getFolders(getStreamFolderOptions);
  } catch (err) {
    console.error('Err on get stream Folders:');
    throw err;
  }
  if ( streamFolders && streamFolders.files instanceof Array && streamFolders.files.length > 0 ) {
    return streamFolders.files[0].id;
  }

  // Create new one folder
  try {
    let createFolderOptions = {
      appProperties: {
        streamId: streamId
      }
    };
    if ( courseFolderId ) {
      createFolderOptions.parents = courseFolderId;
      createFolderOptions.appProperties.courseId = courseId;
    } else {
      createFolderOptions.parents = rootFolderId;
    }
    const streamFolder = await createFolder(streamId, createFolderOptions);
    return streamFolder.id;
  } catch (err) {
    console.error('Err on create stream Folders:');
    throw err;
  }
}

/**
 * Get document folderId from courseId for course, create or get from existed folder
 * @param courseId string
 * @returns {Promise.<string>}
 */
export async function getCourseDocumentFolderId(courseId) {
  if ( ! courseId ) {
    throw Error('CourseId is required!');
  }
  const rootFolderId = await getRootFolder(config.gdrive.rootFolder.courseDocument.property, config.gdrive.rootFolder.courseDocument.name);
  logger.logX('rootFolderId:', rootFolderId);
  let courseFolderId;
  if (courseId) {
    try {
      courseFolderId = await getCourseFolderId(courseId, rootFolderId);
    } catch (err) {
      console.error('Err on get course stream Folders:', err.message);
      throw err;
    }
  }
  return courseFolderId;
}
// ===================End find folder for lesson document====================
