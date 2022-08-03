import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userToCategorySchema = new Schema({
    userID    :     { type: 'String', required: true },
    categoryID:     { type: 'String', required: true }
});

export default mongoose.model('UserToCategory', userToCategorySchema);
