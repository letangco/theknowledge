import LiveStream from '../models/liveStream';
import StringHelper from '../util/StringHelper';
import * as StreamInviteTrackingService from '../services/streamInviteTracking.services';

export async function addStreamInviteTracking( req, res ) {
  // Create new one
  try {
    const trackingData = req.body;
    const streamInviteTracking = await StreamInviteTrackingService.addStreamInviteTracking(trackingData);
    return res.json({
      success: true,
      data: streamInviteTracking,
    });
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function getCourseHaveInviteTracking( req, res ) {
  // Create new one
  try {
    const page = req.query.page;
    const findResult = await StreamInviteTrackingService.getCourseHaveInviteTracking(page);
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

export async function getStreamsOfCourse( req, res ) {
  try {
    const courseId = req.query.courseId;
    const findResult = await StreamInviteTrackingService.getStreamsOfCourse(courseId);
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

export async function getStreamOfCourseUser( req, res ) {
  try {
    const user = req.user;
    if ( ! user || user.role === 'user' ) {
      return res.status(401).send();
    }
    const streamId = req.query.streamId;
    const findResult = await StreamInviteTrackingService.getStreamOfCourse(streamId);
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

export async function getStreamInviteTrackingDataUser( req, res ) {
  try {
    const user = req.user;
    if ( ! user || user.role !== 'admin' ) {
      return res.status(401).send();
    }
    const {streamId, page, order, orderBy} = req.query;

    const findResult = await StreamInviteTrackingService.getStreamInviteTrackingData(streamId, page, order, orderBy);
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

export async function getStreamInviteTrackingData( req, res ) {
  try {
    const {streamId, page, order, orderBy} = req.query;

    const findResult = await StreamInviteTrackingService.getStreamInviteTrackingData(streamId, page, order, orderBy);
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
