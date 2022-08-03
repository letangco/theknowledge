import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const historyMiniGame = new Schema({
  questionId: {type: Number, required: true, index: 1},
  userId: {type: Schema.ObjectId, required: true, index: 1},
  candy: {type: Number, default: 0},
  time: {type: Number}
});

export default mongoose.model('historyMiniGame', historyMiniGame);
