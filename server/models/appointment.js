import mongoose from 'mongoose';
// import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import User from './user';
import globalConstants from '../../config/globalConstants';
const Schema = mongoose.Schema;

const expertSchema = new Schema({
  cuid : {type: String, required: true},
  userID : {type: String, required: true},
  expertID : {type: String, required: true},
  content : { type: 'Mixed',  required: true },
  date : { type: 'String',  required: true },
  hour : {type: 'Mixed', default: 0},
  minute : {type: 'Mixed', default: 0},
  timeZone : { type: 'Mixed',  required: true },
  dateAdded : {type: 'Date', default: Date.now, required: true},
  status: {type: 'Number', default: 0},
});
expertSchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next()
});
expertSchema.post('save',async function (created,next){
  if(this.wasNew){
    let user = await User.findOne({cuid:created.userID});
    let expert = await User.findOne({cuid:created.expertID});
    let data = {
      to:expert._id,
      object:created._id,
      from:user._id,
      data:{
        cuid:created.cuid,
        content:created.content
      },
      type:"appointment"
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
  }
  next();
});
export default mongoose.model('Appointment', expertSchema);
