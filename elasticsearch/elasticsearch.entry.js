import mongoose from 'mongoose';
import { migrateElasticSearchAll } from '../server/libs/Elasticsearch/migrate_elasticsearch';
import config from '../server/config';
import logger from '../server/util/log';

mongoose.Promise = global.Promise;
// MongoDB Connection
mongoose.connect(config.mongoURL, { useMongoClient: true }, async (error) => {
  if (error) {
    logger.error('Please make sure Mongodb is installed and running!');
    throw error;
  } else {
    await migrateElasticSearchAll();
    logger.info('Migrate elastic search for all data done!');
    process.exit();
    return true;
  }
});
