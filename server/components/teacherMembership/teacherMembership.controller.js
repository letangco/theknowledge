import * as TeacherService from './teacherMembership.service';
import User from '../../models/user';
/**
 * Add teacher membership trial
 * @returns {Promise.<{}>}
 */
export async function addTeacherMemberShipTrial(req, res, next) {
  try {
    const user = req.user;
    await TeacherService.addTeacherMemberShipTrial(user._id);
    return res.json({
      success: true,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Add teacher membership trial
 * @returns {Promise.<{}>}
 */
export async function addTeacherMemberShipManually(req, res, next) {
  try {
    const {
      userId,
      days,
      note,
    } = req.body;
    const admin = req.user;
    await TeacherService.addTeacherMemberShipManually({
      adminId: admin._id,
      userId: userId,
      days: days,
      note: note,
    });
    return res.json({
      success: true,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get teacher membership list
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
export async function getTeacherMembership(req, res, next) {
  try {
    const {
      page,
      rowPerPage,
      search,
      status,
    } = req.query;
    const data = await TeacherService.getTeacherMembership(page, rowPerPage, search, status);
    return res.json({
      success: true,
      payload: data,
    })
  } catch (error) {
    return next(error);
  }
}

/**
 * check membership teacher
 * @returns {Promise.<{}>}
 */
export async function checkTeacherMemberShip(req, res, next) {
  try {
    const user = req.user;
    if (Date.now() < user.teacherMembership) {
      return res.json({
        success: true,
        payload: 1
        ,
      });
    }
    let userInfo = await User.findById(user._id)
    if(userInfo.customerId){
      return res.json({
        success: true,
        payload: 2
        ,
      });
    }
    return res.json({
      success: true,
      payload: 3,
    });
  } catch (error) {
    return next(error);
  }
}
