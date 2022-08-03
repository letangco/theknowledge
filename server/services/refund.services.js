import Refunds from '../models/refund';
import User from '../models/user';
import ArrayHelper from '../util/ArrayHelper';
import Courses from '../models/courses';
import {getMetaData as getCourseMetaData, formatListInfo as formatListCourse} from './course.services';

export async function getRefundRequests(requesterId) {
  try {
    let refunds = await Refunds.find().lean();
    return await getMetaData(refunds, requesterId, 'en');
  } catch (err) {
    console.log('err on getRefundRequests:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getMetaData(refundModels, requesterId, langCode) {
  try {
    if(!(refundModels instanceof Array)) {
      refundModels = [refundModels];
    }

    refundModels = JSON.parse(JSON.stringify(refundModels));

    let userIds = [];
    refundModels.forEach(refund => {
      userIds.push(refund.user);
      userIds.push(refund.admin);
    });

    let users = await User.formatBasicInfo(User, userIds);
    let userMapper = ArrayHelper.toObjectByKey(users, '_id');

    let grouped = ArrayHelper.groupByKey(refundModels, 'type');
    let keys = Object.keys(grouped);
    let courses = [];
    let promises = keys.map(async key => {

      switch (key) {
        case 'course':
          let courseIds = grouped[key].map(refund => refund.object);
          courses = await Courses.find({_id: {$in: courseIds}}).lean();
          courses = await getCourseMetaData(courses, requesterId, langCode);
          courses = formatListCourse(courses);
          break;
      }
    });
    await Promise.all(promises);
    let courseMapper = ArrayHelper.toObjectByKey(courses, '_id');

    return refundModels.map(refund => {
      refund.user = userMapper[refund.user];
      if(refund.admin) {
        refund.admin = userMapper[refund.admin];
      }
      switch (refund.type) {
        case 'course':
          refund.object = courseMapper[refund.object.toString()];
          break;
      }
      return refund;
    });
  } catch (err) {
    console.log('err on getMetaData:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function adminApproveRefund(adminId, refundId, notes, status) {
  try {
    let refund = await Refunds.findById(refundId);

    if(!refund) {
      return Promise.reject({status: 404, error: 'Refund request not found.'});
    }

    if(refund.status !== 'waiting') {
      return Promise.reject({status: 400, error: 'Refund request not in waiting status.'});
    }

    if(['approved', 'rejected'].indexOf(status) < 0) {
      return Promise.reject({status: 400, error: 'Invalid status.'});
    }

    refund.status = status;
    refund.admin = adminId;
    refund.notes = notes;
    refund.approved_at = new Date();

    return refund.save();
  } catch (err) {
    console.log('err on adminApproveDeleteCourse:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
