import {Q} from '../Queue';
import globalConstants from "../../../config/globalConstants";
import Notification from "../../models/notificationNew";
import UserOptions from '../../models/userOption';
import {sendMail} from '../EmailDispatcher';

Q.process(globalConstants.jobName.REMIND_RENEW_MEMBERSHIP,1,async function (job, done){
  try{
    let data = job.data;
    let conditions = {
      to:data._id,
      type:"RemindRenewMemberShip"
    };
    let notify = await Notification.findOne(conditions);
    let notification = {
      to:data._id,
      type:"RemindRenewMemberShip",
      data:{
        memberShip:data.memberShip,
        url:'/membership'
      }
    };
    if(!notify && data.email){
      let userOption = await UserOptions.findOne({userID:data.cuid}).lean();
      let mail = {
        type: 'RemindRenewMemberShip',
        language: userOption.language,
        data: {
          url:'membership',
          cuid: data.cuid,
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.userName,
          email: data.email,
          membership: data.memberShip
        }
      };
      await sendMail(mail);
    }
    await Notification.create(notification);
    return done(null);
  }catch (err){
    console.log('err ');
    return done(err);
  }
});
