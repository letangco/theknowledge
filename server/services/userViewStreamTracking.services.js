import UserViewStreamTracking from '../models/userViewStreamTracking';
import LiveStream from '../models/liveStream';
import Course from '../models/courses';
import StringHelper from '../util/StringHelper';
import {addUserViewCourseTracking} from "./userViewCourseTracking.services";
import mongoose from 'mongoose';
import User from '../models/user';
import { Parser } from 'json2csv';
import HistoryActionUser from '../models/historyActionUser';
import globalConstants from "../../config/globalConstants";
import fs from 'fs'
import execa from 'execa';
import path from 'path'
import {formatTimeSecToFullTime} from "../util/DateTimeHelper";

/**
 * Add user view tracking to database
 * @param trackingData
 * @param trackingData.streamId
 * @param trackingData.internalMeetingId
 * @param trackingData.userId
 * @param trackingData.beginTime
 * @param trackingData.endTime
 * @param trackingData.totalTime
 * @param trackingData.device
 * @returns {Promise.<*>}
 */
export async function addUserViewStreamTracking(trackingData) {
  const streamId = trackingData.streamId;
  if ( ! StringHelper.isObjectId(streamId) ) {
    return Promise.reject(Error('Stream id is not valid.'));
  }
  const userId = trackingData.userId;
  if ( ! StringHelper.isObjectId(userId) ) {
    return Promise.reject(Error('User id is not valid.'));
  }
  const beginTime = trackingData.beginTime;
  const endTime = trackingData.endTime;
  if ( ! beginTime || ! endTime ) {
    return Promise.reject(Error('Tracking data is not enough.'));
  }
  if ( ! trackingData.totalTime ) {
    trackingData.totalTime = parseInt(((endTime - beginTime)/1000).toFixed(0)) || -1;
  }
  // Create new one
  try {
    const stream = await LiveStream.findOne({_id: streamId}, {course: 1}).lean();
    if ( stream && stream.course ) {
      // Add tracking for this course
      trackingData.courseId = stream.course;
      await addUserViewCourseTracking({
        courseId: stream.course.toString(),
        userId: userId,
        lastLearningDate: endTime,
        lastLearningTime: trackingData.totalTime,
        totalTimeView: trackingData.totalTime,
      });
    }
    const userViewStreamTracking = new UserViewStreamTracking(trackingData);
    await userViewStreamTracking.save();
    await HistoryActionUser.create({
      user: userId,
      object: streamId,
      type: globalConstants.ACTIONS.CLICK_LIVESTREAM,
      time: Date.now()
    });
    return {
      success: true,
      data: userViewStreamTracking,
    };
  } catch ( error ) {
    return Promise.reject(error);
  }
}

export async function getUserViewStreamTrackingData( streamId, userId ) {
  if ( ! StringHelper.isObjectId(streamId) ) {
    return Promise.reject(Error('Stream id is not valid.'));
  }
  if ( ! StringHelper.isObjectId(userId) ) {
    return Promise.reject(Error('User id is not valid.'));
  }
  // Find all tracking data of this stream
  try {
    const userViewStreamTrackingData = await UserViewStreamTracking.find({userId: userId, streamId: streamId}).sort({ _id: 1 }).lean();
    let totalTime = 0;
    userViewStreamTrackingData.map( tracking => {
      totalTime += tracking.totalTime;
    });
    return {
      success: true,
      payload: {
        userViewStreamTrackingData: userViewStreamTrackingData,
        totalTime: totalTime,
      },
    };
  } catch ( error ) {
    Promise.reject(error);
  }
}

