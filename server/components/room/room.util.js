import crypto from 'crypto';
import request from 'request-promise';
import xml2js from 'xml2js';
import {
  ROOM_ENDPOINT,
  ROOM_SECRET,
} from '../../../config/config';
import logger from '../../util/log';

const parser = new xml2js.Parser({ explicitArray: false });

export async function roomRequest(apiOptions) {
  const res = await parser.parseStringPromise(await request(apiOptions));
  return res?.response;
}

global.roomRequest = roomRequest;

const NO_CHECKSUM_METHODS = ['setConfigXML', '/', 'enter', 'configXML', 'signOut'];

/**
 * Returns a url for any `method` available in the Room API using the parameters in `params`.
 * @param {String} method The name of the API method
 * @param {Object} params An object with pairs of `parameter`:`value`. The parameters will be used only in the
 *                 API calls they should be used. If a parameter name starts with `custom_`, it will
 *                 be used in all API calls, removing the `custom_` prefix.
 *                 Parameters to be used as metadata should use the prefix `meta_`.
 * @param {Boolean} filter Whether the parameters in `params` should be filtered, so that the API
 *                  calls will contain only the parameters they accept. If false, all parameters
 *                  in `params` will be added to the API call.
 * @returns {string}
 */
export function getUrlForRoomCall(method, params = null, filter = true) {
  let query = '', sep;
  logger.logX('Generating URL for method:', method);
  logger.logX(params);
  // mounts the string with the list of parameters
  const paramList = [];
  if (params != null) {
    if (filter) {
      params = filterParams(params, method);
    } else {
      params = filterCustomParameters(params);
    }
    // Add the parameters in alphabetical order to prevent checksum errors
    let keys = Object.keys(params);
    keys = keys.sort();
    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i], param;
      if (key != null) {
        param = params[key];
      }
      if (param != null) {
        paramList.push(`${encodeForUrl(key)}=${encodeForUrl(param)}`);
      }
    }
    if (paramList.length > 0) {
      query = paramList.join('&');
    }
  } else {
    query = '';
  }
  // Calculate the checksum
  const checksum = getChecksum(method, query);
  // Add the missing elements in the query
  if (paramList.length > 0) {
    query = `${method}?${query}`;
    sep = '&';
  } else {
    if (method !== '/') {
      query = method;
    }
    sep = '?';
  }
  if (NO_CHECKSUM_METHODS.indexOf(method) < 0) {
    query = `${query}${sep}checksum=${checksum}`;
  }
  return `${ROOM_ENDPOINT}/${query}`;
}

/**
 * Returns a url for any `method` available in the Room API using the parameters in `params`.
 * @param {String} endpoint The server endpoint
 * @param {String} method The name of the API method
 * @param {Object} params An object with pairs of `parameter`:`value`. The parameters will be used only in the
 *                 API calls they should be used. If a parameter name starts with `custom_`, it will
 *                 be used in all API calls, removing the `custom_` prefix.
 *                 Parameters to be used as metadata should use the prefix `meta_`.
 * @param {Boolean} filter Whether the parameters in `params` should be filtered, so that the API
 *                  calls will contain only the parameters they accept. If false, all parameters
 *                  in `params` will be added to the API call.
 * @returns {string}
 */
export function getUrlForRoomCallBalancer(endpoint, method, params = null, filter = true) {
  let query = '', sep;
  logger.logX('Generating URL for method:', method);
  logger.logX(params);
  // mounts the string with the list of parameters
  const paramList = [];
  if (params != null) {
    if (filter) {
      params = filterParams(params, method);
    } else {
      params = filterCustomParameters(params);
    }
    // Add the parameters in alphabetical order to prevent checksum errors
    let keys = Object.keys(params);
    keys = keys.sort();
    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i], param;
      if (key != null) {
        param = params[key];
      }
      if (param != null) {
        paramList.push(`${encodeForUrl(key)}=${encodeForUrl(param)}`);
      }
    }
    if (paramList.length > 0) {
      query = paramList.join('&');
    }
  } else {
    query = '';
  }
  // Calculate the checksum
  const checksum = getChecksum(method, query);
  // Add the missing elements in the query
  if (paramList.length > 0) {
    query = `${method}?${query}`;
    sep = '&';
  } else {
    if (method !== '/') {
      query = method;
    }
    sep = '?';
  }
  if (NO_CHECKSUM_METHODS.indexOf(method) < 0) {
    query = `${query}${sep}checksum=${checksum}`;
  }
  return `${endpoint}/${query}`;
}

/**
 * Return sha1 string
 * @param {String} data
 * @returns {string}
 */
