import logger from '../../util/log';
import APIError from '../../util/APIError';
import TeacherMembership from '../teacherMembership/teacherMembership.model';
import User from '../../models/user';
import globalConstants, {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  TEACHER_MEMBERSHIP_TYPE,
  TEACHER_REGISTRATION_STATUS,
  TEACHER_MEMBERSHIP_PACKAGE_TYPE,
} from '../../../config/globalConstants';
import { Q } from '../../libs/Queue';
import AMPQ from '../../../rabbitmq/ampq';

/**
 * Add teacher membership trial
 * @param {String} userId
 * @returns {Promise.<boolean>}
 */
export async function addTeacherMemberShipTrial(userId) {
  try {
    // Check teacher membership existed?
    const haveRegisteredTrial = await checkTeacherMembershipTrial(userId);
    if (haveRegisteredTrial) {
      return Promise.reject(new APIError(403, [
        {
          msg: 'User have registered trial package',
          param: 'haveRegisteredTrial'
        }
      ]));
    }
    // Add teacher membership package trial
    await addTeacherMemberShipFromOrder({
      userId: userId,
      type: TEACHER_MEMBERSHIP_TYPE.ANNUAL,
      packageType: TEACHER_MEMBERSHIP_PACKAGE_TYPE.TEACHER,
      status: TEACHER_REGISTRATION_STATUS.ACTIVE,
    });
    return true;
  } catch (error) {
    logger.error(`TeacherService addTeacherMemberShipTrial, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Add teacher membership manually
 * @param {String} adminId
 * @param {String} userId
 * @param {Number} days
 * @param {Number} note
 * @returns {Promise.<boolean>}
 */
export async function addTeacherMemberShipManually({ adminId, userId, days, note }) {
  try {
    // Add teacher membership package trial
    await addTeacherMemberShipFromOrder({
      userId: userId,
      adminId: adminId,
      days: days,
      type: TEACHER_MEMBERSHIP_TYPE.DAILY,
      packageType: TEACHER_MEMBERSHIP_PACKAGE_TYPE.ADMIN_RENEW,
      status: TEACHER_REGISTRATION_STATUS.ACTIVE,
      note: note,
    });
    return true;
  } catch (error) {
    logger.error(`TeacherService addTeacherMemberShipManually, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Add teacher membership
 * @param params
 * @param {String} params.userId
 * @param {String} params.type
 * @param {String} params.packageType
 * @param {String} params.total_payment
 * @param {String} params.payment
 * @param {String} params.note
 * @param {String} params.adminId
 * @param {Number} params.days
 * @returns {Promise.<{}>}
 */
export async function addTeacherMemberShipFromOrder(params) {
  try {
    // Add teacher package
    const user = await User.findOne({ _id: params.userId });
    if (!user) {
      return new APIError(403, [
        {
          msg: 'User not found',
          param: 'userNotFound',
        },
      ]);
    }
    const time = getPackageTime(params.type, params.packageType, params.days, user?.teacherMembership);
    await TeacherMembership.create({
      user: params.userId,
      adminId: params.adminId,
      days: params.days,
      payment: params.payment,
      type: params.type,
      packageType: params.packageType,
      status: TEACHER_REGISTRATION_STATUS.ACTIVE,
      beginTime: time.beginTime,
      endTime: time.endTime,
      note: params.note,
    });
    await User.update({ _id: params.userId }, { $set: { teacherMembership: time.endTime, expert: 1 } });
    // Send email
    const dataSendMail = {
      type: 'teacherMembership',
      language: 'vi',
      data: {
        fullName: user.fullName,
        email: user.email,
        address: user.address,
        packageType: params.packageType,
        type: params.type,
        total_payment: params.total_payment,
        beginTime: time.beginTime,
        endTime: time.endTime,
      }
    };
    const dataNotify = {
      to: user._id,
      type: 'registeredTeacherMembership',
      data: {
        packageType: params.packageType,
        type: params.type,
        total_payment: params.total_payment,
        beginTime: time.beginTime,
        endTime: time.endTime,
        days: params.days,
      },
    };
    Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
    return true;
  } catch (error) {
    logger.error(`TeacherService addTeacherMemberShip, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * @param params
 * @param params.id
 * @param params.userId
 * @param params.status
 * @param params.paymentInfo
 * @param params.note
 * @returns {Promise<boolean>}
 */
export async function updateTeacherMemberShip(params) {
  try {
    await TeacherMembership.updateOne({
      id: params.id,
      user: params.userId,
    }, {
      $set: {
        status: params.status,
        paymentInfo: params.paymentInfo,
        note: params.note,
      }
    });
    return true;
  } catch (error) {
    logger.error(`TeacherService updateTeacherMemberShip, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * If the package type is ADMIN_RENEW: add new time to current teacherMembership date
 * @param type
 * @param packageType
 * @param days
 * @param _currentTime
 * @returns {{beginTime: *, endTime: *}}
 */
function getPackageTime(type = TEACHER_MEMBERSHIP_TYPE.ANNUAL, packageType = TEACHER_MEMBERSHIP_PACKAGE_TYPE.TEACHER, days = 0, _currentTime = null) {
  const currentTime = (packageType === TEACHER_MEMBERSHIP_PACKAGE_TYPE.ADMIN_RENEW && _currentTime) ? _currentTime : Date.now();
  const oneDateTime = 24 * 60 * 60 * 1000;
  let month = 1;
  if (type === TEACHER_MEMBERSHIP_TYPE.ANNUAL) {
    month = 12;
  }
  switch (packageType) {
    case TEACHER_MEMBERSHIP_PACKAGE_TYPE.ADMIN_RENEW:
      return {
        beginTime: currentTime,
        endTime: currentTime + (days * oneDateTime),
      };
    case TEACHER_MEMBERSHIP_PACKAGE_TYPE.TEACHER:
      return {
        beginTime: currentTime,
        endTime: currentTime + (10000 * oneDateTime),
      };
    default:
      return {
        beginTime: currentTime,
        endTime: currentTime + (30 * oneDateTime * month),
      };
  }
}

/**
 * Check user have registered teacher membership?
 * @param userId
 * @returns {Promise<boolean>}
 */
export async function checkTeacherMembershipTrial(userId) {
  try {
    const trialPackage = await TeacherMembership.count({ user: userId, packageType: TEACHER_MEMBERSHIP_PACKAGE_TYPE.TEACHER });
    return trialPackage > 0;
  } catch (error) {
    logger.error(`TeacherService getCurrentPackage, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Get teacher membership list
 * @param {Number} _page
 * @param {Number} rowPerPage
 * @param {String} search
 * @param {String} status
 * @returns {Promise<boolean>}
 */
export async function getTeacherMembership(_page, rowPerPage, search, status) {
  try {
    const queryConditions = {};
    let additionalConditions;
    if (typeof search === 'string') {
      search = search.replace(/\\/g, String.raw`\\`);
      const regExpKeyWord = new RegExp(search, 'i');
      additionalConditions = [
        {
          $match: {
            $or: [
              { 'user.fullName': { $regex: regExpKeyWord } },
              { 'user.email': { $regex: regExpKeyWord } },
            ],
          }
        },
      ];
    } else {
      additionalConditions = [];
    }

    if (Object.values(TEACHER_REGISTRATION_STATUS).indexOf(status) !== -1) {
      queryConditions.status = status;
    }
    let page = Number(_page || 1).valueOf();
    if (page < 1) {
      page = 1;
    }
    let pageLimit = Number(rowPerPage || DEFAULT_PAGE_LIMIT).valueOf();
    if (pageLimit > MAX_PAGE_LIMIT || pageLimit < 1) {
      pageLimit = MAX_PAGE_LIMIT;
    }
    const skip = (page - 1) * pageLimit;
    const sortCondition = {
      _id: -1,
    };

    const aggregateConditions = [
      {
        $match: queryConditions
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'adminId',
          foreignField: '_id',
          as: 'admin'
        }
      },
      ...additionalConditions,
      {
        $sort: sortCondition,
      },
      {
        $skip: skip,
      },
      {
        $limit: pageLimit,
      },
      {
        $project: {
          type: 1,
          packageType: 1,
          beginTime: 1,
          endTime: 1,
          status: 1,
          days: 1,
          'user._id': 1,
          'user.cuid': 1,
          'user.email': 1,
          'user.userName': 1,
          'user.avatar': 1,
          'user.firstName': 1,
          'user.lastName': 1,
          'user.fullName': 1,
          'user.teacherMembership': 1,
          'user.telephone': 1,
          'admin._id': 1,
          'admin.cuid': 1,
          'admin.email': 1,
          'admin.userName': 1,
          'admin.avatar': 1,
          'admin.firstName': 1,
          'admin.lastName': 1,
          'admin.fullName': 1,
        }
      },
    ];
    const countConditions = [
      {
        $match: queryConditions
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      ...additionalConditions,
      { $group: { _id: null, totalItems: { $sum: 1 } } },
    ];
    let totalItems = await TeacherMembership.aggregate(countConditions);
    totalItems = totalItems instanceof Array && totalItems[0] ? totalItems[0].totalItems : 0;
    const data = await TeacherMembership.aggregate(aggregateConditions);
    return {
      data: data,
      currentPage: page,
      totalPage: Math.ceil(totalItems / pageLimit),
      totalItems: totalItems,
    };
  } catch (error) {
    logger.error('TeacherMembership service getTeacherMembership error:');
    logger.error(error.toString());
    throw error;
  }
}
