import mongoose from 'mongoose';
import { activeCodeOrder, activeTeacherMembership } from '../services/historyCart.service';
import StringHelper from "../util/StringHelper";
import {Q} from "../libs/Queue";
import globalConstants from "../../config/globalConstants";

const Schema = mongoose.Schema;

const historyCart = new Schema({
  userName: {type: String},
  phoneNumber: {type: String},
  address: {type: String},
  email: {type: String},
  paymentId: {type: Schema.ObjectId},
  paymentMethod: {type: Object},
  user: {type: Schema.ObjectId, index: 1},
  code: {type: Number, required: true},
  info: {type: Object},
  codeActive: {type: String},
  userUse: {type: Schema.ObjectId},
  dateUse: {type: Date},
  isActive: {type: Boolean, default: false},
  coupon: {type: String, index: 1},
  currency : {type: String, default: 'VND'},
  status: {type: Number, index: 1, default: 1},
  total_payment: {type: Number, default: 0},
  total: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});

/**
 * 1 - pending
 * 2 - success
 * 3 - fail
 * 4 - error_customer
 * 5 - rejected
 * */
historyCart.post('save', async function (created, next) {
  try {
    if(created.status === 2 && !created.isActive) {
      if (created.user) {
        await activeCodeOrder(created.user, created.codeActive);
      } else {
        let dataSendMail = {
          type: 'OrderSuccess',
          language: 'vi',
          data: {
            fullName: created.userName,
            email: created.email,
            address: created.address,
            phoneNumber: created.phoneNumber,
            codeActive: created.codeActive,
            code: StringHelper.generalCodeOrder(created.code),
            total_payment: created.total_payment
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
      }
    }
    next();
  } catch (err) {
    console.log('err post save history cart: ',err);
    next();
  }
});

export default mongoose.model('historyCart', historyCart);
