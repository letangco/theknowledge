import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const multipleChoiceSchema = new Schema({
    title: { type: 'String', required: true },
    slug: { type: 'String', required: true },
    description: { type: 'String', required: true },
    user: {type: Schema.ObjectId, ref: 'users'},
    dateAdded: { type: 'Date', default: Date.now, required: true },
    time: {type: 'Number', default: 0},
    points: {type: 'Number', default: 0},
    course: {type: Schema.ObjectId,},
    lesson: {type: String, default: ''},
    question1: { type: 'String' },
    question2: { type: 'String' },
    question3: { type: 'String' },
    question4: { type: 'String' },
    dateModified: { type: 'Date', default: Date.now},
    index: {type: 'Number', default: 0},
});

export default mongoose.model('MultipleChoice', multipleChoiceSchema);