import AMPQ from '../../rabbitmq/ampq';
import { RESEND_EMAIL_AFTER_FAILED, WORKER_NAME } from '../../server/constants';
import logger from '../../server/util/log';
import { singleSendMail } from '../../mailService/SendGrid';

export function run() {
  AMPQ.consumeData(WORKER_NAME.SEND_MAIL, async (msg, channel) => {
    try {
      const data = JSON.parse(msg.content.toString());
      await singleSendMail(data);
      return channel.ack(msg);
    } catch (error) {
      logger.error('SEND_MAIL error:');
      logger.error(error);
      setTimeout(() => {
        channel.nack(msg);
      }, RESEND_EMAIL_AFTER_FAILED);
      throw error;
    }
  }, {
    noAck: false,
  });
}
