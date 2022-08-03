import mongoose from 'mongoose';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';

const Schema = mongoose.Schema;

const sendGiftsSchema = new Schema({
  from: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  to: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  liveStream: {type: Schema.ObjectId, ref: 'livestreams', index: true},
  gift: {type: String},
  quantity: {type: Number, default: 0},
  points: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now, required: true}
});

sendGiftsSchema.index({createdAt: -1});

sendGiftsSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  next();
});

sendGiftsSchema.post('save', async function (created, next) {
  if (this.wasNew) {
    AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, { type:'sendGift', obj: {
      gift: created,
      liveStream: created.liveStream
    }});

    Q.create(globalConstants.jobName.CREATE_PMT_HISTORY, {action: 'send', detail: created})
      .removeOnComplete(true)
      .save();
  }

  return next();
});

export default mongoose.model('SendGifts', sendGiftsSchema);
