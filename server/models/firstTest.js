import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const firstTest = new Schema({
  title: { type: 'String' },
  description: { type: 'String'},
  user: {type: Schema.ObjectId, ref: 'users'},
  time: {type: 'Number', default: 0},
  numberSubmit: { type: Number, default: 3},
  total: { type: 'Number', default: 0},
  sectionExercise: { type: Array, default: [] },
  typeTest: { type: 'Number', default: 0 },
  dateAdded: { type: 'Date', default: Date.now, required: true },
  dateModified: { type: 'Date', default: Date.now },
  parent: { type: Boolean, default: false },
});

export default mongoose.model('FirstTest', firstTest);
