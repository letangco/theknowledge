/**
 * Registry room event hooks
 **/
import { getUrlForRoomCallBalancer, roomRequest } from './room.util';
import logger from '../../util/log';
import { addStreamRecording, changeStreamStatus, getStreamAutoRecord } from '../../services/liveStream.services';
import { addUserViewStreamTracking, addViewTracking } from '../../rpc_services/liveStream.rpc';
import { streamViewTrackingTypes } from '../../models/liveStreamTracking';
import { getRoomBalancer } from './room.service';
import { ENDPOINTS, ROOM_HOOK_RECORDED_CALLBACK_URL } from '../../../config/config';

const ROOM_VIEWER_ROLE = {
  MODERATOR: 'MODERATOR',
};

const hookIds = {};
const participantCount = {};
const userBeginViewTime = {};
const userViewStreamCount = {}; // Current number viewer for stream on each user

logger.logX('ENDPOINTS');
logger.logX(ENDPOINTS);

async function getServerEndPoint(meetingID) {
  try {
    const length = ENDPOINTS.length;
    for (let i = 0; i < length; i++) {
      const endpoint = ENDPOINTS[i];
      const room = await getRoomBalancer({
        meetingID: meetingID,
        endpoint: endpoint,
      });
      if (room?.meetingID) {
        return endpoint;
      }
    }
    return null;
  } catch (error) {
    logger.error(`RoomHook getServerEndPoint, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Registry hook for balance
 * @param params
 * @param {String} params.callbackURL The URL that will receive a POST call with the events.
 *                                    The same URL cannot be registered more than once.
 * @param {String} params.meetingID The meetingID to bind this hook to an specific meeting.
 *                                  If not informed, the hook will receive events for all meetings.
 * @param {String} params.internalMeetingID The internal meetingID to store this hook
 * @param {String} params.endpoint Server endpoint
 * @param {Boolean} params.getRaw false by default.
 *                                When getRaw=true, the POST call will contain the exact same message sent on redis, otherwise the message will be processed.
 * @returns {Promise<*>}
 */
export async function registryHook(params) {
  try {
    logger.logX('registryHook');
    // Get the meeting ENDPOINT
    const serverEndpoint = params.endpoint || await getServerEndPoint(params.meetingID);
    if (serverEndpoint === null) {
      return Promise.reject(new Error('Endpoint not found'));
    }
    logger.logX('registryHook, serverEndpoint:', serverEndpoint);
    const apiOptions = {
      method: 'GET',
      uri: getUrlForRoomCallBalancer(serverEndpoint, 'hooks/create', {
        callbackURL: params.callbackURL,
        meetingID: params.meetingID,
        getRaw: params.getRaw,
      }),
    };
    logger.logX('apiOptions');
    logger.logX(apiOptions);
    const requestResult = await roomRequest(apiOptions);
    logger.logX('requestResult');
    logger.logX(requestResult);
    if (requestResult?.returncode === 'SUCCESS') {
      hookIds[params.internalMeetingID] = {
        hookID: requestResult?.hookID,
        endpoint: serverEndpoint,
      };
      logger.logX('hookIds');
      logger.logX(JSON.stringify(hookIds));
      return true;
    } else {
      return Promise.reject(new Error('Create hook error'));
    }
  } catch (error) {
    logger.error(`RoomHook registryHook, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Destroy hook
 * @param {String} endpoint Server endpoint
 * @param {Number} hookID The ID of the hook that should be removed, as returned in the create hook call
 * @returns {Promise<*>}
 */
export async function destroyHookBalancer(endpoint, hookID) {
  try {
    const apiOptions = {
      method: 'GET',
      uri: getUrlForRoomCallBalancer(endpoint,'hooks/destroy', {
        hookID: hookID,
      }),
    };
    logger.logX('destroyHookBalancer apiOptions');
    logger.logX(apiOptions);
    return await roomRequest(apiOptions);
  } catch (error) {
    logger.error(`RoomHook destroyHookBalancer, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * @param internalMeetingId
 * @returns {Promise<boolean>}
 */
export async function destroyHookByMeetingId(internalMeetingId) {
  try {
    const hookInfo = hookIds[internalMeetingId];
    if (hookInfo.hookID) {
      await destroyHookBalancer(hookInfo.endpoint, hookInfo.hookID);
      delete hookIds[internalMeetingId];
    }
    return true;
  } catch (error) {
    logger.error(`RoomHook destroyHookByMeetingId, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Handle hook data return
 * @param data
 * @returns {Promise<*>}
 */
export async function handleHook(data) {
  try {
    logger.logX('RoomHook handleHook data:');
    logger.logX(data);
    if (!data?.event) {
      return false;
    }
    const event = JSON.parse(data.event)[0];
    const eventData = event?.data;
    if (eventData?.type === 'event') {
      const timestamp = Number(data?.timestamp).valueOf();
      const meetingId = eventData?.attributes?.meeting?.['external-meeting-id'];
      const internalMeetingId = eventData?.attributes?.meeting?.['internal-meeting-id'];
      const userId = eventData?.attributes?.user?.['external-user-id'];
      const userRole = eventData?.attributes?.user?.['role'];
      logger.logX(`RoomHook handleHook, meetingId: ${meetingId}, eventData.id: ${eventData.id}`);
      switch (eventData.id) {
        case 'meeting-ended':
          /**
           * {
           *   event: '[{"data":{"type":"event","id":"meeting-ended","attributes":{"meeting":{"internal-meeting-id":"11976873075a4b96155669970158510920f18847-1587974887330","external-meeting-id":"5a7a73288c8338542f8c33d1"}},"event":{"ts":1587975121682}}}]',
           *   timestamp: '1587975121684',
           *   domain: 'devroom.tesse.io'
           * }
           */
          try {
            await onMeetingEnded(meetingId, internalMeetingId, timestamp);
          } catch (error) {
            logger.error(`RoomHook handleHook onMeetingEnded for meeting-ended, meetingId: ${meetingId}`);
            logger.error(error.toString());
          }
          break;
        case 'user-joined':
          /**
           * {
           *   event: '[{"data":{"type":"event","id":"user-joined","attributes":{"meeting":{"internal-meeting-id":"11976873075a4b96155669970158510920f18847-1587888297169","external-meeting-id":"5a7a73288c8338542f8c33d1"},"user":{"internal-user-id":"w_l3wn7jfaryfh","external-user-id":"5a7a73288c8338542f8c33a4","name":"Nhan","role":"MODERATOR","presenter":false}},"event":{"ts":1587888573620}}}]',
           *   timestamp: '1587888573632',
           *   domain: 'devroom.tesse.io'
           * }
           */
          if (userRole === ROOM_VIEWER_ROLE.MODERATOR) {
            await changeStreamStatus(meetingId, 'living', 0, 'web', userId);
          } else {
            // Only add tracking for VIEWER
            addParticipantCount(internalMeetingId);
            onUserJoined(userId, internalMeetingId, timestamp);
            try {
              await addViewTracking({
                streamId: meetingId,
                numView: getParticipantCount(internalMeetingId),
                time: timestamp,
                trackingType: streamViewTrackingTypes.normal,
              });
            } catch (error) {
              logger.error(`RoomHook handleHook for addViewTracking user-joined, meetingId: ${meetingId}`);
              logger.error(error.toString());
            }
          }
          break;
        case 'user-left':
          /**
           * {
           *   event: '[{"data":{"type":"event","id":"user-left","attributes":{"meeting":{"internal-meeting-id":"11976873075a4b96155669970158510920f18847-1587888297169","external-meeting-id":"5a7a73288c8338542f8c33d1"},"user":{"internal-user-id":"w_cwidmilccu3e","external-user-id":"5a7a73288c8338542f8c33a3"}},"event":{"ts":1587888653531}}}]',
           *   timestamp: '1587888653545',
           *   domain: 'devroom.tesse.io'
           * }
           */
          if (userRole !== ROOM_VIEWER_ROLE.MODERATOR) {
            await onUserLeft(userId, meetingId, internalMeetingId, timestamp);
            try {
              await addViewTracking({
                streamId: meetingId,
                numView: getParticipantCount(internalMeetingId),
                time: timestamp,
                trackingType: streamViewTrackingTypes.normal,
              });
            } catch (error) {
              logger.error(`RoomHook handleHook for addViewTracking user-left, meetingId: ${meetingId}`);
              logger.error(error.toString());
            }
          }
          break;
        case 'meeting-recording-changed':
          if (hookIds[internalMeetingId]) {
            hookIds[internalMeetingId].haveRecord = true;
          }
          break;
      }
    }
    return true;
  } catch (error) {
    logger.error(`RoomHook handleHook, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Handle hook data return
 * @param data
 * @returns {Promise<*>}
 */
export async function handleRecordedHook(data) {
  try {
    logger.logX('RoomHook handleRecordedHook data:');
    logger.logX(data);
    if (!data?.event) {
      return false;
    }
    const event = JSON.parse(data.event)[0];
    const eventData = event?.data;
    if (eventData?.type === 'event') {
      const meetingId = eventData?.attributes?.meeting?.['external-meeting-id'];
      const internalMeetingId = eventData?.attributes?.meeting?.['internal-meeting-id'];
      logger.logX(`RoomHook handleRecordedHook, meetingId: ${meetingId}, eventData.id: ${eventData.id}`);
      switch (eventData.id) {
        case 'rap-publish-ended':
          /**
           * {
           *   event: '[{"data":{"type":"event","id":"rap-publish-ended","attributes":{"meeting":{"internal-meeting-id":"edebf30ff70e1c02f8c5f524bc32e0bd19999b1b-1588007281350","external-meeting-id":"5e8f5ff8b34f629aba14bf8e"},"record-id":"edebf30ff70e1c02f8c5f524bc32e0bd19999b1b-1588007281350","success":true,"step-time":415,"workflow":"presentation","recording":{"name":"Test rpc","is-breakout":"false","size":1513869,"metadata":{"bbb-origin-server-name":"devroom.tesse.io","bbb-origin-version":"v2","isBreakout":"false","meetingId":"5e8f5ff8b34f629aba14bf8e","meetingName":"Test rpc"},"playback":{"format":"presentation","link":"https://devroom.tesse.io/playback/presentation/2.0/playback.html?meetingId=edebf30ff70e1c02f8c5f524bc32e0bd19999b1b-1588007281350","processing_time":54378,"duration":223365,"extensions":{"preview":{"images":{"image":["https://devroom.tesse.io/presentation/edebf30ff70e1c02f8c5f524bc32e0bd19999b1b-1588007281350/presentation/d2d9a672040fbde2a47a10bf6c37b6a4b5ae187f-1588007281424/thumbnails/thumb-1.png","https://devroom.tesse.io/presentation/edebf30ff70e1c02f8c5f524bc32e0bd19999b1b-1588007281350/presentation/d2d9a672040fbde2a47a10bf6c37b6a4b5ae187f-1588007281424/thumbnails/thumb-2.png","https://devroom.tesse.io/presentation/edebf30ff70e1c02f8c5f524bc32e0bd19999b1b-1588007281350/presentation/d2d9a672040fbde2a47a10bf6c37b6a4b5ae187f-1588007281424/thumbnails/thumb-3.png"]}}},"size":1513869},"download":{}}},"event":{"ts":1588007746}}}]',
           *   timestamp: '1588007748910',
           *   domain: 'devroom.tesse.io'
           * }
           */
          const recording = eventData?.attributes?.recording;
          const recordingUrl = recording?.playback?.link;
          const recordingName = recording?.name;
          await addStreamRecording(meetingId, recordingUrl, recordingName);
          try {
            await destroyHookByMeetingId(internalMeetingId);
          } catch (error) {
            logger.error(`RoomHook handleHook for destroyHookByMeetingId rap-publish-ended, internalMeetingId: ${internalMeetingId}`);
            logger.error(error.toString());
          }
          break;
      }
    }
    return true;
  } catch (error) {
    logger.error(`RoomHook handleRecordedHook, error: ${error.toString()}`);
    throw error;
  }
}

function addParticipantCount(internalMeetingId) {
  if (participantCount[internalMeetingId]) {
    participantCount[internalMeetingId]++;
  } else {
    participantCount[internalMeetingId] = 1;
  }
}

function decreaseParticipantCount(internalMeetingId) {
  if (participantCount[internalMeetingId]) {
    participantCount[internalMeetingId]--;
  } else {
    participantCount[internalMeetingId] = 0;
  }
}

function getParticipantCount(internalMeetingId) {
  return participantCount[internalMeetingId] ?? 0;
}

function deleteParticipantCount(internalMeetingId) {
  delete participantCount[internalMeetingId];
}

/**
 * Calc userId tracking on internalMeetingId at timestamp
 * @param userId
 * @param internalMeetingId
 * @param timestamp
 */
function onUserJoined(userId, internalMeetingId, timestamp) {
  logger.logX('onUserJoined', userId, internalMeetingId, timestamp);
  if (!userBeginViewTime[internalMeetingId]) {
    userBeginViewTime[internalMeetingId] = {};
  }
  if (userBeginViewTime[internalMeetingId][userId]) {
    logger.warn('This user have begin time before and it is not clean!');
    logger.warn(`${userId}, ${internalMeetingId}, ${userBeginViewTime[internalMeetingId][userId]}`);
  } else {
    userBeginViewTime[internalMeetingId][userId] = timestamp;
  }

  if (!userViewStreamCount[internalMeetingId]) {
    userViewStreamCount[internalMeetingId] = {};
  }
  if (userViewStreamCount[internalMeetingId]?.[userId]) {
    userViewStreamCount[internalMeetingId][userId]++;
  } else {
    userViewStreamCount[internalMeetingId][userId] = 1;
  }
  logger.logX('onUserJoined userViewStreamCount', userViewStreamCount);
  logger.logX('onUserJoined userViewStreamCount[internalMeetingId][userId]', userViewStreamCount[internalMeetingId][userId]);
}

/**
 * addUserViewTracking, calc the view time and store to db
 * @param userId
 * @param streamId
 * @param internalMeetingId
 * @param timestamp
 * @param meetingEnded
 * @returns {Promise<void>}
 */
async function onUserLeft(userId, streamId, internalMeetingId, timestamp, meetingEnded = false) {
  try {
    logger.logX('onUserLeft', userId, streamId, internalMeetingId, timestamp);
    logger.logX('userBeginViewTime[key]', userBeginViewTime[internalMeetingId]?.[userId]);
    // If user have no begin tracking, ignore it
    if (!userBeginViewTime[internalMeetingId]?.[userId]) {
      return false;
    }
    decreaseParticipantCount(internalMeetingId);

    if (!userViewStreamCount[internalMeetingId]) {
      userViewStreamCount[internalMeetingId] = {};
    }
    if (userViewStreamCount[internalMeetingId]?.[userId]) {
      userViewStreamCount[internalMeetingId][userId]--;
    } else {
      userViewStreamCount[internalMeetingId][userId] = 0;
    }
    logger.logX('onUserLeft userViewStreamCount', userViewStreamCount);
    logger.logX('onUserLeft userViewStreamCount[internalMeetingId][userId]', userViewStreamCount[internalMeetingId][userId]);
    // If user leave meeting and this user have no joined the meeting on any where else
    if (meetingEnded === true || userViewStreamCount[internalMeetingId][userId] < 1) {
      const beginTime = userBeginViewTime[internalMeetingId][userId];
      const endTime = timestamp;
      // If total time is -1, this data is invalid
      const totalTime = parseInt(((endTime - beginTime)/1000).toFixed(0)) || -1; // second
      await addUserViewStreamTracking({
        userId: userId,
        streamId: streamId,
        internalMeetingId: internalMeetingId,
        beginTime: beginTime,
        endTime: endTime,
        totalTime: totalTime,
      });
      delete userBeginViewTime[internalMeetingId][userId];
    }
    return true;
  } catch (error) {
    logger.error(`onUserLeft: ${error.toString()}`);
    logger.error(`userId, streamId, internalMeetingId: ${userId}, ${streamId}, ${internalMeetingId}`);
  }
}

/**
 * Handle when meeting ended
 * @param meetingId
 * @param internalMeetingId
 * @param timestamp
 * @returns {Promise<boolean>}
 */
async function onMeetingEnded(meetingId, internalMeetingId, timestamp) {
  try {
    const hookInfo = hookIds[internalMeetingId];
    const haveRecord = hookInfo?.haveRecord;
    const endpoint = hookInfo?.endpoint;
    await destroyHookByMeetingId(internalMeetingId);
    const autoRecord = await getStreamAutoRecord(meetingId);
    logger.logX(`meeting-ended: ${autoRecord}, ${haveRecord}, ${endpoint}`);
    // If have record, registry new hook to get the meeting recorded url
    if (autoRecord || (!autoRecord && haveRecord)) {
      await registryHook({
        callbackURL: `${ROOM_HOOK_RECORDED_CALLBACK_URL}?meetingID=${meetingId}?internalMeetingID=${internalMeetingId}`,
        meetingID: meetingId,
        internalMeetingID: internalMeetingId,
        endpoint: endpoint,
      });
    }
    if (userViewStreamCount?.[internalMeetingId]) {
      await Promise.all(Object.keys(userViewStreamCount[internalMeetingId])?.map(async (userId) => {
        logger.logX(`userViewStreamCount userId:, ${userId}`);
        await onUserLeft(userId, meetingId, internalMeetingId, timestamp, true);
      }));
    }
    // Trigger event user-left for all users was not left
    delete userBeginViewTime?.[internalMeetingId];
    delete userViewStreamCount?.[internalMeetingId];
    const totalViewed = getParticipantCount(internalMeetingId);
    // Delete all counter for this meetingId
    deleteParticipantCount(internalMeetingId);
    await changeStreamStatus(meetingId, 'stopped', totalViewed, 'web');
    return true;
  } catch (error) {
    logger.error(`RoomHook handleHook onMeetingEnded, meetingId, internalMeetingId:, ${meetingId}, ${internalMeetingId}`);
    logger.error(error.toString());
  }
}
