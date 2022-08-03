import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import cuid from 'cuid';
import UserViewStreamTracking from '../models/userViewStreamTracking';
import Courses from '../models/courses';
import { checkCoupon } from './coupon.service';
import SupportCourse from '../models/supportCourse';
import User from '../models/user';
import { sendSMS } from '../libs/sendESms';
import Feed from '../models/feeds';
import JoinCourse from '../models/joinCourse';
import CourseCode from '../models/courseCode';
import MultipleChoice from '../models/multipleChoice';
import ReportMultipleChoice from '../models/reportMultipleChoice';
import QuestionMultipleChoice from '../models/questionMultipleChoice';
import UsedPassword from '../models/courseUsedPassword';
import { addScheduleStream } from './liveStream.services';
import { removeJob, Q } from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import configs from '../config';
import StringHelper from '../util/StringHelper';
import ArrayHelper from '../util/ArrayHelper';
import HistoryCoupon from '../models/historyCoupon';
import { cacheImage } from '../libs/imageCache';
import { mathTime } from './liveStream.services';
import * as NumberHandle from '../util/HandleNumber';
import Category from '../models/category';
import {formatCategoryByLanguage} from '../controllers/category.controller';
import DeleteCourse from '../models/deleteCourse';
import LiveStream from '../models/liveStream';
import Refund from '../models/refund';
import KueJob from '../models/remindCourses';
import { buildSlug as buildLessonSlug } from './liveStream.services';
import globalConstants from '../../config/globalConstants';
import ConsiderCourse from '../models/considerCourses';
import UserOption from '../models/userOption';
import Payment from '../models/payment.js';
import {
  addExerciseToCourse,
  removeExerciseToCourse,
  getExercisesByLesson,
  getReportCourseByUser,
} from './exercise.services';
import * as DocumentServices from './document.services';
import { STATUS_MAPPER } from '../controllers/course.controller';
import Follow from '../models/follow';
import { getReviewStarSummary } from './reviewCourse.services';
import { hash } from '../models/functions';
import UserToCourse from '../models/userToCourse';
import adminEvaluateLesson from '../models/adminEvaluateLesson';
import Video from '../models/videos';
import ExerciseToCourse from '../models/exerciseToCourse';
import Document from '../models/documents';
import { slugBuilder } from '../util/string.helper';

export const COURSE_LIMIT = 12;
const msg_error = {
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  ALREADY_JOIN:'ALREADY_JOIN',
  MAX_STUDENT:'MAX_STUDENT',
  CODE_NOT_FOUND:'CODE_NOT_FOUND',
  CODE_NOT_APPLY:'CODE_NOT_APPLY',
  YOU_HAVE_USED:'YOU_HAVE_USED',
  FULL_DISCOUNT:'FULL_DISCOUNT',
  CODE_NOT_STARTED:'CODE_NOT_STARTED',
  CODE_FINISHED:'CODE_FINISHED',
  LEVEL_DISCOUNT:'LEVEL_DISCOUNT',
  NOT_ENOUGH_BALANCE:'NOT_ENOUGH_BALANCE',
  CODE_LOCKED:'CODE_LOCKED',
};
const array_prior_status = [1, 2, 3, 4];
const array_admin_status = [5, 6, 7, 8, 9];

