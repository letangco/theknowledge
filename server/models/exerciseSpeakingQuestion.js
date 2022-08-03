import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ExerciseSpeakingQuestionSchema = new Schema({
    question: { type: 'String', required: true },
    desMore: {type: 'String' },
    fileUrlMore: {type: 'String' },
    onMore: {type: Boolean, default: false },
    type: { type: 'Number', default: 0 },
    script: { type: 'String' },
    exercise: {type: Schema.ObjectId },
    index: {type: 'Number', default: 0 },
});

export default mongoose.model('ExerciseSpeakingQuestion', ExerciseSpeakingQuestionSchema);
