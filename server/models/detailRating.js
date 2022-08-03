import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const detailRatingSchema = new Schema({
    rateId: {type: Schema.ObjectId, ref: 'ratings'},
    skillId: {type: Schema.ObjectId, ref: 'skills'},
    rate: {type: Number, default: 0}
});

detailRatingSchema.index({rateId: 1, skillId: 1});

export default mongoose.model('DetailRating', detailRatingSchema);