export async function getTotalTimeViewStream( streamId, userId ) {
  if ( ! StringHelper.isObjectId(streamId) ) {
    return Promise.reject(Error('Stream id is not valid.'));
  }
  if ( ! StringHelper.isObjectId(userId) ) {
    return Promise.reject(Error('User id is not valid.'));
  }
  // Find all tracking data of this stream
  streamId = typeof streamId === 'string' ? mongoose.Types.ObjectId(streamId) : streamId;
  userId = typeof userId === 'string' ? mongoose.Types.ObjectId(userId) : userId;
  try {
    let totalTime = 0;
    const userViewStreamTracking = await UserViewStreamTracking.aggregate([
      {
        $match: {
          streamId: streamId,
          userId: userId,
        }
      },
      {
        $group: {
          _id: null,
          totalTime: {$sum: "$totalTime"}
        }
      }
    ]);

    if ( userViewStreamTracking instanceof Array && userViewStreamTracking.length > 0 ) {
      totalTime = userViewStreamTracking[0].totalTime;
    }

    return totalTime;
  } catch ( error ) {
    Promise.reject(error);
  }
}
//
// export async function getTotalTimeViewCourse( courseId, userId ) {
//   if ( ! StringHelper.isObjectId(courseId) ) {
//     return Promise.reject(Error('Course id is not valid.'));
//   }
//   if ( ! StringHelper.isObjectId(userId) ) {
//     return Promise.reject(Error('User id is not valid.'));
//   }
//   // Find all tracking data of this stream
//   try {
//     const userViewCourseTrackingData = await UserViewStreamTracking.find({ courseId: courseId, userId: userId });
//     let totalTime = 0;
//     userViewCourseTrackingData.map( tracking => {
//       totalTime += tracking.totalTime;
//     });
//     return totalTime;
//   } catch ( error ) {
//     Promise.reject(error);
//   }
// }

const sortOrder = {
  desc: -1,
  asc: 1,
};
const sortableFields = [
  'totalTime',
];
/**
 * Get user has been view this stream info
 * @param page
 * @param order
 * @param orderBy
 * @param streamId
 * @returns {Promise.<*>}
 */
export async function getUserViewStreamTrackingInfo(page, order, orderBy, streamId) {
  try {
    const pageNumber = Number(page || 1).valueOf();
    streamId = typeof streamId === 'string' ? mongoose.Types.ObjectId(streamId) : streamId;
    const queryConditions = {
       streamId: streamId,
    };
    let sortConditions = {_id: -1};
    if ( sortOrder[order] && sortableFields.indexOf(orderBy) !== -1 ) {
      sortConditions = {[orderBy]: sortOrder[order]};
    }
    const limit = 10;
    const skip = (pageNumber - 1) * limit;
    let total_items = 0;
    const viewerTrackingCounter = await UserViewStreamTracking.aggregate([
      {
        $match: queryConditions
      },
      {
        $group: {
          _id: {streamId: "$streamId", userId: "$userId"},
        }
      },
      {
        $group: {
          _id: null,
          total_items: {$sum: 1}
        }
      }
    ]);

    if ( viewerTrackingCounter instanceof Array && viewerTrackingCounter.length > 0 ) {
      total_items = viewerTrackingCounter[0].total_items || 0;
    }

    if ( total_items === 0 ) {
      // Have no data
      return {
        data: [],
        current_page: pageNumber,
        last_page: 0,
      };
    }

    const userViewTrackingFound = await UserViewStreamTracking.aggregate([
      {
        $match: queryConditions
      },
      {
        $sort: sortConditions
      },
      {
        $group: {
          _id: {streamId: "$streamId", userId: "$userId"},
          totalTime: {$sum: "$totalTime"},
          tracking: { $push: "$$ROOT" },
        }
      },
      { $skip : skip },
      { $limit : limit },
    ]);

    const userIds = userViewTrackingFound.map(tracking => tracking._id.userId);
    const users = await User.formatBasicInfo(User, userIds, 'cuid userName email fullName memberShip telephone');

    const promises = userViewTrackingFound.map(async tracking => {
      tracking.user = users.find(user => user._id.toString() === tracking._id.userId.toString());
      return tracking;
    });
    const userViewTrackingFoundFormatted = await Promise.all(promises);
    // Map user to this result
    return {
      data: userViewTrackingFoundFormatted,
      current_page: pageNumber,
      last_page: Math.ceil(total_items / limit),
    };
  } catch (error) {
    console.error('getUserViewStreamTrackingInfo error:');
    console.error(error);
    return Promise.reject(error);
  }
}

