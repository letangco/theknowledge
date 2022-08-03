import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseMultipleChoiceUploadSchema = new Schema({
    title: { type: 'String', required: true },
    description: { type: 'String', default: ''},
    user: {type: Schema.ObjectId, ref: 'users'},
    role:  {type: 'String', default: 'user' },
    dateAdded: { type: 'Date', default: Date.now, required: true },
    time: {type: 'Number', default: 0},
    total: {type: 'Number', default: 0},
    view: { type: 'Number', default: 1},
    joinAgain: { type: 'Number', default: 1},
    number: {type: 'Number', default: 0},
    type: { type: 'Number', default: 1 }, //1: Exercise, 2: Test
    level: { type: 'String' },
    typeTest: { type: 'Number', default: 0 },
    url: { type: Array},
    questions: { type: Array},
    dateModified: { type: 'Date', default: Date.now},
});

export default mongoose.model('ExerciseMultipleChoiceUpload', exerciseMultipleChoiceUploadSchema);
