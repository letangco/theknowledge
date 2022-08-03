import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const questionMultipleChoiceSchema = new Schema({
  multipleChoice: {type: Schema.ObjectId, ref: 'multipleChoices'},
  title: {type: 'String'},
  fileUrl:  { type: 'String' },
  desMore: {type: 'String'},
  fileUrlMore: {type: 'String'},
  onMore: {type: Boolean, default: false},
  index:  {type: 'Number', default: 0},
  answers: [{
    title: { type: 'String' },
    correct: {type: Boolean, default: false},
    fileUrl: { type: 'String' },
  }]
});

export default mongoose.model('QuestionMultipleChoice', questionMultipleChoiceSchema);