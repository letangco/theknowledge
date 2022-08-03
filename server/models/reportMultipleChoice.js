import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const reportMultipleChoiceSchema = new Schema({
    multipleChoice: { type: Object },
    corrected: { type: 'Number', required: true },
    questions:[],
    contact:{ type: Object },
    dateAdded: { type: 'Date', default: Date.now, required: true }
});

export default mongoose.model('ReportMultipleChoice', reportMultipleChoiceSchema);