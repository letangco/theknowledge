import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const postDescriptionSchema = new Schema({
    postID      :     { type: 'String', required: true },
    languageID  :     { type: 'String', required: true },
    title       :     { type: 'String', required: true },
    description :     { type: 'Mixed'}
});

export default mongoose.model('PostDescription', postDescriptionSchema);
