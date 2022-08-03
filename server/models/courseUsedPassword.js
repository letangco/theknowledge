/**
 * Tracking user when they use password access to course
 * The password use to access to course without buy it
 * The code use by multi user
 */
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const courseUsedPasswordSchema = new Schema({
  courseId: {type: Schema.ObjectId, ref: 'Course', required: true},
  userId: {type: Schema.ObjectId, ref: 'User'},
  password: {type: String, required: true},
  usedDate: {type: Date, default: Date.now},// Date this code is being used
});

export default mongoose.model('CourseUsedPassword', courseUsedPasswordSchema);