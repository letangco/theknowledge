import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseVOAReportSchema = new Schema({
    exercise:  {type: Schema.ObjectId},
    title: { type: 'String', required: true },
    description: { type: 'String'},
    url: { type: 'String'},
    text: { type: 'String'},
    user: {type: Schema.ObjectId, ref: 'users'},
    total: { type: 'Number', default: 0},
    view: { type: 'Number', default: 1},
    course: {type: 'String', default: ''},
    lesson: {type: 'String', default: ''},
    correct: { type: 'Number', default: 0},
    point: { type: 'Number', default: 0},
    mark: { type: Boolean, default: false},
    note: { type: 'String', default: ''},
    inCorrect: { type: 'Number', default: 0},
    result: {type: 'Object', default:{}},
    dateAdded: { type: 'Date', default: Date.now, required: true }
});

export default mongoose.model('ExerciseVOAReport', exerciseVOAReportSchema);
