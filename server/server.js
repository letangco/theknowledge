import Express from 'express';
import compression from 'compression';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import path from 'path';
import { checkLogin } from './libs/Auth/Auth';
import removeFeed from './scripts/tesse_scripts/remove_feed_live';
import removeFeedSchedule from './scripts/tesse_scripts/clear_feed_webinar';
// Initialize the Express Apps
const app = new Express();
const cors = require('cors');
//Add _maxListeners
require('events').defaultMaxListeners = 100;
import globalConstants from '../config/globalConstants';
import serverConfig from './config';
import uploadRoute from './routes/upload.routes';
// Import required modules
import exchangeInfo from './routes/exchangeInfo.routes';
import iosRouter from './routes/ios.router';
import sheet from './routes/sheet.routes';
import posts from './routes/post.routes';
import users from './routes/user.routes';
import coupon from './routes/coupon.route';
import membership from './routes/membership.route';
import chat from './routes/chat.routes';
import category from './routes/category.routes';
import search from './routes/search.routes';
import skill from './routes/skill.routes.js';
import languageSupport from './routes/languageSupport.routers.js';
import transaction from './routes/transaction.routes.js';
import suggestSkill from './routes/suggestSkill.routes.js';
import expert from './routes/expert.routes.js';
import history from './routes/history.routes.js';
import payment from './routes/payment.routes.js';
import follow from './routes/follow.routes.js';
import notification from './routes/notification.routes.js';
import userOption from './routes/userOption.routes.js';
import country from './routes/country.routes.js';
import appointment from './routes/appointment.routes.js';
import knowledge from './routes/knowledge.routes.js';
import comment from './routes/comment.routes.js';
import withdrawal from './routes/withdrawal.routes.js';
import dashboard from './routes/dashboard.routes.js';
import feed from './routes/feed.routes.js';
import paymentMethod from './routes/userPaymentMethod.routes';
import simpleQuestion from './routes/simpleQuestion.routes';
import question from './routes/question.routes';
import answer from './routes/questionAnswer.routes';
import userUseInviteCode from './routes/userUseInviteCode.routes';
import streamingRoute from './routes/streaming.routes';
import userGift from './routes/gifts.routes';
import liveStream from './routes/liveStream.routes';
import liveStreamTracking from './routes/liveStreamTracking.routes';
import streamInviteTracking from './routes/streamInviteTracking.routes';
import userViewStreamTracking from './routes/userViewStreamTracking.routes';
import userViewCourseTracking from './routes/userViewCourseTracking.routes';
import userViewTracking from './routes/userViewTracking.routes';
import commentLiveStream from './routes/commentLiveStream.routes';
import courseRoutes from './routes/course.routes';
import refundRoutes from './routes/refund.routes';
import affiliateHistoryRoutes from './routes/affiliateHistory.routes';
import checkinRoutes from './routes/checkin.routes';
import videoplayback from './routes/videoplayback.routes';
import gdriveRoutes from './routes/gdrive.routes';
import reportRoutes from './routes/report_student.route';
import multipleChoiceRouter from './routes/multipleChoice.routes';
import taskRouter from './routes/task.routes';
import exerciseRouter from './routes/exercise.routes';
import videoRouter from './routes/video.routes';
import cartRouter from './routes/cart.router';
import agentRouter from './routes/agentInfo.routes';
import pointTestRouter from './routes/pointTest.routes';
import { migrateTypeCourse } from './scripts/migrate/migrate_type_course';
import { generalCodeCourse } from './scripts/migrate/migrate_code_course';
import { migrateReportCourseOfUser } from './libs/CronJobs/useAndCourse';
import dashboardUser from './routes/dashboard_user.routes';
import RPC from '../rabbitmq/rpc';
import teacherRegistration from './routes/teacherRegistration.routes';
import errorHandler from './api/errorHandler';
import apiV2 from './api/v2';
import logger from './util/log';
import CronJobs from './libs/Cron';
import TagAgent from './routes/agenttag.routes';
// Kue UI
import { queueUI } from './libs/Queue';
import {
  createRedisWorkers,
  createQueue,
  createWorkers,
} from './libs/Workers';
// import { BackUpDataToGDrive } from './libs/CronJobs/backupDatabase';
import dummyData, {
  initBankUserAccount,
  initChatBotAccount,
  initChatSupportAccount,
  initCustomerSupportAccount,
  initLanguageSupport,
  initCountries,
  initStateCountry
} from './dummyData';
import { setUsersOnlineState } from '../server/controllers/user.controller';
import { clearSocketStorage } from './routes/socket_routes/chat_socket';
import { resetUnCommitStream } from './controllers/liveStream.controller';
import * as Worker from './libs/Workers/worker.index'; // Do not remove
import serverSocketIO, { storeDataWhenUserDisconnect } from './routes/socket_routes/chat_socket';
import teacherMembershipRoute from "./components/teacherMembership/teacherMembership.route";
import ResponseHandler from './virtual_agent/response';

queueUI.listen(serverConfig.kueUI.port, function() {
  console.log('Queue listening on port:' + serverConfig.kueUI.port);
});

createQueue().then(() => {
  createWorkers();
}).catch((error) => {
  console.error('AMPQ: createQueue failure:');
  console.error(error);
});
createRedisWorkers();

/**
 * RPC initial
 */
const rpcQueueName = serverConfig.rabbitMQ.rpcQueueName;
RPC.initialSetup(rpcQueueName).then(async () => {
  await RPC.initServer(rpcQueueName);
}).catch((error) => {
  logger.error('RPC initialSetup error:');
  logger.error(error.toString());
  process.exit(0);
});

