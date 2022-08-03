import mongoose from 'mongoose';
import User from './user';
import UserOption from './userOption';
import Courses from './courses';
import Videos from './videos';
import ArrayHelper from '../util/ArrayHelper';
import StringHelper from '../util/StringHelper';
import globalConstants from '../../config/globalConstants';
import likeStream from './likelivestream';
import {Q, removeJob} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import {cacheImage} from '../libs/imageCache';
import Notifications from './notificationNew';
import ElasticSearch from '../libs/Elasticsearch';
import configs from '../config';
import KueJob from './remindCourses';
import {getFollowerByUserId} from "../controllers/follow.controller";
import {getCurrentViewerInfo, mapUsersInfo, getStreamTotalViewed, getStreamCurrentNumViewer} from '../controllers/ant.controller';
import {getDocumentsByLessons, getVideosByLessons} from "../services/document.services";
import {getExerciseByLessons, getExerciseByLessonsDetail} from "../services/exercise.services";
import {getWebinarTickets} from "../services/webinarTicket.services";
import {getWebinarInteractionsByUser} from "../services/interactWebinar.services";
import bookingWebinar from "./bookingWebinar";

const Schema = mongoose.Schema;
const timeBeforeOneDay = 24*60*60*1000;
const liveStreamSchema = new Schema({
  cuid: {type: String, index: true},
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  title: {type: String},
  // slug: {type: String, unique: true},
  content: {type: String},
  thumbnail: {type: String},
  thumbnailMeta: {type: String}, // Thumbnail for meta CEO
  thumbnailSize: {type: Object}, // {width: 100, height: 100}
  description: {type: String},
  isLive: {type: Boolean, default: true, index: true},
  status: {
    type: String,
    enum: ['new', 'living', 'stopped'],
    default: 'new'
  },
  platform: {
    type: String,
    enum: ['web', 'mobile'],
    index: true,
    default:'web'
  },
  classRoom: {type: Boolean, default: false, index: true},
  like: {type:Number, default:0},
  totalViewed: {type:Number, default:0},
  totalPoints: {type:Number, default:0},
  privacy: {type: Object, default: {to: 'public',invited:[]}},
  language: {type: String, default: 'en'},
  type: {type: String, enum:['live_stream','schedule','video', 'test'],default:'live_stream'},
  time: {
    dateCreate:{type: String},
    dateLiveStream:{type: String},
    date:{type: Date},
    hour:{type:Number},
    minute:{type:Number},
    timer:{type: Number},
    utcOffset:{type: Number},
    countryCode:{type: String},
    isPlay:{type:Boolean, default:false},
    timeZone : { type: 'Mixed'},
  },
  isBlank:{type:String},
  course: {type: Schema.ObjectId, ref: 'Course', index: true}, // for course
  password: {type: String},
  // files: [{type: String}], // for course
  sourceType: {type: String, enum: ['webrtc', 'hls', 'rtmp'], default: 'hls'}, // Load stream via WebRtc, HLS or RTMP
  booked: {type: Array},
  streamFiles: [{
    fileId: {type: String}, // The fileId from GDrive
    recordingUrl: {type: String},
    name: String,
    status: {type: Boolean, default: true, index: true},
  }], // The video stream recorded
  index: {type:Number, default: 0},
  background: { type: Object },
  autoRecord: { type: Boolean, default: false },
}, {
  timestamps: true,
});
liveStreamSchema.set('toJSON', {
  transform(doc, ret, options) { // eslint-disable-line no-unused-vars
    delete ret.__v;
    delete ret.updatedAt;
  },
});
liveStreamSchema.index({createdAt: -1});
liveStreamSchema.index({status: -1});
liveStreamSchema.index({'time.dateLiveStream': 1});

