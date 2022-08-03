import User from '../../models/user';
import Withdrawal from '../../models/withdrawal';
import configs from '../../config';

async function createAutoWithdrawal() {
  let users = await User.find({fullWithdrawl: {$ne: null}});
  let allPromises = users.map(async user => {
    let promises = [];
    let withdrawal = Object.assign({}, user.fullWithdrawl);
    withdrawal.checkedDate = new Date();

    if(user.active !== 1) {
      withdrawal.status = 'rejected';
      withdrawal.notes = 'Invalid user.';
    } else if(user.balance <= 10) {
      withdrawal.status = 'rejected';
      withdrawal.notes = `Invalid balance ($${user.balance})`;
    } else {
      let amount = user.balance - 10;
      withdrawal.amount = amount;
      withdrawal.status = 'approved';
      user.balance -= amount;

      if(!user.autoWithdrawl) {
        user.fullWithdrawl = undefined;
        user.markModified('fullWithdrawl');
      }
      promises.push(user.save());
    }

    promises.push(Withdrawal.create(withdrawal));
    await Promise.all(promises);
  });

  return await Promise.all(allPromises);

  //
  // let autoWithdrawal = await Withdrawal.find({type: 'fullAuto', status: 'pending'});
  // let promises = autoWithdrawal.map(async withdrawal => {
  //   let user = await User.findOne({_id: withdrawal.userId, active: 1});
  //   let promises = [];
  //   withdrawal.checkedDate = new Date();
  //   if(!user) {
  //     withdrawal.status = 'rejected';
  //     withdrawal.notes = 'Invalid user.';
  //   } else if(user.balance <= 10) {
  //     withdrawal.status = 'rejected';
  //     withdrawal.notes = `Invalid balance ($${user.balance})`;
  //   } else {
  //     let amount = user.balance - 10;
  //     withdrawal.amount = amount;
  //     withdrawal.status = 'approved';
  //     user.balance -= amount;
  //     promises.push(user.save());
  //   }
  //   promises.push(withdrawal.save());
  //   await Promise.all(promises);
  //
  //   return await Withdrawal.create({
  //     userId: user._id,
  //     type: 'fullAuto',
  //     paymentMethod: withdrawal.paymentMethod,
  //     amount: null
  //   });
  // });
  //
  // return await Promise.all(promises);
  //
  // let users = await User.find({autoWithdrawl: true, balance: {$gt: 10}}, '_id balance defaultPaymentMethod');
  // let autoWithdrawalPromises = users.map(async user => {
  //   let amount = user.balance - 10;
  //   user.balance -= amount;
  //   return await Promise.all([
  //     user.save(),
  //     Withdrawal.create({
  //       userId: user._id,
  //       type: 'fullAuto',
  //       approvedDate: new Date(),
  //       paymentMethod: user.defaultPaymentMethod,
  //       amount: amount,
  //       status: 'approved'
  //     })
  //   ]);
  // });
  //
  // return await Promise.all(autoWithdrawalPromises);
}

// async function updateFullWithdrawal() {
//   let fullWithdrawal = await Withdrawal.find({type: 'full', status: 'pending'});
//   let promises = fullWithdrawal.map(async withdrawl => {
//     let user = await User.findOne({_id: withdrawl.userId, balance: {$gt: 10}}, 'balance');
//     if(user) {
//       let amount = user.balance - 10;
//       user.balance -= amount;
//       withdrawl.amount = amount;
//       withdrawl.status = 'approved';
//       return await Promise.all([
//         user.save(),
//         withdrawl.save()
//       ]);
//     }
//   });
//
//   return await Promise.all(promises);
// }

async function approvePendingSingleWithdrawal() {
  return await Withdrawal.update({type: 'single', status: 'pending'}, {$set: {status: 'approved'}}, {multi: true});
}

export default {
  cronTime: configs.withdrawalTime,
  onTick: () => {
    console.log('start cron job withdrawal.');
    Promise.all([
      createAutoWithdrawal(),
      // updateFullWithdrawal(),
      approvePendingSingleWithdrawal()
    ]).then(() => {
      console.log('cron job withdrawal done.');
    }).catch(err => console.log(err));
  },
  start: true
};
