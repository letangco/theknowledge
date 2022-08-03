/**
 * The code use to access to course without buy it
 * One code belong to one course and only use for one user
 * If the code was used, th userId must be defined
 */
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const courseCodeSchema = new Schema({
  code: {type: String, required: true, unique: true},
  courseId: {type: Schema.ObjectId, ref: 'Course', required: true},
  type: {type: String, enum: ['membership', 'payment']},
  userUsedId: {type: Schema.ObjectId, ref: 'User'},
  info_contact: {type: Object},
  userCreate: {type: Schema.ObjectId},
  createdDate: {type: Date, default: Date.now},
  usedDate: {type: Date}, // Date this code is being used
});

export default mongoose.model('CourseCode', courseCodeSchema);