liveStreamSchema.statics.getMetadata = async function(streams, langCode, requesterId, canReOpenLessonId, courseStatus) {
  if(! (streams instanceof Array)) streams = [streams];
  streams = streams.filter(stream => stream);
  let userIds = [], streamIds = [];
  streams.forEach(stream => {
    userIds.push(stream.user);
    streamIds.push(stream._id);
  });
  let promises = [];
  promises.push( getDocumentsByLessons(streamIds, requesterId) );
  promises.push( getVideosByLessons(streamIds, requesterId) );
  promises.push( getExerciseByLessons(streamIds) );
  if(requesterId) {
    promises.push( getWebinarInteractionsByUser(requesterId, streamIds) );
  }
  let resources = await Promise.all(promises);
  let users = await User.formatFeedInfo(User, userIds, langCode);
  let documents = resources[0];
  let videos = resources[1];
  let exercises = resources[2];

  let interactions = []
  if(requesterId) {
    resources[3];
  }
  let userMapper = ArrayHelper.toObjectByKey(users, '_id');
  let documentMapper = ArrayHelper.groupByKey(documents, 'lesson');
  let videoMapper = ArrayHelper.groupByKey(videos, 'lesson');
  let exerciseMapper = ArrayHelper.groupByKey(exercises, 'lesson');
  let interactionMapper = interactions? ArrayHelper.toObjectByKey(interactions, 'webinar') : {};

  return Promise.all(streams.map( async (stream) => {
    //console.log('stream: ', stream);
    if(!requesterId){
      stream.liked = false
    }else {
      let options = {
        from: requesterId,
        stream: stream._id
      };
      let isLiked = await likeStream.findOne(options);
      if(isLiked){
        stream.liked = true;
      }else {
        stream.liked = false;
      }
    }
    const streamId = stream._id.toString();
    // Mapping total view from socket to stream
    if ( stream.totalViewed < 1 ) {
      const totalViewed = await getStreamTotalViewed( streamId );
      if ( totalViewed ) {
        // Only override when have value
        stream.totalViewed = totalViewed;
      }
    }

    stream.user = userMapper[stream.user];
    if(stream.thumbnail){
      let data={
        src: stream.thumbnail,
        size: 650
      };
      stream.thumbnail = await cacheImage(data);
    }

    // Only need to map user info when stream still alive
    /*Than: get data user invited*/
    let invitedUser = {};
    if ( stream.status !== 'stopped' ) {
      if ( ! stream.course && stream.privacy.to && stream.privacy.to === 'custom' && stream.privacy.invited ) {
        invitedUser = await mapUsersInfo( streamId, stream.privacy.invited, true);
      } else {
        invitedUser = await mapUsersInfo( streamId, stream.privacy.invited, false);
      }
    }
    stream.invitedUser = invitedUser;
    const currentViewer = await getStreamCurrentNumViewer( streamId );
    stream.currentViewer = currentViewer || 0;
    const currentViewerInfo = await getCurrentViewerInfo( streamId );
    stream.currentViewerInfo = currentViewerInfo || {};

    let user = stream.user;
    let username = user.userName || user.cuid;
    stream.url = `${username}/videos/${stream._id.toString()}`; // Link to view stream


    // check the lesson can start
    if(stream.course) {
      let dateLiveStream = Number(stream.time.dateLiveStream).valueOf();
      let scheduledTime = new Date(dateLiveStream);

      let before = new Date(scheduledTime);
      before = new Date(before.setMinutes(before.getMinutes() - 30));

      let after = new Date(scheduledTime);
      after = new Date(after.setMinutes(after.getMinutes() + 15)) ;

      let current = new Date();
      stream.canStart = current >= before && current <= after;

      // check the lesson can repoen
      stream.canReOpen = courseStatus === 2 || courseStatus === 4 && stream._id.toString() === canReOpenLessonId;

      stream.documents = documentMapper[stream._id];
      stream.videos = videoMapper[stream._id];
      stream.exercises = exerciseMapper[stream._id];
    }

    if(stream.privacy.to === 'ticket') {
      stream.tickets = await getWebinarTickets(stream._id, langCode, requesterId ? requesterId : null);
      if (requesterId){
        let buyTicket = await bookingWebinar.find({user:requesterId,webinar:stream._id}).lean();
        stream.count = 0;
        stream.isBought = buyTicket.length > 0;
        if (buyTicket.length > 0){
          buyTicket.map(times =>{
            stream.count += times.amount;
          });
        }
      }
    }

    if(interactions) {
      stream.interacted = interactionMapper[stream._id] ? interactionMapper[stream._id].interact : 'none';
    }

    return stream;
  })
)
};

