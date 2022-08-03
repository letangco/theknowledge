import LiveStream from '../models/liveStream';
import ViewVideo from '../models/viewVideo';
import Video from '../models/videos';
import TrackingVideo from '../models/trackingVideo';
import Course from "../models/courses";
import User from "../models/user";
import ArrayHelper from "../util/ArrayHelper";
import mongoose from 'mongoose'
const ObjectId = mongoose.Types.ObjectId
export async function getVideos(data) {
  try {
    let videos = await LiveStream.aggregate([
      { $match:{
          streamFiles: {$exists: true, $ne: []},
          course: {$exists: true, $ne: null},
          'streamFiles.status': true
        }},
      {$project:{
          user: '$user',
          course:"$course",
          title: "$title",
          description: '$description',
          thumbnail: '$thumbnail',
          streamFiles: '$streamFiles'
        }},
      {$unwind: '$streamFiles'},
      {
        $group:
          {
            _id: {
              'lessonID': "$_id",
              'user': '$user',
              'course':"$course",
              'title': "$title",
              'description': '$description',
              'thumbnail': '$thumbnail'
            },
            lastVideo: { $last: "$streamFiles" },
            count: { $sum: 1 }
          }
      },
      {$sort:{'lastSalesDate': -1}},
      {$skip: data.skip},
      {$limit: data.limit}
    ]).exec();
    if(videos) {
      let promise = videos.map(async video => {
        let data = video._id;
        let userInfo = await User.findOne({_id: data.user},
          'cuid, userName, firstName, lastName, fullName, avatar'
        ).lean();
        let courseInfo = await Course.findOne({_id: data.course},
          'title, slug, description').lean();
        return {
          lessonID: data.lessonID,
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          video: video.lastVideo,
          user: userInfo,
          course: courseInfo
        }
      })
      return Promise.all(promise);
    }
    return [];
  } catch (err){
    console.log("err getVideos:", err);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}

export async function getTotalVideos() {
  try {
    let result = await LiveStream.aggregate([
      { $match:{
          streamFiles: {$exists: true, $ne: []},
          course: {$exists: true, $ne: null},
          'streamFiles.status': true
        }},
      {$unwind: '$streamFiles'},
      {
        $group:
          {
            _id:  "$_id",
            lastVideo: { $last: "$streamFiles" }
          }
      },
      {
        $count: "total"
      }
    ]).exec();
    if(result){
      return result[0].total;
    }
  } catch (err){
    console.log("err getTotalVideos:", err);
    return Promise.reject({status:400, success:false, err:"Error!!"})
  }
}

export async function viewVideo(options) {
  try {
    if(options === 'video'){
      let check = await ViewVideo.findOne({ videoId: options.videoId}).lean();
      if (check) {
        await ViewVideo.update({ videoId: options.videoId}, {$set: {count: check.count + 1}});
      } else {
        await ViewVideo.create({ videoId: options.videoId, count: 1});
      }
    } else {
      let check = await ViewVideo.findOne({ streamId: options.videoId}).lean();
      if (check) {
        await ViewVideo.update({ streamId: options.videoId}, {$set: {count: check.count + 1}});
      } else {
        await ViewVideo.create({ streamId: options.videoId, count: 1});
      }
    }
  } catch (err) {
    console.log('error viewVideo : ', err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}
export async function getViewVideo(videoId, type) {
  try {
    if(type === 'video'){
      let data = await ViewVideo.findOne({videoId: videoId}).lean();
      return data ? data.count : 1
    } else {
      let data = await ViewVideo.findOne({streamId: videoId}).lean();
      return data ? data.count : 1
    }
  } catch (err) {
    console.log('error viewVideo : ', err);
    return Promise.reject({status: 500, success: false, error: 'Internal Server Error.'})
  }
}
export async function serviceGetCurrentTime(videoId, type = 'video', userId) {
  if(type === 'video'){
    let time =  await TrackingVideo.findOne({
      videoId: videoId,
      userId: userId
    }).lean()
    return time
  } else {
    let time =  await TrackingVideo.findOne({
      streamId: videoId,
      userId: userId
    }).lean()
    return time
  }
}
export async function serviceUpdateCurrentTime(data) {
  if(data.type === 'video'){
    let time =  await TrackingVideo.findOne({
      videoId: data.videoId,
      courseId: data.courseId,
      userId: data.userId
    }).lean()
    if(time){
      if(time.complete === true){
        data.complete = time.complete
      }
      await TrackingVideo.update({
          videoId: data.videoId,
          courseId: data.courseId,
          userId: data.userId
        },
        {$set: {
            time: data.time,
            complete: data.complete
          }})
    } else {
      await TrackingVideo.create({
        videoId: data.videoId,
        userId: data.userId,
        courseId: data.courseId,
        time: data.time,
        complete: data.complete
      })
    }
  } else {
    let time =  await TrackingVideo.findOne({
      streamId: data.videoId,
      courseId: data.courseId,
      userId: data.userId
    }).lean()
    if(time){
      if(time.complete === true){
        data.complete = time.complete
      }
      await TrackingVideo.update({
          streamId: data.videoId,
          courseId: data.courseId,
          userId: data.userId
        },
        {$set: {
            time: data.time,
            complete: data.complete
          }})
    } else {
      await TrackingVideo.create({
        streamId: data.videoId,
        userId: data.userId,
        courseId: data.courseId,
        time: data.time,
        complete: data.complete
      })
    }
  }
}

export async function serviceGetCompleteCourse(courseId, userId) {
  let data = await TrackingVideo.find({
    courseId, userId
  }).lean()
  if(data){
    data = ArrayHelper.toObjectByKey(data, 'videoId');
    return data
  }
  return {}
}
export async function serviceGetCompleteProcess(courseId, userId) {
  let dataComplete = await TrackingVideo.count({
    courseId,
    userId,
    complete: true,
    streamId: null
  }).lean()
  let data = await LiveStream.find({course: courseId}, '_id').lean()
  let lessons = []
  if(data){
    data.map( lesson => {
      lessons.push(lesson)
    })
  }
  let dataVideo = await Video.count({
    lesson: {$in: lessons}
  }).lean()
  return {
    complete: dataComplete,
    total: dataVideo
  }
}
export async function serviceGetTotalUser(courseId) {
  let data = await TrackingVideo.aggregate([
    {
      $match: {
        courseId: ObjectId(courseId)
      }
    },
    {$group: {
      _id: '$userId'
      }}
  ]);
  return data.length
}
