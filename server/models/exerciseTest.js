import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseTest = new Schema({
  title: { type: 'String', required: true },
  description: { type: 'String'},
  user: {type: Schema.ObjectId, ref: 'users'},
  time: {type: 'Number', default: 0},
  numberSubmit: { type: Number, default: 1},
  total: { type: 'Number', default: 0},
  sectionExercise: { type: Array, default: [] },
  type: { type: 'Number', default: 0 },
  dateAdded: { type: 'Date', default: Date.now, required: true },
  dateModified: { type: 'Date', default: Date.now }
});

export default mongoose.model('ExerciseTest', exerciseTest);
