import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseMatchingSchema = new Schema({
    title: { type: 'String', required: true },
    description: { type: 'String' },
    user: {type: Schema.ObjectId, ref: 'users' },
    total: { type: 'Number', default: 0 },
    view: { type: 'Number', default: 1 },
    type: { type: 'Number', default: 1 }, //1: Exercise, 2: Test
    level: { type: 'String' },
    typeTest: { type: 'Number', default: 0 },
    role:  {type: 'String', default: 'user' },
    dateAdded: { type: 'Date', default: Date.now, required: true },
    dateModified: { type: 'Date', default: Date.now}
});

export default mongoose.model('ExerciseMatching', exerciseMatchingSchema);
