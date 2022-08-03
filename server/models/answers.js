import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const answerSchema = new Schema({
  question: {type: Schema.ObjectId, ref: 'simpleQuestions', required: true},
  content: {type: String, required: true},
  upvotes: {type: Number, required: true, default: 0}
});

export default mongoose.model('Answers', answerSchema);
