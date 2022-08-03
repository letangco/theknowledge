import AWS from 'aws-sdk';
import configs from '../config';
import {Q} from './Queue';
import globalConstants from '../../config/globalConstants';

AWS.config.update(configs.aws.configs);

let SNS = new AWS.SNS();

export async function testVoip(req, res) {
  try {
    let endpointArn = await createPlatformEndpoint(req.query.device);

    let pushRs = await pushVoIP(endpointArn);

    console.log('push done');

    await deleteEndpoint(endpointArn);

    return res.json(pushRs);
  } catch (err) {
    console.log('err on testVoip:', err);
    return res.status(500).json(err);
  }
}


/**
 * @param options
 * @param options.userReceive User receive's cuid
 * @param options.userSend User send's cuid
 * @param options.chatGroupID Chat group's cuid
 * @param options.requestCancel Is request cancel call?
 *
 */
export function pushVoIPToUser(options) {
  return Q.create(globalConstants.jobName.PUSH_VOIP_TO_USER, options).removeOnComplete(true).save();
}

export async function pushVoIPToDevice(deviceToken, callData) {
  try {
    let endpointArn = await createPlatformEndpoint(deviceToken);

    let pushRs = await pushVoIP(endpointArn, callData);

    console.log('push done');

    await deleteEndpoint(endpointArn);

    return pushRs;
  } catch (err) {
    throw err;
  }
}

function createPlatformEndpoint(deviceToken) {
  return new Promise((resolve, reject) => {
    SNS.createPlatformEndpoint({
      PlatformApplicationArn: configs.aws.sns_app_arn,
      Token: deviceToken
    }, (err, data) => {
      if(err) return reject(err);
      return resolve(data.EndpointArn);
    });
  });
}


function pushVoIP(endpointArn, callData) {
  return new Promise((resolve, reject) => {
    let payload = {
      default   : 'Hello World, default payload',
      APNS_VOIP : JSON.stringify({
        aps: {
          alert: 'Hi there',
          sound: 'default',
          badge: 1
        },
        callData
      }),
      APNS_VOIP_SANDBOX : JSON.stringify({
        aps: {
          alert: 'Hi there',
          sound: 'default',
          badge: 1
        },
        callData
      })
    };
    payload = JSON.stringify(payload);

    SNS.publish({
      MessageStructure: 'json',
      Message: payload,
      TargetArn: endpointArn
    }, (err, data) => {
      if(err) return reject(err);
      return resolve(data);
    });
  });
}

function deleteEndpoint(endpointArn) {
  return new Promise((resolve, reject) => {
    let params = {
      EndpointArn: endpointArn /* required */
    };

    SNS.deleteEndpoint(params, function(err) {
      if (err){
        return reject(err);
      }
      return resolve();
    });
  });
}
