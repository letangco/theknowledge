import * as UserViewTrackingService from '../services/userViewTracking.services';

export async function getUserViewTracking( req, res ) {
  // Find all tracking data of this stream
  try {
    const {page, order, orderBy} = req.query;

    const findResult = await UserViewTrackingService.getUserViewTracking(page, order, orderBy);
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