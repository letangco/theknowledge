import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import User from '../../models/user'
import Notification from '../../models/notificationNew';
import {sendNotificationToAllMemberShip, sendNotificationToAllMemberShipDay} from "./NotifyMemberShipWorker";
import LiveStream from '../../models/liveStream';
import KueJob from '../../models/remindCourses';
import InteractWebinar from '../../models/interactWebinar';

Q.process(globalConstants.jobName.REMIND_INTERACT,1,async function (job,done){
  try{
    let db = job.data;
    let data = await LiveStream.findById(db.scheduleId).lean();
    let user = await User.findById(data.user).lean();
    let username = user.userName || user.cuid;
    let url = `${username}/videos/${data._id.toString()}`;
    let students = await InteractWebinar.find({webinar:data._id});
    students.map(async e => {
      if(e.user.toString() !== data.user.toString()){
        let user = await User.findById(e).lean();
        if(user){
          let notify = {
            to:user._id,
            object:data._id,
            type:"RemindWebinar",
            data:{
              url:url
            }
          };
          let conditions = {
            to:user._id, object:data._id, type:"RemindWebinar"
          };
          let no = await Notification.findOne(conditions).lean();
          if (no){
            await Notification.remove(conditions);
          }
          await Notification.create(notify);
        }
      }
    });
    students = students.map(e =>{return e.toString()});
    students.push(data.user.toString());
    await sendNotificationToAllMemberShip(students, data, url, 'webinar');

    let notify = {
      to:data.user,
      object:data._id,
      type:"RemindWebinarAuthor",
      data:{
        url:url,
        urlManage:'manage-webinar'
      }
    };
    let conditionss = {
      to:data.user, object:data._id, type:"RemindWebinarAuthor"
    };
    let no = await Notification.findOne(conditionss).lean();
    if (no){
      await Notification.remove(conditionss);
    }
    await Notification.create(notify);

    let conditions = {
      lessonId:data._id,
      jobId:job.id
    };
    await KueJob.remove(conditions);
    return done(null);
  }catch (err){
    console.log('err Create_Schedule :',err)
    return done(err);
  }
});

Q.process(globalConstants.jobName.REMIND_INTERACT_DAY,1,async function (job,done){
  try{
      let db = job.data;
      let data = await LiveStream.findById(db.scheduleId).lean();
      let user = await User.findById(data.user).lean();
      let username = user.userName || user.cuid;
      let url = `${username}/videos/${data._id.toString()}`;
      let students = await InteractWebinar.find({webinar:data._id});
      students.map(async e => {
        if(e.user.toString() !== data.user.toString()){
          let user = await User.findById(e).lean();
          if(user){
            let notify = {
              to:user._id,
              object:data._id,
              type:"RemindWebinarBefore24h",
              data:{
                url:url
              }
            };
            let conditions = {
              to:user._id, object:data._id, type:"RemindWebinarBefore24h"
            };
            let no = await Notification.findOne(conditions).lean();
            if (no){
              await Notification.remove(conditions);
            }
            await Notification.create(notify);
          }
        }
      });
      students = students.map(e =>{return e.toString()});
      students.push(data.user.toString());
      await sendNotificationToAllMemberShipDay(students, data, url, 'webinar');
      let notify = {
        to:data.user,
        object:data._id,
        type:"RemindWebinarAuthorBefore24h",
        data:{
          url:url,
          urlManage:'manage-webinar'
        }
      };
      let conditionss = {
        to:data.user, object:data._id, type:"RemindWebinarAuthorBefore24h"
      };
      let no = await Notification.findOne(conditionss).lean();
      if (no){
        await Notification.remove(conditionss);
      }
      await Notification.create(notify);
      let conditions = {
        lessonId:data._id,
        jobId:job.id,
      };
      await KueJob.remove(conditions);
      return done(null);
  }catch (err){
    console.log('err Create_Schedule :',err);
    return done(err);
  }
});
