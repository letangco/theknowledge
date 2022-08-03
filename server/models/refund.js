import mongoose from 'mongoose';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';

const Schema = mongoose.Schema;

const refundSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  object: {type: Schema.ObjectId, index: true},
  type: {type: String, index: true},
  admin: {type: Schema.ObjectId, ref: 'users', index: true},
  status: {
    type: String,
    enum: ['waiting', 'approved', 'rejected'],
    default: 'waiting',
    index: true
  },
  notes: {type: String},
  created_at: {type: Date, default: Date.now},
  approved_at: {type: Date},
  value_request: {type: Number, default: 0},  // $100
  value_received: {type: Number, default: 0}, // $90
  fee: {type: Number, default: 0},            // $10
});

refundSchema.index({created_at: -1});

refundSchema.index({user: 1, object: 1}, {unique: true});

refundSchema.post('save', async function (created,next) {
  try{
    if(created.status !== 'waiting') {
      Q.create(globalConstants.jobName.AFTER_APPROVE_REFUND, created).removeOnComplete(true).save();
    }
    next();
  }catch (err){
    console.log(err);
  }
});

export default mongoose.model('Refund', refundSchema);
