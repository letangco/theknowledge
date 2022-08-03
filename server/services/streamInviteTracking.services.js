import StreamInviteTracking from '../models/streamInviteTracking';
import Course from '../models/courses';
import LiveStream from '../models/liveStream';
import User from '../models/user';
import StringHelper from '../util/StringHelper';
import mongoose from "mongoose";

/**
 * Add stream invite tracking to database
 * @param trackingData
 * @param trackingData.streamId
 * @param trackingData.courseId
 * @param trackingData.userId
 * @param trackingData.beginTime
 * @param trackingData.endTime
 * @param trackingData.totalTime
 * @param trackingData.device
 * @param trackingData.publishStreamId
 * @param trackingData.isHandUp
 * @param trackingData.connected
 * @returns {Promise.<*>}
 */
export async function addStreamInviteTracking(trackingData) {
  const streamId = trackingData.streamId;
  if ( ! StringHelper.isObjectId(streamId) ) {
    return Promise.reject(Error('Stream id is not valid.'));
  }
  const userId = trackingData.userId;
  if ( ! StringHelper.isObjectId(userId) ) {
    return Promise.reject(Error('User id is not valid.'));
  }
  // const beginTime = trackingData.beginTime;
  // const endTime = trackingData.endTime;
  // if ( ! beginTime || ! endTime ) {
  //   return Promise.reject(Error('Tracking data is not enough.'));
  // }
  // if ( ! trackingData.totalTime ) {
  //   trackingData.totalTime = parseInt(((endTime - beginTime)/1000).toFixed(0)) || -1;
  // }
  // Create new one
  try {
    const stream = await LiveStream.findOne({_id: streamId}, {course: 1}).lean();
    if ( stream && stream.course ) {
      // Add tracking for this course
      trackingData.courseId = stream.course;
    }
    const streamInviteTracking = new StreamInviteTracking(trackingData);
    await streamInviteTracking.save();
    return {
      success: true,
      data: streamInviteTracking,
    };
  } catch ( error ) {
    return Promise.reject(error);
  }
}

export async function getCourseHaveInviteTracking(page) {
  try {
    const pageNumber = Number(page || 1).valueOf();
    const limit = 10;
    const skip = (pageNumber - 1) * limit;
    const countResult = await StreamInviteTracking.aggregate(
      [
        {
          $match: {
            courseId: { $ne: null }
          }
        },
        {
          $group : {
            _id : "$courseId",
          }
        },
        {
          $count: "total_items"
        }
      ]
    );
    const total_items = countResult[0].total_items;
    const streamInviteTracking = await StreamInviteTracking.aggregate(
      [
        {
          $match: {
            courseId: { $ne: null }
          }
        },
        {
          $group : {
            _id : "$courseId",
          }
        },
        { $skip : skip },
        { $limit : limit },
      ]
    );
    const promises = streamInviteTracking.map(async tracking => {
      tracking.course = await Course.findOne({_id: tracking._id}, 'title status slug');
      return tracking;
    });
    const streamInviteTrackingFormatted = await Promise.all(promises);
    // Map user to this result
    return {
      data: streamInviteTrackingFormatted,
      current_page: pageNumber,
      last_page: Math.ceil(total_items / limit),
    };
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function getStreamsOfCourse(courseId) {
  try {
    if ( ! StringHelper.isObjectId(courseId) ) {
      return Promise.reject(Error('Course id is not valid.'));
    }
    const streamTrackings = await StreamInviteTracking.aggregate(
      [
        {
          $match: {
            courseId: mongoose.Types.ObjectId(courseId),
          }
        },
        {
          $group : {
            _id : "$streamId",
          }
        },
      ]
    );
    const streams = [];
    const promises = streamTrackings.map( async streamTracking => {
      let stream = await LiveStream.findOne({_id: streamTracking._id}, 'title status').lean();
      let inviteInfo = await getStreamInviteTrackingInfo(stream._id);
      stream = Object.assign(stream, inviteInfo);
      streams.push(stream);
    });
    await Promise.all(promises);

    return {
      data: streams,
    };
  } catch ( error ) {
    return Promise.reject(error);
  }
}

export async function getStreamOfCourse(streamId) {
  try {
    if ( ! StringHelper.isObjectId(streamId) ) {
      return Promise.reject(Error('Stream id is not valid.'));
    }

    const numInvite = await StreamInviteTracking.count({streamId: streamId});
    if ( numInvite ) {
      let stream = await LiveStream.findOne({_id: streamId}, 'title status').lean();
      let inviteInfo = await getStreamInviteTrackingInfo(stream._id);
      stream = Object.assign(stream, inviteInfo);

      return {
        data: stream,
      };
    }
    return {
      data: null,
    };
  } catch ( error ) {
    return Promise.reject(error);
  }
}

async function getStreamInviteTrackingInfo(streamId, _numInvite) {
  // Count the num invite connect
  const numInvite = _numInvite || await StreamInviteTracking.count({streamId: streamId});
  const numInviteConnected = await StreamInviteTracking.count({streamId: streamId, connected: true});
  const countResult = await StreamInviteTracking.aggregate(
    [
      {
        $match: {
          streamId: streamId,
        }
      },
      {
        $group: {
          _id: null,
          totalTimeConnected: { $sum: "$totalTime" },
        }
      }
    ]
  );

  return {
    numInvite: numInvite,
    numInviteConnected: numInviteConnected,
    totalTimeConnected: countResult[0].totalTimeConnected,
  };
}

const sortableFields = [
  'isHandUp',
  'totalTime',
  'beginTime',
];

const sortOrder = {
  desc: -1,
  asc: 1,
};
export async function getStreamInviteTrackingData( streamId, page, order, orderBy ) {
  if ( ! StringHelper.isObjectId(streamId) ) {
    return Promise.reject(Error('Stream id is not valid.'));
  }
  // Find all tracking data of this stream
  try {
    const limit = 10;
    const pageNumber = Number(page || 1).valueOf();
    const skip = (pageNumber - 1) * limit;
    const queryConditions = {streamId: streamId};
    const total_items = await StreamInviteTracking.count(queryConditions);

    let sortConditions = {beginTime: -1};
    if ( sortOrder[order] && sortableFields.indexOf(orderBy) !== -1 ) {
      sortConditions = {[orderBy]: sortOrder[order]};
    }

    const streamInviteTrackingData = await StreamInviteTracking.find(queryConditions).sort(sortConditions).skip(skip).limit(limit).lean();
    const userIds = streamInviteTrackingData.map(tracking => tracking.userId);
    const users = await User.formatBasicInfo(User, userIds, 'cuid userName email fullName memberShip telephone');
    const promises = streamInviteTrackingData.map(async tracking => {
      tracking.user = users.find(user => user._id.toString() === tracking.userId.toString());
      return tracking;
    });
    const streamInviteTrackingDataFormatted = await Promise.all(promises);
    return {
      data: streamInviteTrackingDataFormatted,
      current_page: pageNumber,
      last_page: Math.ceil(total_items / limit),
    };
  } catch ( error ) {
    Promise.reject(error);
  }
}
