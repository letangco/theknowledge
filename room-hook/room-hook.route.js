import { Router } from 'express';
import AMPQ from '../rabbitmq/ampq';
import { WORKER_NAME } from '../server/constants';

const router = new Router();

router.route('/hooks')
  .post(async (req, res, next) => {
    AMPQ.sendDataToQueue(WORKER_NAME.ROOM_HOOK, req.body);
    return res.json(true);
});

router.route('/hooks/recorded')
  .post(async (req, res, next) => {
    AMPQ.sendDataToQueue(WORKER_NAME.ROOM_RECORDED_HOOK, req.body);
    return res.json(true);
  });

export default router;
