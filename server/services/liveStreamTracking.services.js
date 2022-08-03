import LiveStreamTracking from '../models/liveStreamTracking';
import StringHelper from '../util/StringHelper';
import logger from '../util/log';

/**
 * Add view tracking to database
 * @param trackingData
 * @param trackingData.streamId
 * @param trackingData.numView
 * @param trackingData.time
 * @param trackingData.trackingType
 * @returns {Promise.<*>}
 */
export async function addViewTracking(trackingData) {
  const streamId = trackingData.streamId;
  if ( ! StringHelper.isObjectId(streamId) ) {
    return Promise.reject(Error('Stream id is not valid.'));
  }
  const numView = trackingData.numView;
  const trackingTime = trackingData.time;
  if ( isNaN(numView) || ! trackingTime ) {
    return Promise.reject(Error('Tracking data is not enough.'));
  }
  try {
    // Create new one
    const streamTracking = new LiveStreamTracking(trackingData);
    await streamTracking.save();
    return {
      success: true,
      data: streamTracking
    };
  } catch (error) {
    logger.error(`addViewTracking error: ${error.toString()}`);
    throw error;
  }
}

export async function getStreamingTimeForStream(streamId) {
  try {
    return await LiveStreamTracking.find({
      streamId: streamId,
      trackingType: {$in: ['begin', 'end']},
    }).sort({ time: 1 });
  } catch (error) {
    logger.error(`getStreamingTimeForStream error: ${error.toString()}`);
    throw error;
  }
}
