import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const skillEngagementsSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true},
  skill: {type: Schema.ObjectId, ref: 'skills', required: true},
  engagement: {type: Number, default: 0, required: true}
});

skillEngagementsSchema.index({user: 1, category: 1});
skillEngagementsSchema.index({engagement: -1});

export default mongoose.model('SkillEngagements', skillEngagementsSchema);
