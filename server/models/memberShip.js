import mongoose from 'mongoose';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import UserOption from "./userOption";
import globalConstants from '../../config/globalConstants';
import User from './user';
const Schema = mongoose.Schema;

const memberShipSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  memberShip: {type: String},
  type: {type: String, default: 'joinMemberShip'},
  total: {type: Number, default: 0},
  time:  {type: Number},
  days_active:{type:Number},
  currency: {type: String, default: '$'},
  priceRate: {type: Number, default: 1},
  contactInfo: {type: Object, default: {}},
  created_at: {type: Date, default: Date.now}
});
memberShipSchema.pre('save',function (next) {
  this.wasNew = this.isNew;
  next();
});
/**
 * Notification And Send Mail
 */
memberShipSchema.post('save',async function (created,next) {
  if(this.wasNew){
    let user = await User.findById(created.user).lean();
    let notifications = {
      to:user._id,
      type:created.type || 'joinMemberShip',
      data:{
        memberShip:created.memberShip,
        time:created.time,
        dateActive: created.type === 'adminActive' ? created.days_active : 0,
        userId: created.type !== 'joinMemberShip' ? created.contactInfo.userId : '',
        url:`membership/#payment`
      }
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, notifications);
    if(created.type === 'joinMemberShip'){
      //TODO SEND_MAIL
      let userOption = await UserOption.findOne({userID:user.cuid}).lean();
      let dataSendMailToUserBuy = {
        type:created.type || 'joinMemberShip',
        language: userOption && userOption.language ? userOption.language : 'en',
        data: {
          memberShip:created.memberShip,
          time:created.time,
          url:`membership/#payment`,
          cuid: user.cuid,
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          email: user.email
        }
      };
      Q.create(globalConstants.jobName.SEND_MAIL, dataSendMailToUserBuy).removeOnComplete(true).save();
    }
  }
  next();
});

export default mongoose.model('MemberShip', memberShipSchema);
