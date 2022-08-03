import TeacherRegistration from '../models/teacherRegistration';
import {
  TEACHER_REGISTRATION_STATUS,
  MAX_PAGE_LIMIT,
  DEFAULT_PAGE_LIMIT,
} from '../../config/globalConstants';

/**
 * @param {Object} data
 * @param {String} data.name
 * @param {String} data.email
 * @param {String} data.phone
 * @param {String} data.type
 * @param {String} data.requirement
 * @returns {Promise<boolean>}
 */
export async function addTeacherRegistration(data) {
  try {
    await TeacherRegistration.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      type: data.type,
      requirement: data.requirement,
    });
    return true;
  } catch (err) {
    console.error('TeacherRegistration service addTeacherRegistration error:');
    console.error(err);
    throw err;
  }
}

/**
 * @param {ObjectId} id
 * @param {String} status
 * @returns {Promise<boolean>}
 */
export async function updateTeacherRegistrationStatus(id, status) {
  try {
    if (Object.values(TEACHER_REGISTRATION_STATUS).indexOf(status) === -1) {
      return Promise.reject(new Error('Status is invalid'));
    }
    await TeacherRegistration.updateOne({ _id: id }, {
      $set: {
        status: status,
      }
    });
    return true;
  } catch (err) {
    console.error('TeacherRegistration service updateTeacherRegistrationStatus error:');
    console.error(err);
    throw err;
  }
}

/**
 * @param {Number} _page
 * @param {Number} rowPerPage
 * @returns {Promise<boolean>}
 */
export async function getTeacherRegistration(_page, rowPerPage) {
  try {
    let page = Number(_page || 1).valueOf();
    if (page < 1) {
      page = 1;
    }
    let pageLimit = Number(rowPerPage || DEFAULT_PAGE_LIMIT).valueOf();
    if (pageLimit > MAX_PAGE_LIMIT || pageLimit < 1) {
      pageLimit = MAX_PAGE_LIMIT;
    }

    const skip = (page - 1) * pageLimit;
    const queryConditions = {};
    const sortCondition = {
      _id: -1,
    };
    const totalItems = await TeacherRegistration.count(queryConditions);
    const data = await TeacherRegistration.find(queryConditions)
      .sort(sortCondition).skip(skip).limit(pageLimit);
    return {
      data: data,
      currentPage: page,
      totalPage: Math.ceil(totalItems / pageLimit),
      totalItems: totalItems,
    };
  } catch (err) {
    console.error('TeacherRegistration service getTeacherRegistration error:');
    console.error(err);
    throw err;
  }
}