function getSha1(data) {
  return crypto.createHash('sha1')
    .update(data)
    .digest('hex');
}

/**
 * Returns a list of supported parameters in the URL for a given API method.
 * The return is an array of arrays composed by:
 *   [0] - RegEx or string with the parameter name
 *   [1] - true if the parameter is required, false otherwise
 * @param {String} param
 * @returns {*[]|*[][]|*[][]}
 */
function urlParamsFor(param) {
  switch (param) {
    case 'create':
      return [['meetingID', true], ['name', true], ['attendeePW', false], ['moderatorPW', false], ['welcome', false], ['dialNumber', false], ['voiceBridge', false], ['webVoice', false], ['logoutURL', false], ['maxParticipants', false], ['record', false], ['logo', false], ['duration', false], ['moderatorOnlyMessage', false], ['autoStartRecording', false], ['allowStartStopRecording', false], ['bannerText', false], ['bannerColor', false], ['copyright', false], [/meta_\w+/, false]];
    case 'join':
      return [['fullName', true], ['meetingID', true], ['password', true], ['createTime', false], ['userID', false], ['webVoiceConf', false], ['configToken', false], ['avatarURL', false], ['redirect', false], ['clientURL', false]];
    case 'isMeetingRunning':
      return [['meetingID', true]];
    case 'end':
      return [['meetingID', true], ['password', true]];
    case 'getMeetingInfo':
      return [['meetingID', true], ['password', true]];
    case 'getRecordings':
      return [['meetingID', false], ['recordID', false], ['state', false], [/meta_\w+/, false]];
    case 'publishRecordings':
      return [['recordID', true], ['publish', true]];
    case 'deleteRecordings':
      return [['recordID', true]];
    case 'updateRecordings':
      return [['recordID', true], [/meta_\w+/, false]];
    case 'getRecordingTextTracks':
      return [['recordID', true]];
    case 'hooks/create':
      return [['callbackURL', true], ['meetingID', false], ['getRaw', false]];
    case 'hooks/destroy':
      return [['hookID', true]];
    case 'hooks/list':
      return [['meetingID', false]];
    default:
      return null;
  }
}

/**
 * Filter `params` to allow only parameters that can be passed to the method `method`.
 * To use custom parameters, name them `custom_parameterName`.
 * The `custom_` prefix will be removed when generating the urls.
 * @param {Object} params
 * @param {String} method
 * @returns {*}
 */
function filterParams(params, method) {
  let r;
  const filters = urlParamsFor(method);
  if ((filters == null) || filters.length === 0) {
    return {};
  } else {
    r = include(params, function(key) {
      let filter, i, len;
      for (i = 0, len = filters.length; i < len; i++) {
        filter = filters[i];
        if (filter[0] instanceof RegExp) {
          if (key.match(filter[0]) || key.match(/^custom_/)) {
            return true;
          }
        } else {
          if (key.match(`^${filter[0]}$`) || key.match(/^custom_/)) {
            return true;
          }
        }
      }
      return false;
    });
  }
  return filterCustomParameters(r);
}

/**
 * Creates keys without 'custom_' and deletes the ones with it
 * @param {Object} params
 * @returns {*}
 */
function filterCustomParameters(params) {
  let key;
  for (key in params) {
    if (params.hasOwnProperty(key)) {
      let v = params[key];
      if (key.match(/^custom_/)) {
        params[key.replace(/^custom_/, '')] = v;
      }
    }
  }
  for (key in params) {
    if (params.hasOwnProperty(key)) {
      if (key.match(/^custom_/)) {
        delete params[key];
      }
    }
  }
  return params;
}

/**
 * Calculates the checksum for an API call `method` with the params in `query`.
 * @param {String} method
 * @param {String} query
 * @returns {string}
 */
function getChecksum(method, query) {
  query = query || '';
  const str = method + query + ROOM_SECRET;
  return getSha1(str);
}

/**
 * Ruby-like include() method for Objects
 * @param {Object} input
 * @param {function} _function
 * @returns {{}}
 */
function include(input, _function) {
  let key;
  const _obj = {};
  for (key in input) {
    let value = input[key];
    if (_function.call(input, key, value)) {
      _obj[key] = value;
    }
  }
  return _obj;
}

/**
 * Encodes a string to set it in the URL. Has to encode it exactly like Room does!
 * Otherwise the validation of the checksum might fail at some point.
 * @param value
 * @returns {string}
 */
function encodeForUrl(value) {
  // use + instead of %20 for space to match what the Java tools do.
  // encodeURIComponent doesn't escape !'()* but browsers do, so manually escape them.
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/[!'()]/g, escape)
    .replace(/\*/g, '%2A');
}
