import UserViewTracking from '../models/userViewTracking';
import StringHelper from '../util/StringHelper';
import User from '../models/user';
import Course from '../models/courses';
import {getTotalCourseViewed} from "./userViewCourseTracking.services";
/**
 * Add user view tracking data to database
 * @param trackingData
 * @param trackingData.userId
 * @param trackingData.lastLearningCourse
 * @param trackingData.lastLearningDate
 * @param trackingData.lastLearningTime
 * @param trackingData.totalTimeView
 * @returns {Promise.<*>}
 */
export async function addUserViewTracking(trackingData) {
  const userId = trackingData.userId;
  if ( ! StringHelper.isObjectId(userId) ) {
    return Promise.reject(Error('User id is not valid.'));
  }
  // Create new one
  try {
    // No need to add more tracking when the tracking is already exists
    const existedTracking = await UserViewTracking.findOne({ userId: userId });
    if ( existedTracking ) {
      // Update
      existedTracking.lastLearningDate = trackingData.lastLearningDate;
      existedTracking.lastLearningTime = trackingData.lastLearningTime;
      existedTracking.totalTimeView += trackingData.totalTimeView;
      await existedTracking.save();
    } else {
      // Add new
      const userViewTracking = new UserViewTracking(trackingData);
      await userViewTracking.save();
      return {
        success: true,
        data: userViewTracking,
      };
    }
    return {
      success: true,
      data: existedTracking,
    };
  } catch ( error ) {
    return Promise.reject(error);
  }
}

const sortableFields = [
  'lastLearningDate',
  'lastLearningTime',
  'totalTimeView',
];

const sortOrder = {
  desc: -1,
  asc: 1,
};
/**
 * Get user view tracking list
 * @param page
 * @param order
 * @param orderBy
 * @returns {Promise.<Array>}
 */
export async function getUserViewTracking(page, order, orderBy) {
  try {
    const pageNumber = Number(page || 1).valueOf();
    const queryConditions = {};
    let sortConditions = {lastLearningDate: -1};
    if ( sortOrder[order] && sortableFields.indexOf(orderBy) !== -1 ) {
      sortConditions = {[orderBy]: sortOrder[order]};
    }
    const limit = 10;
    const skip = (pageNumber - 1) * limit;
    const total_items = await UserViewTracking.count(queryConditions);
    const userViewTrackingFound = await UserViewTracking.find({}).sort(sortConditions).skip(skip).limit(limit).lean();
    const userIds = userViewTrackingFound.map(tracking => tracking.userId);
    const users = await User.formatBasicInfo(User, userIds, 'cuid userName email fullName memberShip telephone');
    const promises = userViewTrackingFound.map(async tracking => {
      tracking.course = await Course.findOne({_id: tracking.lastLearningCourse}, 'title status slug');
      tracking.user = users.find(user => user._id.toString() === tracking.userId.toString());
      tracking.totalParticipation = await getTotalCourseViewed(tracking.userId.toString());
      return tracking;
    });
    const userViewTrackingFoundFormatted = await Promise.all(promises);
    // Map user to this result
    return {
      data: userViewTrackingFoundFormatted,
      current_page: pageNumber,
      last_page: Math.ceil(total_items / limit),
    };
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Get view tracking for user
 * @param userId
 * @returns {Promise.<*>}
 */
export async function getViewTrackingForUser(userId) {
  try {
    const userTracking = await UserViewTracking.findOne({userId: userId}).lean();
    if ( userTracking ) {
      userTracking.course = await Course.findOne({_id: userTracking.lastLearningCourse}, 'title status slug');
      userTracking.totalParticipation = await getTotalCourseViewed(userTracking.userId.toString());
    }
    return userTracking;
  } catch (err) {
    return Promise.reject(err);
  }
}