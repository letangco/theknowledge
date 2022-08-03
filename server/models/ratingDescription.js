import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ratingDescriptionSchema = new Schema({
    ratingID      :     { type: 'String', required: true },
    languageID    :     { type: 'String', required: true },
    title         :     { type: 'String', required: true },
    description   :     { type: 'Mixed'}
});

export default mongoose.model('RatingDescription', ratingDescriptionSchema);
