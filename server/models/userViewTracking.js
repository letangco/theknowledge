import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userViewTrackingSchema = new Schema({
  userId: { type: Schema.ObjectId, required: true },
  lastLearningCourse: { type: Schema.ObjectId, required: true },
  lastLearningDate: { type: Date, default: Date.now }, // Sortable - The last time view last lesson of this course
  lastLearningTime: { type: Number, default: 0 }, // Total time watching the last lesson of this course
  totalTimeView: { type: Number, default: 0 }, // Total time watching of this course
});

export default mongoose.model('UserViewTracking', userViewTrackingSchema);
