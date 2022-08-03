import LiveStream from '../models/liveStream';
import CommentLiveStream from '../models/commentLiveStream';
import StringHelper from '../util/StringHelper';
import Feeds from '../models/feeds';
import User from '../models/user';
import mongoose from 'mongoose';
import globalConstants from '../../config/globalConstants';
import {getFollowerByUserId} from './follow.controller.js';
import {mapUsersInfo, broadcastToRoom, getStreamTotalViewed, getStreamCurrentNumViewer} from './ant.controller';
import {sendNotificationWhenLiving} from "../libs/Workers/NotifyMemberShipWorker";
import { userConnectionStates } from '../socket/utils/stream.room';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import * as liveStream_Services from '../services/liveStream.services';
import {updateWebinarTicket} from "../services/webinarTicket.services";
import {getCourseModelById} from "../services/course.services";
import * as WebinarTicketServices from '../services/webinarTicket.services';
import * as InteractWebinarServices from "../services/interactWebinar.services";
import Course from "../models/courses";
import {hash, validate} from "../models/functions";
import sanitizeHtml from "sanitize-html";
import * as Video_Service from '../services/video.services';

const LIVESTREAM_LIMIT = 12;
const COMMENT_LIMIT = 10;

// export async function addInvited(req,res) {
//   try {
//     let roomId = req.params.id;
//     let array_invited = req.body.invited;
//     if(!StringHelper.isObjectId(roomId)) {
//       return res.status(404).json({success: false, error: 'Stream not found.'});
//     }
//
//     let stream = await LiveStream.findById(roomId).lean();
//     if(!stream) {
//       return res.status(404).json({success: false, error: 'Stream not found.'});
//     }
//     await stream.update(
//       {_id:roomId},
//       {$push:
//         {
//           privacy:{
//             invited:array_invited
//           }
//         }
//       }
//     )
//   } catch (err) {
//
//   }
// }

