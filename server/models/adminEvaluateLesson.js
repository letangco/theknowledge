import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const adminEvaluateLesson = new Schema({
  courseId: {type: Schema.ObjectId, require: true, index: 1},
  userId: {type: Schema.ObjectId, require: true, index: 1},
  streamId: {type: Schema.ObjectId, require: true, index: 1},
  evaluater: {type: Schema.ObjectId, require: true, index: 1},
  note: {type: String},
  createdAt: {type: Date, default: Date.now}
});

export default mongoose.model('adminEvaluateLesson', adminEvaluateLesson);
