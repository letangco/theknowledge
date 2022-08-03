import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseWritingReportSchema = new Schema({
    exercise:  {type: Schema.ObjectId},
    title: { type: 'String', required: true },
    description: { type: 'String'},
    user: {type: Schema.ObjectId, ref: 'users'},
    url: {type: Array},
    total: { type: 'Number', default: 0},
    view: { type: 'Number', default: 1},
    urlAnswer: { type: Array},
    descriptionAnswer: { type: 'String'},
    answers: { type: 'Object'},
    arrAnswer: { type: Array },
    joinAgain: { type: 'Number', default: 1},
    mark: { type: Boolean, default: false},
    point: { type: 'Number', default: 0},
    note: { type: String },
    course: {type: 'String', default: ''},
    lesson: {type: 'String', default: ''},
    result: {type: 'Object', default:{}},
    dateAdded: { type: 'Date', default: Date.now, required: true }
});

export default mongoose.model('ExerciseWritingReport', exerciseWritingReportSchema);
