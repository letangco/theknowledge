import * as RoomService from './room.service';
import AMPQ from '../../../rabbitmq/ampq';
import { WORKER_NAME } from '../../../server/constants';

/**
 * Get room join url
 * @returns {Promise.<{}>}
 */
export async function getJoinUrl(req, res, next) {
  try {
    const query = req.query;
    const user = req.user;
    const result = await RoomService.getJoinUrl({
      userId: user._id,
      streamId: query.streamId,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

/**
 * Hook for event during meeting
 * @returns {Promise.<{}>}
 */
export async function callRoomHook(req, res, next) {
  try {
    AMPQ.sendDataToQueue(WORKER_NAME.ROOM_HOOK, req.body);
    return res.json(true);
  } catch (error) {
    return next(error);
  }
}
/**
 * Hook for event rap-publish-ended
 * @returns {Promise.<{}>}
 */
export async function callRoomRecordedHook(req, res, next) {
  try {
    AMPQ.sendDataToQueue(WORKER_NAME.ROOM_RECORDED_HOOK, req.body);
    return res.json(true);
  } catch (error) {
    return next(error);
  }
}
