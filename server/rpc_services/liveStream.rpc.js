import * as LiveStreamServices from '../services/liveStream.services';
import * as LiveStreamTrackingService from '../services/liveStreamTracking.services';
import * as UserViewStreamTrackingService from '../services/userViewStreamTracking.services';
import * as StreamInviteTrackingService from '../services/streamInviteTracking.services';
import logger from '../util/log';
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';
import { isUserSessionReady } from '../routes/socket_routes/chat_socket';

export async function changeStreamStatus(payload) {
  try {
    const streamId = payload.streamId;
    const status = payload.status;
    const totalViewed = Number(payload.totalViewed).valueOf();
    const platform = payload.platform;
    await LiveStreamServices.changeStreamStatus(streamId, status, totalViewed, platform);
    return true;
  } catch (error) {
    logger.error(`RPC_COMMANDS.UPDATE_STREAM_STATUS error: ${error.toString()}`);
    throw error;
  }
}

export function createStreamQueueJob(payload) {
  try {
    let type = payload.type;
    let data = payload.data;
    if ( type && data ) {
      AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {
        type: type,
        obj: data
      });

      return true;
    }
    return Promise.reject(Error('Data is not valid'));
  } catch (error) {
    logger.error(`RPC_COMMANDS.CREATE_STREAM_QUEUE_JOB error: ${error.toString()}`);
    throw error;
  }
}

/**
 * @param trackingData
 * @param trackingData.streamId
 * @param trackingData.numView
 * @param trackingData.time
 * @param trackingData.trackingType
 * @returns {Promise<boolean>}
 */
export async function addViewTracking(trackingData) {
  try {
    await LiveStreamTrackingService.addViewTracking({
      streamId: trackingData.streamId,
      numView: trackingData.numView,
      time: trackingData.time,
      trackingType: trackingData.trackingType,
    });
    return true;
  } catch (error) {
    logger.error(`RPC_COMMANDS.ADD_TRACKING error: ${error.toString()}`);
    throw error;
  }
}

/**
 * @param trackingData
 * @param trackingData.streamId
 * @param trackingData.internalMeetingId
 * @param trackingData.userId
 * @param trackingData.beginTime
 * @param trackingData.endTime
 * @param trackingData.totalTime
 * @param trackingData.device
 * @returns {Promise<boolean>}
 */
export async function addUserViewStreamTracking(trackingData) {
  try {
    await UserViewStreamTrackingService.addUserViewStreamTracking({
      streamId: trackingData.streamId,
      internalMeetingId: trackingData.internalMeetingId,
      userId: trackingData.userId,
      beginTime: trackingData.beginTime,
      endTime: trackingData.endTime,
      totalTime: trackingData.totalTime,
      device: trackingData.device,
    });
    return true;
  } catch (error) {
    logger.error(`RPC_COMMANDS.ADD_USER_VIEW_STREAM_TRACKING error: ${error.toString()}`);
    throw error;
  }
}

export async function addStreamInviteTracking(trackingData) {
  try {
    await StreamInviteTrackingService.addStreamInviteTracking({
      streamId: trackingData.streamId,
      courseId: trackingData.courseId,
      userId: trackingData.userId,
      beginTime: trackingData.beginTime,
      endTime: trackingData.endTime,
      totalTime: trackingData.totalTime,
      device: trackingData.device,
      publishStreamId: trackingData.publishStreamId,
      isHandUp: trackingData.isHandUp,
      connected: trackingData.connected,
    });
    return true;
  } catch (error) {
    logger.error(`RPC_COMMANDS.ADD_STREAM_INVITE_TRACKING error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Get user permission of live stream
 * @param payload
 * @param payload.userToken
 * @param payload.streamId
 * @returns {Promise<string>}
 */
export async function getUserStreamPermission(payload) {
  try {
    return await LiveStreamServices.getUserStreamPermission(payload.userToken, payload.streamId);
  } catch (error) {
    logger.error(`RPC_COMMANDS.GET_USER_STREAM_PERMISSION error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Get user permission of live stream
 * @param userId
 * @returns {Promise<string>}
 */
export async function getIsUserSessionReady(userId) {
  try {
    return await isUserSessionReady(userId);
  } catch (error) {
    logger.error(`RPC_COMMANDS.GET_USER_SESSION_READY error: ${error}`);
    throw error;
  }
}
