import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import User from '../../models/user';
import {pushVoIPToDevice} from "../VoIP";

Q.process( globalConstants.jobName.PUSH_VOIP_TO_USER, 1, async ( job, done ) => {
  try {
    // let userCuild = job.data.userCuid;
    let userReceiveCuid = job.data.userReceive;
    let resources = await Promise.all([
      User.findOne({cuid: userReceiveCuid}, 'cuid deviceAWSTokens').lean(),
      User.formatBasicInfoByCuid(User, job.data.userSend)
    ]);
    let user = resources[0], userSend = resources[1];

    if(user && user.deviceAWSTokens && user.deviceAWSTokens.length) {
      let callData = job.data;
      callData.userSend = userSend;
      console.log('callData:', callData);
      user.deviceAWSTokens.forEach(deviceToken => {
        Q.create(globalConstants.jobName.PUSH_VOIP_TO_DEVICE, {deviceToken, callData}).removeOnComplete(true).save();
      });
    }

    return done(null);
  } catch (err) {
    console.log('err on job PUSH_VOIP_TO_USER:', err);
    return done(err);
  }
});

Q.process( globalConstants.jobName.PUSH_VOIP_TO_DEVICE, 1, async ( job, done ) => {
  try {
    let deviceToken = job.data.deviceToken;
    let callData = job.data.callData;

    await pushVoIPToDevice(deviceToken, callData);

    return done(null);
  } catch (err) {
    console.log('err on job PUSH_VOIP_TO_DEVICE:', err);
    return done(err);
  }
});
