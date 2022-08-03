import mongoose from 'mongoose';
import slug from 'slug';

const Schema = mongoose.Schema;

const PointTestSchema = new Schema({
    status: { type: Boolean, default: true },
    subject: { type: String, default: '' },
    question: { type: String, default: '' },
    indexQuestion: { type: Number, default: 0 }, // sort index of question
    special: { type: Boolean, default: false },
    typeSelect: { type: Number, default: 0 }, // type selection: 0: checkbox, 1: selection
    parentQuestion: { type: Schema.ObjectId },
    // answer
    score: { type: Number, default: 0 },
    content: { type: String, default: '' },
    notEligible: { type: Boolean, default: false },
    indexAnswer: { type: Number, default: 0 }, // sort index of answer
    searchString: { type: String }
}, { timestamps: true });

PointTestSchema.pre('save', function (next) {
    this.searchString = slug(`${this.question} ${this.subject}`, ' ');
    return next();
});


export default mongoose.model('PointTest', PointTestSchema);
