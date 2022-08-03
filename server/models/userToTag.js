import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userToTagSchema = new Schema({
    tagID     :     { type: 'String', required: true },
    userID    :     { type: 'String', required: true },
    categoryID:     { type: 'String', required: true }
});

export default mongoose.model('UserToTag', userToTagSchema);
