import ReportStudent from '../models/manage_supporter';
import CourseCode from '../models/courseCode';
import User from '../models/user';
import UserToCourse from '../models/userToCourse';
import LiveStream from '../models/liveStream';
import {formatListInfo, getMetaData, getMetaDataHome, sortByTimeLession} from "./course.services";
import Course from '../models/courses'
import UserViewStreamTracking from "../models/userViewStreamTracking";
import ArrayHelper from '../util/ArrayHelper'
import AdminNoteUser from '../models/adminNoteUser'



export async function getReportStudent(options) {
  try {
    let conditions = {
      memberShip: {
        $exists: true
      },
      active: 1
    };
    let listUser = [];
    if(options.status){
      switch (options.status) {
        case 1:
          conditions.memberShip = {
            $exists: true,
            $gt: Date.now()
          };
          break;
        case 2:
          conditions.memberShip = {
            $exists: true,
            $lt: Date.now()
          };
          break;
        default:
          break;
      }
    }
    if (options.support) {
      let user_step = await ReportStudent.find({step: options.support}).lean();
      user_step = user_step.map(e => e.user);
      listUser = listUser.concat(user_step);
    }
    if (options.text) {
      let code = await CourseCode.find({
        code: { $regex: options.text.trim(), $options: "$i" },
        userUsedId: {
          $exists: true
        }
      }).lean();
      if(code.length){
        code = code.map(e => e.userUsedId);
        listUser = listUser.concat(code);
      }
      let search_user = await User.find({
        $or: [
          {
            fullName: { $regex: options.text.trim(), $options: "$i" }
          },
          {
            telephone: { $regex: options.text.trim(), $options: "$i" }
          },
          {
            email: { $regex: options.text.trim(), $options: "$i" }
          }
        ]
      }).lean();
      search_user = search_user.map(e => e._id);
      listUser = listUser.concat(search_user);
    }
    if (options.date) {
      let user_date = await ReportStudent.find({nextDateSupport: options.date}).lean();
      if (user_date) {
        user_date = user_date.map(e => e.user);
        listUser = listUser.concat(user_date);
      }
    }
    if (listUser.length){
      conditions._id = {
        $in: listUser
      }
    }
    let count = await User.count(conditions);
    let data = await User.find(conditions, '_id cuid email expert fullName memberShip telephone userName total_course total_studying').sort({total_studying: -1}).limit(options.limit).skip(options.skip).lean();
    let promise = data.map(async e => {
      let check = await ReportStudent.findOne({user: e._id}).lean();
      e.nextDateSupport = check ? check.nextDateSupport : Date.now();
      e.step = check ? check.step : 0;
      let note = await AdminNoteUser.find({user: e._id}).sort({date: 1}).lean();
      e.note = await getMetaDataAdminNote(note);
      return e;
    });
    data = await Promise.all(promise);
    return [count, data];
  } catch (err) {
    console.log('error getReportStudent : ',err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}

export async function getCourseByUser(id, requesterId, time, langCode) {
  try {
    let course_studying = await Course.find({status:
        {
          $in: [1, 2, 3]
        }
    });
    course_studying = course_studying.map(e => e._id);
    let courses = await UserToCourse.find({user: id, course:{$in:course_studying}}).lean();
    let list = courses.map(e => e.course);
    list = await Course.find({
      _id : {
        $in: list
      }
    }).sort({status: 1}).lean();
    list = await getMetaDataHome(list, requesterId, langCode, 'admin');
    list = formatListInfo(list);
    list = await sortByTimeLession(list);
    let promise = list.map(async e => {
      let tracking = await UserToCourse.findOne({user: id, course: e._id}).lean();
      let trackingUser = await UserViewStreamTracking.aggregate([
        { $match:{
            $and: [
              {'courseId': tracking.course},
              {'userId': tracking.user}
            ]
          }
        },
        {
          $group: {
            _id: '$streamId',
            totalTime: {$sum: '$totalTime'}
          }
        }
      ]);
      let total_joined = 0;
      if(trackingUser) {
        trackingUser.map(tracking => {
          if (tracking.totalTime >= time*60) {
            total_joined++;
          }
        })
      }
      let total_lesson = await LiveStream.count({course: e._id});
      tracking.course = e;
      tracking.total_joined = total_joined;
      tracking.total_lesson = total_lesson;
      let code = await CourseCode.findOne({courseId: e._id, userUsedId: id}).lean();
      if(code){
        tracking.code = code.code;
      }
      return tracking;
    });
    return await Promise.all(promise);
  } catch (err) {
    console.log('error getCourseByUser : ',err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}

export async function editReportStudent(options) {
  try {
    let check = await ReportStudent.findOne({user: options.user});
    if(!check){
      check = await ReportStudent.create({
        user: options.user,
        nextDateSupport: options.nextDateSupport || Date.now(),
        step: options.step || 0,
        supporter: options.id
      })
    } else {
      check.supporter = options.id;
      check.nextDateSupport = options.nextDateSupport || check.nextDateSupport;
      check.step = options.step || check.step;
      await check.save();
    }
    return check;
  } catch (err) {
    console.log('error getCourseByUser : ',err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}

export async function adminNoteUser(options) {
  try {
    let user = await User.findById(options.user);
    if(!user){
      return Promise.reject({status: 400, success: false, error:'User not found.'})
    }
    let data = await AdminNoteUser.create(options);
    data = JSON.parse(JSON.stringify(data));
    data = await getMetaDataAdminNote([data]);
    return data[0];
  } catch (err) {
    console.log('error adminNoteUser : ',err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}

export async function getMetaDataAdminNote(data) {
  try {
    let promise = data.map(async e => {
      e.supporter = await User.findById(e.supporter, '_id fullName').lean();
      return e;
    });
    return await Promise.all(promise)
  } catch (err) {
    console.log('error getMetaDate : ',err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}

export async function adminDeleteNote(id) {
  try {
    await AdminNoteUser.remove({_id: id});
    return true;
  } catch (err) {
    console.log('error adminDeleteNote : ',err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}
