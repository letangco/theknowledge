import {Router} from 'express';
import * as IOSController from '../controllers/ios.controller';
const router = new Router();

router.route('/ios/version').get(IOSController.getVersion);

export default router;
