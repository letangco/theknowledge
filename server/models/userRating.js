import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userRatingSchema = new Schema({
    userID        :     { type: 'String', required: true },
    userRaingID   :     { type: 'String', required: true },
    ratingGroupID :     { type: 'String', required: true },
    ratingID      :     { type: 'String', required: true },
    point         :     { type: 'String', required: true },
    dateAdded     :     { type: 'Date', default: Date.now, required: true },
    dateModified  :     { type: 'Date', default: Date.now},
    cuid          :     { type: 'String', required: true }
});

export default mongoose.model('UserRating', userRatingSchema);
