import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ExerciseReadingKeywordQuestionSchema = new Schema({
    question: { type: 'String', required: true },
    desMore: {type: 'String' },
    fileUrlMore: {type: 'String' },
    onMore: {type: Boolean, default: false },
    answer: { type: 'String', required: true },
    point: { type: 'Number', default: 1 },
    exercise: {type: Schema.ObjectId},
    index: {type: 'Number', default: 0},
});

export default mongoose.model('ExerciseReadingKeywordQuestion', ExerciseReadingKeywordQuestionSchema);
