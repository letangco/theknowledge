import path from 'path';
import LiveStream from '../models/liveStream';
import StringHelper from '../util/StringHelper';
import * as UserViewStreamTrackingService from '../services/userViewStreamTracking.services';

export async function addUserViewStreamTracking( req, res ) {
  // Create new one
  try {
    const trackingData = req.body;
    const streamTracking = await UserViewStreamTrackingService.addUserViewStreamTracking(trackingData);
    return res.json({
      success: true,
      data: streamTracking
    });
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function getUserViewStreamTrackingData( req, res ) {
  const courseId = req.query.courseId;
  if ( ! StringHelper.isObjectId(courseId) ) {
    return res.status(404).json({success: false, error: 'Course id is not valid.'});
  }
  const userId = req.query.userId;
  if ( ! StringHelper.isObjectId(userId) ) {
    return res.status(404).json({success: false, error: 'User id is not valid.'});
  }
  // Get all lesson of stream
  try {
    const findResult = await LiveStream.find({course: courseId}, 'title status slug').sort({ _id: 1 }).lean();
    if ( findResult ) {
      const length = findResult.length;
      for ( let index = 0; index < length; index++ ) {
        const stream = findResult[index];
        findResult[index].totalTimeView = await UserViewStreamTrackingService.getTotalTimeViewStream(stream._id.toString(), userId);
      }
      return res.json({
        success: true,
        data: findResult
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Stream not found'
      });
    }
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function getUserViewStreamTrackingInfo( req, res ) {
  const streamId = req.query.streamId;
  if ( ! StringHelper.isObjectId(streamId) ) {
    return res.status(404).json({success: false, error: 'Stream id is not valid.'});
  }
  // Get users view this stream
  try {
    const {page, order, orderBy} = req.query;

    const findResult = await UserViewStreamTrackingService.getUserViewStreamTrackingInfo(page, order, orderBy, streamId);
    return res.json({
      success: true,
      ...findResult,
    });
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function exportUserViewStreamTrackingByCourse( req, res ) {
  // Find all tracking data of this stream
  try {
    const {courseId} = req.query;

    const fileName = await UserViewStreamTrackingService.exportUserViewStreamTrackingByCourse(courseId);
    const filePath = path.join(__dirname, '..', '..', 'exports', fileName);
    return res.download(filePath);
  } catch ( error ) {
    console.error('exportUserViewStreamTrackingInfo error');
    console.error(error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
