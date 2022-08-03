import AMPQ from '../../rabbitmq/ampq';
import * as SendMailWorker from './SendMailWorker';
import * as NotifyWorker from './NotifyWorker';
import logger from '../../server/util/log';

export async function createWorkers() {
  try {
    await AMPQ.initChannel();
    // Import worker here
    NotifyWorker.run();
    SendMailWorker.run();
    logger.info('AMPQ worker is running...');
    return true;
  } catch (error) {
    logger.error('AMPQ: createWorkers initChannel error:');
    logger.error(error);
    throw error;
  }
}
