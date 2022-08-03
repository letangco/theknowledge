import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseMultipleChoiceUploadReportSchema = new Schema({
    exercise:  {type: Schema.ObjectId},
    title: { type: 'String', required: true },
    description: { type: 'String', default: '' },
    time: {type: 'Number', default: 0},
    total: {type: 'Number', default: 0},
    url: {type: Array},
    number: {type: 'Number', default: 0},
    view: { type: 'Number', default: 1},
    joinAgain: { type: 'Number', default: 1},
    user: {type: Schema.ObjectId, ref: 'users'},
    course: {type: 'String', default: ''},
    lesson: {type: 'String', default: ''},
    point: { type: 'Number', default: 0},
    mark: { type: Boolean, default: false},
    note: { type: 'String', default: ''},
    correct: { type: 'Number', default: 0},
    inCorrect: { type: 'Number', default: 0},
    result: {type: 'Object', default:{}},
    dateAdded: { type: 'Date', default: Date.now, required: true }
});

export default mongoose.model('ExerciseMultipleChoiceUploadReport', exerciseMultipleChoiceUploadReportSchema);
