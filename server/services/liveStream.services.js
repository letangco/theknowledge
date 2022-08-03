import LiveStream from '../models/liveStream';
import Feeds from '../models/feeds';
import Notification from '../models/notificationNew';
import ArrayHelper from '../util/ArrayHelper';
import globalConstants from '../../config/globalConstants';
import KueJob from '../models/remindCourses';
import {Q,removeJob} from "../libs/Queue";
import AMPQ from '../../rabbitmq/ampq';
import bookingWebinar from '../models/bookingWebinar';
import StringHelper from '../util/StringHelper';
import cuid from 'cuid';
import Courses from "../models/courses";
import UserToCourse from "../models/userToCourse";
import Documents from '../models/documents';
import Videos from '../models/videos';
import User from "../models/user";
import UserOptions from "../models/userOption";
import {createWebinarTicket, getWebinarTickets} from "./webinarTicket.services";
import {getStreamCurrentNumViewer} from "../controllers/ant.controller";
import {destroyProjectData} from "../socket/drawUtil/drawSocket";
import {getFollowerByUserId} from "../controllers/follow.controller";
import {hash} from "../models/functions";
import sanitizeHtml from "sanitize-html";
import {cacheImage} from "../libs/imageCache";
import {addViewTracking} from "./liveStreamTracking.services";
import {streamViewTrackingTypes} from "../models/liveStreamTracking";
import {addExerciseToCourse} from "./exercise.services";
import logger from '../util/log';
import { sendNotificationWhenLiving } from '../libs/Workers/NotifyMemberShipWorker';
import { slugBuilder } from '../util/string.helper';
import CourseUsedPassword from "../models/courseUsedPassword";

