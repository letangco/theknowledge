import AMPQ from '../../../rabbitmq/ampq';
import logger from '../../util/log';
import * as RoomService from '../../components/room/room.service';
import { RABBITMQ_RESTART_AFTER } from '../../../config/globalConstants';
import { WORKER_NAME } from '../../../server/constants';

AMPQ.consumeData(WORKER_NAME.ROOM_HOOK, async (msg, channel) => {
  try {
    const data = JSON.parse(msg.content.toString());
    await RoomService.callRoomHook(data);
    return channel.ack(msg);
  } catch (error) {
    logger.error('WORKER_NAME.ROOM_HOOK error:');
    logger.error(data);
    logger.error(error);
    setTimeout(() => {
      channel.nack(msg);
    }, RABBITMQ_RESTART_AFTER);
    return true;
  }
}, {
  noAck: false,
});

AMPQ.consumeData(WORKER_NAME.ROOM_RECORDED_HOOK, async (msg, channel) => {
  try {
    const data = JSON.parse(msg.content.toString());
    await RoomService.callRoomRecordedHook(data);
    return channel.ack(msg);
  } catch (error) {
    logger.error('WORKER_NAME.ROOM_RECORDED_HOOK error:');
    logger.error(data);
    logger.error(error);
    setTimeout(() => {
      channel.nack(msg);
    }, RABBITMQ_RESTART_AFTER);
    return true;
  }
}, {
  noAck: false,
});
