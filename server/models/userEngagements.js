import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const userEngagementsSchema = new Schema({
  user1: {type: Schema.ObjectId, ref: 'users', required: true},
  user2: {type: Schema.ObjectId, ref: 'users', required: true},
  engagement: {type: Number, default: 0, required: true}
});

userEngagementsSchema.index({user1: 1, user2: 1});
userEngagementsSchema.index({engagement: -1});

export default mongoose.model('UserEngagements', userEngagementsSchema);
