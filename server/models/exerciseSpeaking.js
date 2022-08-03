import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseSpeakingSchema = new Schema({
    title: { type: 'String', required: true },
    description: { type: 'String'},
    user: {type: Schema.ObjectId, ref: 'users'},
    role:  {type: 'String', default: 'user' },
    view: { type: 'Number', default: 1},
    typeSpeaking: { type: 'Number', default: 1 },
    joinAgain: { type: 'Number', default: 1},
    viewBefore: { type: 'Number', default: 1},
    total: { type: 'Number', default: 0},
    type: { type: 'Number', default: 1 }, //1: Exercise, 2: Test
    level: { type: 'String' },
    typeTest: { type: 'Number', default: 0 },
    dateAdded: { type: 'Date', default: Date.now, required: true },
    dateModified: { type: 'Date', default: Date.now}
});

export default mongoose.model('ExerciseSpeaking', exerciseSpeakingSchema);
