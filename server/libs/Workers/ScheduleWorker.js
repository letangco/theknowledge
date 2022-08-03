import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import Course from '../../models/courses';
import User from '../../models/user'
import Feed from '../../models/feeds'
import liveStream from '../../models/liveStream';
import Notification from '../../models/notificationNew';
import {addNotification} from "../../controllers/notification.controller";
import {sendNotificationToAllMemberShip, sendNotificationToAllMemberShipDay} from "./NotifyMemberShipWorker";
import KueJob from '../../models/remindCourses';

Q.process(globalConstants.jobName.REMIND_LESSON,1,async function (job,done){
  try{
    let data = job.data;
    let schedule = await liveStream.findById(data.scheduleId).lean();
    if(schedule){
      let course = await Course.findById(schedule.course).lean();
      if(course && parseInt(course.status)===3){
        let students = schedule.privacy.invited;
        let lectures = course.lectures;
        students.map(async e => {
          if(e.toString() !== course.creator.toString()){
            let user = await User.findById(e).lean();
            if(user){
              let notify = {
                to:user._id,
                object:course._id,
                type:"RemindSchedule",
                data:{
                  courseId:course._id,
                  url:`course/${course.slug}`
                }
              };
              let conditions = {
                to:user._id,
                object:course._id,
                type:"RemindSchedule"
              };
              let no = await Notification.findOne(conditions).lean();
              if (no){
                await Notification.remove(conditions);
              }
              await Notification.create(notify);
            }
          }
        });
        lectures.map(async e => {
          let user = await User.findById(e).lean();
          if(user){
            let notify = {
              to:user._id,
              object:course._id,
              type:"RemindScheduleAuthor",
              data:{
                courseId:course._id,
                url:`course/${course.slug}`
              }
            };
            let conditions = {
              to:user._id,
              object:course._id,
              type:"RemindScheduleAuthor"
            };
            let no = await Notification.findOne(conditions).lean();
            if (no){
              await Notification.remove(conditions);
            }
            await Notification.create(notify);
          }
        });
        if(course.isMembership){
          let array = students.concat(lectures);
          array = array.map(e=>{return e.toString()});
          await sendNotificationToAllMemberShip(array, course, null, 'course');
        }
        let conditions = {
          courseId:course._id,
          jobId:job.id,
        };
        await KueJob.remove(conditions);
      }else {

      }
    }
    return done(null);
  }catch (err){
    console.log('err Create_Schedule :',err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.REMIND_DAY_LESSON,1,async function (job,done){
  try{
    let data = job.data;
    let schedule = await liveStream.findById(data.scheduleId).lean();
    if(schedule){
      let course = await Course.findById(schedule.course).lean();
      if(course && parseInt(course.status)===3){
        let students = schedule.privacy.invited;
        let lectures = course.lectures;
        students.map(async e => {
          if(e.toString() !== course.creator.toString()){
            let user = await User.findById(e).lean();
            if(user){
              let notify = {
                to:user._id,
                object:course._id,
                type:"RemindScheduleBefore24h",
                data:{
                  courseId:course._id,
                  url:`course/${course.slug}`
                }
              };
              let conditions = {
                to:user._id,
                object:course._id,
                type:"RemindScheduleBefore24h"
              };
              let no = await Notification.findOne(conditions).lean();
              if (no){
                await Notification.remove(conditions);
              }
              await Notification.create(notify);
            }
          }
        });
        lectures.map(async e => {
          let user = await User.findById(e).lean();
          if(user){
            let notify = {
              to:user._id,
              object:course._id,
              type:"RemindScheduleAuthorBefore24h",
              data:{
                courseId:course._id,
                url:`course/${course.slug}`
              }
            };
            let conditions = {
              to:user._id,
              object:course._id,
              type:"RemindScheduleAuthorBefore24h"
            };
            let no = await Notification.findOne(conditions).lean();
            if (no){
              await Notification.remove(conditions);
            }
            await Notification.create(notify);
          }
        });
        if(course.isMembership) {
          let array = students.concat(lectures);
          array = array.map(e => {
            return e.toString()
          });
          await sendNotificationToAllMemberShipDay(array, course, null, 'course');
        }
        let conditions = {
          courseId:course._id,
          jobId:job.id,
        };
        await KueJob.remove(conditions);
      }else {

      }
    }
    return done(null);
  }catch (err){
    console.log('err Create_Schedule :',err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.DELETE_FEED_SCHEDULE,1,async function (job,done){
  try{
    let data = job.data;
    let schedule = await liveStream.findById(data.scheduleId).lean();
    if(schedule && schedule.status === 'stopped'){
      await Feed.remove({object: data.scheduleId})
      //console.log('Remove Feed Success!!', data.scheduleId)
    }
    return done(null);
  }catch (err){
    console.log('err DELETE_FEED_SCHEDULE ',err);
    return done(err);
  }
});
