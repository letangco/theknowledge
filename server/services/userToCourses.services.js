import UserToCourse from '../models/userToCourse';
import logger from '../util/log';

/**
 * Add user to course when user view course tracking added
 * @param data
 * @param data.user
 * @param data.course
 * @returns {Promise.<*>}
 */
export async function addUserToCourseForTracking(data) {
  // Create new one
  try {
    const userToCourse = await UserToCourse.findOne({user: data.user, course: data.course});
    if (!userToCourse) {
      await UserToCourse.create({
        user: data.user,
        course: data.course,
      });
    }
    return true;
  } catch (error) {
    logger.error('UserToCourse Service, addUserToCourseForTracking error:', error);
    return Promise.reject(error);
  }
}
