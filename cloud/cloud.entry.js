import Express from 'express';
import compression from 'compression';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { checkLogin } from '../server/libs/Auth/Auth';
// Initialize the Express Apps
const app = new Express();
const cors = require('cors');

import {
  MONGO_CONNECTION_STRING,
  CORS_OPTIONS,
  SERVER_PORT,
} from './config/config';
// Import required modules
import gDriveRoutes from '../server/routes/gdrive.routes';
// import uploadRoute from '../server/routes/upload.routes';

// Set native promises as mongoose promise
mongoose.Promise = global.Promise;
// MongoDB Connection
mongoose.connect(MONGO_CONNECTION_STRING, { useMongoClient: true }, (error) => {
  if (error) {
    console.error('Please make sure Mongodb is installed and running!'); // eslint-disable-line no-console
    throw error;
  }
  console.log('MongoDB connected =))');
});

app.use(cors(CORS_OPTIONS));
app.use(checkLogin);
// Apply body Parser
app.use(compression());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));
app.use('/api', [
  gDriveRoutes
]);
// app.use('/upload', [ uploadRoute ]);
app.listen(SERVER_PORT, (error) => {
  if (error) {
    console.log(error);
  } else {
    console.log(` _________________________________
< Cloud server is running on port: ${SERVER_PORT} >
 ---------------------------------
  \\
   \\
      /\\_)o<    Hello Man!!!              /\\_/\\_
     |      \\                            /      |
     | O . O|             Hi!Server >.<  |^ . ^ |
     \\_____/                             \\_>o<_/
       CLOUD                                DEV
`)
  }
});
export default app;
