import mongoose from 'mongoose';
import { createWorkers } from './workers/index';
import { MONGO_CONNECTION_STRING } from './config/config';
import logger from '../server/util/log';

mongoose.Promise = global.Promise;
mongoose.connect(MONGO_CONNECTION_STRING, { useMongoClient: true }, async (error) => {
  if (error) {
    logger.error('Please make sure Mongodb is installed and running!'); // eslint-disable-line no-console
    throw error;
  }
  logger.info('MongoDB connected!');
  await createWorkers();
});
