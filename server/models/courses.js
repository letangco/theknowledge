import {Q} from '../libs/Queue';
// import AMPQ from '../../rabbitmq/ampq';
// import Follow from './follow';
// import ArrayHelper from '../util/ArrayHelper';
import mongoose from 'mongoose';
// import Feed from './feeds';
import User from './user';
import globalConstants, { COURSE_STATUS } from "../../config/globalConstants";
import Notification from "./notificationNew";
import * as Course_Service from '../services/course.services';
import ElasticSearch from "../libs/Elasticsearch";
import configs from '../config';
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  title: {type: String, required: true},
  slug: {type: String, required: true, unique: true},
  lectures: [{type: Schema.ObjectId, ref: 'users', required: true}],
  creator: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  code: {type: Number},
  description: {
    general: {type: String},
    yourKnowledge: {type: String}, // kiến thức cần có
    purpose: {type: String},      // mục tiêu khóa học
    attendees: {type: String},   // Đối tượng tham gia
  },
  category: {type: Schema.ObjectId, ref: 'categories', index: true},
  thumbnail: {type: String},
  videoEmbed: {type: String},
  tags: {type: Array},
  maxStudents: {type: Number},
  language: {type: String, index: true},
  duration: {type: Number}, // minutes
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date},
  status: {
    type: Number,
    enum: Object.values(COURSE_STATUS),
    default: 3,
    index: true
  },
  type: {type: String, enum:['live_stream', 'video', 'exercise']},
  isLive: {type: Boolean, default: false},
  regularPrice: { type: Number, index: true }, // $
  price: {type: Number, index: true}, // $
  start_date: {type: Number, default: 0, index: true},
  next_lesson_date: {type: Number, default: 0, index: true},
  isMembership: {type: Boolean, default: false},
  password: {type: String}, // The password user can access to this course without buy it
  buyAble: {type: Boolean, default: true},
  hideCourse: {type: Boolean, default: false},
  commission: {type: Number, default: configs.course_fee} // 0.3 for 30 %
});

/** Status
 * 1 - living
 * 2 - on_going
 * 3 - up_coming
 * 4 - finish
 * 5 - waiting
 * 6 - rejected
 * 7 - waiting_delete
 * 8 - deleted
 * 9 - expired
 */

courseSchema.pre('save',function (next) {
  this.wasNew = this.isNew;
  next();
});
courseSchema.post('save',function (created,next) {
  if(this.wasNew && !created.hideCourse){
    Q.create(globalConstants.jobName.CREATE_ELASTICSEARCH_COURSE, created).removeOnComplete(true).save();
  }
  next();
});
/**
 * Create Feeds
 * */
// courseSchema.post('save',async function (created,next) {
//     // TODO FEED ...
//   if([2,3].indexOf(created.status) !== -1 && !created.hideCourse){
//     let feedOptions = {
//       actor: created.creator,
//       action: 'course_live',
//       type: 'course',
//       object: created._id
//     };
//     let user = [];
//     user = created.lectures.map(e => {return e.toString()});
//     await Promise.all(user.map(async e => {
//       let follow = await Follow.find({to:e},'from');
//       follow.map(e => {
//         if(e && user.indexOf(e.from.toString())===-1){
//           user.push(e.from);
//         }
//       });
//     }));
//     user = await ArrayHelper.uniqueValuesInArray(user);
//
//     user.forEach(async userId => {
//       let opt = Object.assign({owner: userId}, feedOptions);
//       let check = {
//         owner:userId,
//         object: created._id
//       };
//       let feed = await Feed.findOne(check).lean();
//       if(!feed){
//         let priority = created.creator.toString() === userId ? -15 : 0;
//         Q.create(globalConstants.jobName.CREATE_FEED, opt).priority(priority).removeOnComplete(true).save();
//       }
//     });
//   }
//   next();
// });

/**
 * Create Notifications
 * */
