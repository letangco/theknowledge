import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseMatchingReportSchema = new Schema({
    exercise:  {type: Schema.ObjectId},
    title: { type: 'String', required: true },
    description: { type: 'String'},
    user: {type: Schema.ObjectId, ref: 'users'},
    course: {type: 'String', default: ''},
    lesson: {type: 'String', default: ''},
    point: { type: 'Number', default: 0},
    mark: { type: Boolean, default: false},
    note: { type: 'String', default: ''},
    total: { type: 'Number', default: 0},
    correct: { type: 'Number', default: 0},
    view: { type: 'Number', default: 1},
    inCorrect: { type: 'Number', default: 0},
    result: {type: 'Object', default:{}},
    dateAdded: { type: 'Date', default: Date.now, required: true },
});

export default mongoose.model('ExerciseMatchingReport', exerciseMatchingReportSchema);
