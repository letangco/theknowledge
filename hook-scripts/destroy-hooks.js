import logger from '../server/util/log';
import { getUrlForRoomCallBalancer, roomRequest } from '../server/components/room/room.util';

const endpoint = process.env.ROOM_ENDPOINT;

/**
 * Destroy hook
 * @param {String} endpoint Server endpoint
 * @param {Number} hookID The ID of the hook that should be removed, as returned in the create hook call
 * @returns {Promise<*>}
 */
async function destroyHookBalancer(endpoint, hookID) {
  try {
    const apiOptions = {
      method: 'GET',
      uri: getUrlForRoomCallBalancer(endpoint,'hooks/destroy', {
        hookID: hookID,
      }),
    };
    return await roomRequest(apiOptions);
  } catch (error) {
    logger.error(`RoomHook destroyHookBalancer, error: ${error.toString()}`);
    throw error;
  }
}

/**
 * Get hook list
 * @param {String} endpoint Server endpoint
 * @param {String} meetingID Server endpoint
 * @returns {Promise<*>}
 */
async function getHookListBalancer(endpoint, meetingID) {
  try {
    const apiOptions = {
      method: 'GET',
      uri: getUrlForRoomCallBalancer(endpoint,'hooks/list', {
        meetingID: meetingID,
      }),
    };
    return await roomRequest(apiOptions);
  } catch (error) {
    logger.error(`RoomHook getHookListBalancer, error: ${error.toString()}`);
    throw error;
  }
}

async function cleanHook() {
  try {
    const res = await getHookListBalancer(endpoint);
    const hookList = res?.hooks?.hook ?? [];
    logger.info(`Clean hook: have ${hookList?.length || 0} hooks`);
    const destroyRequests = hookList?.map(async (hook) => {
      return await destroyHookBalancer(endpoint, hook.hookID);
    });
    await Promise.all(destroyRequests);
    return true;
  } catch (error) {
    logger.error(`cleanHook error: ${error.toString()}`);
    throw error;
  }
}

cleanHook().then(() => {
  logger.info('Clean hooks succeed');
}).catch((error) => {
  logger.error(`Clean hooks error: ${error.toString()}`);
});
