import mongoose from 'mongoose';
import configs from '../config';

const Schema = mongoose.Schema;

const considerCourseSchema = new Schema({
  admin: {type: Schema.ObjectId, ref: 'users', index: true},
  course: {type: Schema.ObjectId, ref: 'courses', index: true},
  created_at: {type: Date, default: Date.now},
  isApproved: {type: Boolean, index: true},
  notes: {type: String},
  commission: {type: Number, default: configs.course_fee}
});

export default mongoose.model('ConsiderCourse', considerCourseSchema);
