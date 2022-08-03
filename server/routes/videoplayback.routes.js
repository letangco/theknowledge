import {Router} from 'express';
import * as GDrive from '../controllers/gdrive.controller';
import auth from '../libs/Auth/Auth.js';
import isAdmin from '../libs/Auth/isAdmin.js';

const router = new Router();


router.route('/stream')
  .get( GDrive.streamPlayback );

export default router;
