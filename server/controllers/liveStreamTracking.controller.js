import LiveStreamTracking from '../models/liveStreamTracking';
import StringHelper from '../util/StringHelper';
import * as LiveStreamTrackingService from '../services/liveStreamTracking.services';
import UserViewStreamTracking from '../models/userViewStreamTracking';
import { getObjectId } from '../util/string.helper';

export async function addViewTracking( req, res ) {
  // Create new one
  try {
    const trackingData = req.body;
    const streamTracking = await LiveStreamTrackingService.addViewTracking(trackingData);
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

export async function getStreamTrackingData( req, res ) {
  const streamId = req.query.id;
  if ( ! StringHelper.isObjectId(streamId) ) {
    return res.status(404).json({success: false, error: 'Stream id is not valid.'});
  }
  // Find all tracking data of this stream
  try {
    const streamTrackingData = await LiveStreamTracking.find({streamId: streamId}).sort({ time: 1 });
    // Get stream duration
    return res.json({
      success: true,
      streamTrackingData: streamTrackingData
    });
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function getStreamTrackingDataUser( req, res ) {
  const user = req.user;
  if ( ! user ) {
    return res.status(401).send();
  }
  const streamId = req.query.id;
  if ( ! StringHelper.isObjectId(streamId) ) {
    return res.status(404).json({success: false, error: 'Stream id is not valid.'});
  }
  // Find all tracking data of this stream
  try {
    const streamTrackingData = await LiveStreamTracking.find({streamId: streamId}).sort({ time: 1 });
    return res.json({
      success: true,
      streamTrackingData: streamTrackingData,
      streamTrackingSummary: await getStreamTrackingSummary(streamTrackingData, getObjectId(streamId), user._id),
    });
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


export async function getStreamTrackingSummary(streamTrackingData, streamId) {
  try {
    let totalDuration = 0;
    let currentBeginItem = null;
    const numUserViewStream = await UserViewStreamTracking.aggregate([
      {
        $match: {
          streamId: streamId,
        }
      },
      {
        $group: {
          _id: { streamId: '$streamId', userId: '$userId' },
        }
      },
      {
        $count: 'total'
      }
    ]);
    streamTrackingData.map(item => {
      if (item.trackingType === 'begin') {
        currentBeginItem = item;
      } else if (currentBeginItem && item.trackingType === 'end') {
        const beginTime = currentBeginItem?.time?.getTime();
        const endTime = item?.time?.getTime();
        if (endTime && beginTime) {
          totalDuration += (endTime - beginTime);
        }
      }
    });
    if (totalDuration > 0) {
      totalDuration = Math.floor(totalDuration / 1000);
    }
    return {
      totalDuration: totalDuration,
      numUserViewStream: numUserViewStream?.[0]?.total ?? 0,
    };
  } catch ( error ) {
    throw error;
  }
}
