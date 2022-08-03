import logger from '../../util/log';
import { getUrlForRoomCall, getUrlForRoomCallBalancer, roomRequest } from './room.util';
import * as UserService from '../../services/users.service';
import * as LiveStreamService from '../../services/liveStream.services';
import {
  ROOM_ORIGIN_VERSION,
  ROOM_ORIGIN_SERVER_NAME,
  ROOM_LOGOUT_BASE_URL,
  ROOM_HOOK_CALLBACK_URL,
  ROOM_LOGO,
  ROOM_PLAYBACK_LOGO,
  ROOM_PLAYBACK_COPYRIGHT,
  ROOM_PRE_SLIDE,
  ROOM_WELCOME_MESSAGE,
  ROOM_MOBILE_LOGO,
  ROOM_CLIENT_TITLE,
  ROOM_FAVICON,
} from '../../../config/config';
import APIError from '../../util/APIError';
import { getUserStreamPermission } from '../../services/liveStream.services';
import { handleHook, handleRecordedHook, registryHook } from './room.hook';

/**
 * Get BBB status
 * @returns {Promise.<{}>}
 */
export async function getRoomStatus() {
  try {
    const apiOptions = {
      method: 'GET',
      uri: getUrlForRoomCall('/'),
    };
    return await roomRequest(apiOptions);
  } catch (error) {
    logger.error('RoomService getRoomStatus, error:');
    logger.error(error);
    throw error;
  }
}

/**
 * Create room
 * The room is available before 5 minutes after created, this duration config able
 * @param params
 * @param {String} params.name A name for the meeting
 * @param {String} params.meetingID A meeting ID that can be used to identify this meeting
 * @param {String|optional} params.moderatorPW The password that will join URL can later provide as its password parameter to indicate the user will as a moderator.
 *                           If no moderatorPW is provided, create will return a randomly generated moderatorPW password for the meeting.
 * @param {String|optional} params.attendeePW The password that the join URL can later provide as its password parameter to indicate the user will join as a viewer.
 *                          If no attendeePW is provided, the create call will return a randomly generated attendeePW password for the meeting.
 * @param {String|optional} params.logoutURL The URL that the BigBlueButton client will go to after users click the OK button on the ‘You have been logged out message’
 * @param {String|optional} params.logo Setting logo=http://www.example.com/my-custom-logo.png will replace the default logo in the html5 client. (added 2.0)
 * @param {String|optional} params.mobileLogo Setting logo=http://www.example.com/my-custom-mobile-logo.png will replace the default logo on mobile UI in the html5 client. (added 2.0)
 * @param {String|optional} params.favicon Setting logo=http://www.example.com/my-custom-favicon.png will replace the default favicon html5 client. (added 2.0)
 * @param {String|optional} params.playbackLogo Logo load before the slide (added 2.0)
 * @param {String|optional} params.playbackCopyright The copyright when playback recorded presentation (added 2.0)
 * @param {String|optional} params.preSlide The slide display for first load
 * @param {String|optional} params.welcome A welcome message that gets displayed on the chat window when the participant joins.
 * @param {String|optional} params.clientTitle Custom html5 favicon
 * @param {Boolean|optional} params.autoRecord User setting auto record or not
 * @returns {Promise.<{}>}
 */
export async function createRoom(params) {
  try {
    const apiOptions = {
      method: 'POST',
      uri: getUrlForRoomCall('create', {
        name: params.name,
        meetingID: params.meetingID,
        moderatorPW: params.moderatorPW,
        attendeePW: params.attendeePW,
        'meta_bbb-origin-version': ROOM_ORIGIN_VERSION,
        'meta_bbb-origin-server-name': ROOM_ORIGIN_SERVER_NAME,
        'meta_playback-logo-url': params.playbackLogo,
        'meta_playback-copyright': params.playbackCopyright,
        'meta_html5-mobile-logo': params.mobileLogo,
        'meta_html5-client-title': params.clientTitle,
        'meta_html5-client-favicon': params.favicon,
        autoStartRecording: params.autoRecord,
        allowStartStopRecording: !params.autoRecord,
        record: true,
        logoutURL: params.logoutURL || ROOM_LOGOUT_BASE_URL,
        logo: params.logo,
        welcome: params.welcome,
        copyright: 'XRoom',
      }),
      json: false,
    };
    if (params.preSlide) {
      apiOptions.body = `
        <modules>
          <module name="presentation">
            <document url="${params.preSlide}" filename="pre-slide.pdf"/>
          </module>
        </modules>
      `;
      apiOptions.headers = {
        'Content-Type': 'application/xml',
      };
    }
    const room = await roomRequest(apiOptions);
    return {
      meetingID: room.meetingID,
      internalMeetingID: room.internalMeetingID,
      attendeePW: room.attendeePW,
      moderatorPW: room.moderatorPW,
      hasUserJoined: room.hasUserJoined === 'true',
      duration: Number.parseInt(room.duration),
      hasBeenForciblyEnded: room.hasBeenForciblyEnded === 'true',
    };
  } catch (error) {
    logger.error('RoomService createRoom, error:');
    logger.error(error);
    throw error;
  }
}

/**
 * Get room info
 * @param params
 * @param {String} params.meetingID A meeting ID that can be used to identify this meeting
 * @returns {Promise.<{}>}
 */
