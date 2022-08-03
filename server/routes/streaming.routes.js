import {Router} from 'express';
import * as StreamController from '../controllers/streaming.controller';
import path from 'path';
import multer from 'multer';

const router = new Router();

// Stream
const streamDir = path.resolve(__dirname, '../../uploads/stream');
const storageStream = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, streamDir);
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
    cb(null, file.originalname);
  }
});
const uploadStream = multer({storage: storageStream});
const multipleUploadStream = uploadStream.any();
router.post('/upload-stream', multipleUploadStream, StreamController.handleUploadStream);

export default router;
