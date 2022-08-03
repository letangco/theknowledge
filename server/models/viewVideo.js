import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const viewVideo = new Schema({
  videoId: {type: Schema.ObjectId, index: 1},
  streamId: {type: String, index: 1},
  count: {type: Number, default: 0},
});

export default mongoose.model('viewVideo', viewVideo);