export async function getRoom(params) {
  try {
    const apiOptions = {
      method: 'GET',
      uri: getUrlForRoomCall('getMeetingInfo', {
        meetingID: params.meetingID,
      }),
    };
    const room = await roomRequest(apiOptions);
    if (room.returncode === 'FAILED') {
      return null;
    }
    return {
      meetingID: room.meetingID,
      internalMeetingID: room.internalMeetingID,
      attendeePW: room.attendeePW,
      moderatorPW: room.moderatorPW,
      hasUserJoined: room.hasUserJoined === 'true',
      duration: Number.parseInt(room.duration),
      hasBeenForciblyEnded: room.hasBeenForciblyEnded === 'true',
    };
  } catch (error) {
    logger.error('RoomService getRoom, error:');
    logger.error(error);
    throw error;
  }
}

/**
 * Get room info balancer
 * @param params
 * @param {String} params.meetingID A meeting ID that can be used to identify this meeting
 * @param {String} params.endpoint Server endpoint
 * @returns {Promise.<{}>}
 */
export async function getRoomBalancer(params) {
  try {
    const apiOptions = {
      method: 'GET',
      uri: getUrlForRoomCallBalancer(params.endpoint, 'getMeetingInfo', {
        meetingID: params.meetingID,
      }),
    };
    const room = await roomRequest(apiOptions);
    if (room.returncode === 'FAILED') {
      return null;
    }
    return {
      meetingID: room.meetingID,
      internalMeetingID: room.internalMeetingID,
      attendeePW: room.attendeePW,
      moderatorPW: room.moderatorPW,
      hasUserJoined: room.hasUserJoined === 'true',
      duration: Number.parseInt(room.duration),
      hasBeenForciblyEnded: room.hasBeenForciblyEnded === 'true',
    };
  } catch (error) {
    logger.error('RoomService getRoom, error:');
    logger.error(error);
    throw error;
  }
}

/**
 * Get presenter or client join url
 * @param params
 * @param params.userId
 * @param params.streamId
 * @returns {Promise.<{}>}
 */
export async function getJoinUrl(params) {
  try {
    // Get user and stream info
    const user = await UserService.getUserById(params.userId);
    const userPermission = await getUserStreamPermission(user?.token, params.streamId);
    if (['presenter', 'viewer'].indexOf(userPermission) < 0) {
      return Promise.reject(new APIError(403,  [
        {
          msg: 'Permission denied',
          param: 'permissionDenied',
        },
      ]));
    }
    // if (userPermission === 'presenter' && (!user.teacherMembership || user.teacherMembership < Date.now())) {
    //   return Promise.reject(new APIError(403,  [
    //     {
    //       msg: 'Teacher membership was expired',
    //       param: 'teacherMembershipExpired',
    //     },
    //   ]));
    // }
    const stream = await LiveStreamService.getStreamByQuery({
      _id: params.streamId,
    }, {
      path: 'course',
      select: 'slug',
    });
    if (!stream) {
      return Promise.reject(new APIError(404, 'Stream not found'));
    }
    let room;
    // Get room
    room = await getRoom({
      meetingID: stream._id,
    });
    if (userPermission === 'presenter') {
      if (!room?.meetingID) {
        room = await createRoom({
          name: stream.title,
          meetingID: stream._id,
          logoutURL: stream?.course?.slug ? `${ROOM_LOGOUT_BASE_URL}/course/${stream.course.slug}` : ROOM_LOGOUT_BASE_URL,
          logo: ROOM_LOGO,
          mobileLogo: ROOM_MOBILE_LOGO,
          favicon: ROOM_FAVICON,
          clientTitle: ROOM_CLIENT_TITLE,
          playbackLogo: ROOM_PLAYBACK_LOGO,
          playbackCopyright: ROOM_PLAYBACK_COPYRIGHT,
          preSlide: ROOM_PRE_SLIDE,
          welcome: ROOM_WELCOME_MESSAGE,
          autoRecord: !!stream.autoRecord,
        });
      }

      await registryHook({
        callbackURL: `${ROOM_HOOK_CALLBACK_URL}?meetingID=${room.meetingID}?internalMeetingID=${room.internalMeetingID}`,
        meetingID: room.meetingID,
        internalMeetingID: room.internalMeetingID,
      });
    }
    const roomPassword = userPermission === 'presenter' ? room?.moderatorPW : room?.attendeePW;
    if (!roomPassword) {
      return Promise.reject(new APIError(403,  [
        {
          msg: 'Room is not valid',
          param: 'roomNotValid',
        },
      ]));
    }
    const apiOptions = {
      method: 'GET',
      uri: getUrlForRoomCall('join', {
        fullName: user.fullName,
        meetingID: stream._id,
        password: roomPassword,
        userID: user._id,
        redirect: false,
      }),
    };
    const joinResponse = await roomRequest(apiOptions);
    if (joinResponse?.url) {
      return joinResponse?.url;
    }
    return Promise.reject(new APIError(403, {
      msg: 'Join URL not found',
      param: 'joinUrlNotFound',
    }));
  } catch (error) {
    logger.error('RoomService getJoinUrl, error:');
    logger.error(error);
    throw error;
  }
}

export async function callRoomHook(data) {
  try {
    await handleHook(data);
    return true;
  } catch (error) {
    logger.error('RoomService callRoomHook, error:');
    logger.error(error);
    throw error;
  }
}

export async function callRoomRecordedHook(data) {
  try {
    await handleRecordedHook(data);
    return true;
  } catch (error) {
    logger.error('RoomService callRoomRecordedHook, error:');
    logger.error(error);
    throw error;
  }
}