/**
 * Export the courses that user viewed
 * @param courseId
 * @returns {Promise.<*>}
 */
export async function exportUserViewStreamTrackingByCourse(courseId) {
  try {
    if ( ! courseId ) {
      return Promise.reject(Error('Course Id is not valid'));
    }
    try {
      courseId = mongoose.Types.ObjectId(courseId);
    } catch ( error ) {
      console.error('exportUserViewStreamTrackingByCourse parse courseId error:');
      console.error(error);
      return Promise.reject(error);
    }

    // Find stream id by course
    // Get user tracking by stream - lesson
    let course, courseName;
    try {
      course = await Course.findById(courseId);
      courseName = course.title || 'N/A';
    } catch ( error ) {
      console.error('exportUserViewStreamTrackingByCourse get course error:');
      console.error(error);
      return Promise.reject(error);
    }
    const sortConditions = { _id : -1 };
    const queryConditions = {
      courseId: courseId,
    };
    let courseTrackingFound = await UserViewStreamTracking.aggregate([
      { $match : queryConditions },
      { $sort : sortConditions },
      {
        $group: {
          _id: { streamId: "$streamId", userId: "$userId" },
          totalTime: { $sum: "$totalTime" },
          // tracking: { $push: "$$ROOT" },
        }
      },
      {
        $lookup:
        {
          from: "livestreams",
            localField: "_id.streamId",
          foreignField: "_id",
          as: "liveStream"
        }
      },
      {
        $unwind: "$liveStream",
      },
      {
        $lookup:
        {
          from: "users",
            localField: "_id.userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user",
      },
    ]);

    let data = [];
    if ( courseTrackingFound ) {
      data = courseTrackingFound.map(tracking => {
        const newData = {
          courseName: 'N/A',
          lessonName: 'N/A',
          userId: 'N/A',
          fullName: 'N/A',
          email: 'N/A',
          telephone: 'N/A',
          memberShip: 'N/A',
          totalWatchTime: 'N/A',
        };
        const user = tracking.user;
        if ( user ) {
          newData.userId = user._id || 'N/A';
          newData.fullName = user.fullName || user.firstName || user.lastName || 'N/A';
          newData.email = user.email || 'N/A';
          newData.telephone = user.telephone || 'N/A';
          newData.memberShip = user.memberShip ? (new Date(user.memberShip)).toLocaleString() : 'N/A';
        }
        const liveStream = tracking.liveStream;
        if ( liveStream ) {
          newData.lessonName = liveStream.title || 'N/A';
        }
        newData.courseName = courseName;
        newData.totalWatchTime = tracking.totalTime ? formatTimeSecToFullTime(tracking.totalTime) : 'N/A';

        return newData;
      });
    }
    const fields = ['courseName', 'lessonName', 'userId', 'fullName', 'email', 'telephone', 'memberShip', 'totalWatchTime'];
    const fileName = `userTrackingByCourse-${Date.now()}.csv`;
    let dir = path.join(__dirname, '..', '..', 'exports', fileName);
    if (data.length > 0) {
      let shell_script = 'cd ' + path.join(__dirname, '..', '..', 'exports') + ' && rm -f *.csv';
      execa.commandSync(shell_script);
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(data);
      fs.writeFileSync(dir, csv);
    } else {
      fs.writeFileSync(dir, '');
    }
    return fileName;
  } catch (error) {
    console.error('exportUserViewStreamTrackingByCourse error');
    console.error(error);
    return Promise.reject(error);
  }
}
