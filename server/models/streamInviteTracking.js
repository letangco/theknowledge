import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const streamInviteTrackingSchema = new Schema({
  streamId: { type: Schema.ObjectId, required: true },
  userId: { type: Schema.ObjectId, required: true },
  courseId: { type: Schema.ObjectId },
  beginTime: { type: Date },
  endTime: { type: Date },
  totalTime: { type: Number }, // Total time (in second) user watch this stream
  isHandUp: { type: Boolean, required: true }, // If is not handUp, it will be Invite
  publishStreamId: { type: String },
  device: { type: 'Mixed' },
  connected: { type: Boolean },
});

export default mongoose.model('StreamInviteTracking', streamInviteTrackingSchema);
