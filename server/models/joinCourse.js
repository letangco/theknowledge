import mongoose from 'mongoose';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';
import User from './user';
import UserOption from './userOption';
import Courses from './courses';
import UserToCourse from './userToCourse'
import configs from '../config';
import sanitizeHtml from "sanitize-html";

const Schema = mongoose.Schema;

const joinCourseSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  course: {type: Schema.ObjectId, ref: 'courses', required: true, index: true},
  course_price: {type: Number, default: 0},
  tax: {type: Number, default: 0},
  code: {type: String},
  fee: {type: Number, default: 0}, // số tiền sau khi nhân %
  course_creator_receive: {type: Number, default: 0}, // số tiền còn lại sau khi trừ hết thuế, phí
  created_at: {type: Date, default: Date.now},
  currency: {type: String, default: '$'},
  priceRate: {type: Number, default: 1}
});
joinCourseSchema.pre('save',function (next) {
  this.wasNew = this.isNew;
  next();
});
/**
 * Notification And Send Mail
 */
joinCourseSchema.post('save',async function (created,next) {
  if(this.wasNew){
    let courses = await Courses.findById(created.course).lean();
    let author = await User.findById(courses.creator).lean();
    let userBuy = await User.findById(created.user).lean();
    let notification = {
      to:author._id,
      from:userBuy._id,
      type:"joinCoursesToAuthor",
      object:courses._id,
      data:{
        courseID:created.course,
        url:`course/${courses.slug}`
      }
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, notification);
    let notifications = {
      to:userBuy._id,
      type:"joinCourses",
      object:courses._id,
      data:{
        courseID:created.course,
        url:`course/${courses.slug}`
      }
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, notifications);
    //TODO SEND_MAIL
    let userBuyOption = await UserOption.findOne({userID:userBuy.cuid}).lean();
    let dataSendMailToUserBuy = {
      type: 'joinCourses',
      language: userBuyOption && userBuyOption.language ? userBuyOption.language : 'en',
      data: {
        course:courses,
        url:`${configs.clientHttpsHost}/course/${courses.slug}`,
        cuid: userBuy.cuid,
        firstName: userBuy.firstName,
        lastName: userBuy.lastName,
        userName: userBuy.userName,
        email: userBuy.email
      }
    };
    Q.create(globalConstants.jobName.SEND_MAIL, dataSendMailToUserBuy).removeOnComplete(true).save();
    let authorOption = await UserOption.findOne({userID:author.cuid}).lean();

    let dataSendMailAuthor = {
      type: 'joinCoursesToAuthor',
      language: authorOption && authorOption.language ? authorOption.language : 'en',
      data: {
        course:courses,
        url:`${configs.clientHttpsHost}/course/${courses.slug}`,
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
  next();
});

joinCourseSchema.post('save', async function(created, next) {
  let check = await UserToCourse.findOne({user: created.user, course: created.course}).lean();
  if(!check){
    await UserToCourse.create({
      user: created.user,
      course: created.course
    })
  }
  Q.create(globalConstants.jobName.AFTER_JOIN_COURSE, created).removeOnComplete(true).save();
  return next();
});

export default mongoose.model('JoinCourse', joinCourseSchema);
