import Express from 'express';
import cors from 'cors';
import compression from 'compression';
import bodyParser from 'body-parser';
import roomHookRoute from './room-hook.route';
import logger from '../server/util/log';
import { CORS_OPTIONS, SERVER_PORT } from './config';
import { createQueue } from './room-hook.queue';

const app = new Express();
app.use(cors(CORS_OPTIONS));
app.use(compression());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));

app.use('/v1', [roomHookRoute]);

app.listen(SERVER_PORT, (error) => {
  if (error) {
    logger.error('Cannot start Room hook service:');
    logger.error(error);
  } else {
    logger.info(`Room hook service is running on port: ${SERVER_PORT}${process.env.NODE_APP_INSTANCE ? ` on core ${process.env.NODE_APP_INSTANCE}` : ''}${process.env.NODE_ENV ? `, mode ${process.env.NODE_ENV}` : ''}!`);
    createQueue().catch((error) => {
      logger.error('AMPQ: createQueue failure:');
      logger.error(error);
    });
  }
});

export default app;
