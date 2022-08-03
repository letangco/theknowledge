import mongoose from 'mongoose';
import User from './user';
import TransactionDetail from './transactionDetail';
import { Q } from '../libs/Queue';
import globalConstants from '../../config/globalConstants';

const Schema = mongoose.Schema;

const affiliateHistorySchema = new Schema({
  owner: { type: Schema.ObjectId, ref: 'users', required: true, index: true },
  user: { type: Schema.ObjectId, ref: 'users', required: true },
  code: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, required: true },
  timestamp: { type: String},
  type: {
    type: Number,
    enum: [1, 2, 3, 4], // 1 is Call/Chat Session, 2 is join a course, 3 for webinars, 4 is join membership
    index: true
  },
  isWithdrawn: { type: Boolean, default: false },
  orderObject: { type: Schema.ObjectId }, // _id of TransactionDetail or JoinCourse model or bookingWebinar model
  commission: { type: Number }, // 0.2 for 20%
  value: { type: Number }
});

affiliateHistorySchema.index({ createdAt: -1 });

affiliateHistorySchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next();
});

// affiliateHistorySchema.post('save', async function(created, next) {
//   if(this.wasNew) {
//     Q.create(globalConstants.jobName.INCREASE_AFF_OWNER_BALANCE, created).removeOnComplete(true).save();
//   }
//   return next();
// });

affiliateHistorySchema.statics.getMetadata = async function (models) {

};

export default mongoose.model('AffiliateHistory', affiliateHistorySchema);

