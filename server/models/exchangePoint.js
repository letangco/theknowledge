import mongoose from 'mongoose';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';

const Schema = mongoose.Schema;

const exchangePointSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  price: {type: Number, default: 0},
  amount: {type: Number, default: 0},
  fee: {type: Number, default: 0}, // %
  total: {type: Number, default: 0}, // total balance receive, after fee
  createdAt: {type: Date, default: Date.now, required: true}
});

exchangePointSchema.index({createdAt: -1});

exchangePointSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  next();
});

exchangePointSchema.post('save', async function (created, next) {
  if (this.wasNew) {
    Q.create(globalConstants.jobName.CREATE_PMT_HISTORY, {action: 'exchange', detail: created})
      .removeOnComplete(true)
      .save();
  }

  return next();
});

export default mongoose.model('ExchangePoints', exchangePointSchema);
