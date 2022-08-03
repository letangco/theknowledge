import mongoose from 'mongoose';
import {
  TEACHER_MEMBERSHIP_PACKAGE_TYPE,
  TEACHER_REGISTRATION_STATUS,
} from '../../config/globalConstants';

const Schema = mongoose.Schema;

const TeacherRegistrationSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  type: {
    type: String,
    enum: Object.values(TEACHER_MEMBERSHIP_PACKAGE_TYPE),
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(TEACHER_REGISTRATION_STATUS),
    default: TEACHER_REGISTRATION_STATUS.PENDING,
  },
  requirement: { type: String },
}, {
  timestamps: true,
});

TeacherRegistrationSchema.set('toJSON', {
  transform(doc, ret, options) { // eslint-disable-line no-unused-vars
    delete ret.__v;
    delete ret.updatedAt;
    delete ret.createdAt;
  },
});
export default mongoose.model('TeacherRegistration', TeacherRegistrationSchema);
