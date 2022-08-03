import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseVOASchema = new Schema({
    title: { type: 'String', required: true },
    description: { type: 'String' },
    url: { type: 'String' },
    text: { type: 'String' },
    total: { type: 'Number', default: 0 },
    view: { type: 'Number', default: 1 },
    user: {type: Schema.ObjectId, ref: 'users' },
    role:  {type: 'String', default: 'user' },
    type: { type: 'Number', default: 1 }, //1: Exercise, 2: Test
    level: { type: 'String' },
    typeTest: { type: 'Number', default: 0 },
    dateAdded: { type: 'Date', default: Date.now, required: true },
    dateModified: { type: 'Date', default: Date.now}
});

export default mongoose.model('ExerciseVOA', exerciseVOASchema);
