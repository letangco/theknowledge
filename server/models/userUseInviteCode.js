import mongoose from 'mongoose';
import User from './user';
import TransactionDetail from './transactionDetail';

const Schema = mongoose.Schema;

const userUseInviteCodeSchema = new Schema({
  user: { type: Schema.ObjectId, ref: 'users', required: true, unique: true },
  code: {type: String, required: true, index: true},
  createdAt: {type: Date, default: Date.now, required: true},
  twoMinsSession: {type: Boolean, default: false, required: true},
  userInviteValue: {type: Number, default: 0, required: true},
  userUseValue: {type: Number, default: 0, required: true}
});

userUseInviteCodeSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  next();
});

userUseInviteCodeSchema.post('save', async function(created, next) {
  // if (this.wasNew) {
    // let user = await User.findById(created.user);
    // let toDay = new Date();
    // let conditions = {
    //   code: created.code,
    //   // createdAt: {
    //   //   $gte: new Date(toDay.getFullYear(), toDay.getMonth() + 1, toDay.getDate()),
    //   //   $lt: new Date(toDay.setDate(toDay.getDate() + 1))
    //   // },
    //   twoMinsSession: true
    // };
    //
    // let counts = await Promise.all([
    //   TransactionDetail.count({learnerID: user.cuid, duration: {$gte: 120}}),
    //   this.count(conditions)
    // ]);
    // let transactionCount = counts[0], useCodeCount = counts[1];
    // // console.log('count:', count);
    // if (transactionCount) {
    //   let inviter = await User.findOne({inviteCode: created.code});
    //   let userUpdateId = [user._id], setOptions = {twoMinsSession: true, userUseValue: 2};
    //   if(useCodeCount < 5) {
    //     userUpdateId.push(inviter._id);
    //     setOptions.userInviteValue = 2;
    //   }
    //   let promises = [
    //     User.update({_id: {$in: [user._id, inviter._id]}}, {$inc: {balance: 2}}, {multi: true}),
    //     this.update({_id: created._id}, {$set: setOptions})
    //   ];
    //   await Promise.all(promises);
    // }
  // }
  return next();
});

userUseInviteCodeSchema.statics.getMetadata = async function (models) {
  if(!models instanceof Array) models = [models];
  models = JSON.parse(JSON.stringify(models));

  let userIds = models.map(model => model.user);
  // console.log('userIds:', userIds);
  let users = await User.find({_id: {$in: userIds}}, 'userName fullName avatar cuid');
  // console.log('users:', users);
  return models.map((model, index) => {
    model.user = users[index];
    return model;
  });
};

export default mongoose.model('UserUseInviteCode', userUseInviteCodeSchema);

