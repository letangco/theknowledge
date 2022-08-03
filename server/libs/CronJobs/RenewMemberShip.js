import User from '../../models/user';
import {Q} from '../Queue';
import globalConstant from '../../../config/globalConstants';
import {sendNotificationToSlack} from '../../services/memberShip.services';
const tracking = 3*24*60*60*1000;

export async function notifyRenewMembership() {
  try{
    let fields = ['_id', 'fullName', 'avatar', 'cuid', 'email', 'telephone', 'dateOffline', 'dateAdded', 'active', 'expert', 'deleteDate', 'memberShip'].join(' ');
    let conditions = {
      memberShip:{$exists:true}
    };
    let memberships = await User.find(conditions,fields).lean();
    memberships = memberships.filter(e => (e.memberShip - tracking < Date.now() && e.memberShip > Date.now()));
    memberships.map(e =>{
      sendNotificationToSlack({action: 'renewMembership', detail: e});
      Q.create(globalConstant.jobName.REMIND_RENEW_MEMBERSHIP, e).removeOnComplete(true).save();
    });
  }catch (err){
    console.log('err notifyRenewMembership : ',err);
  }
}
