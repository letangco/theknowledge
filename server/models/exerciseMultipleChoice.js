import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseMultipleChoiceSchema = new Schema({
    title: { type: 'String', required: true },
    description: { type: 'String', default: ''},
    user: {type: Schema.ObjectId, ref: 'users'},
    role:  {type: 'String', default: 'user' },
    dateAdded: { type: 'Date', default: Date.now, required: true },
    time: {type: 'Number', default: 0 },
    total: {type: 'Number', default: 0 },
    view: { type: 'Number', default: 1 },
    type: { type: 'Number', default: 1 }, //1: Exercise, 2: Test
    level: { type: 'String' },
    typeTest: { type: 'Number', default: 0 },
    joinAgain: { type: 'Number', default: 1 },
    dateModified: { type: 'Date', default: Date.now },
});

export default mongoose.model('ExerciseMultipleChoice', exerciseMultipleChoiceSchema);
