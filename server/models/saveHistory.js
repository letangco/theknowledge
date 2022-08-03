import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const saveHistorySchema = new Schema({
    cuid: {type: String},
    userID: {type: String},
    saveID: {type: String},
    dateAdded: {type: Date, default: Date.now, required: true}
});

export default mongoose.model('SaveHistory', saveHistorySchema);

