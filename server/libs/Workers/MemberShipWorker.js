import {Q} from '../Queue';
import User from '../../models/user';
import globalConstants from '../../../config/globalConstants';
import config from '../../../server/config';

import {buyMemberShip, inviteMemberShip} from "../../services/memberShip.services";

Q.process(globalConstants.jobName.JOIN_MEMBERSHIP_AFTER_PAY, 1, async (job, done) => {
  try {
    let payment = job.data;
    let langCode = payment.paymentType === 'vtcPay' ? 'vi' : 'en';

    let user = await User.findOne({cuid: payment.userId}, '_id').lean();
    if(!user) {
      return Promise.reject({success: false, error: 'User not found.'});
    }
    await buyMemberShip(user._id, payment.paymentInfo.data.memberShip.key, langCode, payment.paymentInfo.data.contactInfo, payment.paymentInfo.data.aff, false);
    return done(null);
  } catch (err) {
    console.log('err on job JOIN_MEMBERSHIP_AFTER_PAY:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.SCHEDULE_RENEW_MEMBERSHIP, 1, async (job, done)=>{
  try{
    let data = job.data;
    await User.update(
      {_id:data.user},
      {
        $set:{
          memberShip:data.time
        }
      }
    );
    return done(null);
  }catch (err){
    console.log('err on job SCHEDULE_RENEW_MEMBERSHIP:', err);
    return done(err);
  }
});
