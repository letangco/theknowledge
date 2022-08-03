import mongoose from 'mongoose';
import {Q} from "../libs/Queue";
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from "../../config/globalConstants";
import UserOption from "./userOption";
import User from './user';
import LiveStream from './liveStream';
import configs from "../config";

const Schema = mongoose.Schema;

const bookingWebinarSchema = new Schema({
  webinar: {type: Schema.ObjectId, ref: 'LiveStream', required: true},
  user: {type: Schema.ObjectId},
  code: {type: String},
  ticket: {type: Schema.ObjectId},
  amount: {type: Number}, // số lượng
  price: {type: Number},  // đơn giá
  total: {type: Number},  // thành tiền, số lượng x đơn giá
  uniqueCode: [{type: String}],
  tax: {type: Number, default: 0}, // tổng thuế
  fee: {type: Number, default: 0}, // tổng phí, số tiền sau khi nhân total với % phí
  creator_receive: {type: Number, default: 0}, // số tiền còn lại sau khi trừ hết thuế, phí: total - tax - fee
  created_at: {type: Date, default: Date.now},
  currency: {type: String, default: 'USD'},
  priceRate: {type: Number, default: 1},
  contactInfo: {
    fullName: {type: String},
    email: {type: String},
    phoneNumber: {type: String},
  }
});

bookingWebinarSchema.index({ webinar: 1, uniqueCode: 1 });
bookingWebinarSchema.index({ webinar: 1, user: 1 });
bookingWebinarSchema.index({ created_at: -1 });
bookingWebinarSchema.pre('save',async function (next) {
  this.wasNew = this.isNew;
  next();
});
bookingWebinarSchema.post('save',async function (created, next) {
  if (this.wasNew){
    let webinar = await LiveStream.findById(created.webinar).lean();
    let userBuy = await User.findById(created.user).lean();
    let author = await User.findById(webinar.user).lean();
    let username = author.userName || author.cuid;
    let url = `${username}/videos/${created.webinar.toString()}`;
    // TODO Notification
    let notification = {
      to:author._id,
      from:created.user,
      type:"userSentTicket",
      object:created.webinar,
      data:{
        url:url
      }
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, notification);
    let notifications = {
      to:created.user,
      type:"userBuyTicket",
      object:created.webinar,
      data:{
        url:url
      }
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, notifications);
    // TODO SEND_MAIL
    let userBuyOption = await UserOption.findOne({userID:userBuy.cuid}).lean();
    let dataSendMailToUserBuy = {
      type: 'userBuyTicket',
      language: userBuyOption && userBuyOption.language ? userBuyOption.language : 'en' ,
      data: {
        webinar:webinar,
        url:url,
        fullName: created.contactInfo.fullName,
        email:created.contactInfo.email,
        code:created.uniqueCode
      }
    };
    Q.create(globalConstants.jobName.SEND_MAIL, dataSendMailToUserBuy).removeOnComplete(true).save();
    let authorOption = await UserOption.findOne({userID:author.cuid}).lean();

    let dataSendMailAuthor = {
      type: 'userSentTicket',
      language: authorOption && authorOption.language ? authorOption.language : 'en' ,
      data: {
        webinar:webinar,
        url:url,
        cuid: author.cuid,
        userBuy:userBuy,
        firstName: author.firstName,
        lastName: author.lastName,
        userName: author.userName,
        email: author.email
      }
    };
    Q.create(globalConstants.jobName.SEND_MAIL, dataSendMailAuthor).removeOnComplete(true).save();
  }
  next()
});

export default mongoose.model('BooingWebinar', bookingWebinarSchema);
