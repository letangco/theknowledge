import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const reportGameMiniSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', index: true},
  code: {type: String},
  correct: {type: Boolean},
  candy: {type: Number},
  createdDate: {type: Date, default: Date.now},
});


export default mongoose.model('ReportGameMini', reportGameMiniSchema);
