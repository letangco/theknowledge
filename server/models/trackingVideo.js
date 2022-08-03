import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const trackingVideo = new Schema({
  videoId: {type: Schema.ObjectId, index: 1},
  streamId: {type: String, index: 1},
  userId: {type: Schema.ObjectId, required: true, index: 1},
  courseId: {type: Schema.ObjectId, required: true, index: 1},
  time: {type: Number, default: 0},
  complete: { type: Boolean, default: false},
  createdAt: {type: Date, default: Date.now}
});

export default mongoose.model('trackingVideo', trackingVideo);