// Set native promises as mongoose promise
mongoose.Promise = global.Promise;
// MongoDB Connection
mongoose.connect(serverConfig.mongoURL,{useMongoClient: true}, async (error) => {
  if (error) {
    console.error('Please make sure Mongodb is installed and running!'); // eslint-disable-line no-console
    throw error;
  }
  // feed some dummy data in DB.
  // await BackUpDataToGDrive();
  // await dummyData();
  // await removeFeed();
  // await removeFeedSchedule();
  // await migrateTypeCourse();
  // await migrateReportCourseOfUser();
  // await initBankUserAccount();
  // await initChatBotAccount();
  // await initChatSupportAccount();
  // await initCustomerSupportAccount();
  // await initLanguageSupport();
  // await initCountries();
  await initStateCountry();
  // await generalCodeCourse();
  // migrateUserCandy();
  // migrateNote();
  // useToCourse();
});
// Update user Online state to 'Offline'
clearSocketStorage();
setUsersOnlineState(globalConstants.userState.OFFLINE).catch((error) => {
  logger.error(`Reset all users to offline FAILED: ${error.toString()}`);
});
app.use((req, res, next) => {
  res.RH = new ResponseHandler(res);
  next();
});

resetUnCommitStream().catch(error => {
  logger.error('resetUnCommitStream error');
  logger.error(error.toString());
});

app.use(cors(serverConfig.corsOptions));
app.use(checkLogin);
// Note: All request handle use CORS must be write bellow CORS settings
// Use Nginx to host static files if run on server Nginx
if(serverConfig.useExpressHostStatic === true) {
  app.use('/uploads', Express.static(path.resolve(__dirname, '../uploads')));
  app.use('/cache', Express.static(path.resolve(__dirname, '../cache')));
}

// Apply body Parser
app.use(compression());
app.use('/api/payment/webhook', bodyParser.raw({type: "*/*"}))
// app.use('/api/payment/saveStripeToken', bodyParser.raw({type: "*/*"}))
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));
app.use((req, res, next) => {
  let langCode = req.headers.lang || req.query.lang;
  // console.log('langCode:', langCode);
  if(!langCode || langCode === 'null' || langCode === 'undefined') {
    // console.log('null cmnr');
    req.headers.lang = 'en';
  }
  return next();
});
app.use('/api', [
  posts, users, chat, category, search, skill, languageSupport, transaction, question, answer, liveStream,
  suggestSkill, history, payment, follow, notification, userOption, country, simpleQuestion, userGift,
  expert, appointment, knowledge, comment, withdrawal, dashboard, feed, paymentMethod, userUseInviteCode,
  commentLiveStream, courseRoutes, refundRoutes, checkinRoutes, exchangeInfo, coupon, affiliateHistoryRoutes, membership,
  sheet, liveStreamTracking, multipleChoiceRouter, userViewStreamTracking, userViewCourseTracking, streamInviteTracking, taskRouter,
  userViewTracking, exerciseRouter, videoRouter, reportRoutes, dashboardUser, iosRouter, cartRouter,
  teacherRegistration, gdriveRoutes, teacherMembershipRoute, agentRouter, pointTestRouter, TagAgent
]);
app.use('/upload', [ uploadRoute, streamingRoute ]);
app.use('/videoplayback', [ videoplayback ]);
app.use('/cloud', [ gdriveRoutes ]);
app.use('/v2', [apiV2]);

app.use(errorHandler);

const server = app.listen(serverConfig.port, (error) => {
  if (error) {
    logger.error(error.toString());
  } else {
    new CronJobs();
    console.log(`TESSE server is running on port: ${serverConfig.port}!`);
    logger.info(`TESSE server is running on port: ${serverConfig.port}!`);
//     console.log(` _________________________________
// < Server is running on port: ${serverConfig.port} >
//  ---------------------------------
//   \\
//    \\
//       /\\_)o<    Hello Man!!!              /\\_/\\_
//      |      \\                            /      |
//      | O . O|             Hi!Server >.<  |^ . ^ |
//      \\_____/                             \\_>o<_/
//       SERVER                               DEV
// `)
    // let scriptExpert = new ScriptExpert();
    // let scriptSkill = new ScriptSkill();
//     let scriptRemoveKnowledge = new ScriptRemoveKnowledge();
//     scriptRemoveKnowledge.start();
    // scriptExpert.start();
    // scriptSkill.start2();
//    let scripKnowledge = new ScriptKnowledge ();
//    scripKnowledge.start();
  }
});

// Using Socket.io Communication
const serverSocketIOObj = new serverSocketIO(server);
serverSocketIOObj.beginListen();

// Using PeerJs
// const expressPeerServer = require('peer').ExpressPeerServer;
// const peerOptions = {
//   debug: true
// };
// const peerServer = expressPeerServer(server, peerOptions);
// app.use(serverConfig.peerPath, peerServer);
// peerServer.on('connection', function(id) {
//   console.log('PeerJS connect, id: ', id);
  // if(id) {
  //   storeDataWhenUserDisconnect(id);
  // }
// });
// peerServer.on('disconnect', function(id) {
//   console.log('PeerJS disconnect, id: ', id);
  // if(id) {
  //   storeDataWhenUserDisconnect(id);
  // }
// });

// Cron jobs
if(process.env.NODE_ENV === 'production') {
  new CronJobs();
}

export default app;
