import { Router } from 'express';
import * as CheckinWebinarControllers from '../controllers/checkinWebinar.controller';

const router = new Router();

router.route('/checkin-webinar')
  .post(CheckinWebinarControllers.createCheckin);

export default router;
