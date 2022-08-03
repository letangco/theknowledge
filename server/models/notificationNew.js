import mongoose from 'mongoose';
import AMPQ from "../../rabbitmq/ampq";
import User from './user';
import globalConstants from "../../config/globalConstants";
import Notifications from './notificationNew';
import Notify from '../routes/socket_routes/notification';
import * as NotificationService from '../services/notification.services';
const Schema = mongoose.Schema;

const notifications = new Schema({
  to : {type: Schema.ObjectId, 'ref': 'users',index: true, required:true},
  object : {type: Schema.ObjectId, index:true},
  parentId: {type: Schema.ObjectId, index:true},
  from : {type: Schema.ObjectId, 'ref': 'users',index: true},
  data : {type:Object},
  type : {
    type:String,
    required:true,
    index: true
  },
  date: {type: Date, default: Date.now, index: -1},
  seen:{
    type:Boolean,
    default:false
  },
  status:{
    type:Boolean,
    default:false
  }
});
notifications.post('save',async function(created,next){
  let sendnotify = new Notify();
  let conditions = {
    to:created.to,
    status:false
  };
  let count = await Notifications.count(conditions);
  let notify = await Notifications.findById(created._id).lean();
  let notifys = [notify];
  let data = await NotificationService.getMetaData(notifys);
  if(created.type === "answerQuestionAnonymous" || created.type === "replyAnswerQuestionAnonymous"){
    data[0].img = "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg"
  }
  data[0].unReceiveNotify = count;
  sendnotify.emitHandleNotification(data[0]);
  await User.update({_id:created.to},{$set: {unReceiveNotify:count}});
  AMPQ.sendDataToQueue(globalConstants.jobName.PUSH_NOTIFY_TO_USER, created);
  next();
});
notifications.pre('remove',async function (removed,next) {
  let conditions = {
    to:removed.to,
    status:false
  };
  let count = await Notifications.count(conditions);
  await User.update({_id:removed.to},{$set: {unReceiveNotify:count}});
  next();
});
export default mongoose.model('NotificationNew',notifications);
