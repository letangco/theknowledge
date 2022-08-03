import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const SupportCourse = new Schema({
  date: {type: Number, required: true},
  content: {type: String, default: ''},
  creator: {type: Schema.ObjectId, required: true},
  user: {type: Schema.ObjectId, required: true},
  course: {type: Schema.ObjectId, required: true}
});

export default mongoose.model('SupportCourse', SupportCourse);
