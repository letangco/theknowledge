import * as TeacherService from './teacher.service';

/**
 * Get teacher dashboard report
 * @returns {Promise.<{}>}
 */
export async function getTeacherDashboardReport(req, res, next) {
  try {
    const user = req.user;
    const data = await TeacherService.getTeacherDashboardReport(user._id);
    return res.json({
      success: true,
      payload: data,
    });
  } catch (error) {
    return next(error);
  }
}
