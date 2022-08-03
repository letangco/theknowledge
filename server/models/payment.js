import mongoose from 'mongoose';
import User from './user';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';
import {sendNotificationToSlack} from '../services/memberShip.services';

const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  cuid : { type: 'String', required: true },
  userId : {type: 'String'},
  paymentType : {type: 'String'},
  type : {type: 'Number'},
  amount : {type: 'Number', default: 0},
  currency : {type: Object},
  detail : {type: Object},
  paymentInfo : {type: Object},
  affCode: String,
  memberCode: String,
  status : {type: 'Number', default: 0},
  dateAdded : {type: 'Date', default: Date.now, required: true}
});

paymentSchema.index({dateAdded: -1});

paymentSchema.statics.getMetadata = async function(payment) {
  let object = JSON.parse(JSON.stringify(payment));
  object.user = await User.findOne({cuid: payment.userId}, 'cuid userName fullName avatar').exec();
  delete object.userId;

  return object;
};

paymentSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  next();
});

paymentSchema.post('save', async function (created, next) {
  if (this.wasNew && created.paymentType !== 'Cod' && created.paymentType !== 'transferBank' && created.paymentType !== 'QRpay' && created.userId) {
    Q.create(globalConstants.jobName.CREATE_PMT_HISTORY, {action: 'deposit', detail: created})
      .removeOnComplete(true)
      .save();
  }
  if (this.wasNew && created.paymentInfo && ( created.paymentInfo.type === 'memberShip' || created.paymentInfo.type === 'MemberShipTrial')) {
    sendNotificationToSlack({action: 'newMembership', detail: created})
  }

  return next();
});

export default mongoose.model('Payment', paymentSchema);
