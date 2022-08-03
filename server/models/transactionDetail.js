import mongoose from 'mongoose';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';
const Schema = mongoose.Schema;

const transactionDetailSchema = new Schema({
  cuid: {type: String, required: true},
  transactionID: {type: String, required: true},
  sharers: {type: String, required: true}, // Expert ID, who share the knowledge
  learnerID: {type: String, required: true}, // The ID of user learn
  fees: {type: Number, required: true}, // The money this user must pay
  duration: {type: Number, required: true}, // The duration time of this user stay in this transaction in second
  dateAdded: {type: Date, default: Date.now, required: true} // The time transaction detail added
});

transactionDetailSchema.index({transactionID: 1});

transactionDetailSchema.post('save', (created, next) => {
  Q.create(globalConstants.jobName.SESSION_ENGAGEMENT, created).removeOnComplete(true).save();
  Q.create(globalConstants.jobName.CHECK_1ST_2MINS_TRANS, created).removeOnComplete(true).save();
  Q.create(globalConstants.jobName.CREATE_PMT_HISTORY, {detail: created, action: 'transaction'}).removeOnComplete(true).save();
  return next();
});

export default mongoose.model('TransactionDetail', transactionDetailSchema);
