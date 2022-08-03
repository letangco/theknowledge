import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const tagsDescriptionSchema = new Schema({
    title     :     { type: 'String', required: true },
    dateAdded :     { type: 'Date', default: Date.now, required: true },
    cuid      :     { type: 'String', required: true }
});

export default mongoose.model('Tags', tagsDescriptionSchema);
