import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const categoryEngagementsSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true},
  category: {type: Schema.ObjectId, ref: 'categories', required: true},
  engagement: {type: Number, default: 0, required: true}
});

categoryEngagementsSchema.index({user: 1, category: 1});
categoryEngagementsSchema.index({engagement: -1});

export default mongoose.model('CategoryEngagements', categoryEngagementsSchema);
