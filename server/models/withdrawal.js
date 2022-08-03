import mongoose from 'mongoose';
import User from './user';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';

const Schema = mongoose.Schema;

const withdrawalSchema = new Schema({
  userId: {type: Schema.ObjectId, ref: 'users', required: true},
  type: {
    type: String,
    enum: ['single', 'full', 'fullAuto']
  },
  requestDate: {type: Date, default: Date.now, required: true},
  checkedDate: {type: Date},
  canceledDate: {type: Date},
  paidDate: {type: Date},
  paymentMethod: {
    type: Object,
    required: true
  },
  amount: {type: Number},
  adminId: {type: Schema.ObjectId, ref: 'users'},
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'canceled', 'paid'],
    required: true,
    default: 'pending'
  },
  notes: {type: String}
});

withdrawalSchema.index({requestDate: -1});
withdrawalSchema.index({checkedDate: -1});
withdrawalSchema.index({type: 1});
withdrawalSchema.index({status: 1});
withdrawalSchema.index({userId: 1});
withdrawalSchema.index({userId: 1, requestDate: 1});

withdrawalSchema.statics.isValidWithdrawal = function (withdrawal) {
  if(!withdrawal.type || (withdrawal.type !== 'single' && withdrawal.type !== 'full' && withdrawal.type !== 'fullAuto')) {
    return false;
  }
  if(withdrawal.type === 'single' && withdrawal.amount < 10) {
    return false;
  }
  if(!withdrawal.userId) {
    return false;
  }

  return true;
};

withdrawalSchema.statics.getMetadata = async function (withdrawal) {
  let object = JSON.parse(JSON.stringify(withdrawal));
  object.user = await User.findById(withdrawal.userId, 'cuid userName fullName avatar balance').exec();
  delete object.userId;

  if(withdrawal.adminId) {
    object.admin = await User.findById(withdrawal.adminId, 'cuid userName fullName avatar').exec();
    delete object.adminId;
  }

  return object;
};

withdrawalSchema.post('save', async function (created, next) {
  if (created.status === 'paid') {
    Q.create(globalConstants.jobName.CREATE_PMT_HISTORY, {action: 'withdrawal', detail: created})
      .removeOnComplete(true)
      .save();
  }

  return next();
});

export default mongoose.model('Withdrawal', withdrawalSchema);
