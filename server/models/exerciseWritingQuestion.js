import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ExerciseWritingQuestionSchema = new Schema({
    question: { type: 'String', required: true },
    answer: { type: 'String', default: '' },
    desMore: {type: 'String', default: '' },
    fileUrlMore: {type: 'String' },
    onMore: {type: Boolean, default: false },
    type: { type: 'Number', default: 0 },
    point: { type: 'Number', default: 1 },
    exercise: {type: Schema.ObjectId },
    index: {type: 'Number', default: 0 },
});

export default mongoose.model('ExerciseWritingQuestion', ExerciseWritingQuestionSchema);
