import mongoose from 'mongoose';
import LiveStream from './liveStream';
import User from './user';
import globalConstants from "../../config/globalConstants";
// import {Q} from "../libs/Queue";
import AMPQ from '../../rabbitmq/ampq';

const Schema = mongoose.Schema;

const interactWebinarSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  webinar: {type: Schema.ObjectId, ref: 'LiveStream', required: true, index: true},
  interact: {
    type: String,
    enum: ['going', 'interested']
  },
  created_at: {type: Date, default: Date.now}
});

interactWebinarSchema.index({
  webinar: 1,
  user: 1,
  interact: 1
});

interactWebinarSchema.index({created_at: -1});
interactWebinarSchema.pre('save',async function (next) {
  this.wasNew = this.isNew;
  next();
});
interactWebinarSchema.post('save',async function (created,next) {
  if (this.wasNew){
    let webinar = await LiveStream.findById(created.webinar).lean();
    let author = await User.findById(webinar.user).lean();
    let notification = {
      to:author._id,
      from:created.user,
      type: created.interact === 'interested' ? 'interactWebinar' : 'goingWebinar',
      object:created.webinar
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, notification);
  }
  next();
});
export default mongoose.model('InteractWebinar', interactWebinarSchema);
