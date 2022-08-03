import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ExerciseMultipleChoiceQuestionSchema = new Schema({
    exercise: {type: Schema.ObjectId },
    title: {type: 'String' },
    fileUrl:  { type: 'String' },
    desMore: {type: 'String' },
    fileUrlMore: {type: 'String' },
    onMore: {type: Boolean, default: false },
    index: {type: 'Number', default: 0 },
    answers: [{
      title: { type: 'String' },
      correct: { type: Boolean, default: false },
      fileUrl: { type: 'String' },
    }]
});

export default mongoose.model('ExerciseMultipleChoiceQuestion', ExerciseMultipleChoiceQuestionSchema);
