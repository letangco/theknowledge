import mongoose from 'mongoose';
import {
  TEACHER_MEMBERSHIP_PACKAGE_TYPE,
  TEACHER_REGISTRATION_STATUS,
  TEACHER_MEMBERSHIP_TYPE,
} from '../../../config/globalConstants';

const Schema = mongoose.Schema;

const TeacherMembershipSchema = new Schema({
  user: { type: Schema.ObjectId, ref: 'User', required: true },
  adminId: { type: Schema.ObjectId, ref: 'User' },
  days: { type: Number },
  payment: { type: Schema.ObjectId, ref: 'Payment' },
  type: {
    type: String,
    enum: Object.values(TEACHER_MEMBERSHIP_TYPE),
    required: true,
  },
  packageType: {
    type: String,
    enum: Object.values(TEACHER_MEMBERSHIP_PACKAGE_TYPE),
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(TEACHER_REGISTRATION_STATUS),
    default: TEACHER_REGISTRATION_STATUS.PENDING,
  },
  beginTime: { type: Number },
  endTime: { type: Number },
  note: { type: String },
}, {
  timestamps: true,
});

TeacherMembershipSchema.set('toJSON', {
  transform(doc, ret, options) { // eslint-disable-line no-unused-vars
    delete ret.__v;
    delete ret.updatedAt;
    delete ret.createdAt;
  },
});
export default mongoose.model('TeacherMembership', TeacherMembershipSchema);
