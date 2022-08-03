import mongoose from 'mongoose';
import User from './user';
import {Q} from '../libs/Queue';
import globalConstants from "../../config/globalConstants";

const Schema = mongoose.Schema;

const userToCourseSchema = new Schema({
  user: { type: Schema.ObjectId, ref: 'users', required: true },
  course: { type: Schema.ObjectId, ref: 'courses', required: true },
  note: {type: Array},
  result: {type: String, enum:['success', 'fail', 'out_of_date', 'reserve', 'pending', 'swap_class'], default: 'pending'},
  evaluater: {type: Schema.ObjectId},
  nextDateSupport: {type: Number},
  step: {type: Number, default: 1},
  createdAt: {type: Date, default: Date.now, required: true},
});

userToCourseSchema.statics.getMetadata = async function (models) {
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
userToCourseSchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next();
});

userToCourseSchema.post('save', async function (created, next){
  try {
    if (this.wasNew) {
      Q.create(globalConstants.jobName.AFTER_SAVE_OR_REMOVE_USER_TO_COURSE, created).removeOnComplete(true).save();
    }
    next();
  } catch (err) {
    console.log('error post save user to course : ', err);
    next()
  }
});

export default mongoose.model('UserToCourse', userToCourseSchema);