export async function createCourse(coursesOptions) {
  try {
    let user = await User.findById(coursesOptions.creator, 'expert');
    if(!user.expert || user.expert !== 1) {
      return Promise.reject({status: 403, error: 'Permission denied.'});
    }
    let check_slug = await Courses.findOne({slug: coursesOptions.slug}).lean();
    if(check_slug){
      return Promise.reject({status: 400, success: false, error: 'Slug exists.'})
    }
    let course = await Courses.create(coursesOptions);
    course = JSON.parse(JSON.stringify(course));
    return course;
  } catch (err) {
    console.log('err on createCourse:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function buildSlug(title) {
  let simpleSlug = slugBuilder(title);
  let isExists = await Courses.count({slug: simpleSlug});
  if(!isExists) {
    return simpleSlug;
  }
  return simpleSlug + '-' + cuid.slug();
}

export async function buildSlugUserName(title) {
  let simpleSlug = slugBuilder(title);
  let isExists = await User.count({userName: simpleSlug});
  if(!isExists) {
    return simpleSlug;
  }
  return simpleSlug + '-' + cuid.slug();
}

export async function joinCourse(userId, courseId, langCode, affCode, code, memberCode) {
  try {
    let options = {user: userId, course: courseId};
    let historyCoupon;
    let resources = await Promise.all([
      User.findById(userId),
      Courses.findById(courseId).lean(),
      JoinCourse.findOne(options).lean(),
      JoinCourse.count({course: courseId})
    ]);
    let user = resources[0], course = resources[1];
    options.course_price = course.price;
    if(!course) {
      return Promise.reject({status: 404, error: msg_error.COURSE_NOT_FOUND});
    }

    if(resources[2]) {
      return Promise.reject({status: 400, error: msg_error.ALREADY_JOIN});
    }

    if(resources[3] === course.maxStudents) {
      return Promise.reject({status: 400, error: msg_error.MAX_STUDENT});
    }
    // If user use code coupon

    if (code){
      options.code = code;
      historyCoupon = await checkCoupon(userId,course, 1, course.price, 'course', langCode, code);

      if (!historyCoupon.success){
        return Promise.reject(historyCoupon);
      }
      delete historyCoupon.success;
      options.course_price = historyCoupon.price_discount;
      if(user.balance < options.course_price) {
        return Promise.reject({status: 400, success:false, error: msg_error.NOT_ENOUGH_BALANCE, missing: await NumberHandle.numberRound(options.course_price - user.balance, 1000)});
      }
    }else if(!memberCode) {
      if(user.balance < course.price) {
        return Promise.reject({status: 400, success:false, error: msg_error.NOT_ENOUGH_BALANCE, missing: await NumberHandle.numberRound(course.price - user.balance, 1000)});
      }
    }
    let commission = course.commission || 0;
    let tesseBank = await User.findById(configs.tesseBank._id);
    options.fee = (commission * options.course_price).toFixed(2);
    options.course_creator_receive = options.course_price - options.fee;
    options.currency = configs.currency[langCode] ? configs.currency[langCode] : 'USD';
    options.priceRate = configs.moneyExchangeRate[langCode] ? configs.moneyExchangeRate[langCode] : 1;
    //end
    if(memberCode){
      await Payment.update({memberCode: memberCode}, {$set:{status: 1}})
    } else {
      await User.update({_id: userId},{$set: {balance: (user.balance - options.course_price).toFixed(2)}});
      await User.update({_id: configs.tesseBank._id},{$set: {balance: (options.course_creator_receive + tesseBank.balance).toFixed(2)}});
    }
    // create join course record

    let joinedCourse = await JoinCourse.create(options);

    if(affCode && course.price > 0) {
      let jobData = {type: 2, orderObject: joinedCourse, affCode};
      Q.create(globalConstants.jobName.CREATE_AFF_HISTORY, jobData).removeOnComplete(true).save();
    }
    if (code){
      historyCoupon.paymentId =  joinedCourse._id;
      await HistoryCoupon.create(historyCoupon);
    }
    return {balance: user.balance};
  } catch (err) {
    console.log('err on joinCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getLessonByTime(range, user){
  try{
    let conditions = {
      course: {$ne: null},
      $and:[
        {'time.dateLiveStream':{$gte: range.start}},
        {'time.dateLiveStream':{$lt: range.end}}
      ]
    };
    if(user){
      let courses = await UserToCourse.find({
        user: user
      });
      courses = courses.map(e => e.course);
      conditions = {
        course: {
          $ne: null,
          $in: courses
        },
        $and:[
          {'time.dateLiveStream':{$gte: range.start}},
          {'time.dateLiveStream':{$lt: range.end}}
        ]
      }
    }
    let lessons = await LiveStream.find(conditions, '_id course time.dateLiveStream').sort({'time.dateLiveStream': 1}).lean()
    if(lessons){
      let promises = lessons.map(async lesson => {
        let course =  await Courses.findOne({
          _id: lesson.course,
          status: {$in: [1, 2, 3]}
        }, 'title creator category slug price regularPrice thumbnail next_lesson_date status thumbnail duration').lean();
        if(course){
          course.dateStart = lesson.time.dateLiveStream;
          course.thumbnail = course.thumbnail ? await cacheImage({src:course.thumbnail,size:100}) : null;
          course.duration = parseInt(course.duration) * 60 * 1000;
          course.creator = await User.findById(course.creator,"_id cuid userName fullName expert avatar").lean();
        }
        return course;
      });
      return await Promise.all(promises);
    }
  }catch (err) {
    console.log('error getLessonByTime : ',err);
    throw {
      success: false,
      status: 500,
      error:'Internal Server Error.'
    }
  }
}

/**
 * get list course filter by date
 * @param date: date
 * @param user
 * @returns {Promise<null|*>}
 */
export async function getCourseBydate(date, user = null) {
  let timer = [];
  timer.push({
    start: date,
    end: date + (12*60*60*1000)
  });
  timer.push({
    start: date + (12*60*60*1000),
    end: date + (18*60*60*1000)
  });
  timer.push({
    start: date + (18*60*60*1000),
    end: date + (24*60*60*1000)
  });
  if(timer){
    let promises = timer.map(async time => {
      return await this.getLessonByTime(time, user);
    });
    return await Promise.all(promises);
  }
  return null;
}
/**
 * Get List courses
 * @param options bounded params
 * @param options.page Page to query
 * @param options.status Status to filter
 * @param options.requester Requester object
 * @param options.requester._id Requester's _id
 * @param options.requester.role Requester's role
 * @param options.langCode language code
 */

export async function getCourses(options) {
  try {
    let limit = options.home === true ? 12 : COURSE_LIMIT;
    let page = options.page;
    let status = options.status;
    let requesterId = options.requester ? options.requester._id : null;
    let role = options.requester ? options.requester.role : null;
    let langCode = options.langCode;
    let skip = (page - 1) * limit;
    let allowStatuses = [1, 2, 3, 4];
    let language = {$ne: null};
    let conditions = {};
    if(role === 'admin' && options.request) {
      Array.prototype.push.apply(allowStatuses, [5, 6, 7, 8, 9]);
      conditions = {
        status: {$in: allowStatuses}
      };
    } else {
      // if(langCode !== 'vi') {
      //   language = {$ne: configs.languageVi};
      // }
      conditions = {
        status: {$in: allowStatuses},
        hideCourse: {$in: [false, null]}
      };
      conditions['$or'] = [
        {language},
        {creator: requesterId}
      ];
    }
    if(allowStatuses.indexOf(status) >= 0) {
      conditions.status = status;
    }

    if (options.user) {
      conditions.creator = options.user;
    }
    if (options.category) {
      const cat =  await Category.findById(options.category);
      if (cat) {
        let categories = await Category.distinct('_id',{ parent: cat.cuid }).lean();
        if(categories?.length) {
          categories.push(options.category)
        } else {
          categories = [options.category]
        }
        conditions.category = { $in: categories };
      }
    }
    if (options.keyword) {
      conditions['$or'] = [
        {'title': { $regex: options.keyword.trim(), $options: "$i" }},
        {'description.general': { $regex: options.keyword.trim(), $options: "$i" }}
      ];
    }
    //Membership switch
    switch (options.type) {
      case 'membership':
        conditions.isMembership = true;
        break;
      case 'paid':
        conditions.isMembership = false;
        if(options.home !== true){
          conditions.price = {$ne: 0};
          conditions.buyAble = true;
        }
        break;
      case 'free':
        conditions.price = 0;
        conditions.buyAble = true;
        break;
      case 'video':
        conditions.type = 'video';
        break;
      case 'live_stream':
        conditions.type = 'live_stream';
        break;
      // case 'password':
      //   conditions.password = {$ne : null};
      //   break;
      default:
        break;
    }
    // let resources = await Promise.all([
    //   Courses.count(conditions),
    //   Courses.find(conditions).sort(role === 'admin'  && options.request ? {created_at: -1} : {status: 1}).lean()
    // ]);
    let total_items = await Courses.count(conditions);
    console.log('Main : ', conditions, allowStatuses.indexOf(status) >= 0 ? status : allowStatuses);
    let cond = conditions;
    delete cond.status;
    let data = await queryCourse(cond, skip, limit, allowStatuses.indexOf(status) >= 0 ? status : allowStatuses );
    // data = data.slice(0, limit)
    data = await getMetaDataHome(data, requesterId, langCode, role);
    data = formatListInfo(data);
    // data = await sortByTimeLession(data);
    // data = data.splice(skip, limit);
    // }
    //console.log('data: ', data[0]);
    return {total_items, data};
  } catch (err) {
    console.log('err on getCourses:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
export async function getMetaDataHome(courseModels, requesterId, langCode, role = 'user') {
  try{
    langCode = langCode || 'en';
    if(!(courseModels instanceof Array)) {
      courseModels = [courseModels];
    }
    let courseIds = courseModels.map(e => e._id);
    let joinCourseMapper = {}, refundMapper = {}, courseCode = null, usedPassword = null;
    let actions;
    if(requesterId) {
      actions = await Promise.all([
        JoinCourse.find({user: requesterId, course: {$in: courseIds}}).lean(),
        Refund.find({user: requesterId, object: {$in: courseIds}, status: 'waiting'}).lean(),
        CourseCode.findOne({courseId: courseIds[0], userUsedId: requesterId}).lean(),
        UsedPassword.findOne({courseId: courseIds[0], userId: requesterId}).lean()
      ]);
      let joinCourses = actions[0], refunds = actions[1];
      courseCode = actions[2];
      usedPassword = actions[3];
      joinCourseMapper = ArrayHelper.toObjectByKey(joinCourses, 'course');
      refundMapper = ArrayHelper.toObjectByKey(refunds, 'object');

    }
    let priceRate = configs.moneyExchangeRate[langCode] ? configs.moneyExchangeRate[langCode] : 1;
    let currency = configs.currency[langCode] ? configs.currency[langCode] : 'USD';
    let promises = courseModels.map(async course =>{
      switch (course.status) {
        case 1:
          course.status = 'living';
          break;
        case 2:
          course.status = 'on_going';
          break;
        case 3:
          course.status = 'up_coming';
          break;
        case 4:
          course.status = 'finish';
          break;
        case 5:
          course.status = 'waiting';
          break;
        case 6:
          course.status = 'rejected';
          break;
        case 7:
          course.status = 'waiting_delete';
          break;
        case 8:
          course.status = 'deleted';
          break;
        case 9:
          course.status = 'expired';
          break;
        default:
          break;
      }
      course.thumbnail = course.thumbnail ? await cacheImage({src:course.thumbnail,size:420}) : null;
      course.creator = await User.findById(course.creator,"_id cuid userName fullName expert avatar").lean();
      course.isLecture = requesterId && course.lectures.indexOf(requesterId.toString()) >= 0 || false;
      if(joinCourseMapper.hasOwnProperty(course._id.toString()) || courseCode || usedPassword){
        course.joined = true;
      } else {
        course.joined = false;
      }
      course.waiting_refund = refundMapper.hasOwnProperty(course._id.toString());
      course.registered = await JoinCourse.count({course: course._id});
      course.language = configs.languageMapper[course.language] || 'un';
      course.price_text = (course.price * priceRate).toFixed(2)*1;
      course.regularPriceText = (course.regularPrice * priceRate).toFixed(2)*1;
      course.currency = currency;
      course.password = !!course.password;
      let lessionLiving = await LiveStream.find({status:'living',course:course._id});
      let lessionLive = await LiveStream.find({type: {'$ne': 'video'},course:course._id});
      if(lessionLive && lessionLive.length){
        course.live = true
      } else {
        course.live = false
      }
      let scheduleLession = await LiveStream.find({status:'new', course:course._id, 'time.dateLiveStream':{$gt:Date.now()}}).sort({'time.dateLiveStream': 1}).lean();
      if (lessionLiving.length > 0){
        course.lessonUrl = `${course.creator.userName || course.creator.cuid}/videos/${lessionLiving[0]._id}`;
        course.lessonId = lessionLiving[0]._id;
        course.status = 'living';
        await Courses.update({
          _id: course._id
        }, {
          $set: {
            status: 1
          }
        });
        course.next_lesson_date = parseInt(lessionLiving[0].time.dateLiveStream);
      }else {
        if (scheduleLession.length > 0){
          course.lessonUrl = `${course.creator.userName || course.creator.cuid}/videos/${scheduleLession[0]._id}`;
          course.lessonId = scheduleLession[0]._id;
          course.next_lesson_date = parseInt(scheduleLession[0].time.dateLiveStream);
        }else {
          if(role !== 'admin'){
            course.status = 'finish';
            if(course.type !== 'video') {
              await Courses.update({
                _id: course._id
              }, {
                $set: {
                  status: 4
                }
              });
            }
          }
          course.next_lesson_date = 0;
        }
      }

      let lessons = await LiveStream.find({course: course._id}).sort({index: 1, 'time.dateLiveStream': 1}).lean();
      let courseType = 'exercise';
      if(lessons && lessons.length){
        let lessonLive = [];
        lessons.map((lesson, index) => {
          if(lesson.type !== 'video' && lesson.type !== 'test'){
            courseType = 'liveStream';
          } else if(lesson.type === 'video' && courseType === 'exercise'){
            courseType = 'video'
          }
        });
      } else  {
        courseType = 'liveStream';
      }
      course.type = courseType
      course.code = course.code ? StringHelper.generalCourseUser(course.code) : null;
      return course;
    });
    return await Promise.all(promises);
  }catch (err){
    console.log('err on getMetaData:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
export async function getMetaData(courseModels, requesterId, langCode, memberShip = false) {
  try {
    langCode = langCode || 'en';
    let joinCourseMapper = {}, refundMapper = {}, courseCode = null, usedPassword = null;

    if(!(courseModels instanceof Array)) {
      courseModels = [courseModels];
    }
    courseModels = JSON.parse(JSON.stringify(courseModels));

    let categoryIds = [], courseIds = [];
    courseModels.forEach(course => {
      categoryIds.push(course.category);
      courseIds.push(course._id);
    });
    if(!courseIds.length){
      return Promise.reject({status: 404, error: 'Courses was not found.'});
    }
    let categories = await Category.find({_id: {$in: categoryIds}}).lean();
    categories = formatCategoryByLanguage(categories, langCode);
    let categoryMappers = ArrayHelper.toObjectByKey(categories, '_id');
    let requester = '';
    if(requesterId) {
      requester = await User.findById(requesterId).lean();
      let actions = await Promise.all([
        JoinCourse.find({user: requesterId, course: {$in: courseIds}}).lean(),
        Refund.find({user: requesterId, object: {$in: courseIds}, status: 'waiting'}).lean(),
        CourseCode.findOne({courseId: courseIds[0], userUsedId: requesterId}).lean(),
        UsedPassword.findOne({courseId: courseIds[0], userId: requesterId}).lean()
      ]);
      let joinCourses = actions[0], refunds = actions[1];
      courseCode = actions[2];
      usedPassword = actions[3];
      joinCourseMapper = ArrayHelper.toObjectByKey(joinCourses, 'course');
      refundMapper = ArrayHelper.toObjectByKey(refunds, 'object');
    }

    let lessons = await LiveStream.find({course: {$in: courseIds}}).sort({index: 1, 'time.dateLiveStream': 1}).lean();
    //Sort lesson with video and livestream, if video keep index, live stream sort by date live
    let courseType = 'exercise';
    if(lessons && lessons.length){
      let lessonLive = [];
      lessons.map((lesson, index) => {
        if(lesson.type !== 'video' && lesson.type !== 'test'){
          courseType = 'liveStream';
          lesson.dateLiveStream = parseInt(lesson.time.dateLiveStream);
          lessonLive.push(lesson);
          lessons[index] = {}
        } else if(lesson.type === 'video' && courseType === 'exercise'){
          courseType = 'video'
        }
      });
      if(lessonLive){
        lessonLive = ArrayHelper.sortByProp(lessonLive, 'dateLiveStream', 'asc');
        lessonLive.map(live => {
          for(let i = 0; i < lessons.length; i++){
            if(JSON.stringify(lessons[i]) === '{}'){
              lessons[i] = live;
              return;
            }
          }
        })
      }
    } else  {
      courseType = 'liveStream';
    }
    let priceRate = configs.moneyExchangeRate[langCode] ? configs.moneyExchangeRate[langCode] : 1;
    let currency = configs.currency[langCode] ? configs.currency[langCode] : 'USD';
    let now = Date.now();
    let viewStatus = false;
    let promises = courseModels.map(async course => {
      course.type = courseType
      course.category = categoryMappers[course.category];
      course.registered = await JoinCourse.count({course: course._id});
      if(requesterId && requesterId.toString() === course.creator.toString()) {
        let agg = await JoinCourse.aggregate([
          {
            $match: {course: course._id}
          },
          {
            $group: {_id: '$course', in_come: {$sum: '$course_creator_receive'}}
          }
        ]);
        if(agg.length) {
          course.in_come = agg[0]['in_come'];
        }
      }
      course.isLecture = requesterId && course.lectures.indexOf(requesterId.toString()) >= 0 || false;
      let lectures = await User.formatLectureInfo(User, course.lectures, langCode, course.category ? course.category._id : null);
      let lectureMappers = ArrayHelper.toObjectByKey(lectures, '_id');
      course.lectures = course.lectures.map(lectureId => lectureMappers[lectureId]);
      course.creator = lectureMappers[course.creator];
      course.joined = false;
      if (course.isMembership){
        if(requester && requester.memberShip){
          if(requester.memberShip > Date.now()){
            if(joinCourseMapper.hasOwnProperty(course._id.toString()) || courseCode || usedPassword){
              course.joined = true;
            }
          } else {
            course.reason = 'OUT_DATE_MEMBERSHIP'
          }
        } else {
          course.reason = 'NOT_LOGIN'
        }
      } else {
        if(joinCourseMapper.hasOwnProperty(course._id.toString()) || courseCode || usedPassword){
          course.joined = true;
        }
      }
      course.waiting_refund = refundMapper.hasOwnProperty(course._id.toString());
      if(course.isLecture ||
        course.joined ||
        (memberShip && course.isMembership) ||
        course._id.toString() === course.creator._id.toString()
        || courseCode || usedPassword) {
        viewStatus = true;
      }
      let thisLessons = lessons.filter(lesson => lesson.course.toString() === course._id.toString());
      let livingLessons;
      let finishedLessons = [], scheduleLessons = [];
      for(let i=0, max=thisLessons.length; i<max; i++) {
        let lesson = thisLessons[i];
        if(lesson.status === 'living') {
          livingLessons = lesson;
          break;
        }
        if (lesson.type === 'schedule') {
          scheduleLessons.push(lesson);
        } else {
          finishedLessons.push(lesson);
        }
        if(lesson.type !== 'video'){
          course.live = true
        }
      }

      let dateLiveStream;
      for(let i = 0, max = scheduleLessons.length, limit = max - 1; i < max; i++) {
        dateLiveStream = Number(scheduleLessons[i]['time']['dateLiveStream']).valueOf();
        if(dateLiveStream > Date.now()) {
          course.next_lesson_date = dateLiveStream;
          course.lessonTitle = scheduleLessons[i].title
          course.lessonId = scheduleLessons[i]._id
          break;
        }
      }

      if(course.status === 3 && Date.now() >= course.start_date) {
        await Courses.update({_id: course._id}, {$set: {status: 2}});
      }

      if(course.status === 2 || course.status === 3) {
        let lastLesson = thisLessons[thisLessons.length -1];
        if(lastLesson) {
          let dateLiveStream = Number(lastLesson.time.dateLiveStream).valueOf();
          let scheduledTime = new Date(dateLiveStream);
          let after = new Date(scheduledTime);
          after = after.setMinutes(after.getMinutes() + 15);
          if(now > after && course.live === true) {
            course.status = 4;
            await Courses.update({_id: course._id}, {$set: {status: 4}});
          }
        }
      }
      let canReOpenLessonId = finishedLessons.length ? finishedLessons[finishedLessons.length - 1]['_id'].toString() : null;
      course.lessons = await LiveStream.getMetaBasic(thisLessons, langCode, requesterId, canReOpenLessonId, course.status, viewStatus);
      course.multipleChoice = [];
      let multipleChoice  = await MultipleChoice.find({course: {$in: courseIds}}).sort({index: 1,dateModified: 1}).lean()
      if(multipleChoice){
        promises = multipleChoice.map(async multi => {
          multi.questions = await QuestionMultipleChoice.count({
            multipleChoice: mongoose.Types.ObjectId(multi._id)
          }).lean();

          multi.totalChoice = await ReportMultipleChoice.count({
            'multipleChoice._id': mongoose.Types.ObjectId(multi._id)
          }).lean();
          if(requesterId){
            multi.total = await ReportMultipleChoice.count({
              'multipleChoice._id': mongoose.Types.ObjectId(multi._id),
              'contact.user': mongoose.Types.ObjectId(requesterId)
            }).lean();
            let max = await ReportMultipleChoice.find({
              'multipleChoice._id': mongoose.Types.ObjectId(multi._id),
              'contact.user': mongoose.Types.ObjectId(requesterId)
            }).sort({corrected: -1}).lean();
            if(max.length && multi.questions){
              multi.point = parseInt(max[0].corrected) * parseInt(max[0].multipleChoice.points) / multi.questions
            }
          }
          return multi;
        });
        course.multipleChoice = await Promise.all(promises);
      }
      course.lessonUrl = livingLessons ? livingLessons.url : scheduleLessons.length ? scheduleLessons[0].url : '';
      course.lessonTitle = livingLessons ? livingLessons.title :
        course.lessonTitle ? course.lessonTitle :
          scheduleLessons.length ? scheduleLessons[scheduleLessons.length - 1].title : '';
      course.lessonId = livingLessons ? livingLessons._id :
        course.lessonId ? course.lessonId :
          scheduleLessons.length ? scheduleLessons[scheduleLessons.length - 1]._id : '';
      course.language = configs.languageMapper[course.language] || 'un';
      course.price_text = course.price * priceRate;
      course.regularPriceText = (course.regularPrice * priceRate).toFixed(2)*1;
      course.currency = currency;
      course.password = !!course.password;
      course.thumbnail = course.thumbnail ? await cacheImage({src:course.thumbnail,size:980}) : null;
      switch (course.status) {
        case 1:
          course.status = 'living';
          break;
        case 2:
          course.status = 'on_going';
          break;
        case 3:
          course.status = 'up_coming';
          break;
        case 4:
          course.status = 'finish';
          break;
        case 5:
          course.status = 'waiting';
          break;
        case 6:
          course.status = 'rejected';
          break;
        case 7:
          course.status = 'waiting_delete';
          break;
        case 8:
          course.status = 'deleted';
          break;
        case 9:
          course.status = 'expired';
          break;
      }
      course.code = course.code ? StringHelper.generalCourseUser(course.code) : null;
      return course;
    });

    return Promise.all(promises);
  } catch (err) {
    console.log('err on getMetaData:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getMetaDataToUpdate(courseModels, requesterId, langCode) {
  try {
    langCode = langCode || 'en';
    let joinCourseMapper = {}, refundMapper = {}, courseCode = null, usedPassword = null;

    if(!(courseModels instanceof Array)) {
      courseModels = [courseModels];
    }
    courseModels = JSON.parse(JSON.stringify(courseModels));

    let categoryIds = [], courseIds = [];
    courseModels.forEach(course => {
      categoryIds.push(course.category);
      courseIds.push(course._id);
    });
    if(!courseIds.length){
      return Promise.reject({status: 404, error: 'Courses was not found.'});
    }
    let categories = await Category.find({_id: {$in: categoryIds}}).lean();
    categories = formatCategoryByLanguage(categories, langCode);
    let categoryMappers = ArrayHelper.toObjectByKey(categories, '_id');
    if(requesterId) {
      let actions = await Promise.all([
        JoinCourse.find({user: requesterId, course: {$in: courseIds}}).lean(),
        Refund.find({user: requesterId, object: {$in: courseIds}, status: 'waiting'}).lean(),
        CourseCode.findOne({courseId: courseIds[0], userUsedId: requesterId}).lean(),
        UsedPassword.findOne({courseId: courseIds[0], userId: requesterId}).lean()
      ]);
      let joinCourses = actions[0], refunds = actions[1];
      courseCode = actions[2];
      usedPassword = actions[3];
      joinCourseMapper = ArrayHelper.toObjectByKey(joinCourses, 'course');
      refundMapper = ArrayHelper.toObjectByKey(refunds, 'object');
    }
    let lessons = await LiveStream.find({course: {$in: courseIds}}).sort({index: 1, 'time.dateLiveStream': 1}).lean();

    let priceRate = configs.moneyExchangeRate[langCode] ? configs.moneyExchangeRate[langCode] : 1;
    let currency = configs.currency[langCode] ? configs.currency[langCode] : 'USD';
    let now = Date.now();
    let promises = courseModels.map(async course => {
      course.category = categoryMappers[course.category];
      course.registered = await JoinCourse.count({course: course._id});
      if(requesterId && requesterId.toString() === course.creator.toString()) {
        let agg = await JoinCourse.aggregate([
          {
            $match: {course: course._id}
          },
          {
            $group: {_id: '$course', in_come: {$sum: '$course_creator_receive'}}
          }
        ]);
        if(agg.length) {
          course.in_come = agg[0]['in_come'];
        }
      }
      course.isLecture = requesterId && course.lectures.indexOf(requesterId.toString()) >= 0 || false;
      let lectures = await User.formatLectureInfo(User, course.lectures, langCode, course.category ? course.category._id : null);
      let lectureMappers = ArrayHelper.toObjectByKey(lectures, '_id');
      course.lectures = course.lectures.map(lectureId => lectureMappers[lectureId]);
      course.creator = lectureMappers[course.creator];
      if(joinCourseMapper.hasOwnProperty(course._id.toString()) || courseCode || usedPassword){
        course.joined = true;
      } else {
        course.joined = false;
      }
      let thisLessons = lessons.filter(lesson => lesson.course.toString() === course._id.toString());
      let livingLessons;
      let finishedLessons = [], scheduleLessons = [];
      for(let i=0, max=thisLessons.length; i<max; i++) {
        let lesson = thisLessons[i];
        if(lesson.status === 'living') {
          livingLessons = lesson;
          break;
        }
        if (lesson.type === 'schedule') {
          scheduleLessons.push(lesson);
        } else {
          finishedLessons.push(lesson);
        }
      }

      let dateLiveStream;
      for(let i = 0, max = scheduleLessons.length, limit = max - 1; i < max; i++) {
        dateLiveStream = Number(scheduleLessons[i]['time']['dateLiveStream']).valueOf();
        if(dateLiveStream > Date.now()) {
        //  if(i < limit) {
            course.next_lesson_date = dateLiveStream;
            break;
        //  }
        //  course.next_lesson_date = null;
        }
      }
      let canReOpenLessonId = finishedLessons.length ? finishedLessons[finishedLessons.length - 1]['_id'].toString() : null;
      course.lessons = await LiveStream.getMetaBasic(thisLessons, langCode, requesterId, canReOpenLessonId, course.status, true);
      let resultMulti = await MultipleChoice.find({course: {$in: courseIds}}).sort({index: 1, dateModified: -1}).lean()
      course.lessonUrl = livingLessons ? livingLessons.url : scheduleLessons.length ? scheduleLessons[0].url : '';
      course.lessonId = livingLessons ? livingLessons._id : scheduleLessons.length ? scheduleLessons[0]._id : '';
      course.language = configs.languageMapper[course.language] || 'un';
      course.price_text = course.price * priceRate;
      course.regularPriceText = (course.regularPrice * priceRate).toFixed(2)*1;
      course.currency = currency;
      course.password = !!course.password;
      course.thumbnail = course.thumbnail ? await cacheImage({src:course.thumbnail,size:980}) : null;
      if(resultMulti.length){
        resultMulti.map(multi => {
          multi.type = 'multiple'
          if(multi.lesson){
            course.lessons.map((lesson, index) => {
              if(multi.lesson === lesson.cuid){
                course.lessons.splice(index + 1, 0, multi);
              }
            })
          } else {
            for(let i = 0; i < course.lessons.length; i ++){
              let lesson = course.lessons[i]
              if(lesson.type !== 'multiple'){
                if(i){
                  course.lessons.splice(i , 0, multi);
                  break;
                } else {
                  course.lessons = [multi].concat(course.lessons);
                  break;
                }
              }
            }
          }
        })
      }

      switch (course.status) {
        case 1:
          course.status = 'living';
          break;
        case 2:
          course.status = 'on_going';
          break;
        case 3:
          course.status = 'up_coming';
          break;
        case 4:
          course.status = 'finish';
          break;
        case 5:
          course.status = 'waiting';
          break;
        case 6:
          course.status = 'rejected';
          break;
        case 7:
          course.status = 'waiting_delete';
          break;
        case 8:
          course.status = 'deleted';
          break;
        case 9:
          course.status = 'expired';
          break;
      }
      course.code = course.code ? StringHelper.generalCourseUser(course.code) : null;
      return course;
    });

    return Promise.all(promises);
  } catch (err) {
    console.log('err on getMetaData:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

async function getCourseInCome(courseId, langCode) {
  try {
    langCode = langCode || 'en';

    courseId = mongoose.Types.ObjectId(courseId);
    let agg = await JoinCourse.aggregate([
      {
        $match: {course: courseId}
      },
      {
        $group: {_id: '$course', in_come: {$sum: '$course_creator_receive'}}
      }
    ]);

    let in_come = agg.length ? agg[0]['in_come'].toFixed(2) : 0;
    return langCode === 'vi' ? in_come * configs.moneyExchangeRate.vi : in_come;
  } catch (err) {
    console.log('err on getCourseInCome:', err);
    return 0;
  }
}

export async function updateCourseBrokenLesson(courseId, lessonId) {
  try {
    await Courses.update({_id: courseId}, {$set: {status: 2}});
    await LiveStream.update({_id: lessonId}, {$set: {status: 'stopped'}});
    return true
  } catch (err) {
    console.log('err on updateBrokenLesson:', err);
    return false;
  }
}

export function formatListInfo(courses) {
  try {
    return courses.map(course => {
      return {
        _id: course._id,
        title: course.title,
        description: course.description ? course.description.general : '',
        creator: course.creator,
        thumbnail: course.thumbnail,
        code: course.code,
        price: course.price,
        regularPrice: course.regularPrice,
        slug: course.slug,
        start_date: course.start_date,
        next_lesson_date: course.next_lesson_date,
        status: course.status,
        registered: course.registered,
        joined: course.joined,
        waiting_refund: course.waiting_refund,
        currency: course.currency,
        price_text: course.price_text,
        regularPriceText: course.regularPriceText,
        lessonUrl: course.lessonUrl,
        lessonId: course.lessonId,
        lessonTitle: course.lessonTitle,
        isLecture: course.isLecture,
        lectures: course.lectures,
        live: course.live,
        isMembership: course.isMembership,
        type: course.type
      };
    });
  } catch (err) {
    console.log('err on formatListInfo:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getCourseById(courseId, requesterId, langCode) {
  try {
    let course = await Courses.findById(courseId).lean();
    if(!course) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }

    let courses = await getMetaData(course, requesterId, langCode);
    return courses.pop();
  } catch (err) {
    console.log('err on getCourseById:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
export async function checkCourseIsLive(_id) {
 return await LiveStream.count({course: _id, status: 'living'}).lean();
}
export async function getCourse(courseId, courseSlug, requesterId, role, langCode, memberShip = false) {
  try {
    if(!courseId && !courseSlug) {
      return Promise.reject({status: 400, error: 'Please provide id or slug.'});
    }

    let conditions = {};
    if(courseId) {
      conditions._id = courseId;
    } else {
      conditions.slug = courseSlug;
    }

    let course = await Courses.findOne(conditions).lean();
    if(!course) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }

    let isCreator = course.creator.toString() === requesterId.toString();
    if(isCreator && course.status === 1){
      let checkLive = await this.checkCourseIsLive(course._id);
      if(!checkLive){
        await Courses.update(conditions, {$set: {status: 3}});
        course = await Courses.findOne(conditions).lean();
      }
    }
    let allowStatuses = [1, 2, 3, 4, 9];
    if(role === 'admin') {
      Array.prototype.push.apply(allowStatuses, [5, 6, 7, 8]);
    } else if (isCreator) {
      Array.prototype.push.apply(allowStatuses, [5, 6, 7]);
    }

    // if(!isCreator) {
    if(allowStatuses.indexOf(course.status) < 0) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }
    // }

    let resources = await Promise.all([
      getMetaData(course, requesterId, langCode, memberShip),
      getReviewStarSummary(course._id)
    ]);
    let courses = resources[0], statistic = resources[1];
    let data = courses.pop();
    data.statistic = statistic;

    return data;
  } catch (err) {
    console.log('err on getCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getCourseToUpdate(courseId, courseSlug, requesterId, role, langCode) {
  try {
    if(!courseId && !courseSlug) {
      return Promise.reject({status: 400, error: 'Please provide id or slug.'});
    }

    let conditions = {};
    if(courseId) {
      conditions._id = courseId;
    } else {
      conditions.slug = courseSlug;
    }

    let course = await Courses.findOne(conditions).lean();
    if(!course) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }

    let isCreator = course.creator.toString() === requesterId.toString();
    if(isCreator && course.status === 1){
      let checkLive = await this.checkCourseIsLive(course._id)
      if(!checkLive){
        await Courses.update(conditions, {$set: {status: 3}});
        course = await Courses.findOne(conditions).lean();
      }
    }
    let allowStatuses = [1, 2, 3, 4, 9];
    if(role === 'admin') {
      Array.prototype.push.apply(allowStatuses, [5, 6, 7, 8]);
    } else if (isCreator) {
      Array.prototype.push.apply(allowStatuses, [5, 6, 7]);
    }

    // if(!isCreator) {
    if(allowStatuses.indexOf(course.status) < 0) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }
    // }

    let resources = await Promise.all([
      getMetaDataToUpdate(course, requesterId, langCode),
      getReviewStarSummary(course._id)
    ]);
    let courses = resources[0], statistic = resources[1];
    let data = courses.pop();
    data.statistic = statistic;
    return data;
  } catch (err) {
    console.log('err on getCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getCourseBySlug(slug, requesterId, langCode) {
  try {
    let course = await Courses.findOne({slug: slug}).lean();
    if(!course) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }

    let courses = await getMetaData(course, requesterId, langCode);
    return courses.pop();
  } catch (err) {
    console.log('err on getCourseById:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function updateCourse(course, courseOptions, langCode) {
  try {
    let lessonOptions = courseOptions.lessons || [];
    //Get all users of course: buy, used code and password to update for new lesson
    let joinedCourse = await JoinCourse.find({course: course._id}).lean();
    let invited = joinedCourse.map(joinCourse => joinCourse.user.toString());
    let courseCodes = await CourseCode.find({courseId: course._id, userUsedId: {$exists: true, $ne: null}}).lean();
    let invitedCode = courseCodes.map(courseCode => courseCode.userUsedId.toString());
    let coursesPass = await UsedPassword.find({courseId: course._id}).lean();
    let invitedPass = coursesPass.map(coursePass => coursePass.userId.toString());
    invited = invited.concat(invitedCode).concat(invitedPass);
    let lecturess = course.lectures.map(e => e.toString());
    Array.prototype.push.apply(invited, lecturess);

    // if(courseOptions.title) {
    //   course.title = courseOptions.title;
    //   course.slug = await buildSlug(courseOptions.title);
    // }
    console.log('course current: ', course);
    console.log('courseOptions: ', courseOptions)
    course.title = courseOptions.title || course.title;
    course.lectures = courseOptions.lectures || course.lectures;
    course.description = courseOptions.description || course.description;
    course.category = courseOptions.category || course.category;
    course.thumbnail = courseOptions.thumbnail || course.thumbnail;
    course.tags = courseOptions.tags || course.tags;
    course.maxStudents = courseOptions.maxStudents && courseOptions.maxStudents >= joinedCourse.length ? courseOptions.maxStudents : course.maxStudents;
    course.language = courseOptions.language || course.language;
    course.duration = courseOptions.duration || course.duration;
    course.videoEmbed = courseOptions.videoEmbed;
    course.updated_at = new Date();
    course.price = courseOptions.price;
    // if(!joinedCourse.length && courseOptions.price) {
    //   course.price = courseOptions.price;
    // }
    if(!joinedCourse.length && courseOptions.regularPrice) {
      course.regularPrice = courseOptions.regularPrice;
    }
    if(courseOptions.updatePassword){
      course.password = courseOptions.password ? hash(sanitizeHtml(courseOptions.password)) : '';
    }
    course.buyAble = courseOptions.buyAble;
    course.hideCourse = courseOptions.hideCourse;
    if(!courseOptions.step){
      let lessons = await LiveStream.find({course: course._id});

      // detect deleted lessons and remove
      let oldLessonIds = lessons.map(lesson => lesson._id.toString());
      let deletedLessonIds = oldLessonIds.filter(lessonId => {
        return ArrayHelper.findItemByProp(lessonOptions, '_id', lessonId) === false;
      });
      if(deletedLessonIds && deletedLessonIds.length){
        let documents = await DocumentServices.getDocumentsByLessons(deletedLessonIds);
        await DocumentServices.deleteDocuments(documents);
        let videos = await DocumentServices.getVideosByLessons(deletedLessonIds);
        await DocumentServices.deleteVideos(videos);
        await LiveStream.remove({_id: {$in: deletedLessonIds}});
      }
      let newLessons = [], oldLessons = [];
      lessonOptions.map(async (_lessonOption, index)  =>  {
        if(_lessonOption.type !== 'multiple'){
          if(!_lessonOption._id) {
            _lessonOption.course = course._id;
            _lessonOption.index = index;
            _lessonOption.privacy = {
              to: 'custom',
              invited: invited
            };
            newLessons.push(_lessonOption);
          } else {
            _lessonOption.index = index;
            oldLessons.push(_lessonOption);
          }
        } else {
          await MultipleChoice.update(
            {
              _id: _lessonOption._id
            },
            {
              $set: {
                lesson: _lessonOption.lessonCuid || null,
                course: course._id,
                index: index,
                dateModified: Date.now()
              }
            }
          )
        }
      });
      let i, lessonOption;

      let lesson, lessonPromises = [];
      for(let j = 0, max = lessons.length; j < max; j++) {
        lesson = lessons[j];
        i = ArrayHelper.findItemByProp(oldLessons, '_id', lesson._id.toString());
        if(i !== false) {
          lessonOption = oldLessons[i];
          lesson.time.hour = lessonOption.hour || lesson.hour;
          lesson.time.minute = lessonOption.minute || lesson.minute;
          lesson.time.countryCode = lessonOption.countryCode || lesson.countryCode;
          lesson.time.timeZone = lessonOption.timeZone || lesson.timeZone;
          lesson.time.utcOffset = lessonOption.utcOffset || lesson.utcOffset;
          lesson.title = lessonOption.title || lesson.title;
          lesson.index = lessonOption.index || 0;
          lesson.background = lessonOption.background;
          lesson.autoRecord = lessonOption.autoRecord;
          lesson.description = lessonOption.description || lesson.description;
          if(!joinedCourse.length && lessonOption.dateLiveStream) {
            lesson.time.dateLiveStream = mathTime(lessonOption);
          }
          lesson.status = parseInt(lesson.time.dateLiveStream) > Date.now() ? 'new' : lesson.status;
          lesson.type = lessonOption.type !== 'video' && lessonOption.type !== 'test' ? 'schedule' : lessonOption.type;
          if(lessonOption.documentDelete && lessonOption.documentDelete.length) {
            lessonOption.documentDelete = lessonOption.documentDelete.filter(document => StringHelper.isObjectId(document._id));
            let docs = await DocumentServices.getDocumentsByIds(lessonOption.documentDelete);
            await DocumentServices.deleteDocuments(docs);
          }
          if(lessonOption.videoDelete && lessonOption.videoDelete.length) {
            lessonOption.videoDelete = lessonOption.videoDelete.filter(video => StringHelper.isObjectId(video._id));
            let videos = await DocumentServices.getVideosByIds(lessonOption.videoDelete);
            await DocumentServices.deleteVideos(videos);
          }
          if(lessonOption.documents) {
            if(lessonOption.documents.files && lessonOption.documents.files.length) {
              let fileIds = lessonOption.documents.files.map(file => file._id);
              let fileDocuments = await DocumentServices.getDocumentModelsByIds(fileIds);
              let index, file;
              let filePromises = fileDocuments.map(document => {
                index = ArrayHelper.findItemByProp(lessonOption.documents.files, '_id', document._id.toString());
                file = lessonOption.documents.files[index];

                document.title = file.title;
                document.privacy = file.privacy;
                document.lesson = lesson._id;

                return document.save();
              });
              await Promise.all(filePromises);
            }

            if(lessonOption.documents.links && lessonOption.documents.links.length) {
              let oldLinks = [], oldLinkIds = [], newLinks = [];
              lessonOption.documents.links.forEach(link => {
                if(link.address){
                  if(link._id) {
                    oldLinks.push(link);
                    oldLinkIds.push(link._id);
                  }
                  else
                    newLinks.push(link);
                }
              });

              let linkDocuments = await DocumentServices.getDocumentModelsByIds(oldLinkIds);
              let index, link;
              let linkPromises = linkDocuments.map(document => {
                index = ArrayHelper.findItemByProp(oldLinks, '_id', document._id.toString());
                link = oldLinks[index];

                document.title = link.title;
                document.privacy = link.privacy;
                document.address = link.address;

                return document.save();
              });
              let documentOptions = newLinks.map(link => {
                link.user = course.creator;
                link.lesson = lesson._id;
                link.course = lesson.course;

                return link;
              });
              linkPromises.push( DocumentServices.addDocuments(documentOptions) );

              await Promise.all(linkPromises);
            }
          }
          if(lessonOption.videos) {
            if(lessonOption.videos && lessonOption.videos.length) {
              let fileIds = lessonOption.videos.map(file => file._id);
              let fileVideos = await DocumentServices.getVideoModelsByIds(fileIds);
              let index, file;
              if(fileVideos && fileVideos.length){
                let filePromises = fileVideos.map(video => {
                  index = ArrayHelper.findItemByProp(lessonOption.videos, '_id', video._id.toString());
                  file = lessonOption.videos[index];
                  video.title = file.title;
                  video.privacy = file.privacy;
                  video.lesson = lesson._id;
                  return video.save();
                });
                await Promise.all(filePromises);
              }
            }
          }
          // Exercise: 4c5c96669ace06444f2a39ca45d60ab65c70558c
          await removeExerciseToCourse(lesson._id);
          let exercisePromises = lessonOption.exercises.map((exercise, index) => {
            let data = {
              title: exercise.title,
              type: exercise.type,
              exercise: exercise._id,
              course: course._id,
              lesson: lesson._id,
              index: index
            };
            addExerciseToCourse(data);
          });
          await Promise.all(exercisePromises);

          lessonPromises.push( lesson.save() );
        }
      }

      await Promise.all(lessonPromises);

      let options = {
        data: newLessons,
        user: course.creator
      };
      newLessons = await addScheduleStream(options);
      // console.log('newLessons:', newLessons);

      lessons = await LiveStream.find({course: course._id}).sort({'time.dateLiveStream': 1}).lean();
      let type = 'exercise';
      lessons.map(e => {
        if(e.type !== 'video' && e.type !== 'test'){
          type = 'live_stream';
        } else if(e.type === 'video' && type !== 'live_stream'){
          type = 'video'
        }
      });
      if(!lessons || !lessons.length) {
        course.start_date = undefined;
        course.next_lesson_date = undefined;
      } else {
        course.start_date = lessons[0].time.dateLiveStream;
        let check = await LiveStream.find({course: course._id, type: 'schedule', "time.dateLiveStream":{$gt:Date.now()}}).lean();
        let lession_living = await LiveStream.find({course: course._id, status:'living'}).lean();
        let count = check.length;
        if(lession_living.length > 0){
          course.status = 1;
          if(count > 0  && count < lessons.length){
            course.next_lesson_date = check[0].time.dateLiveStream;
          }
          if(count === lessons.length){
            course.next_lesson_date = lessons[0].time.dateLiveStream;
          }
          if(count === 0){
            course.next_lesson_date = 0;
          }
        } else {
          if(count > 0  && count < lessons.length && [1,2,3,4,9].indexOf(course.status) !== -1){
            course.next_lesson_date = check[0].time.dateLiveStream;
            course.status = 2;
          }
          if(count === lessons.length && [1,2,3,4,9].indexOf(course.status) !== -1){
            // course.next_lesson_date = lessons[0].time.dateLiveStream;
            course.status = 3;
          }
          if(count === 0 && [1,2,3,4,9].indexOf(course.status) !== -1){
            // course.next_lesson_date = 0;
            course.status = 4;
          }
        }
      }
      course.type = type;
      await course.save();
    }

    let results = await getMetaData(course, course.creator, langCode);
    return results.pop();
  } catch (err) {
    console.log('err on updateCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function checkTypeCourse(courseId) {
  try{
    let lessons = await LiveStream.find({course: courseId}).lean();
    let type = 'video';
    lessons.map(e => {
      if(e.type !== 'video'){
        type = 'live_stream';
      }
    });
    return type;
  }catch (err) {
    console.log('error checkTypeCourse : ',err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}

export async function requestRefund(userId, courseId, reason) {
  try {
    let joinedCourse = await JoinCourse.findOne({user: userId, course: courseId}).lean();
    if(!joinedCourse) {
      return Promise.reject({status: 400, error: 'You have not joined this course.'});
    }

    let course = await Courses.findById(courseId).lean();

    if(course.status !== 3) {
      return Promise.reject({status: 400, error: 'Course has started.'});
    }

    let fee = 0.1 * joinedCourse.course_price;

    let refundOptions = {
      user: userId,
      object: courseId,
      type: 'course',
      reason: reason,
      value_request: joinedCourse.course_price,
      value_received: joinedCourse.course_price - fee,
      fee: fee
    };

    return await Refund.create(refundOptions);
  } catch (err) {
    if(err.code === 11000) {
      return Promise.reject({status: 400, error: 'You has requested to refund this object.'});
    }
    console.log('err on requestRefund:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function deleteCourse(courseId, requesterId, role) {
  try {
    let course = await Courses.findById(courseId);
    if(!course) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }

    if(role !== globalConstants.role.ADMIN && course.creator.toString() !== requesterId.toString()) {
      return Promise.reject({status: 403, error: 'Permission denied.'});
    }

    let joined = await JoinCourse.count({course: courseId});
    if(!joined) {
      course.status = 8;
      await course.save();
      /**
       * Delete Job Kue
       * */
      let jobs = await KueJob.find({courseId:courseId}).lean();
      if(jobs){
        jobs.map(async e => {
          removeJob(e.jobId,e.type);
        });
        await KueJob.remove({courseId:courseId});
      }
      await Feed.remove({object:courseId});
      /**
       * End
       * */
      return {deleted: true};
    }

    course.status = 7;
    await Promise.all([
      DeleteCourse.create({
        user: requesterId,
        course: courseId
      }),
      course.save()
    ]);
    return {deleted: false};
  } catch (err) {
    console.log('err on deleteCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

/**STATUS_MAPPER
 *
 * @param creatorId
 * @param page
 * @param data
 * @param langCode
 * @param type: [mine, invited]
 * @returns {Promise<{data: *, total_items: *}|Promise>}
 */
export async function getMyCourses(creatorId, page, query, langCode, type) {
  try {
    let skip = (page - 1) * COURSE_LIMIT;

    let allowStatuses = [1, 2, 3, 4, 5, 6, 7, 9];
    if(query.status){
      if(query.status === 'going' ){
        allowStatuses = [1, 2, 3];
      } else if(query.status === 'finish' ){
        allowStatuses = [4];
      }
    }
    let conditions;
    if (type === 'invited') {
      conditions  = {
        creator: { $ne: creatorId },
        lectures: creatorId,
        status: { $in: allowStatuses }
      };
    } else {
      conditions  = {
        creator: creatorId,
        status: { $in: allowStatuses }
      };
    }
    if(query.type_course){
      conditions.type = query.type_course.toString()
    }
    let resources = await Promise.all([
      Courses.count(conditions),
      Courses.find(conditions).sort({status: 1, start_date: 1}).skip(skip).limit(COURSE_LIMIT).lean()
    ]);
    let data = resources[1];
    let total_items = resources[0];
    let courses = []
    if(data && data.length){
     let promises = data.map(async item => {
        let course =  await getMetaData(item, creatorId, langCode);
        return course.pop();
      })
      courses = await Promise.all(promises)
    }
    data = sortCourses(courses);
    data = formatListInfo(data);

    return {total_items, data};
  } catch (err) {
    console.log('getMyCourses: ', err)
    return Promise.reject({status: err.status || 500, error: err.error || 'Internal error.'});
  }
}

export async function getJoinedCourses(page, status, requesterId, langCode) {
  try {
    let skip = (page - 1) * COURSE_LIMIT;
    let actions = await Promise.all([
      JoinCourse.find({user: requesterId}).lean(),
      CourseCode.find({ userUsedId: requesterId}).lean(),
      UsedPassword.find({ userId: requesterId}).lean()
    ]);
    let joinCourses = actions[0],
    courseCode = actions[1],
    usedPassword = actions[2];
    let courseIds = [];
    if(joinCourses){
      let joinC = joinCourses.map(joinCourse => joinCourse.course);
      courseIds = courseIds.concat(joinC)
    }
    if(courseCode){
      let codeC = courseCode.map(course => course.courseId);
      courseIds = courseIds.concat(codeC)
    }
    if(usedPassword){
      let passC = usedPassword.map(course => course.courseId);
      courseIds = courseIds.concat(passC)
    }
    let conditions = {
      _id: {$in: courseIds},
      status: {$in: [1, 2, 3, 4]}
    };
    if(status === 3 || status === 2 || status === 4) {
      conditions.status = status;
    }

    // let resources = await Promise.all([
    //   Courses.count(conditions),
    //   Courses.find(conditions).sort({start_date: 1}).lean()
    // ]);

    let total_items = await Courses.count(conditions);
    if(conditions.status){
      delete conditions.status;
    }
    let data = await queryCourse(conditions, skip, COURSE_LIMIT, [1,2,3,4]);
    let courses = []
    if(data && data.length){
      let promises = data.map(async item => {
        let course =  await getMetaData(item, requesterId, langCode);
        return course.pop();
      })
      courses = await Promise.all(promises)
    }
    data = sortCourses(courses);
    data = formatListInfo(data);
    return {total_items, data};
  } catch (err) {
    console.log('error getJoinedCourse : ',err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

function sortCourses(courses) {
  try {
    let cloned_courses = ArrayHelper.cloneArray(courses);

    cloned_courses = cloned_courses.map(course => {
      course.priority = STATUS_MAPPER[course.status];

      // if(isCourseHaveLivingLesson(course)) {
      //   course.priority = 4;
      // } else {
      //   switch (course.status) {
      //     case 'on_going':
      //       course.priority = 3;
      //       break;
      //     case 'up_coming':
      //       course.priority = 2;
      //       break;
      //     case 'finish':
      //       course.priority = 1;
      //       break;
      //     default:
      //       course.priority = 0;
      //       break;
      //   }
      // }
      return course;
    });

    return ArrayHelper.multiChainSort(cloned_courses, {priority: 'asc', next_lesson_date: 'asc'});
  } catch (err) {
    console.log('err on sortCourses:', err);
    return courses;
  }
}

function isCourseHaveLivingLesson(course) {
  if(!course.lessons || !course.lessons.length) {
    return false;
  }

  for(let i=0, max=course.lessons.length; i < max; i++) {
    if(course.lessons[i].isLive) {
      return true;
    }
  }

  return false;
}

export async function getCourseModelById(courseId) {
  try {
    return await Courses.findById(courseId);
  } catch (err) {
    console.log('err on getCourseModelById:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function adminConsiderCourse(courseId, status, adminId, notes, commission) {
  try {
    commission = Number(commission).valueOf();
    if(isNaN(commission)) {
      commission = configs.course_fee;
    }
    let course = await getCourseModelById(courseId);
    if(course.status !== 5) {
      return Promise.reject({status: 400, error: 'Not waiting course.'});
    }

    if([3, 6].indexOf(parseInt(status)) < 0) {
      return Promise.reject({status: 400, error: 'Invalid status.'});
    }

    course.status = status;
    course.commission = commission;
    /**
     * Send Mail
     * */
    let author = await User.findById(course.creator).lean();
    let authorOption = await UserOption.findOne({userID:author.cuid}).lean();
    if(parseInt(status) === 3){
      let dataSendMailAuthor = {
        type: 'approveCourse',
        language: authorOption && authorOption.language ? authorOption.language : 'en',
        data: {
          course:course,
          url:`${configs.clientHttpsHost}/course/${course.slug}`,
          cuid: author.cuid,
          firstName: author.firstName,
          lastName: author.lastName,
          userName: author.userName,
          email: author.email
        }
      };
      Q.create(globalConstants.jobName.SEND_MAIL, dataSendMailAuthor).removeOnComplete(true).save();
    }else {
      let dataSendMailAuthor = {
        type: 'rejectCourse',
        language: authorOption.language,
        data: {
          notes:notes,
          course:course,
          url:`${configs.clientHttpsHost}/course/${course.slug}`,
          cuid: author.cuid,
          firstName: author.firstName,
          lastName: author.lastName,
          userName: author.userName,
          email: author.email
        }
      };
      Q.create(globalConstants.jobName.SEND_MAIL, dataSendMailAuthor).removeOnComplete(true).save();
    }
    /** End */
    return await Promise.all([
      ConsiderCourse.create({
        admin: adminId,
        course: courseId,
        isApproved: status == 3,
        notes: notes,
        commission
      }),
      course.save()
    ]);
  } catch (err) {
    console.log('err on adminConsiderCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
export async function checkBuyAble(userId, courseId, langCode, code) {
  try {
    let resources = await Promise.all([
      User.findById(userId, 'balance').lean(),
      Courses.findById(courseId, 'price').lean(),
    ]);

    let user = resources[0], course = resources[1];
    if(!course) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }if(!user) {
      return Promise.reject({status: 404, error: 'User not found.'});
    }
    let rate = configs.moneyExchangeRate[langCode] ? configs.moneyExchangeRate[langCode] : 1;
    let currency = configs.currency[langCode] ? configs.currency[langCode] : 'USD';
    let balance = user.balance * rate;
    let data = {};
    let course_price = course.price;
    // If user use code coupon
    if (code){
      data = await checkCoupon(userId,course, 1, course.price, 'course', langCode, code);
      if (data.success){
        course_price = data.price_discount;
        data.apply_code = true;
        data.price_discount = data.price_discount * rate;
      } else {
        data.apply_code = false;
      }
      delete data.success;
    }
    // end
    let buyAble = user.balance >= course_price;

    let dataCourse = {
      price: course.price * rate,
      balance: balance,
      buyAble: buyAble,
      currency: currency
    };
    if(!buyAble) {
      dataCourse.missing = langCode === 'vi' ? await NumberHandle.numberRound((course_price - user.balance) * rate, 1000) : (course_price - user.balance) * rate;
      if(currency == 'USD' && dataCourse.missing < 0.5){
        dataCourse.missing = 0.5
      }
      if(currency == 'VND' && data.missing < 10000){
        dataCourse.missing = 10000
      }
    }
    Object.assign(data, dataCourse);
    return data;
  } catch (err) {
    console.log('err on checkBuyAble:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function adminApproveDeleteCourse(adminId, courseId, notes) {
  try {
    let resources = await Promise.all([
      getCourseModelById(courseId),
      DeleteCourse.findOne({course: courseId, status: 'waiting'})
    ]);
    let course = resources[0], deleteRequest = resources[1];

    if(!course) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }

    if(!deleteRequest) {
      return Promise.reject({status: 400, error: 'This course has not been requested to delete.'});
    }

    course.status = 8;
    deleteRequest.status = 'approved';
    deleteRequest.approved_at = new Date();
    deleteRequest.notes = notes;
    deleteRequest.admin = adminId;

    /**
     * Delete Job Kue
     * */
    let jobs = await KueJob.find({courseId:courseId}).lean();
    if(jobs){
      jobs.map(async e => {
        removeJob(e.jobId,e.type);
      });
      await KueJob.remove({courseId:courseId});
    }
    /**
     * End
     * */

    return Promise.all([
      course.save(),
      deleteRequest.save(),
      Feed.remove({object:courseId})
    ]);
  } catch (err) {
    console.log('err on adminApproveDeleteCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function checkCanStartLesson(lessonId) {
  try {
    let lesson = await LiveStream.findById(lessonId, 'course').lean();
    if(lesson && lesson.course) {
      let course = await Courses.findById(lesson.course, 'status').lean();
      if(course.status !== 1) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.log('err on checkCanStartLesson:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function checkBoughtCourse(userId, courseId) {
  try {
    if(!userId) {
      return false;
    }
    let course = await Courses.findById(courseId).lean();
    if(!course) {
      return Promise.reject({status: 404, error: 'Course not found.'});
    }

    let joined = await JoinCourse.findOne({user: userId, course: courseId}).lean();

    return !!joined;
  } catch (err) {
    console.log('err on checkBoughtCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

const STUDENT_LIMIT = 20;
export async function getCourseStudents(courseId, page, langCode) {
  try {
    let skip = (page - 1) * STUDENT_LIMIT;
    let resources = await Promise.all([
      JoinCourse.count({course: courseId}),
      JoinCourse.find({course: courseId}).skip(skip).limit(STUDENT_LIMIT).lean()
    ]);
    let total_items = resources[0], joined = JSON.parse(JSON.stringify(resources[1]));
    let userIds = joined.map(join => join.user);
    let users = await User.formatBasicInfo(User, userIds);
    let in_come = await getCourseInCome(courseId, langCode);

    let joinCourseMapper = ArrayHelper.toObjectByKey(users, '_id');

    joined = joined.map(join => {
      join.user = joinCourseMapper[join.user];
      join.course_creator_receive = join.course_creator_receive.toFixed(2)
      return join;
    });
    return {
      success: true,
      in_come,
      total_items,
      current_page: page,
      last_page: Math.ceil(total_items / STUDENT_LIMIT),
      data: joined
    }
  } catch (err) {
    console.log('err on getCourseStudents:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getAuthorCourseStudents(courseId) {
  try {
    let joined = await  JoinCourse.find({course: courseId}).lean()
    let userIds = joined.map(join => join.user);
    let users = await User.formatBasicInfo(User, userIds, 'fullName email telephone');
    let joinCourseMapper = ArrayHelper.toObjectByKey(users, '_id');

    joined = joined.map(join => {
      join.user = joinCourseMapper[join.user];
      return join;
    });


    let joinedCode = await  CourseCode.find({courseId: courseId, userUsedId:{$exists: true, $ne: null} }).lean()
    userIds = joinedCode.map(join => join.userUsedId);
    users = await User.formatBasicInfo(User, userIds, 'fullName email telephone');
    let joinCourseCodeMapper = ArrayHelper.toObjectByKey(users, '_id');

    joinedCode = joinedCode.map(join => {
      join.user = joinCourseCodeMapper[join.userUsedId];
      return join;
    });
    return {
      success: true,
      joined: joined,
      joinedCode: joinedCode,

    }
  } catch (err) {
    console.log('err on getCourseStudents:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

const COURSE_CODE_LIMIT = 10;
export async function getCourseCode(courseId, page, role) {
  try {
    let skip = (page - 1) * COURSE_CODE_LIMIT;
    let resources = '';
    if(role === 'user'){
      resources = await Promise.all([
        CourseCode.count({courseId: courseId}),
        CourseCode.find({courseId: courseId}).skip(skip).limit(COURSE_CODE_LIMIT).lean()
      ]);
    }
    if(role === 'admin'){
      resources = await Promise.all([
        CourseCode.count({courseId: courseId}),
        CourseCode.find({courseId: courseId}).sort({usedDate: 1}).lean()
      ]);
    }
    let total_items = resources[0], codes = JSON.parse(JSON.stringify(resources[1]));
    let userIds = codes.map(join => join.userUsedId);

    let users = await User.formatBasicInfo(User, userIds);

    let codeCourseMapper = ArrayHelper.toObjectByKey(users, '_id');

    codes = codes.map( code => {
      if ( codeCourseMapper[code.userUsedId] ) {
        code.user = codeCourseMapper[code.userUsedId];
      }
      // Remove unused fields
      delete code._id;
      delete code.userUsedId;
      delete code.__v;
      return code;
    });
    return {
      success: true,
      total_items,
      current_page: page,
      last_page: Math.ceil(total_items / COURSE_CODE_LIMIT),
      data: codes
    }
  } catch (err) {
    console.log('err on getCourseCode:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function formatCourseToReview(courseId) {
  try {
    let course = await Courses.findById(courseId).lean();
    course = (await getMetaData(course)).pop();

    return {
      _id: course._id,
      title: course.title,
      creator: course.creator,
      thumbnail: course.thumbnail,
    }
  } catch (err) {
    console.log('err on formatCourseToReview:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function PushNotificationCourse(courseId,status) {
  try{
    /**
     * Notification
     * */
    let course = await Courses.findById(courseId).lean();
    let author = await User.findById(course.creator).lean();
    if (parseInt(status)===3){

      let notifications = {
        type:"followCourses",
        from:author._id,
        object:course._id,
        data:{
          url: `course/${course.slug}`
        }
      };
      let notificationsInvite = {
        type:"InviteCourses",
        from:author._id,
        object:course._id,
        data:{
          url: `course/${course.slug}`
        }
      };
      let notificationsAuthor = {
        type:"AuthorCourses",
        object:course._id,
        data:{
          url: `course/${course.slug}`
        }
      };
      let lectures = course.lectures;
      lectures = await lectures.map(e =>{return e.toString()});
      let users = [];
      await Promise.all(lectures.map(async e => {
        let follow = await Follow.find({to:e},'from');
        follow.map(e => {
          if(e && users.indexOf(e.from.toString())===-1 && lectures.indexOf(e.from.toString())){
            users.push(e.from.toString());
          }
        });
      }));
      // notification author
      let options = Object.assign({to:author._id},notificationsAuthor);
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, options);
      // notification lectures
      lectures.map(async e =>{
        let owner = await User.findById(e).lean();
        if(owner && e.toString() !== course.creator.toString()){
          let opt = Object.assign({to:owner._id},notificationsInvite);
          AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, opt);
        }
      });
      // notification follow
      users.map(async e => {
        let owner = await User.findById(e).lean();
        if(owner && lectures.indexOf(e.toString()) === -1){
          let opt = Object.assign({to:owner._id},notifications);
          AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, opt);
        }
      });
    }else {
      let notificationsAuthor = {
        type:"RejectCourse",
        object:course._id,
        data:{
          url: `course/${course.slug}`
        }
      };
      let options = Object.assign({to:author._id},notificationsAuthor);
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, options);
    }
    /**
     * End
     * */
  }catch (err){
    return Promise.reject({status:500,err:'Push notification courses!'});
  }
}

export async function buildElasticDoc(course) {
  try{
    let search_test = `${course.title} ${course.description.general}`;
    return {
      status: course.status,
      id: course._id.toString(),
      search_text: search_test
    };
  }catch (err){
    console.log('err buildElasticDoc : ',err);
    return Promise.reject({status:500,err:'err buildElasticDoc !!'});
  }
}
export async function reportCourseStudent(course, user) {
  try {
    let courseInfo = await Courses.findById(course).lean()
    if(!courseInfo){
      return Promise.reject({status: 404, error: 'Course not found'});
    }
    let lessons = await LiveStream.find({course: course}).lean()
    let total = {
      exercises: 0,
      joined: 0
    }
    if(lessons){
      let promises = lessons.map( async lesson => {
        let exercises = await getExercisesByLesson(lesson._id)
        total.exercises += exercises.length
        lesson.timeView = await getTotalTimeViewStream(lesson._id.toString(), user.toString())
        if(exercises){
          let promisesEx = exercises.map( async exercise => {
            let report = await getReportCourseByUser({
              exercise: exercise.exercise,
              user: user,
              lesson: lesson._id,
              type: exercise.type
            })
            if(report){
              total.joined++
            }
            exercise.report = report
            return exercise
          })
          await Promise.all(promisesEx)
        }
        lesson.exercises = exercises
        return lesson
      })
      await Promise.all(promises)
      return {lessons, total}
    }
  }catch (err){
    console.log('err reportCourseStudent : ',err);
    return Promise.reject({status:500,err:'err buildElasticDoc !!'});
  }
}

export async function sortByTimeLession(array) {
  try {
    let living = [],
      on_going = [],
      up_coming = [],
      finish = [],
      waiting = [],
      rejected = [],
      waiting_delete = [],
      deleted = [],
      expired = [],
      videoCourse = array.filter(e => e.type === 'video');
    array.map(e => {
      switch (e.status) {
        case 'living':
          living.push(e);
          break;
        case 'on_going':
        case 'up_coming':
            on_going.push(e);
          break;
        // case 'up_coming':
        //   up_coming.push(e);
        //   break;
        case 'finish':
          finish.push(e);
          break;
        case 'waiting':
          waiting.push(e);
          break;
        case 'rejected':
          rejected.push(e);
          break;
        case 'waiting_delete':
          waiting_delete.push(e);
          break;
        case 'deleted':
          deleted.push(e);
          break;
        case 'expired':
          expired.push(e);
          break;
      }
    });
    living = living.filter(e => e.type !== 'video');
    living = ArrayHelper.sortByProp(living, 'next_lesson_date', 'asc');
    on_going = on_going.filter(e => e.type !== 'video');
    on_going = ArrayHelper.sortByProp(on_going, 'next_lesson_date', 'asc');
    // up_coming = ArrayHelper.sortByProp(up_coming,'next_lesson_date','asc');
    finish = finish.filter(e => e.type !== 'video');
    let promise = finish.map(async course => {
      let lesson_last = await LiveStream.find({course: course._id}).sort({"time.dateLiveStream": -1}).limit(1).lean();
      if(lesson_last.length){
        lesson_last = lesson_last[0];
        course.time_end = parseInt(lesson_last.time.dateLiveStream);
      } else {
        course.time_end = 0;
      }
      return course;
    });
    finish = await Promise.all(promise);
    finish = ArrayHelper.sortByProp(finish, 'time_end', 'desc');
    waiting = waiting.filter(e => e.type !== 'video');
    waiting = ArrayHelper.sortByProp(waiting, 'next_lesson_date', 'asc');
    rejected = ArrayHelper.sortByProp(rejected, 'next_lesson_date', 'asc');
    waiting_delete = ArrayHelper.sortByProp(waiting_delete, 'next_lesson_date', 'asc');
    deleted = ArrayHelper.sortByProp(deleted, 'next_lesson_date', 'asc');
    expired = ArrayHelper.sortByProp(expired, 'next_lesson_date', 'asc');
    videoCourse = ArrayHelper.sortByProp(videoCourse, 'created_at', 'asc');
    return living.concat(on_going).concat(videoCourse).concat(finish).concat(waiting).concat(rejected).concat(waiting_delete).concat(deleted).concat(expired);
  } catch (err) {
    console.log('err sortByTimeLession : ', err);
    return array;
  }
}

export async function addNoteCourse(options) {
  try {
    let data = await SupportCourse.create(options);
    data = JSON.parse(JSON.stringify(data));
    data = await getDataMetaSupportCourse([data]);
    return data[0];
  } catch (err) {
    console.log('error addNoteCourse : ', err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}

export async function getNoteByUser(options) {
  try {
    let note = await SupportCourse.find({user: options.user, course: options.course}).sort({time: 1}).lean();
    note = await getDataMetaSupportCourse(note);
    return note;
  } catch (err) {
    console.log('error getNoteByUser : ', err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}

export async function getDataMetaSupportCourse(data) {
  try{
    let promise = data.map(async e => {
      e.creator = await User.findById(e.creator, '_id fullName');
      return e;
    });
    return await Promise.all(promise);
  }catch (err) {
    console.log('error getDataMetaSupportCourse : ', err);
    throw {status: 500, success: false, error: 'Internal Server Error.'}
  }
}

export async function editUserToCourse(options) {
  try {
    let check_course = await Courses.findById(options.course);
    if(!check_course){
      return Promise.reject({status:400, success: false, error: 'Course not found.'})
    }
    let check_user = await UserToCourse.findOne({user: options.user, course: options.course});
    if(!check_user){
      return Promise.reject({status:400, success: false, error: 'User has not joined the course.'})
    }
    check_user.nextDateSupport = options.nextDateSupport || check_user.nextDateSupport;
    check_user.result = options.result || check_user.result;
    check_user.step = options.step || check_user.step;
    check_user.evaluater = options.evaluater;
    await check_user.save();
    return check_user;
  } catch (err) {
    console.log('error editUserToCourse : ',err);
    return Promise.reject({status:500, success: false, error: 'Internal Server Error.'})
  }
}

export async function editUserViewToCourse(options) {
  try {
    let check_course = await Courses.findById(options.courseId);
    if(!check_course){
      return Promise.reject({status:400, success: false, error: 'Course not found.'})
    }
    let check_user = await UserToCourse.findOne({user: options.userId, course: options.courseId});
    if(!check_user){
      return Promise.reject({status:400, success: false, error: 'User has not joined the course.'})
    }
    let data = await adminEvaluateLesson.create(options);
    data = JSON.parse(JSON.stringify(data));
    data.evaluater = await User.findById(data.evaluater, '_id fullName').lean();
    return data;
  } catch (err) {
    console.log('error editUserViewToCourse : ',err);
    return Promise.reject({status:500, success: false, error: 'Internal Server Error.'})
  }
}

export async function getReviewLessons(courseId, userId) {
  try {
    let check_course = await Courses.findById(courseId);
    if(!check_course){
      return Promise.reject({status:400, success: false, error: 'Course not found.'})
    }
    let lessons = await LiveStream.find({course: courseId}, '_id').lean();
    let obj = {};
    let promise = lessons.map(async e => {
      let data = await adminEvaluateLesson.find({courseId: courseId, userId: userId, streamId: e._id}).sort({createdAt: 1}).lean();
      let promise_data = data.map(async lesson => {
        lesson.evaluater = await User.findById(lesson.evaluater, '_id fullName').lean();
        return lesson;
      });
      obj[e._id] = await Promise.all(promise_data);
    });
    await Promise.all(promise);
    return obj;
  } catch (err) {
    console.log('error getReviewLessons : ',err);
    return Promise.reject({status:500, success: false, error: 'Internal Server Error.'})
  }
}

export async function editCodeCourse(options) {
  try{
    let check = await CourseCode.findOne({code: options.code, courseId: options.courseId});
    if(!check){
      return Promise.reject({status: 400, success: false, error: 'Code not found.'})
    }
    check.info_contact = options.info_contact || check.info_contact;
    check.code = options.code || check.code;
    await check.save();
    if(check.user){
      check.user = await User.formatBasicInfoById(User, check.user);
    }
    return check;
  }catch (err) {
    console.log('error editCodeCourse : ',err);
    return Promise.reject({status:500, success: false, error: 'Internal Server Error.'})
  }
}

export async function sendSMSToUser(options) {
  try{
    let listPhone = [];
    if(options.phones){
      listPhone = options.phones;
    }
    if(options.users && options.users.length){
      let users = await User.find({_id:{$in: options.users}, telephone: {$nin: listPhone}}).lean();
      users.map(e => {
        if(e.telephone){
          listPhone.push(e.telephone);
        }
      })
    }
    await sendSMS(listPhone, options.content);
    return true
  }catch (err) {
    console.log('error sendSMSToUser : ',err);
    return Promise.reject({status:500, success: false, error: 'Internal Server Error.'})
  }
}

export async function clearUserToCourse(user, course) {
  try {
    await JoinCourse.remove({user, course});
    await CourseCode.remove({userUsedId: user, courseId: course});
    await UsedPassword.remove({userId: user, courseId: course});
    Q.create(globalConstants.jobName.AFTER_REMOVE_COURSE_CODE, {
      course,
      user
    }).removeOnComplete(true).save();
    Q.create(globalConstants.jobName.AFTER_SAVE_OR_REMOVE_USER_TO_COURSE, {
      course,
      user
    }).removeOnComplete(true).save();
  }catch (err) {
    console.log('error clearUserToCourse : ',err);
    return Promise.reject({status:500, success: false, error: 'Internal Server Error.'})
  }
}

export async function trackingVideoCourse(options) {
  try {
    return await UserViewStreamTracking.create(options);
  } catch (err) {
    console.log('error trackingVideoCourse : ',err);
    return Promise.reject({status:500, success: false, error: 'Internal Server Error.'})
  }
}

export async function getGeneralCourse(options) {
  try {
    let conditions = {};
    if(options.text){
      conditions.title = { $regex: options.text.trim(), $options: "$i" };
    }
    if(options.status){
      conditions.status = options.status
    }
    let courses = await Courses.find(conditions, "_id title status lectures").sort({status: 1}).limit(options.limit).skip(options.skip).lean();
    let count = await Courses.count(conditions);
    let promise = courses.map(async e => {
      let userInCourse = await UserToCourse.find({course: e._id}).lean();
      userInCourse = userInCourse.map(elm => elm.user);
      e.total_user = userInCourse.length;
      e.total_out_date = await User.count({_id:{$in:userInCourse}, memberShip: {$lt: Date.now()}});
      e.total_lesson = await LiveStream.count({course: e._id});
      e.total_lived = await LiveStream.count({course: e._id, 'time.dateLiveStream' : {$lt: Date.now()}});
      let promise_lecture = e.lectures.map(async lecture => {
        let user = await User.findById(lecture, '_id fullName telephone email').lean();
        return user;
      });
      e.lectures = await Promise.all(promise_lecture);
      e.miss_lesson = 0;
      if([1,2].indexOf(e.status) !== -1){
        let total_lived = await LiveStream.find({course: e._id, 'time.dateLiveStream' : {$lt: Date.now()}}).sort({'time.dateLiveStream' : -1}).limit(3).lean();
        let length = total_lived.length;
        if(length && e.total_user > 0){
          let liveStreams = total_lived.map(live => live._id);
          let time_last = new Date(parseInt(total_lived[length - 1].time.dateLiveStream));
          let user = await UserToCourse.find({course: e._id, createdAt: {$lt: time_last}}).lean();
          user = user.map(use => use.user);
          e.miss_lesson = user.length;
          let check = await UserViewStreamTracking.aggregate([
            {
              $match: {
                streamId: {
                  $in: liveStreams
                },
                userId: {
                  $in: user
                },
                courseId: e._id
              }
            },
            {
              $group: {
                _id: "$userId",
                total: {
                  $sum: 1
                }
              }
            }
          ]);
          if(check.length){
            e.miss_lesson = user.length - check.length;
          }
        }
      }
      switch (e.status) {
        case 1:
          e.status = 'living';
          break;
        case 2:
          e.status = 'on_going';
          break;
        case 3:
          e.status = 'up_coming';
          break;
        case 4:
          e.status = 'finish';
          break;
        case 5:
          e.status = 'waiting';
          break;
        case 6:
          e.status = 'rejected';
          break;
        case 7:
          e.status = 'waiting_delete';
          break;
        case 8:
          e.status = 'deleted';
          break;
        case 9:
          e.status = 'expired';
          break;
      }
      return e;
    });
    let data = await Promise.all(promise);
    return [count, data]
  } catch (err) {
    console.log('error getGeneralCourse : ',err);
    return Promise.reject({status:500, success: false, error: 'Internal Server Error.'})
  }
}

export async function queryCourse(conditions, skip, limit, status) {
  try {
    let min = skip, max = skip + limit;
    let prior = 0, video = 0, adminView = 0;
    let status_prior = [], status_video = [], status_admin = [];
    if(Array.isArray(status)) {
      status.map(e => {
        switch (true) {
          case array_prior_status.indexOf(e) !== -1 :
            status_prior.push(e);
            break;
          case array_admin_status.indexOf(e) !== -1 :
            status_admin.push(e);
            break;
          default:
            status_video.push(e);
            break;
        }
      });
      let conditions_prior = Object.assign({}, conditions), conditions_video = Object.assign({}, conditions), conditions_admin = Object.assign({}, conditions);
      if(status_prior.length) {
        conditions_prior.status = {
          $in: status_prior
        };
        prior = await Courses.count(conditions_prior);
      }
      if(status_video.length) {
        // console.log('asdasd : ', conditions_video);
        conditions_video.status = 4;
        // console.log(conditions_video);
        video = await Courses.count(conditions_video);
        // console.log('Total prior : ', video);
      }
      if(status_admin.length) {
        conditions_admin.status = {
          $in: status_video
        };
        adminView = await Courses.count(conditions_admin);
      }
      let total = prior + video + adminView;
      // console.log(total);
      let result = [];
      if(total > min){
        total = total - min > limit ? limit :  total - min;
        if(prior > min) {
          let sort = {
            status: 1,
            next_lesson_date: 1
          };
          console.log(prior, min, max, total, skip, sort)
          let data = await getCourseByConditions(conditions_prior, prior, min, max, total, skip, sort);
          // console.log('Data  prior : ', data.data.length, total);
          if(data && data.sl === total){
            return data.data;
          } else {
            result = data.data;
            total = total - data.sl;
            sort = {
              type: - 1,
              next_lesson_date: -1
            };
            data = await getCourseByConditions(conditions_video, prior + video, min, max, total, 0, sort);
            // console.log('Data video : ', data.data.length, total);
            if(data && data.sl === total){
              // console.log('Result : ',result);
              return result.concat(data.data);
            } else {
              result = result.concat(data.data);
              total = total - data.sl;
              sort = {
                status: 1,
                next_lesson_date: 1
              };
              data = await getCourseByConditions(conditions_admin, prior + video + adminView, min, max, total, 0, sort);
              return result.concat(data.data);
            }
          }
        } else if (prior + video > min) {
          let sort = {
            type: -1,
            next_lesson_date: -1
          };
          let drop = min - prior;
          let data = await getCourseByConditions(conditions_video, prior + video, min, max, total, drop, sort);
          if(data && data.sl === total){
            return data.data;
          } else {
            result = result.concat(data.data);
            total = total - data.sl;
            sort = {
              status: 1,
              next_lesson_date: 1
            };
            data = await getCourseByConditions(conditions_admin, prior + video + adminView, min, max, total, 0, sort);
            return result.concat(data.data);
          }
        } else {
          let drop = min - prior - video;
          return await Courses.find(conditions_admin).sort({status: 1, next_lesson_date: -1}).skip(drop).limit(limit).lean();
        }
      } else {
        return []
      }
      /**
       * End
       * */
    } else {
      conditions.status = status;
      let sort = status === 4 ? {type: 1, next_lesson_date: -1} : {type: 1, next_lesson_date: 1};
      return await Courses.find(conditions).sort(sort).skip(skip).limit(limit).lean();
    }
  } catch (err) {
    console.log('error queryCourse : ',err);
    throw {
      status:500,
      success: false,
      error: 'Internal Server Error.'
    }
  }
}

export async function getCourseByConditions(conditions, quantity, min, max, limit, skip, sort) {
  try {
    if(quantity >= max) {
      let data = await Courses.find(conditions).sort(sort).skip(skip).limit(limit).lean();
      return {
        sl: limit,
        data
      }
    }
    if (quantity < max) {
      if (quantity > min) {
        let data = await Courses.find(conditions).sort(sort).skip(skip).limit(quantity - min).lean();
        return {
          sl: data.length,
          data
        }
      } else {
        let data = await Courses.find(conditions).sort(sort).skip(skip).limit(min).lean();
        return {
          sl: data.length,
          data
        }
      }
      
    }
    return {
      sl: 0,
      data: []
    }
  } catch (err) {
    console.log('error getCourseByConditions : ', err);
    throw {
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    }
  }
}

export async function getCodeCourse() {
  try {
    let course = await Courses.find({code:{$ne: null}}).sort({code: -1}).limit(1).lean();
    return course.length ? course[0].code : 0;
  }catch (err) {
    throw {
      success: false,
      status: 500,
      error: 'Internal Server Error.'
    }
  }
}
/**
 * generateLessonLive
 * @param {object} options
 * @param {string} options.courseId Course ID
 * @param {string} options.user User Create
 * @param {array} options.dayInWeek Day In Week
 * @param {number} options.totalLesson Total Lesson
 * @param {number} options.hour Hour
 * @param {number} options.minute Minute
 * @param {number} options.dateStart Date Start
 * @param {string} options.password Password
 * @param {boolean} options.classRoom Class Room
 * @param {object} options.thumbnail Thumbnail
 * @param {string} options.thumbnailSize thumbnail size
 * @param {number} options.index Index
 * @param {array} options.privacy Privacy
 * @param {number} options.utcOffset utcOffset
 * @param {timeZone} options.timeZone timeZone
 * @param {countryCode} options.countryCode countryCode
 * @param {string} options.destination destination
 * */
export async function generateLessonLive(options, langCode) {
  try {
    let first_week = [];
    let course = await Courses.findById(options.courseId);
    if (!course) {
      return Promise.reject({success: false, status: 404, error: 'Course not found.'});
    }
    if(options.user.toString() !== course.creator.toString()) {
      return Promise.reject({success: false, status: 401, error: 'Permission denied.'});
    }
    let dayInWeek = options.dayInWeek.sort();
    let totalDayInWeek = dayInWeek.length;
    if (totalDayInWeek === 0) {
      return Promise.reject({success: false, status: 400, error: 'Please set day in week'})
    }
    if (options.hour > 24 || options.hour < 0) {
      return Promise.reject({success: false, status: 400, error: 'Hour in from 0 to 23'})
    }
    if (options.minute > 60 || options.minute < 0) {
      return Promise.reject({success: false, status: 400, error: 'Minute in from 0 to 59'})
    }
    let date_start = new Date(options.dateStart).getTime() + options.hour * 60 * 60 * 1000 + options.minute * 60 * 1000;
    if (date_start < Date.now()) {
      return Promise.reject({success: false, status: 400, error: 'Invalid Date Start'});
    }
    let day_start;
    for ( let i = 0; i <  7; i++ ) {
      let next_day = date_start + (i * 24 * 60 * 60 * 1000);
      let day = new Date(next_day).getDay();
      if (!day_start && dayInWeek.indexOf(day) !== -1) {
        day_start = {
          index: dayInWeek.indexOf(day)
        }
      }
      first_week[day] = next_day;
    }
    let result = [];
    for (let i = 0; i < options.totalLesson; i++) {
      let index = (i + day_start.index)%totalDayInWeek;
      let dayWeek = dayInWeek[index];
      let timeLive = first_week[dayWeek];
      first_week[dayWeek] = first_week[dayWeek] + 7 * 24 * 60 * 60 * 1000;
      let schedule = {
        cuid: cuid(),
        user: options.user,
        content: '',
        title: langCode === 'vi' ? `Buổi ${i+1}` : `Lesson ${i+1}`,
        slug: `${course.slug}-lesson-${i+1}`,
        description: '',
        course: options.courseId,
        // isLive: false,
        classRoom: options.classRoom,
        password:  options.password ? hash(sanitizeHtml(options.password)) : '',
        type: 'schedule',
        index: options.index,
        time: {
          dateCreate: Date.now(),
          dateLiveStream: timeLive,
          date: timeLive - (options.hour * 60 * 60 * 1000 + options.minute * 60 * 1000),
          hour: options.hour,
          minute: options.minute,
          utcOffset: options.utcOffset,
          timeZone: options.timeZone,
          countryCode: options.countryCode,
          timer: timeLive
        }
      };
      // if(options.thumbnail && options.destination) {
      //   schedule.thumbnail = `${options.destination}/${options.thumbnail[i].filename}`;
      //   schedule.thumbnailMeta = `${options.destination}/${options.thumbnail[i].filename}`;
      //   schedule.thumbnailSize = options.thumbnailSize;
      // }
      if (options.privacy) {
        schedule.privacy = options.privacy;
      }
      let rs = await LiveStream.create(schedule);
      AMPQ.sendDataToQueue(globalConstants.jobName.CREATE_ELASTICSEARCH_WEBINAR, rs);
      result.push(rs);
    }
    if (result.length) {
      course.type = 'live_stream';
      course.start_date = result[0].time.dateLiveStream - (options.hour * 60 * 60 * 1000 + options.minute * 60 * 1000);
      course.next_lesson_date = result[0].time.dateLiveStream;
      course.status = 3;
      await course.save();
    }
    return await getMetaData(course, options.user, langCode);
  } catch (error) {
    console.log('error generateLesson : ',error);
    return Promise.reject({status:500, success: false, error: 'Internal Server Error.'})
  }
}

export async function cloneCourse(options) {
  try {
    let course = await Courses.findById(options.id).lean();
    if (!course) {
      return Promise.reject({success: false, status: 404, error:'Course not found.'});
    }
    if (course.creator.toString() !== options.user.toString()) {
      return Promise.reject({success: false, status: 403, error:'Forbidden'});
    }
    let course_new = await Courses.create({
      title: course.title,
      slug: await buildSlug(course.title),
      lectures: course.lectures,
      creator: options.user,
      description: course.description,
      category: course.category,
      thumbnail: course.thumbnail,
      videoEmbed: course.videoEmbed,
      tags: course.tags || [],
      maxStudents: course.maxStudents,
      language: course.language,
      duration: course.duration, // minutes
      status: 3,
      price: course.price, // $
      start_date: course.start_date,
      next_lesson_date: course.next_lesson_date
    });
    let lessons = await LiveStream.find({course: course._id}).lean();
    let promise = lessons.map(async e => {
      let lesson = await LiveStream.create({
        cuid: cuid(),
        user: e.user,
        title: e.title,
        slug: buildLessonSlug(e.title),
        description: e.description,
        password: e.password || '',
        thumbnail: e.thumbnail,
        thumbnailMeta: e.thumbnailMeta,
        thumbnailSize: e.thumbnailSize,
        course: course_new._id,
        index: e.index,
        streamFiles: e.streamFiles,
        booked: e.booked,
        sourceType: e.sourceType,
        time: e.time,
        type: e.type,
        language: e.language,
        privacy: {
          to: e.privacy.to,
          invited: []
        },
        totalPoints: 0,
        totalViewed: 0,
        like: 0,
        classRoom: e.classRoom,
        platform: e.platform,
        status: 'stopped',
        isLive: false
      });
      let document = await Promise.all([
        await Document.find({lesson: e._id}).lean(),
        await Video.find({lesson: e._id}).lean(),
        await ExerciseToCourse.find({lesson: e._id}).lean()
      ]);
      let documents = document[0];
      let video = document[1];
      let exercise = document[2];
      if (documents.length) {
        let document_create = documents.map(async docs => {
          let options = Object.assign({}, docs);
          delete options._id;
          delete options.__v;
          options.lesson = lesson._id;
          options.course = course_new._id;
          options.documentOld = docs._id;
          await Document.create(options);
        });
        await Promise.all(document_create);
      }
      if (video.length) {
        let video_create = video.map(async vid => {
          let options = Object.assign({}, vid);
          delete options._id;
          delete options.__v;
          options.videoOld = vid._id;
          options.lesson = lesson._id;
          options.course = course_new._id;
          await Video.create(options)
        });
        await Promise.all(video_create);
      }
      if (exercise.length) {
        let exercise_create = exercise.map(async exer => {
          let options = Object.assign({}, exer);
          delete options._id;
          delete options.__v;
          options.videoOld = exer._id;
          options.lesson = lesson._id;
          options.course = course_new._id;
          await ExerciseToCourse.create(options);
        });
        await Promise.all(exercise_create);
      }
    });
    await Promise.all(promise);
    return course_new;
  } catch (error) {
    console.log('error on cloneCourse:', error);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
