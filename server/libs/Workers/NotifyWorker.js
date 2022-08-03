import AMPQ from '../../../rabbitmq/ampq';
import globalConstants, {RABBITMQ_RESTART_AFTER} from '../../../config/globalConstants';
import Notification from '../../models/notificationNew';
import logger from '../../util/log';

AMPQ.consumeData(globalConstants.jobName.ADD_NOTIFICATION_NEW, async (msg, channel) => {
  try {
    let arrayJob = JSON.parse(msg.content.toString());
    await Notification.create(arrayJob);
    return channel.ack(msg);
  } catch (error) {
    logger.error(`ADD_NOTIFICATION_NEW error: ${error}`);
    logger.error(`Data: ${JSON.parse(msg.content.toString())}`);
    setTimeout(() => {
      channel.nack(msg);
    }, RABBITMQ_RESTART_AFTER);
  }
}, {
  noAck: false,
});
