import mongoose from 'mongoose';
import User from './user';
import TransactionDetail from './transactionDetail';

const Schema = mongoose.Schema;
const transactionUsersFields = 'cuid userName fullName avatar';

const transactionSchema = new Schema({
  cuid: {type: String, required: true},
  sharers: {type: String, required: true}, // Expert ID, who share the knowledge
  type: {type: String, required: true}, // call or chat
  price: {type: Number, required: true}, // Price Expert set
  currency: {type: String, required: true}, // The currency is use in this transaction
  beginTime: {type: Number, required: true}, // The time when start transaction(call by function Date.now())

  // If the server die, browse all transaction have endTime is zero
  // And update the endTime to the time server die
  endTime: {type: Number, default: 0, required: true}, // The time when transaction ended(call by function Date.now())

  moneyEarnings: {type: Number, default: 0, required: true}, // Money without Tax and Fees
  tax: {type: Number, default: 0, required: true}, // The tax
  fees: {type: Number, default: 0, required: true}, // The fees, that system withheld
  sharersFunds: {type: Number, default: 0, required: true}, // The money of shares with Tax and Fees applied
  duration: {type: Number, default: 0, required: true}, // Duration time of transaction in second
  dateAdded: {type: Date, default: Date.now, required: true}, // The time transaction added
  isRated: {type: Boolean, default: false}
});

/**
 * Example data
 {
   "transaction": {
     cuid: 'newrandomstringcuid',
     sharers: 'expertid',
     type: 'call',
     price: 1.5,
     moneyEarnings: 150.00,
     tax: 12.80,
     fees: 26.54,
     sharersFunds: 110.66,
     duration: 6000,
     currency: 'USD',
     dateAdded: '2016-12-29'
   }
 }
 */

transactionSchema.statics.getMetadata = async function(transaction) {
  let object = JSON.parse(JSON.stringify(transaction));
  let detail = await TransactionDetail.findOne({transactionID: transaction.cuid});
  if(!detail) {
    return null;
  }
  
  let users = await Promise.all([
    User.findOne({cuid: detail.learnerID}, transactionUsersFields).exec(),
    User.findOne({cuid: detail.sharers}, transactionUsersFields).exec(),
  ]);
  
  object.from = users[0];
  object.to = users[1];
  
  return object;
}

export default mongoose.model('Transaction', transactionSchema);
