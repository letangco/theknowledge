import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const postRatingSchema = new Schema({
    postID        :     { type: 'String', required: true },
    userID        :     { type: 'String', required: true },
    point         :     { type: 'String', required: true },
    dateAdded     :     { type: 'Date', default: Date.now, required: true },
    dateModified  :     { type: 'Date', default: Date.now},
    cuid          :     { type: 'String', required: true }
});

export default mongoose.model('PostRating', postRatingSchema);
