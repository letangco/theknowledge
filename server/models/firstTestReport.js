import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const firstTestReportSchema = new Schema({
  exercise: {type: Schema.ObjectId},
  title: { type: 'String' },
  description: { type: 'String'},
  user: {type: Schema.ObjectId, ref: 'users'},
  total: { type: 'Number', default: 0},
  point: { type: 'Number' },
  mark: { type: Boolean, default: false},
  course: {type: 'String', default: ''},
  lesson: {type: 'String', default: ''},
  note: { type: String },
  correct: { type: 'Number', default: 0},
  inCorrect: { type: 'Number', default: 0},
  numberSubmit: { type: 'Number' }, // number time submited
  result: {type: Array, default:[]},
  dateAdded: { type: 'Date', default: Date.now, required: true },
  updateAt: { type: 'Date', default: Date.now, required: true },
  final: {type: Boolean, default: false},
  parent: { type: Boolean, default: false },
  typeTest: { type: Number },
  sendMail: { type: Boolean },
  time: { type: String },
});

export default mongoose.model('FirstTestReport', firstTestReportSchema);
