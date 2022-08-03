import UserUseInviteCode from '../models/userUseInviteCode';
import TransactionDetail from '../models/transactionDetail';
import ServerSettings from '../models/serverSettings';
import User from '../models/user';
import StringHelper from '../util/StringHelper';
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';

const LIMIT = 20;

export async function addUserUseCode(req, res) {
  try {
    let code = StringHelper.sanitizeHtml(req.body.code);

    let setting = await ServerSettings.findOne({key: 'run_invite_strategy'});
    if (!setting || !setting.value) {
      return res.status(400).json({
        success: false,
        error: 'Invite promotion is pending.'
      });
    }

    let inviter = await User.findOne({inviteCode: code});
    if (!inviter) {
      return res.json({success: false, error: 'Your invite code is not valid. Please try again!'});
    }

    let user1 = await User.findOne({inviteCode: code, _id: req.user._id});
    if (user1) {
      return res.json({success: false, error: 'You can\'t use invite code yourself.'});
    }

    let usedInviteCode = await UserUseInviteCode.count({user: req.user._id});
    if(usedInviteCode) {
      return res.status(403).json({success: false, error: 'You have used invite code before.'});
    }

    // let toDay = new Date();
    // let conditions = {
    //   code: code,
    //   createdAt: {
    //     $gte: new Date(toDay.getFullYear(), toDay.getMonth() + 1, toDay.getDate()),
    //     $lt: new Date(toDay.setDate(toDay.getDate() + 1))
    //   },
    //   twoMinsSession: true
    // };
    // let count = await UserUseInviteCode.count(conditions);
    // if (count >= 5) {
    //   return res.json({
    //     success: false,
    //     error: 'This code is can not use today.'
    //   });
    // }

    let created = await UserUseInviteCode.create({
      user: req.user._id,
      code: code
    });
    let userSend = await User.findById(req.user._id);
    let user = await User.findById(created.user);
    let toDay = new Date();
    let conditions = {
      code: created.code,
      // createdAt: {
      //   $gte: new Date(toDay.getFullYear(), toDay.getMonth() + 1, toDay.getDate()),
      //   $lt: new Date(toDay.setDate(toDay.getDate() + 1))
      // },
      twoMinsSession: true
    };

    let counts = await Promise.all([
      TransactionDetail.count({learnerID: user.cuid, duration: {$gte: 120}}),
      UserUseInviteCode.count(conditions)
    ]);
    let transactionCount = counts[0], useCodeCount = counts[1];
    // console.log('count:', count);
    if (transactionCount) {
      let userUpdateId = [user._id], setOptions = {twoMinsSession: true, userUseValue: 2};
      if(useCodeCount < 5) {
        userUpdateId.push(inviter._id);
        setOptions.userInviteValue = 2;
      }
      let promises = [
        User.update({_id: {$in: [user._id, inviter._id]}}, {$inc: {balance: 2}}, {multi: true}),
        UserUseInviteCode.update({_id: created._id}, {$set: setOptions})
      ];
      await Promise.all(promises);
      // Code notification invite code
      let userSend = await User.findById(req.user._id);
      if(userSend){
        let dataNotify = {
          to: inviter._id,
          from: userSend._id,
          type: 'userInvited',
          data: {}
        };
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
        dataNotify = {
          to: userSend._id,
          type: 'userUsedInvited',
          data: {}
        };
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
      }
    } else if(useCodeCount < 5) {
      let dataNotify = {
        to: inviter._id,
        from: userSend._id,
        type: 'userInviteCode',
        data: {}
      };
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
    }
    return res.json({success: true});
  } catch (err) {
    console.log('err on addUserUseCode:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function getUserUseInviteCode(req, res) {
  try {
    let page = ~~ req.query.page || 1;
    let skip = (page - 1) * LIMIT;
    // let timestamp = Number(req.query.date).valueOf();
    // timestamp = isNaN(timestamp) ? Date.now() : timestamp;
    // let date = new Date(timestamp), from = new Date(date);

    let user = await User.findById(req.user._id);

    let conditions = {
      code: user.inviteCode,
      // createdAt: {
      //   $gte: new Date(from.getFullYear(), from.getMonth(), from.getDate()),
      //   $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate()+1)
      // },
      userInviteValue: {$gt: 0}
    };


    let rs = await Promise.all([
      UserUseInviteCode.count(conditions),
      UserUseInviteCode.find(conditions).sort({createdAt: -1}).skip(skip).limit(LIMIT),
      UserUseInviteCode.aggregate([
        { $match: { code: user.inviteCode } },
        { $group: { _id: null, sum_amount: {$sum: "$userInviteValue"} } }
      ])
    ]);
    let total = rs[0];
    let data = await UserUseInviteCode.getMetadata(rs[1]);
    let agg = rs[2];

    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(total / LIMIT),
      total_items: total,
      total_ref_bonus: agg.length ? agg[0].sum_amount : 0,
      data: data
    });
  } catch (err) {
    console.log('err on getUserUseInviteCode:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}
