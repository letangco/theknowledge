import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userViewStreamTrackingSchema = new Schema({
  streamId: { type: Schema.ObjectId, required: true },
  internalMeetingId: { type: String },
  userId: { type: Schema.ObjectId, required: true },
  courseId: { type: Schema.ObjectId },
  beginTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  totalTime: { type: Number, required: true }, // Total time (in second) user watch this stream
  device: { type: 'Mixed' },
  createdAt: { type: Date, default: Date.now}
});

export default mongoose.model('UserViewStreamTracking', userViewStreamTrackingSchema);