liveStreamSchema.pre('save', async function(next) {
  this.wasNew = this.isNew;
  if(this.title) {
    this.language = StringHelper.detectLanguage(this.title);
  } else {
    try {
      let user = await User.findById(this.user, 'cuid').lean();
      let settings = await UserOption.findOne({userID: user.cuid}, 'language').lean();
      this.language = settings && settings.language ? settings.language : 'en';
    } catch ( error ) {
      console.error('detectLanguage for stream error');
      console.error(error);
      this.language = 'en'; // Default lang
    }
  }
  next();
});

// liveStreamSchema.post('save',function (created,next) {
//   try{
//     if(this.wasNew && created.type === 'schedule'){
//       AMPQ.sendDataToQueue(globalConstants.jobName.CREATE_ELASTICSEARCH_WEBINAR, created);
//     }
//     next();
//   }catch (err){
//     liveStream.remove({_id:created._id});
//     console.log(err);
//   }
// });

liveStreamSchema.post('save', async function (created,next) {
  try{
    if(this.wasNew && !created.isBlank){
      if (!created.course && created.type === 'schedule'){
        let user = await User.formatBasicInfoById(User,created.user);
        let username = user.userName || user.cuid;
        let url = `${username}/videos/${created._id}`;
        switch (created.privacy.to){
          case "custom":
            let inviteUsers = created.privacy.invited;
            if(inviteUsers.length !== 0 ){
              inviteUsers.map(async to =>{
                if(to){
                  let notify = {
                    to:to,
                    from:user._id,
                    object:created._id,
                    data:{
                      url:url
                    },
                    type:"ScheduleStreamInvite",
                  };
                  AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW,notify);
                }
              });
            }
            break;
          case "public":
            let followUsers = await getFollowerByUserId(created.user);
            if(followUsers.length !== 0){
              followUsers.map(async to =>{
                if(to){
                  let notify = {
                    to:to._id,
                    from:user._id,
                    object:created._id,
                    data:{
                      url:url
                    },
                    type:"ScheduleStream",
                  };
                  AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW,notify);
                }
              });
            }
            break;
          case "ticket":
            let followUserss = await getFollowerByUserId(created.user);
            if(followUserss.length !== 0){
              followUserss.map(async to =>{
                if(to){
                  let notify = {
                    to:to._id,
                    from:user._id,
                    object:created._id,
                    data:{
                      url:url
                    },
                    type:"followTicket",
                  };
                  AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW,notify);
                }
              });
            }
            break;
          default:
            break;
        }
      }
    }
    next();
  }catch (err){
    throw err;
  }
});
// liveStreamSchema.post('save', async function(created, next) {
//   try {
//     if(this.wasNew && created.type === 'schedule'){
//       if (!created.course) {
//         let feedOptions = {
//           live_stream: created,
//           actor: created.user,
//           action: created.type,
//           type: created.type,
//         };
//         let users = [];
//         switch (created.privacy.to) {
//           case 'public':
//             let conditions = {active: 1};
//             if (created.language === 'vi') {
//               let options = await UserOption.find({language: 'vi'}).lean();
//               let userCuids = options.map(option => option.userID);
//               conditions.cuid = {$in: userCuids};
//             }
//             users = await User.find(conditions, '_id').lean();
//             break;
//           case 'me':
//             let streamer = {_id: created.user};
//             users.push(streamer);
//             break;
//           case 'custom':
//             let me = {_id: created.user};
//             users.push(me);
//             let array_invited = created.privacy.invited;
//             if (array_invited.length !== 0) {
//               array_invited.forEach(async e => {
//                 let streamer = {_id: e};
//                 users.push(streamer);
//               })
//             }
//         }
//         // users = await User.find({active: 1}, '_id').lean();
//         let userIds = users.map(user => user._id);
//         userIds.forEach(userId => {
//           let opt = Object.assign({object: created._id, owner: userId}, feedOptions);
//           let priority = created.user.toString() === userId ? -15 : 0;
//           Q.create(globalConstants.jobName.CREATE_FEED, opt).priority(priority).removeOnComplete(true).save();
//         });
//       }
//     }
//   } catch (err) {
//     throw err;
//   }
//   return next();
// });
liveStreamSchema.post('save',async function (created,next) {
    await Notifications.remove({object:created._id});
    let deadline = parseInt(created.time.dateLiveStream) - Date.now();
    if (created.type === 'schedule' && created.privacy.to === "ticket" && !created.course) {
      // TODO Varibale
      let data = {scheduleId: created._id};
      let conditions = {lessonId: created._id};

      // TODO
      let kuejob = await KueJob.find(conditions).lean();
      if (kuejob.length > 0) {
        let promise = kuejob.map(async e => {
          await removeJob(e.jobId, e.type);
          await KueJob.remove(conditions);
        });
        await Promise.all(promise);
      }
      if (deadline < configs.trackingSchedule) {
        let job = Q.create(globalConstants.jobName.REMIND_TICKET, data).priority(0).removeOnComplete(true);
        job.save();
      } else {
        let delay = deadline - configs.trackingSchedule;
        let job = Q.create(globalConstants.jobName.REMIND_TICKET, data).delay(delay).priority(0).removeOnComplete(true);
        job.save(async function (err) {
          if (err) throw err;
          await KueJob.create({
            courseId: created.course,
            lessonId: created._id,
            jobId: job.id,
            type: globalConstants.jobName.REMIND_TICKET
          });
        });
        if (deadline > timeBeforeOneDay) {
          let jobDay = Q.create(globalConstants.jobName.REMIND_DAY_TICKET, data).delay(deadline - timeBeforeOneDay).priority(0).removeOnComplete(true);
          jobDay.save(async function (err) {
            if (err) throw err;
            await KueJob.create({
              courseId: created.course,
              lessonId: created._id,
              jobId: jobDay.id,
              type: globalConstants.jobName.REMIND_DAY_TICKET
            });
          });
        }
      }
    }
    if (created.type === 'schedule' && created.privacy.to === "public") {
      // TODO
      let kuejob = await KueJob.find({lessonId: created._id}).lean();
      if (kuejob.length > 0) {
        let promise = kuejob.map(async e => {
          await removeJob(e.jobId, e.type);
          await KueJob.remove({lessonId: created._id});
        });
        await Promise.all(promise);
      }
      if (deadline < configs.trackingSchedule) {
        let job = Q.create(globalConstants.jobName.REMIND_INTERACT, {scheduleId: created._id}).priority(0).removeOnComplete(true);
        job.save();
      } else {
        let delay = deadline - configs.trackingSchedule;
        let job = Q.create(globalConstants.jobName.REMIND_INTERACT, {scheduleId: created._id}).delay(delay).priority(0).removeOnComplete(true);
        job.save(async function (err) {
          if (err) throw err;
          await KueJob.create({lessonId: created._id, jobId: job.id, type: globalConstants.jobName.REMIND_INTERACT});
        });
        if (deadline > timeBeforeOneDay) {
          let jobDay = Q.create(globalConstants.jobName.REMIND_INTERACT_DAY, {scheduleId: created._id}).delay(deadline - timeBeforeOneDay).priority(0).removeOnComplete(true);
          jobDay.save(async function (err) {
            if (err) throw err;
            await KueJob.create({
              lessonId: created._id,
              jobId: jobDay.id,
              type: globalConstants.jobName.REMIND_INTERACT_DAY
            });
          });
        }
      }
    }

    // Notification Remind Course
    if (created.course) {
      let kuejob = await KueJob.find({courseId: created.course, lessonId: created._id}).lean();
      if (kuejob.length > 0) {
        let promise = kuejob.map(async e => {
          await removeJob(e.jobId, e.type);
          await KueJob.remove({courseId: created.course, lessonId: created._id});
        });
        await Promise.all(promise);
      }
      if (deadline < configs.trackingSchedule) {
        let job = Q.create(globalConstants.jobName.REMIND_LESSON, {scheduleId: created._id}).priority(0).removeOnComplete(true);
        job.save();
      } else {
        let delay = deadline - configs.trackingSchedule;
        let job = Q.create(globalConstants.jobName.REMIND_LESSON, {scheduleId: created._id}).delay(delay).priority(0).removeOnComplete(true);
        job.save(async function (err) {
          if (err) throw err;
          await KueJob.create({courseId:created.course, lessonId: created._id, jobId: job.id, type: globalConstants.jobName.REMIND_LESSON});
        });
        let jobDay = Q.create(globalConstants.jobName.REMIND_DAY_LESSON, {scheduleId: created._id}).delay(deadline - timeBeforeOneDay).priority(0).removeOnComplete(true);
        jobDay.save(async function (err) {
          if (err) throw err;
          await KueJob.create({courseId:created.course, lessonId: created._id, jobId: jobDay.id, type: globalConstants.jobName.REMIND_DAY_LESSON});
        });
      }
    }
    // Delete Feed Schedule
    if (!created.course && created.type === 'schedule' && created.privacy.to !== 'password') {
      let job = Q.create(globalConstants.jobName.DELETE_FEED_SCHEDULE, {scheduleId: created._id}).delay(deadline).priority(0).removeOnComplete(true);
      job.save(async function (err) {
        if (err) throw err;
        await KueJob.create({lessonId: created._id, jobId: job.id, type: globalConstants.jobName.DELETE_FEED_SCHEDULE});
      });
      let data = {
        id: created._id.toString(),
        status:created.status,
        dateLiveStream: parseInt(created.time.dateLiveStream),
        search_text: `${created.title} ${created.description}`
      };
      await ElasticSearch.update('webinars', data, undefined, true)
    }
  next();
});

