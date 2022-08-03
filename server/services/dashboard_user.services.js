import globalConstants from "../../config/globalConstants";
import LiveStream from '../models/liveStream';
import Course from '../models/courses';
import Moment from 'moment';
import userViewStreamTracking from "../models/userViewStreamTracking";
import HistoryActionUser from '../models/historyActionUser'
import UserToCourse from '../models/userToCourse';

export async function getChart(options) {
  try {
    let conditions = {
      year: parseInt(options.year),
      userId: options.user
    };
    let DaysInMonth = 0;
    let start = 0;
    let end = 0;
    if(options.week){
      conditions.week = parseInt(options.week);
      let date = Moment().set('year', options.year).week(options.week);
      start = date.startOf('isoWeek').format('YYYY-MM-DD 00:00:00');
      // end = date.endOf('isoWeek').format('YYYY-MM-DD 00:00:00');
    }
    if (options.month){
      conditions.month = parseInt(options.month);
      start = `${options.year}-${options.month}-01 00:00:00`;
      DaysInMonth = new Date(options.year, options.month, 0).getDate();
      // end = `${options.year}-${options.month}-${DaysInMonth} 23:59:59`
    }
    let data = await userViewStreamTracking.aggregate([
      {
        $project:{
          month: {
            $month: "$endTime"
          },
          week: {
            $isoWeek: "$endTime"
          },
          day: {
            $dayOfMonth: "$endTime"
          },
          year: {
            $year: "$endTime"
          },
          totalTime: "$totalTime",
          userId: "$userId"
        }
      },
      {
        $match: conditions
      },
      {
        $group: {
          _id: "$day",
          total: {
            $sum: "$totalTime"
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);
    DaysInMonth = options.week ? 7 : DaysInMonth;
    let rs = [];
    start = new Date(start);
    let timeMillis = start.getTime();
    for (let i = 0; i < DaysInMonth; i++) {
      let obj = {
        date: `${start.getDate()}/${start.getMonth()+1}/${start.getFullYear()}`
      };
      data.map(e => {
        if(e._id === start.getDate()){
          obj.totalTime = e.total;
        }
      });
      rs.push(obj);
      timeMillis += 1000 * 60 * 60 * 24;
      start = new Date(timeMillis);
    }
    return rs;
  } catch (err) {
    console.log('error getChart : ',err);
    return Promise.reject({success: false, status: 500, error:'Internal Server Error.'})
  }
}

export async function getHistoryCourse(options) {
  try {
    let course = await UserToCourse.find({user: options.user}).lean();
    course = course.map(e => e.course);
    let count = await Course.count({_id: {$in: course}, status:{$in:[1,2,3,4]}});
    course = await Course.find({_id: {$in: course}, status:{$in:[1,2,3,4]}}, '_id title status').sort({status: 1}).limit(options.limit).skip(options.skip).lean();
    let promise = course.map(async e => {
      let joined = 0;
      let miss = 0;
      let total_lesson = await LiveStream.count({course: e._id});
      let lessons = await LiveStream.find({course: e._id}).sort({'time.dateLiveStream': 1}).lean();
      let promise_lesson = lessons.map(async lesson => {
        if (!(lesson.time.dateLiveStream > Date.now())){
          let tracking = await userViewStreamTracking.find({streamId: lesson._id, userId: options.user}).lean();
          if(tracking.length){
            joined ++;
          } else {
            miss ++;
          }
        }
      });
      await Promise.all(promise_lesson);
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
      e.joined = joined;
      e.miss = miss;
      e.total_lesson = total_lesson;
      e.rate = joined > 0 ? parseFloat(((joined/total_lesson)*100).toFixed(2)) : 0;
      return e;
    });
    course = await Promise.all(promise);
    return [count, course];
  } catch (err) {
    console.log('error getHistoryCourse : ',err);
    return Promise.reject({success: false, status: 500, error:'Internal Server Error.'})
  }
}

export async function getHistoryAction(options) {
  try {
    let count = await HistoryActionUser.count({user: options.user});
    let data = await HistoryActionUser.find({user: options.user}).skip(options.skip).limit(options.limit).sort({time: -1}).lean();
    data = await getMetaDataHistoryAction(data);
    return [count, data]
  } catch (err) {
    console.log('error getHistoryAction : ',err);
    return Promise.reject({success: false, status: 500, error:'Internal Server Error.'})
  }
}

export async function getMetaDataHistoryAction(data) {
  try {
    let promise = data.map(async e => {
      switch (e.type) {
        case globalConstants.ACTIONS.CLICK_LIVESTREAM:
          e.object = await LiveStream.findById(e.object).lean();
          if(e.object.course){
            e.course = await Course.findById(e.object.course, '_id title slug');
          }
          break;
        case globalConstants.ACTIONS.CLICK_VIDEO:
          e.object = await LiveStream.findById(e.object).lean();
          if(e.object.course){
            e.course = await Course.findById(e.object.course, '_id title slug');
          }
          break;
        default:
          break;
      }
      return e;
    });
    return await Promise.all(promise);
  } catch (err) {
    throw {
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    }
  }
}
