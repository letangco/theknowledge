import mongoose from 'mongoose';
const Schema = mongoose.Schema;

export const streamViewTrackingTypes = {
  begin: 'begin',
  normal: 'normal',
  end: 'end',
};

const liveStreamTrackingSchema = new Schema({
  streamId: { type: Schema.ObjectId, required: true },
  time: { type: Date, required: true },
  numView: { type: Number, required: true },
  trackingType: { type: String, enum: Object.values(streamViewTrackingTypes) },
});

export default mongoose.model('LiveStreamTracking', liveStreamTrackingSchema);
