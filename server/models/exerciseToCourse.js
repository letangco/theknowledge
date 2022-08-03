import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exerciseToCoursechema = new Schema({
    title: { type: 'String' },
    type: {type: Number, default: 0},
    exercise: {type: Schema.ObjectId},
    course: {type: Schema.ObjectId},
    lesson: {type: Schema.ObjectId},
    index: {type: Number, default: 0}
});

export default mongoose.model('ExerciseToCourse', exerciseToCoursechema);