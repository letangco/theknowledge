import Membership from '../../models/memberShip';
import User from '../../models/user';
import Notification from "../../models/notificationNew";
const DAY = 24*60*60*1000;
const HOUR = 60*60*1000;

export async function sendNotificationToAllMemberShip(array, data, url, type) {
  try{
    let fields = ['_id', 'fullName', 'avatar', 'cuid', 'email', 'dateOffline', 'dateAdded', 'active', 'expert', 'deleteDate'].join(' ');
    let memberships = await User.find({memberShip:{$gt:(Date.now() +  HOUR)}},fields).lean();
    let typeNotify = (type === 'webinar') ? "RemindMemberShipWebinarHour" : "RemindMemberShipCourseHour";
    let dataNotify = (type === 'webinar') ? {webinarId:data._id, url:url}:{courseId:data._id, url:`course/${data.slug}`};
    memberships = memberships.filter(membership => array.indexOf(membership._id.toString()) === -1);
    let promises = memberships.map(async e =>{
      let user = await User.findById(e).lean();
      if(user){
        let notification = {
          to: e._id,
          object:data._id,
          type:typeNotify,
          data:dataNotify
        };
        let conditions = {
          to:user._id, object:data._id, type:typeNotify
        };
        let no = await Notification.findOne(conditions).lean();
        if (no){
          await Notification.remove(conditions);
        }
        await Notification.create(notification);
      }
    });
    await Promise.all(promises);
  }catch (err){
    console.log('err sendNotificationToAllMemberShip : ',err);
  }
}

export async function sendNotificationToAllMemberShipDay(array, data, url, type) {
  try{
    let fields = ['_id', 'fullName', 'avatar', 'cuid', 'email', 'dateOffline', 'dateAdded', 'active', 'expert', 'deleteDate'].join(' ');
    let memberships = await User.find({memberShip:{$gt:(Date.now() +  DAY)}},fields).lean();
    let typeNotify = (type === 'webinar') ? "RemindMemberShipWebinarDay" : "RemindMemberShipCourseDay";
    let dataNotify = (type === 'webinar') ? {webinarId:data._id, url:url}:{courseId:data._id, url:`course/${data.slug}`};
    memberships = memberships.filter(membership => array.indexOf(membership._id.toString()) === -1);
    let promises = memberships.map(async e =>{
      let user = await User.findById(e).lean();
      if(user){
        let notification = {
          to: e._id,
          object:data._id,
          type:typeNotify,
          data:dataNotify
        };
        let conditions = {
          to:user._id, object:data._id, type:typeNotify
        };
        let no = await Notification.findOne(conditions).lean();
        if (no){
          await Notification.remove(conditions);
        }
        await Notification.create(notification);
      }
    });
    await Promise.all(promises);
  }catch (err){
    console.log('err sendNotificationToAllMemberShip : ',err);
  }
}

export async function sendNotificationWhenLiving(array, data, url, type) {
  try{
    let fields = ['_id', 'fullName', 'avatar', 'cuid', 'email', 'dateOffline', 'dateAdded', 'active', 'expert', 'deleteDate'].join(' ');
    let memberships = await User.find({memberShip:{$gt:(Date.now() +  DAY)}},fields).lean();
    let typeNotify = (type === 'webinar') ? "RemindMemberShipWebinar" : "RemindMemberShipCourse";
    let dataNotify = (type === 'webinar') ? {webinarId:data._id, url: url ?? `course/${data.slug}`}:{courseId:data._id, url:`course/${data.slug}`};
    memberships = memberships.filter(membership => array.indexOf(membership._id.toString()) === -1);
    let promises = memberships.map(async e =>{
      let user = await User.findById(e).lean();
      if(user){
        let notification = {
          to: e._id,
          object:data._id,
          type:typeNotify,
          data:dataNotify
        };
        let conditions = {
          to:user._id, object:data._id, type:typeNotify
        };
        let no = await Notification.findOne(conditions).lean();
        if (no){
          await Notification.remove(conditions);
        }
        await Notification.create(notification);
      }
    });
    await Promise.all(promises);
  }catch (err){
    console.log('err sendNotificationWhenLiving : ',err);
  }
}