/**
 * Create blank stream for only get stream _id for the handle have require it
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function createBlankStream(req, res) {
  try {
    let liveStream = new LiveStream({
      user: req.user._id,
      isBlank:'ant'
    });
    if ( req.body.type === 'schedule' ) {
      liveStream.type = 'schedule';
    }
    await liveStream.save();
    return res.json({
      success: true,
      data: liveStream
    });
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export async function addLiveStream(req, res) {
  try {
    let data = JSON.parse(req.body.data);
    //console.log('addLiveSteam data.privacy.to', data.privacy.to);
    if(data.videoId){
      let liveStreamInfo = await LiveStream.findById(data.videoId);
      let array_membership = liveStreamInfo.privacy.invited;
      if(liveStreamInfo.course) {
        let course = await getCourseModelById(liveStreamInfo.course);
        if(course.lectures.indexOf(req.user._id.toString()) < 0) {
          return res.status(403).json({success: false, error: 'Permission denied.'});
        }
        if(course.status === 1) {
          return res.status(403).json({success: false, error: 'Course is living.', code: 'LIVING_COURSE'});
        }
        await liveStream_Services.updateStatusCoursesWhenLiving({coursesId: liveStreamInfo.course, lessonId: liveStreamInfo._id});
      } else {
        liveStreamInfo.privacy = data.privacy || liveStreamInfo.privacy;
      }

      liveStreamInfo.content = data.content || liveStreamInfo.content;
      liveStreamInfo.title = data.title || liveStreamInfo.title;
      liveStreamInfo.description = data.description || liveStreamInfo.description;
      // liveStreamInfo.isLive = true;
      // liveStreamInfo.status = 'living'; // The stream status will change to living when stream started
      liveStreamInfo.type = 'live_stream';
      if(data.updatePassword){
        liveStreamInfo.password = data.password ? hash(sanitizeHtml(data.password)) : '';
      }
      // Update thumb images when not set one of them
      if ( ! liveStreamInfo.thumbnail || ! liveStreamInfo.thumbnailMeta ) {
        liveStreamInfo.thumbnail = `${req.destination}/${req.fileName}`;
        liveStreamInfo.thumbnailMeta = `${req.destination}/${req.fileNameForMetaCEO}`;
        liveStreamInfo.thumbnailSize = data.thumbnailSize;
      }
      if ( data.sourceType ) {
        liveStreamInfo.sourceType = data.sourceType;
      }
      await liveStreamInfo.save();
      // await LiveStream.update(
      //   {_id:data.videoId},
      //   {$set:
      //       {
      //         content: data.content || liveStreamInfo.content,
      //         title: data.title || liveStreamInfo.title,
      //         description: data.description || liveStreamInfo.description,
      //         privacy: data.privacy || liveStreamInfo.privacy,
      //         isLive: true,
      //         type: 'live_stream',
      //       }
      //   }
      // );
      let liveStream = JSON.parse(JSON.stringify(liveStreamInfo));
      // let liveStream = await LiveStream.findById(data.videoId).lean();
      let author = await User.formatBasicInfoById(User, req.user._id);
      let username = author.userName || author.cuid;
      liveStream.url = `${username}/videos/${liveStream._id.toString()}`; // Link to view stream
      let userId = [];
      let invitedUser = {};
      await sendNotificationWhenLiving(array_membership, liveStream.course ? await Course.findById(liveStream.course):liveStreamInfo, liveStream.url, liveStream.course ? 'course':'webinar');
      if(liveStream.privacy.to === 'custom' && liveStream.privacy.invited){
        let promises = liveStream.privacy.invited.map( async id => {
          let user = await User.findOne({_id: id, active: 1}, '_id cuid fullName avatar userName').lean();
          if(user){
            user.status = userConnectionStates.offline;
            if(user._id.toString() !== req.user._id.toString()){
              /**
               * Send Mail And Notification Course when Lession start
               */
              invitedUser[id] = user;
              if(liveStream.course){
                let options = {
                  user:id,
                  course:liveStream.course,
                  url:liveStream.url,
                  liveStream:liveStream
                };
                await liveStream_Services.sendNotificationCourses(options);
              }else{
                userId.push(user.cuid);
                let dataNotify = {
                  to:user._id,
                  from:author._id,
                  object:data.videoId,
                  data : {
                    url: liveStream.url
                  },
                  type:'inviteLivestream'
                };
                AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW,dataNotify);
              }
              /**
               * End
               * */
              return user;
            }
          }
        });
        await Promise.all(promises);
      }
      if(liveStream.privacy.to === 'public'){
        let users = await getFollowerByUserId(req.user._id);
        if(users){
          users.map( user => {
            if(user && userId && userId.indexOf(user.cuid) === -1){
              let dataNotify = {
                to:user._id,
                from:author._id,
                object:data.videoId,
                data : {
                  url: liveStream.url
                },
                type:'followLivestream'
              };
              AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW,dataNotify);
            }
          });
        }
      }
      if (liveStream.privacy.to === 'ticket'){
        let options = {
          url:liveStream.url,
          liveStream:liveStreamInfo
        };
        await liveStream_Services.sendNotificationTicket(options);
      }
      liveStream.invitedUser = invitedUser;
      liveStream.user = {
        '_id' : author._id.toString(),
        'cuid': author.cuid,
        'userName': author.userName,
        'fullName': author.fullName,
        'avatar': author.avatar
      };
      return res.json({
        success: true,
        data: liveStream
      });
    } else {
      let thumbUrl = `${req.destination}/${req.fileName}`;
      let thumbUrlMeta = `${req.destination}/${req.fileNameForMetaCEO}`;
      let liveStream = new LiveStream({
        user: req.user._id,
        content: data.content,
        title: data.title,
        description: data.description,
        password: data.password ? hash(sanitizeHtml(data.password)) : '',
        thumbnail: thumbUrl,
        thumbnailMeta: thumbUrlMeta,
        thumbnailSize: data.thumbnailSize,
        classRoom: data.classRoom,
      });
      if(data.privacy) {
        liveStream.privacy = data.privacy;
      }
      await liveStream.save();

      let author = await User.formatBasicInfoById(User, req.user._id);
      let username = author.userName || author.cuid;
      liveStream = JSON.parse(JSON.stringify(liveStream));
      liveStream.url = `${username}/videos/${liveStream._id.toString()}`; // Link to view stream
      let userId = [];
      let invitedUser = {};
      if(data.privacy.to === 'custom' && data.privacy.invited){
        let promises = data.privacy.invited.map( async id => {
          let user = await User.findOne({_id: id, active: 1}, '_id cuid fullName avatar userName').lean();
          if(user){
            user.status = userConnectionStates.offline;
            invitedUser[id] = user;
            userId.push(user.cuid);
            return user;
          }
          // if(user){
          //   invitedUser[id] = user;
          //   userId.push(user.cuid);
          //   let dataNotify = {
          //     userID : user.cuid,
          //     userSendID : author.cuid,
          //     type : 'inviteLivestream',
          //     data : {
          //       url: liveStream.url
          //     }
          //   };
          //   AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
          //   return user;
          // }
        });
        await Promise.all(promises);
      }
      // if(data.privacy.to === 'public'){
      //   let users = await getFollowerByUserId(req.user._id);
      //   if(users){
      //     users.map( user => {
      //       if(user && userId && userId.indexOf(user.cuid) === -1){
      //         let dataNotify = {
      //           userID : user.cuid,
      //           userSendID : author.cuid,
      //           type : 'followLivestream',
      //           data : {
      //             url: liveStream.url
      //           }
      //         };
      //         AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
      //       }
      //     });
      //   }
      // }
      liveStream.invitedUser = invitedUser;
      liveStream.user = {
        '_id' : author._id.toString(),
        'cuid': author.cuid,
        'userName': author.userName,
        'fullName': author.fullName,
        'avatar': author.avatar
      };
      return res.json({
        success: true,
        data: liveStream
      });

    }
  } catch (err) {
    console.log('err on addLiveSteam:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function getLivingStream(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let skip = (page - 1) * LIVESTREAM_LIMIT;
    let conditions = {};
    if (req.headers.token) {
      let user = await User.findOne({'token': req.headers.token, active: 1}, '_id').lean();
      if(user){
        conditions = {status: 'living'};
        conditions['$or'] = [
          {
            'privacy.to': 'public',
            language: req.headers.lang !== 'vi' ? {$ne: 'vi'} : {$ne: null}
          },
          {
            'privacy.to': 'custom',
            'privacy.invited': user._id.toString()
          }
        ];
      } else {
        conditions = {status: 'living', 'privacy.to': 'public'};
        if (req.headers.lang !== 'vi') {
          conditions.language = {$ne: 'vi'};
        }
      }
    } else {
      conditions = {status: 'living', 'privacy.to': 'public'};
      if (req.headers.lang !== 'vi') {
        conditions.language = {$ne: 'vi'};
      }
    }
    /*Than: load stream by type (streaming or course)*/
    if(req.query.type){
      if(req.query.type == 'classRoom'){
        conditions.classRoom = true;
      } else if(req.query.type == 'livestream'){
        conditions.classRoom = false;
      }
    }
    let resources = await Promise.all([
      LiveStream.count(conditions),
      LiveStream.find(conditions).sort({createdAt: -1}).skip(skip).limit(LIVESTREAM_LIMIT).lean()
    ]);
    let total = resources[0];
    let data = [];
    if (req.headers.token) {
      let user = await User.findOne({token: req.headers.token});
      data = await LiveStream.getMetadata(resources[1], req.headers.lang, user ? user._id : undefined);
    } else {
      data = await LiveStream.getMetadata(resources[1], req.headers.lang);
    }
    //console.log(data);
    return res.json({
      success: true,
      last_page: Math.ceil(total / LIVESTREAM_LIMIT),
      current_page: page,
      total_items: total,
      data: data
    });
  } catch (err) {
    console.log('err on getLivingStream:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function getStream(req, res) {
  try {
    let roomId = req.params.id;
    if(!StringHelper.isObjectId(roomId)) {
      return res.status(404).json({success: false, error: 'Stream not found.'});
    }

    let stream = await LiveStream.findById(roomId).lean();
    if(!stream) {
      return res.status(404).json({success: false, error: 'Stream not found.'});
    }
    let streams = [];
    let user = {}, memberShip = false;
    if(req.headers.token){
      user = await User.findOne({token:req.headers.token});
      if(user && user.memberShip > new Date().getTime()){
        memberShip = true;
      }
      streams = await LiveStream.getMetadata(stream, req.headers.lang, user ? user._id : undefined);
    }else {
      streams = await LiveStream.getMetadata(stream, req.headers.lang);
    }
    // if(req.hasOwnProperty('user')){
    //   streams = await LiveStream.getMetadata(stream, req.headers.lang, 'Undefind');
    // }else {
    //   streams = await LiveStream.getMetadata(stream, req.headers.lang, req.user._id);
    // }
    if(stream.type === 'live_stream'){
      switch (stream.privacy.to) {
        case 'ticket':
        case 'public':
          stream = streams.pop();
          stream.memberShip = memberShip;
          stream.access = stream.privacy.to === 'public' ? true : false;
          return res.json({success: true, data: stream});

        case 'me':
          if(user && user._id && user._id.toString() == stream.user._id.toString()){
            stream = streams.pop();
            stream.access = true;
            return res.json({success: true, data: stream});
          }else {
            return res.json({success:false, error: 'Not Permission 1'})
          }

        case 'password':
          stream = streams.pop();
          stream.password = true;
          if(user && user._id && user._id.toString() == stream.user._id.toString()){
            stream.access = true;
          } else {
            stream.access = false;
          }
          return res.json({success: true, data: stream});

        case 'custom':
          let array_invited = stream.privacy.invited;
          if(stream.course){
            let courseInfo = await Course.findById(stream.course, 'password buyAble lectures isMembership slug').lean();
            if(!courseInfo){
              return res.json({success:false, error: 'Not Permission 2'})
            }
            if(user && user._id && (array_invited.indexOf(user._id.toString())!==-1 ||
              user._id.toString() == stream.user._id.toString())){
              stream = streams.pop();
              stream.access = true;
              stream.courseSlug = courseInfo.slug || '';
              return res.json({success: true, data: stream});
            }
            if(user && user._id && courseInfo.lectures && courseInfo.lectures.length > 0){
              courseInfo.lectures.map( item => {
                if(item.toString() === user._id.toString()){
                  stream = streams.pop();
                  stream.access = true;
                  stream.courseSlug = courseInfo.slug || '';
                  return res.json({success: true, data: stream});
                }
              })
            }
            if(courseInfo.isMembership && memberShip){
              stream = streams.pop();
              stream.access = true;
              stream.courseSlug = courseInfo.slug || '';
              return res.json({success: true, data: stream});
            }

            stream = streams.pop();
            stream.access = false;
            stream.codeAccess = true;
            stream.buyAble = courseInfo.buyAble || false;
            stream.courseSlug = courseInfo.slug || '';
            stream.password = !!courseInfo.password;
            stream.isMembership = !!courseInfo.isMembership;
            return res.json({success: true, data: stream});
          } else if(user && user._id && (array_invited.indexOf(user._id.toString())!==-1 ||
            user._id.toString() == stream.user._id.toString())
          ){
            stream = streams.pop();
            stream.memberShip = memberShip;
            stream.access = true;
            return res.json({success: true, data: stream});
          } else {
            stream = streams.pop();
            stream.memberShip = memberShip;
            stream.access = false;
            return res.json({success: true, data: stream});
          }
      }
    } else {
      switch (stream.privacy.to) {
        case 'ticket':
        case 'public':
        case 'me':
        case 'custom':
      }
      let type = req.query.type || 'none';
      let data = await LiveStream.findById(stream._id).lean();
      let time = Date.now();
      if(time > parseInt(stream.time.dateLiveStream + 30*60*1000)  && !stream.course){
        return res.json({success:false, err:"Stream Overdue or Had LiveStream !!"});
      }
      /*Than: get user invite info*/
      var invitedUser = [];
      if((data.privacy.to === 'custom' && data.privacy.invited) || memberShip && data.privacy.invited.length){
        let promises = data.privacy.invited.map( async id => {
          if(id !== data.user._id){
            let user = await User.findOne({_id: id, active: 1}, '_id cuid fullName avatar userName').lean();
            if(user){
              invitedUser.push(user);
            }
          }
        });
        await Promise.all(promises);
      }
      data.invitedUser = invitedUser;
      data.memberShip = memberShip;
      data.aceess = false;
      data.password = !!data.password;
      if(type !== 'none'){
        return res.json({success: true, data: data});
      }else {
        let info = streams.pop();
        info.invitedUser = invitedUser;
        info.aceess = false;
        info.password = !!data.password;
        if(parseInt(info.time.dateLiveStream) - 30*60*1000 < time && time < parseInt(info.time.dateLiveStream) && !info.course){
          info.time.isPlay = true;
        }
        info.memberShip = memberShip;
        info.time.timer = Math.ceil((parseInt(info.time.dateLiveStream) - time)/1000);
        return res.json({success: true, data: info});
      }
    }
  } catch (err) {
    console.log('err on getStream:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}
export async function getStreamMeta(req, res) {
  try {
    let roomId = req.params.id;
    if(!StringHelper.isObjectId(roomId)) {
      return res.json({});
    }

    let stream = await LiveStream.findById(roomId).lean();
    if(!stream) {
      return res.json({});
    }
    return res.json({
      title : stream.title,
      description : stream.description,
      tags : [],
      type : 'article',
      thumbnails : [stream.thumbnailMeta] || [''],
    });
  } catch (err) {
    return res.json({});
  }
}

export async function deleteLiveStream(req, res) {
  try {
    let liveStream = await LiveStream.findById(req.params.id);
    if(!liveStream) {
      return res.status(404).json({
        success: false, error: 'Live stream not found.'
      });
    }

    if(liveStream.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, error: 'Permission denied.'
      });
    }

    await liveStream.remove();
    return res.json({success: true});
  } catch (err) {
    console.log('err on deleteLiveStream:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}
export async function updatePassword(req, res) {
  try{
    let data = req.body
    if (!req.params.id ) {
      return res.status(404).json({
        success: false, error: 'WEBINAR_NOT_FOUND'
      });
    }
    if(!data.password){
      return res.status(404).json({
        success: false, error: 'PASSWORD_EMPTY'
      });
    }
    await LiveStream.update({_id: req.params.id}, {'$set' : {
      password: hash(sanitizeHtml(data.password))
      }})
    return res.status(200).json({
      success: true
    });
  } catch(error) {
    console.log('err on updatePassword:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}
export async function updateLiveStream(req, res) {
  try {
    if ( ! req.params.id ) {
      return res.status(404).json({
        success: false, error: 'Live stream is not set.'
      });
    }
    let liveStream = await LiveStream.findById(req.params.id);
    if(!liveStream) {
      return res.status(404).json({
        success: false, error: 'Live stream not found.'
      });
    }

    if(liveStream.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, error: 'Permission denied.'
      });
    }
    /* Than:Notify for user when update invite user list */
    if(req.body.privacy.to == 'custom' && req.body.privacy.invited){
      let author = await User.findOne({_id: req.user._id}, 'userName cuid').exec();
      let username = author.userName || author.cuid;
      req.body.privacy.invited.map( async id => {
        if(liveStream.privacy.invited.indexOf(id) == -1){
          let user = await User.findOne({_id: id}, 'cuid').exec();
          if(user){
            let dataNotify = {
              to : user._id,
              from : author._id,
              type : 'inviteLivestream',
              data : {
                url: `${username}/videos/${liveStream._id.toString()}`
              }
            };
            AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
          }
        }
      });
    }
    let title = StringHelper.sanitizeHtml(req.body.title);
    liveStream.title = title || liveStream.title;

    let description = StringHelper.sanitizeHtml(req.body.description);
    liveStream.description = description || liveStream.description;

    liveStream.content = req.body.content || liveStream.content;

    liveStream.privacy = req.body.privacy || liveStream.privacy;
    // liveStream.isLive = typeof req.body.isLive === 'boolean' ? req.body.isLive : liveStream.isLive;

    streamNameSpaceInstance.setStreamPrivacyForRoom(liveStream._id, liveStream.privacy);

    return res.json({
      success: true,
      data: await liveStream.save()
    });
  } catch (err) {
    console.log('err on updateLiveStream:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function stopStream(req, res) {
  try {
    let streamId = req.params.id;
    let result = await liveStream_Services.changeStreamStatus(streamId, 'stopped');
    return res.status(200).json({
      success: true,
      result: result
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false, error: err.error || 'Internal error.'
    });
  }
}

export async function getStreamPrivacy(streamId) {
  try {
    return await LiveStream.findOne({_id: streamId}, {privacy: 1}).exec();
  } catch (err) {
    return false;
  }
}

/**
 * When restart server, reset all commit stream
 * @returns {Promise.<*>}
 */
export async function resetUnCommitStream() {
  try {
    let unCommitStreams = await LiveStream.find({status: 'living'}).exec();
    unCommitStreams.map( async stream => {
      await liveStream_Services.changeStreamStatus(stream._id.toString(), 'stopped')
    });
    return true;
  } catch (err) {
    console.log('err on resetUnCommitStream');
    console.log(err);
    return Promise.reject({success: false, error: err.message});
  }
}

export async function addComment(req, res) {
  try {
    let liveStreamId = req.params.id;
    if(!StringHelper.isObjectId(liveStreamId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Live Stream id.'
      });
    }

    let liveStream = await LiveStream.findById(liveStreamId).lean();
    if(!liveStream) {
      return res.status(404).json({
        success: false,
        error: 'Live Stream not found.'
      });
    }

    // let content = StringHelper.sanitizeHtml(req.body.content);
    let content = req.body.content;
    if(!content) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Content.'
      });
    }
    let comment = await CommentLiveStream.create({
      user: req.user._id,
      liveStream: liveStreamId,
      content: content,
      videoTime: req.body.videoTime
    });

    return res.json({
      success: true,
      data: comment
    });
  } catch (err) {
    console.log('err on addLiveStreamComment:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function getComments(req, res) {
  try {
    let liveStreamId = req.params.id;
    if(!StringHelper.isObjectId(liveStreamId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Live Stream id.'
      });
    }

    let liveStream = await LiveStream.findById(liveStreamId).lean();
    if(!liveStream) {
      return res.status(404).json({
        success: false,
        error: 'Live Stream not found.'
      });
    }

    let conditions = {liveStream: liveStreamId};
    if(req.query.lastCommentId && req.query.lastCommentId !== 'undefined' && req.query.lastCommentId !== 'null') {
      conditions['_id'] = {$lt: req.query.lastCommentId};
    }
    let comments = await CommentLiveStream.find(conditions).sort({createdAt: -1}).limit(COMMENT_LIMIT + 1).lean();
    comments = comments.reverse();
    let loadMore = comments.length > COMMENT_LIMIT;
    if(loadMore) {
      comments.splice(0, 1);
    }

    let data = await CommentLiveStream.getMetadata(comments);

    return res.json({
      success: true,
      data,
      loadMore
    });
    // let page = Number(req.query.page || 1).valueOf();
    // let skip = (page - 1) * COMMENT_LIMIT;
    // let conditions = {liveStream: liveStreamId};
    // let resources = await Promise.all([
    //   CommentLiveStream.count(conditions),
    //   CommentLiveStream.find(conditions).sort({createdAt: -1}).skip(skip).limit(COMMENT_LIMIT).lean()
    // ]);
    //
    // let total = resources[0], data = await CommentLiveStream.getMetadata(resources[1]);
    // data = data.reverse();
    // return res.json({
    //   success: true,
    //   current_page: page,
    //   last_page: Math.ceil(total / COMMENT_LIMIT),
    //   total_items: total,
    //   data
    // });
  } catch (err) {
    console.log('err on getLiveStreamComments:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}
// Replaceable
export async function getViewer(req, res) {
  try {
    let roomId = req.params.id; // liveStreamId
    let numViewer = await getStreamCurrentNumViewer( roomId );
    return res.json({
      success: true,
      numViewer
    })
  } catch (err) {
    console.log('err on getLiveStreamViewer:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    })
  }
}

// Replaceable
export async function getTotalViewed(req, res) {
  try {
    let roomId = req.params.id; // liveStreamId
    // Get from db when stream stopped
    let stream = await LiveStream.findOne({_id: mongoose.Types.ObjectId(roomId)}, {status: 1, totalViewed: 1}).exec();
    if ( stream && stream.status === 'stopped' ) {
      return res.json({
        success: true,
        numTotalViewer: stream.totalViewed || 0
      })
    }
    let numTotalViewer = await getStreamTotalViewed( roomId );
    return res.json({
      success: true,
      numTotalViewer
    });
  } catch (err) {
    console.log('err on getLiveStreamTotalViewer:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    })
  }
}

export async function increaseTotalViewed(streamId, number) {
  try {
    let stream = await LiveStream.findById(streamId);
    if(!stream) {
      return res.json({success: false, code: 404, error: 'Stream not found.'});
    }

    if(stream.status !== 'living') {
      return res.json({success: false, code: 400, error: 'Stream has been stopped.'});
    }

    stream.totalViewed += number;
    if(stream.totalViewed < 0) stream.totalViewed = 0;

    await stream.save();

    return res.json({success: true, code: 200, totalViewed: stream.totalViewed});
  } catch (err) {
    console.log('err on increaseTotalViewed:', err);
    return {success: false, code: 500, error: 'Internal error.'};
  }
}

export async function updateLiveStreamPrivacy(req, res) {
  try {
    let stream = await LiveStream.findById(req.params.id);
    if(!stream) {
      return res.json({success: false, code: 404, error: 'Stream not found.'});
    }

    if(stream.user.toString() !== req.user._id.toString()) {
      return res.json({success: false, code: 403, error: 'Permission denied.'});
    }
    /* Than:Notify for user when update invite user list */
    if(req.body.privacy.to === 'custom' && req.body.privacy.invited){
      let author = await User.findOne({_id: req.user._id}, 'userName cuid').exec();
      let username = author.userName || author.cuid;
      req.body.privacy.invited.map( async id => {
        if(stream.privacy.invited.indexOf(id) === -1){
          let user = await User.findOne({_id: id}, 'cuid').exec();
          if(user){
            let dataNotify = {
              to : user._id,
              from : author._id,
              type : 'inviteLivestream',
              data : {
                url: `${username}/videos/${stream._id.toString()}`
              }
            };
            AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
          }
        }
      });
    }
    await Feeds.remove({object:stream._id,type:'live_stream'});
    stream.privacy = req.body.privacy;
    await stream.markModified('privacy');
    await stream.save();
    let data = await LiveStream.findById(req.params.id);
    // Todo: call API to ant to send socket
    let roomId = data._id.toString();
    let invitedUser = data.privacy.invited;
    let userInvitedInfo = await mapUsersInfo(roomId, invitedUser, true);
    broadcastToRoom(
      roomId,
      'liveStreamAction',
      {
        type: 'liveStream.updateUserInvited',
        data: userInvitedInfo
      },
      {
        includeSender: true
      }
    );
    // If need
    // streamNameSpaceInstance.setStreamPrivacyForRoom(roomId, data.privacy.to);
    return res.json({
      success:true,
      data: data
    })
  } catch (err) {
    console.log('err on updateLiveStreamPrivacy:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}


// ------------------ SCHEDULE -------------------------------

export async function addScheduleStream(req,res) {
  try{
    let data = JSON.parse(req.body.data);
    let options = {
      user: req.user._id,
      data: data,
      thumbnail:req.files,
      destination:req.destination
    };
    let data_streams = await liveStream_Services.addScheduleStream(options);
    data_streams.map(async e =>{
      let data_stream = JSON.parse(JSON.stringify(e));
      let author = await User.formatBasicInfoById(User, req.user._id);
      let username = author.userName || author.cuid;
      data_stream.url = `${username}/videos/${data_stream._id.toString()}`;
    });
    return res.json({
      status:200,
      success:true,
      data:data_streams
    });
  }catch (err){
  console.log("err", err);
  return res.status(err.status).json(err);
  }
}

export async function deleteScheduleStream(req,res) {
  try{
    let StreamId = await StringHelper.isObjectId(req.params.id);
    if(!StreamId){
      throw {
        status:404,
        success:false,
        err:'Query not format!'
      }
    }
    let options = {
      user_req:req.user._id,
      stream_id:req.params.id
    };
    let msg = await liveStream_Services.deleteScheduleStream(options);
    return res.json({
      status:200,
      success:true,
      msg:msg
    })
  }catch (err){
    console.log("err", err);
    return res.status(err.status).json(err);
  }
}

export async function updateScheduleStream(req,res) {
  try {
    let data = JSON.parse(req.body.data);
    let timezone = parseInt(data.utcOffset) / 60;
    let thumbUrl = req.destination ? `${req.destination}/${req.fileNameForMetaCEO}` : null;
    let thumbUrlMeta = req.destination ? `${req.destination}/${req.fileNameForMetaCEO}` : null;
    let datelive = parseInt(data.dateLiveStream) + (parseInt(data.hour)-timezone)*3600000 + parseInt(data.minute)*60*1000;
    let dateCreate = parseInt(data.dateSchedule);
    let timer = Math.ceil((datelive - dateCreate)/1000);
    let date = data.dateDefault;
    let lang = req.headers.lang || 'en';
    let options = {
      stream_id:data.id,
      user_req: req.user._id,
      lang,
      content: data.content,
      title: data.title,
      description: data.description,
      thumbnail: thumbUrl,
      thumbnailMeta: thumbUrlMeta,
      thumbnailSize: data.thumbnailSize,
      classRoom: data.classRoom,
      password: data.password,
      updatePassword: data.updatePassword,
      type:'schedule',
      time:{
        dateCreate:dateCreate,
        dateLiveStream:datelive,
        date:date,
        hour:data.hour,
        minute:data.minute,
        timeZone : data.timeZone,
        utcOffset:data.utcOffset,
        countryCode : data.countryCode,
        timer: timer // milisecond
      },
    };
    if(data.privacy){
      options.privacy = data.privacy;
      if (data.ticket_info){
        options.privacy.ticket_info = data.ticket_info;
      }
      await updatePrivacySchedule(options);
    }
    let streams = await liveStream_Services.updateScheduleByUser(options);
    if (data.ticket_info){
      data.ticket_info[0].webinar = data.ticket_info[0].webinar ? data.ticket_info[0].webinar : data.id;
      await updateWebinarTicket(data.ticket_info);
    }
    return res.json({
      status:200,
      success:true,
      msg:'Update Success!',
      data:streams[0]
    })
  }catch (err){
    console.log("err", err);
    return res.status(err.status).json(err);
  }
}

export async function updatePrivacySchedule(data) {
  try{
    let privacy = data.privacy;
    let schedule = await liveStream_Services.getPrivacyByScheduleId(data.stream_id);
    let privacyOld = schedule.privacy;
    let author = await User.findById(data.user_req);


    let username = author.userName || author.cuid;
    let userInviteNew = privacy.invited;
    // Notify
    /**
     userInviteNew.map(async to =>{
      if(privacyOld.invited.indexOf(to)===-1){
          // Create Feed
          let feedOptions = {
            live_stream: schedule,
            actor: schedule.user,
            action: 'start_live',
            type: schedule.type,
            owner:to,
            object:schedule._id
          };
          let priority = schedule.user.toString() === to ? -15 : 0;
          Q.create(globalConstants.jobName.CREATE_FEED, feedOptions).priority(priority).removeOnComplete(true).save();
          //Notify
          let dataNotify = {
            userID: to,
            userSendID: author.cuid,
            type: 'ScheduleStreamInvite',
            data: {
              url: `${username}/video/${data.stream_id}`
            }
          };
          Q.create(globalConstants.jobName.ADD_NOTIFY, dataNotify).removeOnComplete(true).save();
        }
    });
     */
    // Notify New
    userInviteNew.map(async to =>{
      if(privacyOld.invited.indexOf(to)===-1){
        // Create Feed
        let feedOptions = {
          live_stream: schedule,
          actor: schedule.user,
          action: 'start_live',
          type: schedule.type,
          owner:to,
          object:schedule._id
        };
        let priority = schedule.user.toString() === to ? -15 : 0;
        Q.create(globalConstants.jobName.CREATE_FEED, feedOptions).priority(priority).removeOnComplete(true).save();
        //Notify
        let dataNotify = {
          to: to,
          from: req.user._id,
          object:schedule._id,
          type: 'ScheduleStreamInvite',
          data: {
            url: `${username}/videos/${schedule._id}`
          }
        };
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
      }
    });
    let options = {
      privacy:privacy,
      scheduleId:data.stream_id,
      user_req:data.user_req
    };
    return await liveStream_Services.updatePrivacySchedule(options);
  }catch (err){
    console.log("err updatePrivacySchedule", err);
  }
}

export async function getScheduleOfUser(req,res) {
  try{
    let lang = req.headers.lang || 'en';
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || 12).valueOf();
    let type = req.query.type ? req.query.type.toString() : "live";
    let skip = (page - 1) * limit;
    let options = {
      limit: limit,
      skip: skip,
      lang: lang,
      type: type,
      user_req:req.user._id
    };

    let rs = await Promise.all([
      liveStream_Services.countScheduleOfUser(options),
      liveStream_Services.getScheduleOfUser(options)
    ]);
    return res.json({
      status:200,
      success:true,
      total:rs[0],
      total_page: Math.ceil(rs[0]/limit),
      current_page: page,
      data:rs[1],
    })
  }catch (err) {
    console.log("err", err);
    return res.status(err.status).json(err);
  }
}
export async function getScheduleStream(req,res) {
  try{
    let lang = req.headers.lang || 'en';
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || LIVESTREAM_LIMIT).valueOf();
    let type = req.query.type ? req.query.type.toString() : "live";
    let skip = (page - 1) * limit;
    let options = {
      limit: limit,
      skip: skip,
      lang: lang,
      type: type
    };
    if(req.headers.token){
      let user = await User.findOne({token:req.headers.token}).lean();
      if(user){
        options.user_req = user._id
      }
    }
    let rs = await Promise.all([
      liveStream_Services.countScheduleByUser(options),
      liveStream_Services.getScheduleByUser(options)
    ]);
    return res.json({
      status:200,
      success:true,
      total:rs[0],
      total_page: Math.ceil(rs[0]/limit),
      current_page: page,
      data:rs[1],
    })
  }catch (err){
    console.log(err);
    return res.status(err.status).json(err);
  }
}

export async function getAllStreams(req,res) {
  try{
    //console.log("Aaa");
    let lang = req.headers.lang || 'en';
    let page = Number(req.query.page || 1).valueOf();
    let skip = (page - 1) * LIVESTREAM_LIMIT;
    let options = {
      limit: LIVESTREAM_LIMIT,
      skip: skip,
      lang: lang,
    };
    if(req.headers.token){
      let user = await User.findOne({token:req.headers.token}).lean();
      if(user){
        options.user_req = user._id
      }
    }
    let rs = await Promise.all([
      liveStream_Services.countScheduleByUser(options),
      liveStream_Services.getScheduleByUser(options)
    ]);
    let rss = await Promise.all([
      liveStream_Services.getCount(options),
      liveStream_Services.getLiving(options)
    ]);
    //console.log(rss[0]);
    return res.json({
      status:200,
      success:true,
      total_stream:rss[0],
      total_schedule:rs[0],
      total_page_stream: Math.ceil(rss[0]/LIVESTREAM_LIMIT),
      total_page_schedule: Math.ceil(rs[0]/LIVESTREAM_LIMIT),
      current_page: page,
      list_stream:rss[1],
      list_schedule:rs[1],
    })
  }catch (err){
    console.log("err getAllStreams", err);
    return res.status(err.status).json(err);
  }
}

export async function updateIsLive(req,res) {
  try{
    let StreamId = await StringHelper.isObjectId(req.params.id);
    if(!StreamId){
      throw {
        status:404,
        success:false,
        err:'Query not format!'
      }
    }
    let options = {
      user_req:req.user._id,
      streamId:req.params.id
    };
    let data = await liveStream_Services.updateIsPlay(options);
    // Notify
    // let author = await User.formatBasicInfoById(User, req.user._id);
    // let username = author.userName || author.cuid;
    // url = `${username}/videos/${data._id.toString()}`;
    // let users = await getFollowerByUserId(req.user._id);
    // if(users){
    //   users.map(async user =>{
    //     if(user.cuid){
    //       let dataNotify = {
    //         userID : user.cuid,
    //         userSendID : author.cuid,
    //         type : 'LiveScheduleStream',
    //         data : {
    //           url: url
    //         }
    //       };
    /** Data Notification News Format.
            let dataNews = {
              to:user._id,
              from:author._id,
              object:data._id,
              data:{
                url:url
              },
              type:"LiveScheduleStream",
            }
     */
    //       Q.create(globalConstants.jobName.ADD_NOTIFY, dataNotify).removeOnComplete(true).save();
    //     }
    //   });
    // }
    return res.json({
      status:200,
      success:true,
      msg:'Update Live Success!',
      data:data
    })
  }catch (err){
    console.log("err updateIsPlay", err);
    return res.status(err.status).json(err);
  }
}

export async function getStreamHome(req,res) {
  try{
    let lang = req.headers.lang || 'en';
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || 12).valueOf();
    let type = req.query.type ? req.query.type.toString() : "live";
    let skip = (page - 1) * limit;
    let options = {
      limit: limit,
      skip: skip,
      lang: lang,
      type: type
    };
    if(req.headers.token){
      let user = await User.findOne({token:req.headers.token}).lean();
      if(user){
        options.user_req = user._id
      }
    }
    //Stream Living
    let living = await Promise.all([
      liveStream_Services.getLiving(options),
      liveStream_Services.getCountLiving(options)
    ]);
    //Stream Schedule
    let schedule = await Promise.all([
      liveStream_Services.getScheduleByUser(options),
      liveStream_Services.countScheduleByUser(options)
    ]);
    return res.json({
      success:true,
      data:{
        current_page: page,
        total_page_living: Math.ceil(living[1]/limit),
        total_page_schedule: Math.ceil(schedule[1]/limit),
        total_living:living[1],
        total_schedule:schedule[1],
        data_living:living[0],
        data_schedule:schedule[0],
      }
    })
  }catch (err){
    console.log("err getStreamHome", err);
    return res.status(err.status).json(err);
  }
}

export async function getListStream(req,res) {
  try{
    let lang = req.headers.lang || 'en';
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || LIVESTREAM_LIMIT).valueOf();
    let type = req.query.type ? req.query.type.toString() : "live";
    let skip = (page - 1) * limit;
    let options = {
      limit: limit,
      skip: skip,
      lang: lang,
      type: type
    };
    if(req.headers.token){
      let user = await User.findOne({token:req.headers.token}).lean();
      if(user){
        options.user_req = user._id
      }
    }
    //Get Stream
    let rs = await liveStream_Services.getAllStream(options);

    //Response
    return res.json({
      success:true,
      data:{
        current_page: page,
        total_page:Math.ceil(rs[1]/limit),
        total_stream : rs[1],
        data : rs[0]
      }
    })
  }catch(err) {
    console.log("err getListStream", err);
    return res.status(err.status).json(err);
  }
}

export function checkStreamPermission(req, res) {
  try {
    return res.status(200).json({
      success: req.permission && req.permission !== 'denied',
      permission: req.permission
    });
  } catch (err) {
    console.log("err checkStreamPermission", err);
    return res.status(err.status || 500).json(err);
  }
}

export function createStreamQueueJob(req, res) {
  try {
    let type = req.body.type;
    let data = req.body.data;
    if ( type && data ) {
      AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {
        type: type,
        obj: data
      });

      return res.json({
        success: true
      })
    } else {
      return res.status(500).json({
        success: false,
        error: 'Data is not valid'
      })
    }
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      error: err.toString()
    })
  }
}

export async function checkWebinarBuyAble(req, res) {
  try {
    let ticketId = req.query.ticket;
    let code = req.query.code;
    if(!StringHelper.isObjectId(ticketId)) {
      return res.status(404).json({success: false, error: 'Ticket not found.'});
    }

    let quantity = Number(req.query.quantity).valueOf();
    if(isNaN(quantity)) {
      return res.status(400).json({success: false, error: 'Invalid quantity.'});
    }

    let data = await WebinarTicketServices.checkBuyAble(req.user._id, ticketId, quantity, req.headers.lang, code);

    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function buyWebinarTicket(req, res) {
  try {
    let ticketId = req.query.ticket || '';
    let code = req.query.code || '';
    const affCode = req.query.aff;

    if (!StringHelper.isObjectId(ticketId)) {
      return res.status(404).json({success: false, error: 'Ticket not found.'});
    }

    let quantity = Number(req.query.quantity).valueOf();
    if (isNaN(quantity)) {
      return res.status(400).json({success: false, error: 'Invalid quantity.'});
    }

    let contactInfo = req.body.contactInfo;
    if(!contactInfo || !contactInfo.fullName || !contactInfo.email || !contactInfo.phoneNumber) {
      return res.status(400).json({success: false, error: 'Invalid contact info.'});
    }

    let data = await WebinarTicketServices.bookWebinarTicket(req.user._id, ticketId, quantity, req.headers.lang, contactInfo, affCode, code);

    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getStreamHistory(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    if(isNaN(page)) {
      return res.status(400).json({success: false, error: 'Invalid page'});
    }

    let data = await liveStream_Services.getLiveStreamHistory(req.user._id, page, req.headers.lang);
    data.success = true;

    return res.status(200).json(data);
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function changeStreamStatus(req, res) {
  try {
    let streamId = req.params.id, status = req.body.status, totalViewed = Number(req.body.totalViewed).valueOf();
    let platform = req.query.platform;

    if(['web', 'mobile'].indexOf(platform) < 0) {
      platform = 'web';
    }

    if(!StringHelper.isObjectId(streamId)) {
      return res.status(404).json({success: false, error: 'Stream not found.'});
    }

    if(['new', 'living', 'stopped'].indexOf(status) < 0) {
      return res.status(400).json({success: false, error: 'Invalid status.'});
    }

    await liveStream_Services.changeStreamStatus(streamId, status, totalViewed, platform);

    return res.status(200).json({success: true});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getBookedWebinar(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    if(isNaN(page)) {
      return res.status(400).json({success: false, error: 'Invalid page'});
    }

    let data = await liveStream_Services.getMyBookedWebinar(req.user._id, page, req.headers.lang);
    data.success = true;

    return res.status(200).json(data);
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getBookedTickets(req, res) {
  try {
    let webinarId = req.params.id;
    if(!StringHelper.isObjectId(webinarId)) {
      return res.status(404).json({success: false, error: 'Webinar not found.'});
    }
    let data = await WebinarTicketServices.getBookedTickets(webinarId, req.user._id);
    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function interactWebinar(req, res) {
  try {
    let webinarId = req.params.id;
    if(!StringHelper.isObjectId(webinarId)) {
      return res.status(404).json({success: false, error: 'Webinar not found.'});
    }

    let data = await InteractWebinarServices.interactWebinar(req.user._id, webinarId, req.body.interact);

    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getWebinarStatistic(req, res) {
  try {
    let webinarId = req.params.id;
    if (!StringHelper.isObjectId(webinarId)) {
      return res.status(404).json({success: false, error: 'Webinar not found.'});
    }

    let page = Number(req.query.page || 1).valueOf();
    if (isNaN(page)) {
      return res.status(400).json({success: false, error: 'Invalid page'});
    }

    let data = await WebinarTicketServices.statisticWebinar(webinarId, page);
    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getWebinarInteractions(req, res) {
  try {
    let webinarId = req.params.id;
    if(!StringHelper.isObjectId(webinarId)) {
      return res.status(404).json({success: false, error: 'Webinar not found.'});
    }

    let page = Number(req.query.page || 1).valueOf();
    if(isNaN(page)) {
      return res.status(400).json({success: false, error: 'Invalid page'});
    }

    let data = await InteractWebinarServices.getWebinarInteractions(webinarId, req.query.interact, page);

    data.success = true;

    return res.status(200).json(data);

  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function validateTicket(req, res) {
  try {
    let webinarId = req.params.id;
    if(!StringHelper.isObjectId(webinarId)) {
      return res.status(404).json({success: false, error: 'Webinar not found.'});
    }

    let valid = await WebinarTicketServices.validateTicket(webinarId, req.query.ticket);

    return res.status(200).json({success: true, valid});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function validatePassword(req, res) {
  try {
    let webinarId = req.params.id;
    let password = req.query.password;

    if(!StringHelper.isObjectId(webinarId)) {
      return res.status(404).json({success: false, error: 'WEBINAR_NOT_FOUND'});
    }
    if(!password) {
      return res.status(404).json({success: false, error: 'PASSWORD_EMPTY'});
    }
    let webinarInfo = await LiveStream.findOne({_id: webinarId, 'privacy.to': 'password'}).lean();
    if(!webinarInfo){
      return res.status(404).json({success: false, error: 'WEBINAR_NOT_FOUND'});
    }
    if(!validate(webinarInfo.password,sanitizeHtml(password))) {
      return res.status(404).json({success: false, error: 'PASSWORD_NOT_CORRECT'});
    }
    return res.status(200).json({success: true, valid: true});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getEvents(req,res) {
  try {
    let lang = req.headers.lang || 'en';
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || 12).valueOf();
    let skip = (page - 1) * limit;
    let options = {
      lang,
      skip,
      limit
    };
    if (req.headers.token) {
      let user = await User.findOne({token: req.headers.token}).lean();
      if (user) {
        options.user_req = user._id
      }
    }
    let rs = await liveStream_Services.getEvents(options);
    return res.json({
      success: true,
      current_page: page,
      total_page: Math.ceil(rs[1] / limit),
      total_stream: rs[1],
      data: rs[0]
    })
  } catch (err) {
    return res.status(err.status).json(err);
  }
}

/**
 * Add one more for streamFiles
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function updateStreamFiles(req, res) {
  const streamId = req.params.id;
  if ( ! StringHelper.isObjectId(streamId) ) {
    return res.status(404).json({success: false, error: 'Stream id is not valid.'});
  }
  /**
   * {
   *   fileId: 'the-file-id', // The fileId on GDrive
   *   name: 'the-video-id', // The name of file on GDrive
   * }
   */
  const streamFileInfo = req.body;
  // Check the streamInfo is valid
  if ( streamFileInfo && streamFileInfo.fileId && streamFileInfo.name ) {
    // Update stream info
    try {
      const updateResult = await LiveStream.update({_id: mongoose.Types.ObjectId(streamId)}, { $push: {
        streamFiles: {
          fileId: streamFileInfo.fileId,
          name: streamFileInfo.name,
        }
      }});
      if ( updateResult.nModified > 0 ) {
        return res.json({
          success: true,
          data: updateResult
        });
      } else {
        return res.status(404).json({
          success: false,
          error: 'Stream not found'
        });
      }
    } catch ( error ) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  return res.status(500).json({
    success: false,
    error: 'The info of stream is not enough'
  });
}

export async function getStreamCourse( req, res ) {
  const streamId = req.params.id;
  if ( ! StringHelper.isObjectId(streamId) ) {
    return res.status(404).json({success: false, error: 'Stream id is not valid.'});
  }
  try {
    const findResult = await LiveStream.findOne({_id: mongoose.Types.ObjectId(streamId)}, 'course');
    if ( findResult ) {
      return res.json({
        success: true,
        data: findResult
      });
    } else {
      return res.status(200).json({
        success: false,
        error: 'Stream not found',
        errorCode: 'StreamNotFound',
      });
    }
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function getStreamCourseForAdmin( req, res ) {
  const courseId = req.query.id;
  if ( ! StringHelper.isObjectId(courseId) ) {
    return res.status(404).json({success: false, error: 'Course Id is not valid.'});
  }
  // Update stream info
  try {
    const findResult = await LiveStream.find({course: courseId}, 'title status');
    if ( findResult ) {
      return res.json({
        success: true,
        data: findResult
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function viewVideo(req, res) {
  try {
    let options = req.body;
    if(!options.videoId){
      throw {
        success:false,
        status: 400,
        error: 'Invalid Params.'
      }
    }
    options.userId = req.user._id;
    let data = await Video_Service.viewVideo(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

export async function getViewVideo(req, res) {
  try {
    let videoId = req.params.id;
    let type = req.query.type;
    if(!videoId){
      throw {
        success:false,
        status: 400,
        error: 'Invalid Params.'
      }
    }
    return res.json({
      success: true,
      data: await Video_Service.getViewVideo(videoId, type)
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}
