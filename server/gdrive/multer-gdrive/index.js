import multer from 'multer';
import path from 'path';
import readline from 'readline';
import jwtClient, { insertPermission, drive } from '../GDrive';
import logger from '../../util/log';

const storageDocument = multer.diskStorage({
  filename: async function (req, file, cb) {
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName) || '';
    const slugName = slug(path.basename(file.originalname, fileExtension), { lowercase: true });
    const finalName = `${slugName}-${Date.now()}${fileExtension}`;
    cb(null, finalName);
  }
});
storageDocument._handleFile = async function (req, file, cb) {
  try {
    const stream = file.stream;

    const fileName = decodeURIComponent(file.originalname);
    const fileMimeType = file.mimetype;

    const requestBody = {
      name: fileName,
      originalFilename: fileName,
      mimeType: fileMimeType,
    };
    logger.logX('req.reqBody:');
    logger.logX(req.reqBody);
    if ( req.reqBody ) {
      const appProperties = req.reqBody.appProperties;
      if ( appProperties ) {
        requestBody.appProperties = appProperties;
      }
      const parents = req.reqBody.parents;
      if ( parents ) {
        requestBody.parents = parents;
      }
    }
    drive.files.create(
      {
        requestBody: requestBody,
        media: {
          mimeType: fileMimeType,
          body: stream,
        },
        fields: 'id, kind, name, mimeType, appProperties, parents',
      },
      // Workaround axios' issue of streams incorrect backpressuring, issue: https://github.com/googleapis/google-api-nodejs-client/issues/1107
      {
        //   maxContentLength: 128 * 1024 * 1024 * 1024,
        //   maxRedirects: 0,
        onUploadProgress: function (progressEvent) {
          logger.logX(`onUploadProgress ${progressEvent.bytesRead}`);
        }
      }
    ).then( async (response) => {
      const fileData = response.data;
      const auth = jwtClient;
      const isPublic = !! ( auth && auth.public );
      if ( isPublic ) {
        try {
          const authRes = await insertPermission( fileData.id, null, 'anyone', 'reader', auth );
          logger.logX('Make file public res:');
          logger.logX(authRes.data);
        } catch (error) {
          console.error('Upload document to drive, insertPermission error:', error.message);
        }
      }
      logger.logX('fileData');
      logger.logX(fileData);
      if ( ! req.filesData ) {
        req.filesData = [ fileData ];
      } else {
        req.filesData.push( fileData );
      }
      return cb(null, {
        fileData: fileData
      });
    }).catch( error => {
      console.error('Upload document to drive error:');
      console.error(error);
      return cb(error, null);
    });
  } catch (error) {
    console.error('Upload document to drive error:');
    console.error(error);
    cb(error, null);
  }
};

storageDocument._removeFile = function(req, file, cb) {
  drive.files.delete({
    fileId: file.fileId,
  }, cb);
};

const uploadFile = multer({
  storage: storageDocument,
});

const uploadFileMulter = uploadFile.any();

export default uploadFileMulter;
