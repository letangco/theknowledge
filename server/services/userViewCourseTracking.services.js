import UserViewCourseTracking from '../models/userViewCourseTracking';
import StringHelper from '../util/StringHelper';
import mongoose from 'mongoose';
import { addUserViewTracking } from './userViewTracking.services';
import { addUserToCourseForTracking } from './userToCourses.services';
import logger from '../util/log';

/**
 * Add user view stream on course tracking to database
 * @param trackingData
 * @param trackingData.courseId
 * @param trackingData.userId
 * @param trackingData.lastLearningDate
 * @param trackingData.lastLearningTime
 * @param trackingData.totalTimeView
 * @returns {Promise.<*>}
 */
export async function addUserViewCourseTracking(trackingData) {
  const courseId = trackingData.courseId;
  if ( ! StringHelper.isObjectId(courseId) ) {
    return Promise.reject(Error('Course id is not valid.'));
  }
  const userId = trackingData.userId;
  if ( ! StringHelper.isObjectId(userId) ) {
    return Promise.reject(Error('User id is not valid.'));
  }
  // Create new one
  try {
    // No need to add more tracking when the tracking is already exists
    let existedTracking = await UserViewCourseTracking.findOne({ courseId: courseId, userId: userId });
    if ( existedTracking ) {
      // Update
      existedTracking.lastLearningDate = trackingData.lastLearningDate;
      existedTracking.lastLearningTime = trackingData.lastLearningTime;
      existedTracking.totalTimeView += trackingData.totalTimeView;
      await existedTracking.save();
    } else {
      // Add new
      const userViewCourseTracking = new UserViewCourseTracking(trackingData);
      await userViewCourseTracking.save();
      existedTracking = userViewCourseTracking;
    }
    try {
      await addUserViewTracking({
        userId: userId,
        lastLearningCourse: courseId,
        lastLearningDate: trackingData.lastLearningDate,
        lastLearningTime: trackingData.lastLearningTime,
        totalTimeView: trackingData.totalTimeView,
      })
    } catch (error) {
      return Promise.reject(error);
    }
    addUserToCourseForTracking({
      user: userId,
      course: courseId,
    }).catch((error) => {
      logger.error(`addUserViewCourseTracking, addUserToCourseForTracking error: ${error.toString()}`);
    });
    return {
      success: true,
      data: existedTracking,
    };
  } catch ( error ) {
    return Promise.reject(error);
  }
}

const sortableFields = [
  'totalTimeView',
];

const sortOrder = {
  desc: -1,
  asc: 1,
};
/**
 * Get the courses that user viewed
 * @param userId
 * @param page
 * @param order
 * @param orderBy
 * @returns {Promise.<Array>}
 */
export async function getUserViewedCourse(userId, page, order, orderBy) {
  try {
    // Check the userId
    if ( ! StringHelper.isObjectId(userId) ) {
      return Promise.reject(Error('User id is not valid.'));
    }
    const page = Number(page || 1).valueOf();
    const queryConditions = { userId : mongoose.Types.ObjectId(userId)};
    let sortConditions = { _id : -1 };
    if ( sortOrder[order] && sortableFields.indexOf(orderBy) !== -1 ) {
      sortConditions = {[orderBy]: sortOrder[order]};
    }
    const limit = 10;
    const skip = (page - 1) * limit;
    const total_items = await UserViewCourseTracking.count(queryConditions);
    let courseTrackingFound = await UserViewCourseTracking.aggregate([
      { $match : queryConditions },
      { $sort : sortConditions },
      { $skip : skip },
      { $limit : limit },
      {
        $lookup:
          {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course"
          }
      },
      {$unwind: '$course'}
    ]);
    return {
      courses: courseTrackingFound,
      current_page: page,
      last_page: Math.ceil(total_items / limit),
    };
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function getTotalCourseViewed(userId) {
  try {
    // Check the userId
    if ( ! StringHelper.isObjectId(userId) ) {
      return Promise.reject(Error('User id is not valid.'));
    }

    const queryConditions = { userId: userId };
    return await UserViewCourseTracking.count(queryConditions) || 0;
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function getTotalTimeViewCourseByUser(userId) {
  try {
    // Check the userId
    if ( ! StringHelper.isObjectId(userId) ) {
      return Promise.reject(Error('User id is not valid.'));
    }

    const queryConditions = { userId: userId };
    const trackingCourses = await UserViewCourseTracking.find(queryConditions);
    let totalTime = 0;
    await Promise.all(trackingCourses.map(async trackingCourse => {
      totalTime += trackingCourse.totalTimeView;
    }));
    return totalTime;
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function getCourseTrackingInfo(userId) {
  try {
    // Check the userId
    if ( ! StringHelper.isObjectId(userId) ) {
      return Promise.reject(Error('User id is not valid.'));
    }
    const queryConditions = { userId: userId };
    const trackingCourses = await UserViewCourseTracking.find(queryConditions);
    let totalTime = 0;
    await Promise.all(trackingCourses.map(async trackingCourse => {
      totalTime += trackingCourse.totalTimeView;
    }));
    return totalTime;
  } catch (err) {
    return Promise.reject(err);
  }
}
