import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const categoryDescriptionSchema = new Schema({
    categoryID  :     { type: 'String', required: true },
    languageID  :     { type: 'String', required: true },
    title       :     { type: 'String', required: true },
    description :     { type: 'Mixed'}
});

export default mongoose.model('CategoryDescription', categoryDescriptionSchema);
