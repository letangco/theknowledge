import request from 'request-promise';
import config from '../config';
import globalConstants from '../../config/globalConstants';
import User from '../models/user';
import {isUserSessionReady} from '../routes/socket_routes/chat_socket';
import logger from '../util/log';

/**
 * Get user is viewing this stream
 * @param streamId
 * @returns {Promise.<{}>}
 */
export async function getCurrentViewerInfo( streamId ) {
  const apiOptions = {
    method: 'GET',
    uri: `${config.stream.antAPI}/ant/viewer/${streamId}/status-all`,
    json: true,
    strictSSL: false // Allow to call to SSL domain https://github.com/request/request/issues/2505
  };
  try {
    const requestResult = await request(apiOptions);
    if ( requestResult.success === true ) {
      const viewerStatus = requestResult.viewerStatus;
      if ( viewerStatus instanceof Object ) {
        let getDataPromises = [];
        let currentViewerInfo = {};

        async function getUserInfo(userId) {
          if ( viewerStatus[userId] !== 'offline' ) {
            const viewerUserInfo = await User.formatBasicInfoById(User, userId);
            viewerUserInfo.status = viewerStatus[userId];
            currentViewerInfo[userId] = viewerUserInfo;
          }
        }

        Object.keys(viewerStatus).map( userId => {
          getDataPromises.push(getUserInfo(userId));
        });

        await Promise.all(getDataPromises);
        return currentViewerInfo;
      }
    }
    return {};
  } catch (error) {
    logger.error(`getViewerStatus, error: ${error}`);
    return {};
  }
}

export async function mapUsersInfo( streamId, userIds = [], justGetInList = false ) {
  const apiOptions = {
    method: 'GET',
    uri: `${config.stream.antAPI}/ant/viewer/${streamId}/status-all`,
    json: true,
    strictSSL: false
  };
  try {
    return {};
    const requestResult = await request(apiOptions);
    if ( requestResult.success === true ) {
      const viewerStatus = requestResult.viewerStatus;
      if ( viewerStatus instanceof Object ) {
        let getDataPromises = [];
        let currentViewerInfo = {};

        if ( justGetInList === true ) {
          await Promise.all(userIds.map( async userId => {
            let viewerUserInfo = await User.formatBasicInfoById(User, userId);
            if(viewerUserInfo){
              viewerUserInfo.status = viewerStatus[userId] || 'offline';
              currentViewerInfo[userId] = viewerUserInfo;
            }
          }));
        } else {
          await Promise.all(userIds.map( async userId => {
            let viewerUserInfo = await User.formatBasicInfoById(User, userId);
            if(viewerUserInfo){
              viewerUserInfo.status = viewerStatus[userId] || 'offline';
              currentViewerInfo[userId] = viewerUserInfo;
              delete viewerStatus[userId]; // Remove the user had browse
            }
          }));
          await Promise.all(Object.keys(viewerStatus).map( async userId => {
            let viewerUserInfo = await User.formatBasicInfoById(User, userId);
            if(viewerUserInfo){
              viewerUserInfo.status = viewerStatus[userId] || 'offline';
              currentViewerInfo[userId] = viewerUserInfo;
              delete viewerStatus[userId]; // Remove the user had browse
            }
          }));
        }
        return currentViewerInfo;
      }
    }
    return {};
  } catch (error) {
    console.log('mapUsersInfo, error:');
    console.log(error.message);
    return {};
  }
}

/**
 * Emit message to room
 * @param streamId
 * @param event
 * @param data
 * @param ops: { includeSender: true || false // Send to your self or not }
 */
export function broadcastToRoom(streamId, event, data, ops) {
  const getUserPermissionOptions = {
    method: 'POST',
    uri: `${config.stream.antAPI}/ant/socket/${streamId}/broadcast-to-room`,
    body: {
      event: event,
      data: data,
      ops: ops
    },
    json: true,
    strictSSL: false
  };

  return request(getUserPermissionOptions);
}

/**
 * Todo: call this function to check user status before make the Session
 * Check user is ready for establish new Session connection?
 * @param userId
 * @returns {boolean}
 */
export async function isUserReadyForNewConnection(userId) {
  let isUserSessionReady = await isUserSessionReady(userId);
  let isUserInviteReady = await isUserInviteFree(userId);
  return ( isUserSessionReady === true && isUserInviteReady === true );
}

async function isUserInviteFree(userId) {
  const apiOptions = {
    method: 'GET',
    uri: `${config.stream.antAPI}/ant/user/${userId}/invite-free`,
    json: true,
    strictSSL: false
  };

  try {
    let res = await request(apiOptions);
    if ( res && res.success === true ) {
      return res.ready || false;
    }
    return false;
  } catch (ex) {
    return false;
  }
}

export async function getStreamTotalViewed(streamId) {
  const apiOptions = {
    method: 'GET',
    uri: `${config.stream.antAPI}/ant/viewer/${streamId}/total-viewed`,
    json: true,
    strictSSL: false
  };

  try {
    let res = await request(apiOptions);
    if ( res && res.success === true ) {
      return res.totalViewed || 0;
    }
    return 0;
  } catch (ex) {
    return 0;
  }
}

export async function getStreamCurrentNumViewer(streamId) {
  const apiOptions = {
    method: 'GET',
    uri: `${config.stream.antAPI}/ant/viewer/${streamId}/current-num-view`,
    json: true,
    strictSSL: false
  };

  try {
    let res = await request(apiOptions);
    if ( res && res.success === true ) {
      return res.currentNumView || 0;
    }
    return 0;
  } catch (ex) {
    return 0;
  }
}

/**
 * Create RTMP stream broadcast via Ant
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function createRtmpStream(req, res) {
  try {
    const streamId = req.body.streamId;
    const name = req.body.name;

    const apiOptions = {
      method: 'POST',
      uri: `${config.stream.antAPI}/ant/stream/create`,
      json: true,
      strictSSL: false,
      body: {
        streamId: streamId,
        name: name
      }
    };
    let apiRes = await request(apiOptions);
    return res.json(apiRes);
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Get stream info
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function getBroadcastInfo(req, res) {
  try {
    const streamId = req.params.id;
    if ( streamId ) {
      const apiOptions = {
        method: 'GET',
        uri: `${config.stream.antAPI}/ant/broadcast/${streamId}/info`,
        json: true,
        strictSSL: false
      };
      let apiRes = await request(apiOptions);
      return res.json(apiRes);
    } else {
      return res.status(500).json({
        success: false,
        error: 'Stream Id is not found!'
      })
    }
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Remove stream
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function removeBroadcast(req, res) {
  try {
    const streamId = req.params.id;
    if ( streamId ) {
      // const apiOptions = {
      //   method: 'POST',
      //   uri: `${config.stream.antAPI}/ant/broadcast/${streamId}/remove`,
      //   json: true,
      //   strictSSL: false
      // };
      // let apiRes = await request(apiOptions);
      // return res.json(apiRes);
      return res.json({
        success: false,
        message: 'This API is maintaining',
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Stream Id is not found!'
      })
    }
  } catch ( error ) {
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
