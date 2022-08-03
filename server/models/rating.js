import mongoose from 'mongoose';
import User from './user';

const Schema = mongoose.Schema;

const ratingSchema = new Schema({
    from: {type: Schema.ObjectId, ref: 'users'},
    expertId: {type: Schema.ObjectId, ref: 'users'},
    createdDate: {type: Date, default: Date.now, required: true},
    comment: {type: String},
    avg: {type: Number, default: 0}
});

ratingSchema.index({expertId: 1});
ratingSchema.index({createdDate: -1});

ratingSchema.statics.getMetadata = async function(rating) {
  rating = JSON.parse(JSON.stringify(rating));
  rating.from = await User.findById(rating.from, 'cuid userName fullName avatar');
  delete rating.expertId;
  delete rating.__v;
  
  return rating;
}

export default mongoose.model('Rating', ratingSchema);
