import mongoose from 'mongoose';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';

const Schema = mongoose.Schema;

const buyGiftsSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  type: {type: String, enum: ['buy', 'sell']},
  gift: {type: String, enum: ['points', 'flowers', 'coffee', 'cars', 'houses']},
  quantity: {type: Number, default: 0},
  price: {type: Number, default: 0},
  total: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now, required: true}
});

buyGiftsSchema.index({createdAt: -1});

buyGiftsSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  next();
});

buyGiftsSchema.post('save', async function (created, next) {
  if (this.wasNew) {
    Q.create(globalConstants.jobName.CREATE_PMT_HISTORY, {action: 'trade', detail: created})
      .removeOnComplete(true)
      .save();
  }

  return next();
});

export default mongoose.model('TradeGifts', buyGiftsSchema);
