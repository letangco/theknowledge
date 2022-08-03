// Worker to increase engagements after call/chat

import UserEngagement from '../../../models/userEngagements';
import User from '../../../models/user';
import UserUseInviteCode from '../../../models/userUseInviteCode';
import globalConstants from '../../../../config/globalConstants';
import {Q} from '../../Queue';
import AMPQ from '../../../../rabbitmq/ampq';

Q.process(globalConstants.jobName.SESSION_ENGAGEMENT, 1, async (job, done) => {
  try {
    let data = await User.find({cuid: {$in: [job.data.sharers, job.data.learnerID]}}, 'cuid');
    let sharerId = null, learnerId = null;
    data.forEach(user => {
      if(user.cuid === job.data.sharers) {
        sharerId = user._id;
      } else {
        learnerId = user._id;
      }
    });

    let userEngagementConditions = {
      $or: [
        {user1: sharerId, user2: learnerId},
        {user1: learnerId, user2: sharerId},
      ]
    };
    await UserEngagement.update(userEngagementConditions, {$inc: {engagement: 1}, $set: {user1: sharerId, user2: learnerId}}, {upsert: true});

    //console.log('session engagement done');
    return done(null);
  } catch (err) {
    console.log('session engagement err:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.CHECK_1ST_2MINS_TRANS, 1, async (job, done) => {
  try {
    let transactionDetail = job.data;
    let user = await User.findOne({cuid: transactionDetail.learnerID});

    if(transactionDetail.duration >=120) {
      let usedInviteCode = await UserUseInviteCode.findOne({user: user._id, twoMinsSession: false}).lean();
      if(usedInviteCode) {
        let inviter = await User.findOne({inviteCode: usedInviteCode.code});
        user.balance += 2;

        let promises = [
          user.save()
        ];

        let count = await UserUseInviteCode.count({
          code: usedInviteCode.code,
          // createdAt: {
          //   $gte: new Date(toDay.getFullYear(), toDay.getMonth() + 1, toDay.getDate()),
          //   $lt: new Date(toDay.setDate(toDay.getDate() + 1))
          // },
          twoMinsSession: true
        });
        let check = await UserUseInviteCode.findOne({
          code: usedInviteCode.code,
          userInviteValue: {$ne:2},
          user: user._id,
        }).lean();
        let dataNotify = {
          to: user._id,
          type: 'userUsedInvited',
          data: {}
        };
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
        if(count < 5 && check) {
          //console.log('ahahaha co 2$ nhe !!!!!!');
          inviter.balance += 2;
          promises.push(inviter.save());
          // Code notification invite code
          let dataNotify = {
            to: inviter._id,
            from: user._id,
            type: 'userInvited',
            data: {}
          };
          AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
        }
        await UserUseInviteCode.update(
          {
            user: user._id,
            code: usedInviteCode.code
          },
          {
            $set:
              {
                twoMinsSession:true,
                userInviteValue:2,
                userUseValue:2
              }
          }
        );
        await Promise.all(promises);
      }
    }

    return done(null);
  } catch (err) {
    return done(err);
  }
});
