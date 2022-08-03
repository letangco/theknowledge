import mongoose from 'mongoose';
import {Q} from "../libs/Queue";
import globalConstants from "../../config/globalConstants";

const Schema = mongoose.Schema;

const reviewCourseSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  course: {type: Schema.ObjectId, ref: 'courses', index: true},
  star: {type: Number, default: 0},
  content: {type: String},
  streamId: {type: Schema.ObjectId},
  options: {type: Array},
  createdDate: {type: Date, required: true, default: Date.now}
});

reviewCourseSchema.index({createdDate: -1});

// reviewCourseSchema.pre('save',function (next) {
//   this.wasNew = this.isNew;
//   next();
// });
reviewCourseSchema.post('save',function (created,next) {
  console.log('Send Notification To Teacher.')
  Q.create(globalConstants.jobName.NOTIFICATION_TEACHER, created).removeOnComplete(true).save();
  next();
});

export default mongoose.model('ReviewCourse', reviewCourseSchema);
