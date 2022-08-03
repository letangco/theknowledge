  import mongoose from 'mongoose';
import User from './user';
import ArrayHelper from '../util/ArrayHelper';
import autoIncrement from 'mongoose-auto-increment';

const Schema = mongoose.Schema;

autoIncrement.initialize(mongoose.connection);

const paymentHistorySchema = new Schema({
  historyId: {type: Number, index: true},
  owner: {type: Schema.ObjectId, ref: 'users', required: true, index: true}, // owner of this record
  user: {type: Schema.ObjectId, ref: 'users', index: true}, // The 2nd user. Maybe the sender, receiver, learner or sharer
  createdDate: {type: Date, required: true, default: Date.now},
  action: {
    type: String,
    enum: [
      'deposit', 'withdrawal', 'transaction', 'invite_code', 'send',
      'receive', 'exchange', 'join_course', 'sell_course', 'fee_course',
      'book_webinar_ticket', 'sell_webinar_ticket', 'fee_webinar_ticket',
      'book_membership'
    ],
    required: true,
    index: true
  },
  change: {type: Number}, // `1` is increase, `0` is decrease.
  detail: {type: 'Mixed'},
  price: {type: String},
  total: {type: String},
  amount: {type: String},
  account: {type: String}
});
paymentHistorySchema.plugin(autoIncrement.plugin, {model: 'PaymentHistory', field: 'historyId', startAt: 1});


paymentHistorySchema.index({createdDate: -1});

paymentHistorySchema.statics.getMetadata = async function (paymentHistory) {
  if(! (paymentHistory instanceof Array)) paymentHistory = [paymentHistory];

  let userIds = paymentHistory.map(history => history.user);
  let users = await User.find({_id: {$in: userIds}}, 'fullName userName cuid active').lean();
  let userMapper = ArrayHelper.toObjectByKey(users, '_id');

  return paymentHistory.map(history => {
    if(history.user) {
      history.user = userMapper[history.user];
    }
    return history;
  });
};

export default mongoose.model('PaymentHistory', paymentHistorySchema);