const DEADLINE = 30*60*1000;
export function mathTime(data) {
  try{
    let timezone = parseInt(data.utcOffset) / 60;
    let datelive = parseInt(data.dateLiveStream) + (parseInt(data.hour) - timezone) * 3600000 + parseInt(data.minute) * 60 * 1000;
    return datelive;
  } catch (err){
    logger.error(err.toString());
  }
}
export async function addScheduleStream(options) {
  try {
    let result = [];
    let thumbnail = options.thumbnail;
    let data_stream = options.data;
    if(!Array.isArray(data_stream)){
      data_stream = [data_stream];
    }
    for(let i = 0; i < data_stream.length; i++) {
      let data = data_stream[i];
      let datelive = mathTime(data);
      if(data.type !== 'video' && data.type !== 'test'){
        if(datelive < Date.now()){
          return Promise.reject({status:400, success:false, err:'Error_DateLiveStream'})
        }
      }
      let dateCreate = parseInt(data.dateSchedule);
      let timer = Math.ceil((datelive - dateCreate) / 1000);
      let date = data.dateDefault;
      let schedule = {
        cuid: data.cuid,
        user: options.user,
        content: data.content,
        title: data.title,
        slug: data.slug,
        files: data.files,
        description: data.description,
        // thumbnail: thumbUrl,
        // thumbnailMeta: thumbUrlMeta,
        thumbnailSize: data.thumbnailSize,
        // isLive: false,
        classRoom: data.classRoom,
        password:  data.password ? hash(sanitizeHtml(data.password)) : '',
        type: data.type === 'video' ? 'video' : data.type === 'test' ? 'test' : 'schedule',
        index: data.index,
        time: {
          dateCreate: dateCreate,
          dateLiveStream: datelive,
          date: date,
          hour: data.hour,
          minute: data.minute,
          utcOffset: data.utcOffset,
          timeZone: data.timeZone,
          countryCode: data.countryCode,
          timer: timer || 0 // milisecond
        },
        autoRecord: data.autoRecord,
      };
      if(options.thumbnail && options.destination) {
        schedule.thumbnail = `${options.destination}/${thumbnail[i].filename}`;
        schedule.thumbnailMeta = `${options.destination}/${thumbnail[i].filename}`;
      }
      if(data.course){
        schedule.course = data.course;
      }
      if (data.privacy) {
        schedule.privacy = data.privacy;
      }
      let rs = await LiveStream.create(schedule);
      if(rs.type === 'schedule'){
        AMPQ.sendDataToQueue(globalConstants.jobName.CREATE_ELASTICSEARCH_WEBINAR, rs);
      }
      if(data.documents) {
        if(data.documents.files && data.documents.files.length) {
          let fileIds = data.documents.files.map(file => file._id);
          let fileDocuments = await Documents.find({_id: {$in: fileIds}});
          let index, file;
          let filePromises = fileDocuments.map(document => {
            index = ArrayHelper.findItemByProp(data.documents.files, '_id', document._id.toString());
            file = data.documents.files[index];
            document.title = file.title;
            document.privacy = file.privacy;
            document.lesson = rs._id;

            return document.save();
          });
          await Promise.all(filePromises);
        }

        if(data.documents.links && data.documents.links.length) {
          let documentOptions = data.documents.links.map(link => {
            link.user = options.user;
            link.lesson = rs._id;
            link.course = rs.course;

            return link;
          });
          await Documents.create(documentOptions);
        }
      }
      if(data.videos) {
        if(data.videos && data.videos.length) {
          let fileIds = data.videos.map(file => file._id);
          let fileVideos = await Videos.find({_id: {$in: fileIds}});
          let index, file;
          let filePromises = fileVideos.map(document => {
            index = ArrayHelper.findItemByProp(data.videos, '_id', document._id.toString());
            file = data.videos[index];
            document.title = file.title;
            document.privacy = file.privacy;
            document.lesson = rs._id;

            return document.save();
          });
          await Promise.all(filePromises);
        }
      }
      // Exercise: 4c5c96669ace06444f2a39ca45d60ab65c70558c
      if(data.exercises) {
        if(data.exercises && data.exercises.length) {
          let exercisesPromises = data.exercises.map((exercise, index) => {
            let data = {
              title: exercise.title,
              type: exercise.type,
              exercise: exercise._id,
              course: rs.course,
              lesson: rs._id,
              index: index
            }
            addExerciseToCourse(data);
          });
          await Promise.all(exercisesPromises);
        }
      }

      if(data.ticket_info && data.ticket_info.length) {
        let ticket_info = data.ticket_info.map(info => {
          return {
            webinar: rs._id,
            price: !!parseFloat(info.price) ? parseFloat(info.price).toFixed(2) : 0,
            quantity: info.quantity
          };
        });
        await createWebinarTicket(ticket_info);
      }

      result.push(rs);
    }
    return result;
  } catch (err){
    logger.error(`err addScheduleStream Services: ${err.toString()}`);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}
export async function getPrivacyByScheduleId(ID) {
  try{
    let schedule = await LiveStream.findById(ID);
    if(!schedule){
      return Promise.reject({status:400, success:false, err:'Stream Not Found!'})
    }
    if(schedule.type !== 'schedule'){
      return Promise.reject({status:400, success:false, err:'Not type Schedule!'})
    }
    return schedule;
  } catch (err){
    logger.error(`err getPrivacyByScheduleId Services: ${err.toString()}`);
    return Promise.reject({status:400, success:false, err:"Error!"})
  }
}
export async function updatePrivacySchedule(options) {
  try{
    let schedule = await LiveStream.findById(options.scheduleId);
    if(!schedule){
      return Promise.reject({status:400, success:false, err:'Stream Not Found!'})
    }
    if(schedule.type !== 'schedule'){
      return Promise.reject({status:400, success:false, err:'Not type Schedule!'})
    }
    if(options.user_req.toString() !== schedule.user.toString()){
      return Promise.reject({status:400, success:false, err:'Not Permission!'})
    }
    await LiveStream.update(
      {
        _id:options.scheduleId
      },
      {
        $set:{
          privacy:options.privacy
        }
      }
    );
    return await LiveStream.findById(options.scheduleId);
  } catch (err){
    logger.error(`err updatePrivacySchedule Services: ${err.toString()}`);
    return Promise.reject({status:400, success:false, err:"Error!"})
  }
}
export async function deleteScheduleStream(options) {
  try{
    let livestream = await LiveStream.findById(options.stream_id);
    if(!livestream){
      return Promise.reject({status:400, success:false, err:'Stream Not Found!'})
    }
    if(options.user_req.toString() !== livestream.user.toString()){
      return Promise.reject({status:400, success:false, err:'Not Permission!'})
    }
    /**
     * Remove job
     * */
    let jobs = await KueJob.find({lessonId:options.stream_id}).lean();
    if(jobs){
      jobs.map(async e => {
        removeJob(e.jobId,e.type);
      });
      await KueJob.remove({lessonId:options.stream_id});
    }
    /**
     * End
     * */
    await Feeds.remove({object:options.stream_id});
    await Notification.remove({object:options.stream_id});
    await LiveStream.remove({_id: livestream._id});
    return 'Delete Schedule Success!';
  } catch (err){
    logger.error(`deleteScheduleStream error: ${err.toString()}`);
    return Promise.reject({status:500, success:false, err:"Error!!"})
  }
}

export async function updateScheduleByUser(options) {
  try{
    let livestream = await LiveStream.findById(options.stream_id);
    if(!livestream){
      return Promise.reject({status:400, success:false, err:'Stream Not Found!'})
    }
    if(options.user_req.toString() !== livestream.user.toString()){
      return Promise.reject({status:400, success:false, err:'Not Permission!'})
    }
    if(options.type !== 'video') {
      if (parseInt(options.time.dateLiveStream) < Date.now()) {
        return Promise.reject({status: 400, success: false, err: 'Error_DateLiveStream'})
      }
    }
    livestream.content = options.content;
    livestream.title = options.title;
    livestream.description = options.description;
    livestream.thumbnail = options.thumbnail || livestream.thumbnail;
    livestream.thumbnailMeta = options.thumbnailMeta || livestream.thumbnailMeta;
    livestream.thumbnailSize = options.thumbnailSize || livestream.thumbnailSize;
    livestream.privacy = options.privacy;
    livestream.password =  options.updatePassword && options.password ? hash(sanitizeHtml(options.password)) : livestream.password;
    livestream.status = 'new';
    livestream.isLive = false;
    livestream.time.dateLiveStream = options.time.dateLiveStream;
    livestream.time.hour = options.time.hour;
    livestream.time.minute = options.time.minute;
    livestream.time.timeZone = options.time.timeZone;
    livestream.time.timer = options.time.timer;
    livestream.time.dateCreate = options.time.dateCreate;
    livestream.time.date = options.time.date;
    livestream.time.countryCode = options.time.countryCode;
    livestream.time.utcOffset = options.time.utcOffset;
    await livestream.save();
    let data = await LiveStream.findById(options.stream_id).lean();
    return await getMetaDataHome([data],options);
  } catch (err) {
    logger.error(`updateScheduleByUser error: ${err}`);
    return Promise.reject({status:500, success:false, err:"Error!!"});
  }
}
export async function getScheduleByUser(options) {
  try{
    let conditions = {
      type:'schedule',
      "time.dateLiveStream":{$gt:Date.now()},
      course: null
    };
    if(options.type){
      conditions.classRoom = (options.type === "courses")
    }

    if(options.user_stream){
      conditions.user = options.user_stream;
    }
    if(options.user_req){
      //conditions.user={$ne:options.user_req};
      conditions["$or"]=[
        {
          "privacy.to": {$in: ["public", "ticket"]},
          language: options.lang !== 'vi' ? {$ne:'vi'} : {$ne:null}
        },
        {
          "privacy.to":"custom",
          "privacy.invited":options.user_req.toString()
        },
        {
          "privacy.to":"custom",
          user:options.user_req
        },
        {
          "privacy.to":"me",
          user:options.user_req
        }
      ];
      let data = await searchSchedule(conditions,options);
      return await getMetaDataHome(data,options);
    }else {
      conditions["privacy.to"] = {$in: ["public", "ticket"]};
      if(options.lang !== 'vi'){
        conditions.language = {$ne:'vi'}
      }
      let data = await searchSchedule(conditions,options);
      return await getMetaDataHome(data,options);
    }
  } catch (err){
    logger.error(`getScheduleByUser error: ${err.toString()}`);
    return Promise.reject({status:500, success:false, err:"Error!!"})
  }
}
export async function countScheduleByUser(options) {
  try{
    let conditions = {
      type:'schedule',
      "time.dateLiveStream":{$gt:Date.now()},
      course: null
    };

    if(options.type){
      conditions.classRoom = (options.type === "courses")
    }
    if(options.user_req){
      //conditions.user={$ne:options.user_req};
      conditions["$or"]=[
        {
          "privacy.to": {$in: ["public", "ticket"]},
          language: options.lang !== 'vi' ? {$ne:'vi'} : {$ne:null}
        },
        {
          "privacy.to":"custom",
          "privacy.invited":options.user_req.toString()
        },
        {
          "privacy.to":"custom",
          user:options.user_req
        },
        {
          "privacy.to":"me",
          user:options.user_req
        }
      ];
      let count = await searchSchedule(conditions,options);
      return count.length;
    }else {
      conditions["privacy.to"] = {$in: ["public", "ticket"]};
      if(options.lang !== 'vi'){
        conditions.language = {$ne:'vi'}
      }
      let count = await searchSchedule(conditions,options);
      return count.length;
    }
  } catch (err) {
    logger.error(`countScheduleByUser Services error: ${err.toString()}`);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}



export async function countScheduleOfUser(options){
  try{
    let conditions = {
      user:options.user_req,
      course:null
    };
    conditions['$or'] = [
      {
        type:'schedule',
        "time.dateLiveStream":{$gt:Date.now()},
      },
      {
        status:'living',
      }
    ];
    if(options.type){
      conditions.classRoom = (options.type === "courses")
    }
    let count = await searchSchedule(conditions,options);
    return count.length;
  } catch (err) {
    logger.error(`err countScheduleOfUser Services: ${err.toString()}`);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}
export async function getScheduleOfUser(options) {
  try{
    let conditions = {
      user:options.user_req,
      course:null
    };
    conditions['$or'] = [
      {
        type:'schedule',
        "time.dateLiveStream":{$gt:Date.now()},
      },
      {
        status:'living',
      }
    ];
    if(options.type){
      conditions.classRoom = (options.type === "courses")
    }
    let data = await searchSchedule(conditions,options);
    return await LiveStream.getMetadata(data,options.lang, options.user_req);
  } catch (err){
    logger.error(`err getScheduleOfUser Services: ${err.toString()}`);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}

async function searchSchedule(conditions,options) {
  try{
    let livestream = await LiveStream.find(conditions).sort({"time.dateLiveStream": 1}).skip(options.skip).limit(options.limit).lean();
    let promise = livestream.map(async e =>{
      let dateLive = parseInt(e.time.dateLiveStream);
      let datenow = Date.now();
        if(e.status === 'new' && (dateLive - datenow)<DEADLINE){
          e.time.isPlay = true;
        }
        if (e.privacy.to === 'ticket'){
          e.tickets = await getWebinarTickets(e._id, options.lang);
        }
        e.time.timer = Math.ceil((dateLive - datenow)/1000);
        return e;
    });
    return Promise.all(promise);
  }catch (err){
    logger.error(`err searchScheduleOfUser Services: ${err}`);
  }
}

export async function updateIsPlay(options) {
  try {
    let schedule = await LiveStream.findById(options.streamId);
    let data = options.data;
    //console.log(options);
    if(!schedule){
      return Promise.reject({status:400, success:false, err:"Schedule Not Found!"});
    }
    if(options.user_req.toString() !== schedule.user.toString()){
      return Promise.reject({status:400, success:false, err:"Not Permission!"});
    }
    if(schedule.course && schedule.time.dateLiveStream > Date.now()){
      return Promise.reject({status:400, success:false, err:"Not yet play stream!"});
    }
    await LiveStream.update({_id:options.streamId},
      {
        $set:
          {
            status: 'living',
            type:"live_stream",
            content: data.content || schedule.content,
            title: data.title || schedule.title,
            description: data.description || schedule.description,
            privacy: data.privacy || schedule.privacy,
          }
      }
    );
    let rs = await LiveStream.find({_id:options.streamId}).lean();
    //console.log(rs);
    return await LiveStream.getMetadata(rs , data.language,options.user_req);
  }catch (err){
    logger.error(`err updateIsPlay Services: ${err.toString()}`);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}

export async function getLiving(options) {
  try{
    if(options.user_req){
      let conditions = {
        type:"live_stream",
        classRoom:options.type === "courses",
        status: 'living',
        course: null
        //user:{$ne:options.user_req}
      };
      if(options.user_stream){
        conditions.user = options.user_stream;
      }
      conditions ['$or'] =[
        {
          "privacy.to":{$in: ["public", "ticket"]},
          language:options.lang !== "vi" ? {$ne:"vi"} : {$ne:null}
        },
        {
          "privacy.to":"custom",
          "privacy.invited":options.user_req.toString()
        },
        {
          "privacy.to":"custom",
          user:options.user_req
        },
        {
          "privacy.to":"me",
          user:options.user_req
        }
      ];
      let data = await LiveStream.find(conditions).sort({createdAt: -1}).skip(options.skip).limit(options.limit).lean();
      return await getMetaDataHome(data,options);
    }else {
      let conditions = {
        type:'live_stream',
        status: 'living',
        classRoom:options.type === "courses",
        "privacy.to":{$in: ["public", "ticket"]}
      };
      if(options.user_stream){
        conditions.user = options.user_stream;
      }
      if(options.lang !== 'vi'){
        conditions.language = {$ne:'vi'}
      }
      let data = await LiveStream.find(conditions).sort({createdAt: -1}).skip(options.skip).limit(options.limit).lean();
      return await getMetaDataHome(data,options);
    }
  }catch (err) {
    logger.error(`err getStream Services: ${err.toString()}`);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}

export async function getCountLiving(options) {
  try {
    if(options.user_req){
      let conditions = {
        type:'live_stream',
        classRoom:options.type === "courses",
        //user:{$ne:options.user_req},
        status: 'living',
        course: null
      };
      if(options.user_stream){
        conditions.user = options.user_stream;
      }
      conditions ['$or'] =[
        {
          "privacy.to":{$in: ["public", "ticket"]},
          language:options.lang !== "vi" ? {$ne:"vi"} : {$ne:null}
        },
        {
          "privacy.to":"custom",
          "privacy.invited":options.user_req.toString()
        },
        {
          "privacy.to":"custom",
          user:options.user_req
        },
        {
          "privacy.to":"me",
          user:options.user_req
        }
      ];
      return await LiveStream.count(conditions);
    }else {
      let conditions = {
        type:'live_stream',
        status: 'living',
        "privacy.to":{$in: ["public", "ticket"]},
        classRoom:options.type === "courses",
      };

      if(options.user_stream){
        conditions.user = options.user_stream;
      }
      if(options.lang !== 'vi'){
        conditions.language = {$ne:'vi'}
      }
      return await LiveStream.count(conditions);
    }
  }catch (err){
    logger.error(`err getCount Services: ${err.toString()}`);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}

export async function getAllStream(options) {
  try{
    let conditions = {
      classRoom : options.type === "courses",
      course: null
    };
    let data;
    let count;
    if(options.user_req){
      //conditions.user={$ne:options.user_req};
      conditions["$or"] = [
        {
          "privacy.to": {$in: ["public", "ticket"]},
          language:options.lang !== "vi" ? {$ne:"vi"} : {$ne:null},
          type:"schedule",
          "time.dateLiveStream":{$gt:Date.now()}
        },
        {
          "privacy.to":"custom",
          "privacy.invited":options.user_req.toString(),
          type:"schedule",
          "time.dateLiveStream":{$gt:Date.now()}
        },
        {
          "privacy.to":"me",
          user:options.user_req,
          type:"schedule",
          "time.dateLiveStream":{$gt:Date.now()}
        },
        {
          "privacy.to":{$in: ["public", "ticket"]},
          language:options.lang !== "vi" ? {$ne:"vi"} : {$ne:null},
          status: 'living'
        },
        {
          "privacy.to":"custom",
          "privacy.invited":options.user_req.toString(),
          status: 'living'
        },
        {
          "privacy.to":"me",
          user:options.user_req,
          status: 'living'
        },
        {
          "privacy.to":"custom",
          user:options.user_req,
          status: 'living'
        },
        {
          "privacy.to":"custom",
          user:options.user_req,
          type:"schedule",
          "time.dateLiveStream":{$gt:Date.now()}
        }
      ];
      data = await LiveStream.find(conditions).sort({"time.dateLiveStream": 1, status:1}).skip(options.skip).limit(options.limit).lean();

      // console.log('data course list: ', data);
      count = await LiveStream.count(conditions);
      // let sort = {
      //   status:"esc"
      // };
      // data = await ArrayHelper.multiChainSort(data, sort);
      // console.log(data);
      data = await data.map(e=>{
        if(e.status === 'new'){
          let dateLive = parseInt(e.time.dateLiveStream);
          let datenow = Date.now();
          if((dateLive - datenow)<DEADLINE){
            e.time.isPlay = true;
          }
          e.time.timer = Math.ceil((dateLive - datenow)/1000);
          return e;
        }else {
          return e;
        }
      });
      data = await LiveStream.getMetadata(data,options.lang, options.user_req);
    }else {
      if(options.lang !== 'vi'){
        conditions.language = {$ne:'vi'}
      }
      conditions["$or"] = [
        {
          status: 'new',
          type:"schedule",
          "time.dateLiveStream":{$gt:Date.now()}
        },
        {
          status: 'living'
        }
      ];
      conditions["privacy.to"] = {$in: ['public', 'ticket']};
      //console.log(conditions);
      data = await LiveStream.find(conditions).sort({"time.dateLiveStream": 1, status:1}).skip(options.skip).limit(options.limit).lean();
      count = await LiveStream.count(conditions);
      // let sort = {
      //   status:"esc"
      // };
      // data = await ArrayHelper.multiChainSort(data, sort);
      data = await data.map(e=>{
        if(e.status === 'new'){
          let dateLive = parseInt(e.time.dateLiveStream);
          let datenow = Date.now();
          if((dateLive - datenow)<DEADLINE){
            e.time.isPlay = true;
          }
          e.time.timer = Math.ceil((dateLive - datenow)/1000);
          return e;
        }else {
          return e;
        }
      });
      data = await LiveStream.getMetadata(data,options.lang);
    }
    return [data,count];
  }catch (err){
    logger.error('err getAllStream Services:');
    logger.error(err);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}

export async function deleteNotificationsOfStream(options) {
  try{
    let stream = await LiveStream.findById(options.stream_id);
    if(!stream){
      return Promise.reject({status:400, success:true, err:"Stream Not Found!"})
    }

  }catch (err){
    logger.error("err deleteNotificationsOfStream Services :");
    logger.error(err);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}


export async function buildSlug(title) {
  let simpleSlug = slugBuilder(title);
  let isExists = await LiveStream.count({slug: simpleSlug});
  if(!isExists) {
    return simpleSlug;
  }
  return simpleSlug + '-' + cuid.slug();
}

export async function getLessonsSlugMapper(lessonIds) {
  try {
    if(!(lessonIds instanceof Array)) {
      lessonIds = [lessonIds];
    }
    let lessons = await LiveStream.find({_id: lessonIds}, 'slug').lean();
    return ArrayHelper.toObjectByKey(lessons, '_id');
  } catch (err) {
    logger.error('err getLessonsSlugs');
    logger.error(err);
    return Promise.reject({status:500, success:false, err:"Internal error."})
  }
}
export async function updateStatusCoursesWhenLiving(options) {
  try {
    let next_lesson_date = 0;
    let lessons = await LiveStream.find({course:options.coursesId}).sort({'time.dateLiveStream':1}).lean();
    let index = lessons.findIndex((e)=>{
      return e._id.toString() === options.lessonId.toString();
    });
    for(let i = index + 1; i < lessons.length; i++){
      if(lessons[i] && lessons[i].type === 'schedule'){
        next_lesson_date = mathTime(lessons[i].time);
        break
      }
    }
    await Courses.update(
      { _id: options.coursesId },
      {
        $set: {
          status: 1,
          next_lesson_date:next_lesson_date
        }
      }
    )
  } catch (err) {
    logger.error('err updateStatusCoursesWhenLiving:');
    logger.error(err);
  }
}

export async function updateStopCourses(lesson, lastLessonTime) {
  try{
    let status = 2;
    // let lesson = await LiveStream.findById(streamId).lean();

    let after = new Date(lastLessonTime);
    after = after.setMinutes(after.getMinutes() + 15);

    let course = await Courses.findById(lesson.course).lean();
    if(course){
      if(course.next_lesson_date === 0 && Date.now() > after){
        status = 4;
      }
      await Courses.update(
        {_id:lesson.course},
        {$set:
            {
              status:status
            }
        }
      )
    }
  }catch (err){
    logger.error('err updateStopCourses');
    logger.error(err);
  }
}

export async function getLiveStreamHistory(userId, page, langCode) {
  try {
    let skip = (page - 1) * 12;
    let conditions = {
      user: userId,
      course: null
    };
    conditions["$or"] = [
      {
        type: 'live_stream',
        status: 'stopped'
      },
      {
        type: 'schedule',
        status: 'new',
        "time.dateLiveStream":{$lt:Date.now()}
      }
    ];

    let results = await Promise.all([
      LiveStream.count(conditions),
      LiveStream.find(conditions).sort({createdAt: -1}).skip(skip).limit(12).lean()
    ]);
    let total_items = results[0], data = await LiveStream.getMetaBasic(results[1], langCode || 'en');

    return {
      current_page: page,
      last_page: Math.ceil(total_items / 12),
      total_items,
      data
    };
  } catch (err) {
    logger.error('err on getLiveStreamHistory:');
    logger.error(err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

/**
 * @param streamId
 * @param status
 * @param totalViewed
 * @param platform
 * @param {String} requesterId user request id
 * @returns {Promise<Promise|boolean>}
 */
export async function changeStreamStatus(streamId, status, totalViewed, platform, requesterId) {
  try {
    let stream = await LiveStream.findById(streamId);
    if(!stream) {
      return Promise.reject({status: 404, error: 'Stream not found.'});
    }
    const prevStreamStatus = stream.status;
    if (status === prevStreamStatus) {
      // The stream status not changes, no need to do anything
      return true;
    }
    if(['web', 'mobile'].indexOf(platform) < 0) {
      platform = 'web';
    }

    stream.status = status || stream.status;
    stream.totalViewed = totalViewed && !isNaN(totalViewed) ? stream.totalViewed + totalViewed : stream.totalViewed;
    if (stream.user){
      await LiveStream.update(
        {_id:streamId},
        {$set:
          {
            status:status||stream.status,
            totalViewed: totalViewed && !isNaN(totalViewed) ? stream.totalViewed + totalViewed : stream.totalViewed,
            platform
          }
        }
      )
    }
    if (stream.status === 'living' && !stream.course) {
      let user = await User.formatBasicInfoById(User,stream.user);
      let username = user.userName || user.cuid;
      let url = `${username}/videos/${stream._id}`;
      switch (stream.privacy.to){
        case 'custom':
          let inviteUsers = stream.privacy.invited;
          if(inviteUsers.length !== 0 ){
            inviteUsers.map(async to =>{
              if(to){
                let notify = {
                  to:to,
                  from:user._id,
                  object:stream._id,
                  data:{
                    url:url
                  },
                  type:'inviteLivestream',
                };
                AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, notify);
              }
            });
          }
          break;
        case 'public':
          let followUsers = await getFollowerByUserId(stream.user);
          if(followUsers.length !== 0){
            followUsers.map(async to =>{
              if(to){
                let notify = {
                  to:to._id,
                  from:user._id,
                  object:stream._id,
                  data:{
                    url:url
                  },
                  type:'followLivestream',
                };
                AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, notify);
              }
            });
          }
          break;
        default:
          break;
      }
      await createFeedLiveStream(stream);
    }
    if (status === 'living' && prevStreamStatus !== 'living') {
      try {
        await addViewTracking({
          streamId: streamId,
          time: Date.now(),
          numView: 0,
          trackingType: streamViewTrackingTypes.begin,
        });
        await updateStatusCoursesWhenLiving({coursesId: stream.course, lessonId: stream._id});
        const invitedUsers = stream.privacy.invited || [];
        const notiDataPayload = stream.course ? await Courses.findById(stream.course) : stream;
        sendNotificationWhenLiving(invitedUsers, notiDataPayload, null, stream.course ? 'course' : 'webinar').catch((error) => {
          logger.error('Live stream controller, sendNotificationWhenLiving error:');
          logger.error(error);
        });
        if(stream.course && stream.privacy.to === 'custom' && invitedUsers){
          invitedUsers.map( id => {
            if (typeof id !== 'string') {
              id = id.toString();
            }
            if (id !== requesterId) {
              /**
               * Send Mail And Notification Course when Lesson start
               */
              const options = {
                user: id,
                course: stream.course,
                url: `course/${notiDataPayload.slug}`,
                liveStream: stream
              };
              sendNotificationCourses(options).catch((error) => {
                logger.error('LiveStream service changeStreamStatus, sendNotificationCourses 0:');
                logger.error(error);
              });
            }
          });
        }
      } catch (error) {
        logger.error(`Add view tracking when stream living failed: ${streamId}`);
        logger.error(error);
      }
    }
    // Sometimes this function call 2 times so need to check the stream is not stopped before do the bellow code
    if (stream.status === 'stopped' && prevStreamStatus !== 'stopped') {
      try {
        await addViewTracking({
          streamId: streamId,
          time: Date.now(),
          numView: 0,
          trackingType: streamViewTrackingTypes.end,
        });
      } catch ( error ) {
        logger.error(`Add view tracking when stream stopped failed: ${streamId}`);
        logger.error(error);
      }
      await Feeds.remove({object: streamId});
      await Notification.remove({object: streamId});
      destroyProjectData(streamId);
      if(stream.course) {
        let lessons = await LiveStream.find({course: stream.course}).sort({'time.dateLiveStream': 1}).lean();
        let lastLesson = lessons[lessons.length - 1];
        await updateStopCourses(stream, lastLesson.time.dateLiveStream);
      }
    }
    return true;
  } catch (err) {
    logger.error('err on changeStreamStatus:');
    logger.error(err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getMyBookedWebinar(userId, page, langCode) {
  try {
    let skip = (page - 1) * 12;

    let conditions = {
      'privacy.to': 'ticket',
      booked: userId
    };

    let results = await Promise.all([
      LiveStream.count(conditions),
      //LiveStream.find(conditions).sort({status:1 , 'time.dateLiveStream': 1}).skip(skip).limit(12).lean()
      LiveStream.aggregate([
        {
          $match:conditions
        },
        {
          $sort:{status:1 , 'time.dateLiveStream': 1}
        },
        {
          $skip:skip
        },
        {
          $limit:12
        }
      ])
    ]);
    let total_items = results[0];
    let data = await switchData(results[1]);
    data = await LiveStream.getMetaBasic(data, langCode || 'en',userId);
    return {
      current_page: page,
      last_page: Math.ceil(total_items / 12),
      total_items,
      data
    };
  } catch (err) {
    logger.error('err on getMyBookedWebinar:');
    logger.error(err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function sendNotificationCourses(data) {
  try{
    let course = await Courses.findById(data.course).lean();
    if (course){
      // Send mail
      let user = await User.findById(data.user).lean();
      let userOption = await UserOptions.findOne({userID:user.cuid}).lean();
      let dataMail = {
        type: 'LiveScheduleStream',
        language: userOption ? userOption.language : 'vi',
        data: {
          course:data.liveStream,
          url:data.url,
          cuid: user.cuid,
          firstName: user.firstName,
          lastName: user.lastName,
          userName: user.userName,
          email: user.email
        }
      };
      Q.create(globalConstants.jobName.SEND_MAIL, dataMail).removeOnComplete(true).save();

      // Notification
      let dataNotify = {
        to: data.user,
        from:course.creator,
        object:data.course,
        data : {
          url: data.url
        },
        type:'inviteLiveLesson'
      };
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW,dataNotify);
    }
  } catch(err) {
    logger.error('err sendNotificationCourses:');
    logger.error(err);
  }
}

export async function sendNotificationTicket(options) {
  try{
    let booked = options.liveStream.booked;
    let promise = booked.map(async e=>{
      let dataNotify = {
        to:e,
        from:options.liveStream.user,
        object:options.liveStream._id,
        data : {
          url: options.url
        },
        type:'liveTicket'
      };
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW,dataNotify);
    });
    await Promise.all(promise);
  } catch (err){
    logger.error('err sendNotificationTicket:');
    logger.error(err);
  }
}
export async function getMetaDataHome(notifications,options) {
  try{
    if(notifications.length <= 0) return [];
    let promise = notifications.map(async e =>{
      let user = await User.findById(e.user,"_id cuid expert avatar fullName active userName").lean();
      let username = user.userName || user.cuid;
      let currentViewer = await getStreamCurrentNumViewer( e._id );
      e.url = `${username}/videos/${e._id.toString()}`;
      e.currentViewer = currentViewer || 0;
      e.tickets = e.privacy.to === 'ticket' ? await getWebinarTickets(e._id,options.lang, options.user_req ? options.user_req : null) : null;
      if(e.privacy.to === 'ticket' && options.user_req){
        let buyTicket = await bookingWebinar.find({user:options.user_req,webinar:e._id}).lean();
        e.count = 0;
        e.isBought = buyTicket.length > 0;
        if (buyTicket.length > 0){
          buyTicket.map(times =>{
            e.count += times.amount;
          });
        }
      }
      if(e.thumbnail){
        let data={
          src: e.thumbnail,
          size: 650
        };
        e.thumbnail = await cacheImage(data);
      }
      e.user = user;
      return e;
    });
    return Promise.all(promise);
  } catch (err){
    logger.error('err getMetaDataHome:');
    logger.error(err);
  }
}

export async function getEvents(options) {
  try{
    let conditions = {
      language:options.lang !== "vi" ? {$ne:"vi"} : {$ne:null},
      "privacy.to": {$in: ["public", "ticket"]},
    };
    conditions['$or'] = [
      {
        type:'live_stream',
        status: 'living',
        'time.dateLiveStream': {$exists:true}
      },
      {
        type:'schedule',
        status:'new',
        "time.dateLiveStream": {$gt:Date.now()}
      }
    ];
    let data = await LiveStream.find(conditions).sort({"time.dateLiveStream": 1}).skip(options.skip).limit(options.limit).lean();
    let sort = {
      status:"esc"
    };
    data = await ArrayHelper.multiChainSort(data, sort);
    return [await LiveStream.getMetadata(data,options.lang),data.length]
  } catch (err) {
    logger.error('err getEvents:');
    logger.error(err);
    return Promise.reject({status: 500, error: 'Internal error.'})
  }
}

export async function switchData(data) {
  try{
    let stopped = data.filter(e => e.status === 'stopped');
    let living = data.filter(e => e.status === 'living');
    let news = data.filter(e => e.status === 'new');
    let before = [];
    let after = [];
    news.map(e => {
      if (e.time.dateLiveStream > Date.now()){
        after.push(e);
      }else {
        before.push(e);
      }
    });
    return living.concat(after).concat(before).concat(stopped);
  } catch (err){
    logger.error('err switchData:');
    logger.error(err);
  }
}

export async function buildElasticDoc(livestream) {
  try{
    let search_test = `${livestream.title} ${livestream.description}`;
    return {
      id: livestream._id.toString(),
      status:livestream.status,
      dateLiveStream: livestream.time.dateLiveStream.toString(),
      search_text: search_test
    };
  } catch (err){
    logger.error('err buildElasticDoc:');
    logger.error(err);
    return Promise.reject({status:500,err:'err buildElasticDoc !!'});
  }
}
async function createFeedLiveStream(created) {
  try{
    let feedOptions = {
      live_stream: created,
      actor: created.user,
      action: created.type,
      type: created.type,
    };
    let users = [];
    switch (created.privacy.to) {
      case 'public':
        let conditions = {active: 1};
        if (created.language === 'vi') {
          let options = await UserOptions.find({language: 'vi'}).lean();
          let userCuids = options.map(option => option.userID);
          conditions.cuid = {$in: userCuids};
        }
        users = await User.find(conditions, '_id').lean();
        break;
      case 'me':
        let streamer = {_id: created.user};
        users.push(streamer);
        break;
      case 'custom':
        let me = {_id: created.user};
        users.push(me);
        let array_invited = created.privacy.invited;
        if (array_invited.length !== 0) {
          array_invited.forEach(async e => {
            let streamer = {_id: e};
            users.push(streamer);
          })
        }
    }
    // users = await User.find({active: 1}, '_id').lean();
    let userIds = users.map(user => user._id);
    userIds.forEach(userId => {
      let opt = Object.assign({object: created._id, owner: userId}, feedOptions);
      let priority = created.user.toString() === userId ? -15 : 0;
      Q.create(globalConstants.jobName.CREATE_FEED, opt).priority(priority).removeOnComplete(true).save();
    });
  } catch (err){
    logger.error('err createFeedLiveStream:');
    logger.error(err);
  }
}
export async function checkJoinedStream(lesson, user){
  try {
    let lessonInfo = await LiveStream.findById(lesson);
    return !!(lessonInfo && lessonInfo.privacy.invited.indexOf(user) >= 0);

  } catch (err) {
    logger.error('err checkJoinedStream:');
    logger.error(err);
    return Promise.reject({status:500,err:'err checkJoinedStream !!'});
  }
}

/**
 * Get user permission of live stream
 * @param userToken
 * @param streamId
 * @returns {Promise<string>}
 */
export async function getUserStreamPermission(userToken, streamId) {
  try {
    let liveStream = await LiveStream.findById(streamId, 'user privacy course status').lean();
    if ( ! liveStream ) {
      return await Promise.reject(Error('Live Stream not found'));
    }
    let permission = 'denied';
    if ( ! userToken ) {
      permission = (liveStream.privacy.to === 'custom' || liveStream.privacy.to === 'me') ? 'denied' : 'viewer';
    } else {
      const user = await User.findOne({ token: userToken }, 'role memberShip');
      if (user._id.toString() === liveStream.user.toString()) {
        return 'presenter';
      }
      if ( ! liveStream.course ) {
        permission = 'denied';
      } else {
        let courseInfo = await Courses.findById(liveStream.course, 'lectures').lean();
        if ( courseInfo && courseInfo.lectures && courseInfo.lectures.length > 0 ) {
          let checked = false;
          let promises = courseInfo.lectures.map(async item => {
            if(item.toString() === user._id.toString()){
              checked = true;
              permission = 'presenter';
            }
          });
          await Promise.all(promises);
          if ( ! checked ) {
            if ( user.memberShip && user.memberShip > new Date().getTime() ) {
              permission = 'viewer';
            } else {
              permission = 'denied';
            }
          }
        } else if ( user.memberShip && user.memberShip > new Date().getTime() ) {
          permission = 'viewer';
        } else {
          permission = 'denied';
        }
        if (permission === 'denied' && courseInfo) {
          // Check user to course
          const userToCourse = await UserToCourse.findOne({ user: user?._id, course: courseInfo?._id });
          if (userToCourse) {
            permission = 'viewer';
          }
          if (permission === 'denied') {
            const usePass = await CourseUsedPassword.count({ userId: user?._id, courseId: courseInfo?._id }).lean();
            if (usePass) {
              permission = 'viewer';
            }
          }
        }
      }
      // permission = 'viewer';
    }
    return permission;
  } catch (error) {
    logger.error('checkStreamPermission error:');
    logger.error(error);
    throw error;
  }
}

/**
 * Get live stream
 * @param {Object} query
 * @param {Object|Array|optional} populate
 * @returns {Query|void|Query|*}
 */
export function getStreamByQuery(query, populate) {
  if (populate) {
    return LiveStream.findOne(query).populate(populate);
  }
  return LiveStream.findOne(query);
}

/**
 * Add recording file to stream
 * @param streamId
 * @param recordingUrl
 * @param recordingName
 * @returns {Promise<*>}
 */
export async function addStreamRecording(streamId, recordingUrl, recordingName) {
  if (!recordingUrl) {
    throw new Error('Recording must have url');
  }
  try {
    await LiveStream.update(
      {
        _id: streamId,
        'streamFiles.recordingUrl': { $ne: recordingUrl },
      },
      {
        $push: {
          streamFiles: {
            recordingUrl: recordingUrl,
            name: recordingName,
          }
        },
      }
    );
    return true;
  } catch (error) {
    logger.error('addStreamRecording error:');
    logger.error(error);
    throw error;
  }
}

/**
 * Get live stream auto record value
 * @param {ObjectId} streamId
 */
export async function getStreamAutoRecord(streamId) {
  try {
    const stream = await LiveStream.findOne({ _id: streamId }, 'autoRecord');
    if (stream) {
      return stream?.autoRecord ?? false;
    }
    return Promise.reject(new Error('LiveStream not found'));
  } catch (e) {
    logger.error(`getStreamAutoRecord error: ${error}`);
    throw e;
  }
}