// courseSchema.post('save', async function (created,next) {
//   try{
//     let author = await User.findById(created.creator).lean();
//     let notifications = {
//       type:"followCourses",
//       userSendID:author.cuid,
//       data:{
//         coursesId:created._id,
//         url: `course/${created.slug}`
//       }
//     };
//     let notificationsInvite = {
//       type:"InviteCourses",
//       userSendID:author.cuid,
//       data:{
//         coursesId:created._id,
//         url: `course/${created.slug}`
//       }
//     };
//     let notificationsAuthor = {
//       type:"AuthorCourses",
//       data:{
//         coursesId:created._id,
//         url: `course/${created.slug}`
//       }
//     };
//     let lectures = created.lectures;
//     lectures = await lectures.map(e =>{return e.toString()});
//     let users = [];
//     await Promise.all(lectures.map(async e => {
//       let follow = await Follow.find({to:e},'from');
//       follow.map(e => {
//         if(e && users.indexOf(e.from.toString())===-1 && lectures.indexOf(e.from.toString())){
//           users.push(e.from.toString());
//         }
//       });
//     }));
//     /**
//      * Notifications WHEN create
//      * */
//     if(this.wasNew){
//       // console.log('Create!');
//       // await Promise.all(lectures.map(async e =>{
//       //   let owner = await User.findById(e).lean();
//       //   if(owner && e.toString() !== created.creator.toString()){
//       //     let opt = Object.assign({userID:owner.cuid},notifications);
//       //     // console.log(notifications);
//       //     AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, opt);
//       //   }
//       // }));
//       // //console.log(users);
//       // users.map(async e => {
//       //   let owner = await User.findById(e).lean();
//       //   if(owner){
//       //     let opt = Object.assign({userID:owner.cuid},notifications);
//       //     // console.log(notifications);
//       //     AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, opt);
//       //   }
//       // });
//     /**
//      * Notifications WHEN update
//      * */
//     }else {
//       console.log('Update!');
//       if([2,3].indexOf(created.status) !== -1){
//         let options = Object.assign({userID:author.cuid},notificationsAuthor);
//         let check = await NotificationsController.searchNotify(options);
//         if(check === -1){
//           AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, options);
//         }
//         /** Notifications */
//         lectures.map(async e =>{
//           let owner = await User.findById(e).lean();
//           if(owner && e.toString() !== created.creator.toString()){
//             let opt = Object.assign({userID:owner.cuid},notificationsInvite);
//             let notify = await NotificationsController.searchNotify(opt);
//             // console.log(notifications);
//             if(notify === -1){
//               AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, opt);
//             }
//           }
//         });
//         //console.log(users);
//         users.map(async e => {
//           let owner = await User.findById(e).lean();
//           if(owner && lectures.indexOf(e.toString()) === -1){
//             let opt = Object.assign({userID:owner.cuid},notifications);
//             let notify = await NotificationsController.searchNotify(opt);
//             // console.log(notifications);
//             if(notify === -1){
//               AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, opt);
//             }
//           }
//         });
//       }
//     }
//     next();
//   }catch (err){
//     console.log(err);
//   }
// });
courseSchema.post('save',async function (created,next) {
  try {
    if(!created.hideCourse){
      if (created.status === 8){
        Q.create(globalConstants.jobName.DELETE_ELASTICSEARCH_COURSE, created).removeOnComplete(true).save();
        await Notification.remove({object:created._id});
      } else {
        let data = await Course_Service.buildElasticDoc(created);
        await ElasticSearch.update('courses', data, undefined, true)
      }
    }
    return next();
  } catch (e) {
    return next();
  }
});
courseSchema.statics.formatSuggestData = async function(_this, _courses) {
  try{
    let courses = await _this.find({_id:{$in:_courses}},'title slug lectures creator description category language price regularPrice').lean();
    let promises = courses.map(async e=>{
      e.url = `course/${e.slug}`;
      e.lectures = await User.formatBasicInfo(User, e.lectures);
      e.creator = await User.findById(e.creator,'cuid userName avatar fullName expert').lean();
      return e;
    });
    return await Promise.all(promises);
  }catch (err){
    console.log('formatSuggestData ',err);
  }
};
export default mongoose.model('Course', courseSchema);