liveStreamSchema.statics.getMetaBasic = async function(streams, langCode, requesterId, canReOpenLessonId, courseStatus, viewStatus = false) {
  if(! (streams instanceof Array)) streams = [streams];
  streams = streams.filter(stream => stream);
  let userIds = [], streamIds = [];
  streams.forEach(stream => {
    userIds.push(stream.user);
    streamIds.push(stream._id);
  });
  let promises = [];
  promises.push( getDocumentsByLessons(streamIds, requesterId, viewStatus));
  promises.push( getVideosByLessons(streamIds, viewStatus));

  // Exercise: 4c5c96669ace06444f2a39ca45d60ab65c70558c
  promises.push(getExerciseByLessons(streamIds));

  if(requesterId) {
    promises.push( getWebinarInteractionsByUser(requesterId, streamIds) );
  }
  let resources = await Promise.all(promises);
  let users = await User.formatFeedInfo(User, userIds, langCode);
  let documents = resources[0];
  let videos = resources[1];
  let exercises = resources[2];
  let interactions = [];
  if(requesterId) {
    interactions = resources[3];
  }
  let userMapper = ArrayHelper.toObjectByKey(users, '_id');
  let documentMapper = ArrayHelper.groupByKey(documents, 'lesson');
  let videoMapper = ArrayHelper.groupByKey(videos, 'lesson');
  let exerciseMapper = ArrayHelper.groupByKey(exercises, 'lesson');
  let interactionMapper = ArrayHelper.toObjectByKey(interactions, 'webinar');

  return Promise.all(streams.map( async (stream) => {
      //console.log('stream: ', stream);
      if(!requesterId){
        stream.liked = false
      }else {
        let options = {
          from: requesterId,
          stream: stream._id
        };
        let isLiked = await likeStream.findOne(options);
        stream.liked = !!isLiked;
      }
      stream.user = userMapper[stream.user];
      if(stream.thumbnail){
        let data={
          src: stream.thumbnail,
          size: 650
        };
        stream.thumbnail = await cacheImage(data);
      }
      const streamId = stream._id.toString();
      // Only need to map user info when stream still alive
      /*Than: get data user invited*/
      // let user = stream.user;
      // let username = user.userName || user.cuid;
      // stream.url = `${username}/videos/${stream._id.toString()}`; // Link to view stream
      // Build stream backup urls
      // Todo: let check the permission of user get this stream
      if (viewStatus && stream.streamFiles instanceof Array ) {
        const streamFiles = stream.streamFiles;
        const streamFileURLs = [];
        streamFiles.forEach( streamFile => {
          if (streamFile.status === true) {
            if (streamFile.recordingUrl) {
              streamFileURLs.push({
                _id: streamFile._id,
                recordingUrl: streamFile.recordingUrl,
              });
            } else if (streamFile.fileId) {
              streamFileURLs.push({
                _id: streamFile._id,
                link: `videoplayback/stream?id=${streamId}&fileId=${streamFile.fileId}`,
                linkView: `play/stream?id=${streamId}&fileId=${streamFile.fileId}`,
              });
            }
          }
        });
        stream.streamFileURLs = streamFileURLs;
      }
      delete stream.streamFiles;
      // check the lesson can start
      if(stream.course) {
        let dateLiveStream = Number(stream.time.dateLiveStream).valueOf();
        let scheduledTime = new Date(dateLiveStream);

        let before = new Date(scheduledTime);
        before = new Date(before.setMinutes(before.getMinutes() - 30));

        let after = new Date(scheduledTime);
        after = new Date(after.setMinutes(after.getMinutes() + 15));

        let current = new Date();
        stream.canStart = current >= before && current <= after;

        // check the lesson can repoen
        stream.canReOpen = courseStatus === 2 || courseStatus === 4 && stream._id.toString() === canReOpenLessonId;

        stream.documents = documentMapper[stream._id];
        stream.videos = videoMapper[stream._id];
        stream.exercises = exerciseMapper[stream._id];
      }
      if(stream.privacy.to === 'ticket') {
        stream.tickets = await getWebinarTickets(stream._id, langCode, requesterId ? requesterId : null);
        if (requesterId){
          let buyTicket = await bookingWebinar.find({user:requesterId,webinar:stream._id}).lean();
          stream.count = 0;
          stream.isBought = buyTicket.length > 0;
          if (buyTicket.length > 0){
            buyTicket.map(times =>{
              stream.count += times.amount;
            });
          }
        }
      }

      if(interactions) {
        stream.interacted = interactionMapper[stream._id] ? interactionMapper[stream._id].interact : 'none';
      }

      return stream;
    })
  )
};
liveStreamSchema.pre('remove', async function (removed, next) {
  if (removed.type==='schedule'){
    let conditions= removed.course ? {
      courseId:removed.course,
      lessonId:removed._id
    }
    :
    {
      lessonId:removed._id
    };
    let Kuejob = await KueJob.findOne(conditions).lean();
    if (Kuejob.length > 0){
      Kuejob.map(async e=>{
        removeJob(e.jobId,e.type);
        await KueJob.remove({lessonId : removed._id});
      });
    }
    AMPQ.sendDataToQueue(globalConstants.jobName.DELETE_ELASTICSEARCH_WEBINAR, removed);
  }
  await Notifications.remove({object:removed._id});
  next();
});
liveStreamSchema.statics.formatSuggestData = async function(_this, livestreams) {
  try {
    return await _this.find({_id:{$in:livestreams}}).sort({"time.dateLiveStream":1}).lean();
  }catch (err){
    console.log('formatSuggestData ',err);
  }
};

export default mongoose.model('LiveStream', liveStreamSchema);
