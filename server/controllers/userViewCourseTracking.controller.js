import * as UserViewCourseTrackingService from '../services/userViewCourseTracking.services';

export async function getUserViewedCourse( req, res ) {
  // Find all tracking data of this stream
  try {
    const {userId, page, order, orderBy} = req.query;

    const findResult = await UserViewCourseTrackingService.getUserViewedCourse(userId, page, order, orderBy);
    return res.json({
      success: true,
      ...findResult
    });
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}