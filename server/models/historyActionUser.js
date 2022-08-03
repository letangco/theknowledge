import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const historyUserAction = new Schema({
  user: { type: Schema.ObjectId, required: true, index: 1 },
  object: { type: Schema.ObjectId, index: 1},
  type: { type: String, index: 1, required: true },
  time: { type: Number },
  createdAt: { type: Date, default: Date.now}
});

export default mongoose.model('historyActionUser', historyUserAction);
