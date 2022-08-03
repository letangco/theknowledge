import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ExerciseWritingIELTQuestionSchema = new Schema({
    question: { type: 'String', required: true },
    desMore: {type: 'String' },
    fileUrlMore: {type: 'String' },
    onMore: {type: Boolean, default: false },
    answer: { type: 'String', required: true },
    exercise: {type: Schema.ObjectId},
    point: { type: 'Number', default: 1 },
    index: {type: 'Number', default: 0},
});

export default mongoose.model('ExerciseWritingIELTSQuestion', ExerciseWritingIELTQuestionSchema);
