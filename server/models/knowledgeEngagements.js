import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const knowledgeEngagementsSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true},
  knowledge: {type: Schema.ObjectId, ref: 'knowledges', required: true},
  engagement: {type: Number, default: 0, required: true}
});

knowledgeEngagementsSchema.index({user: 1, knowledge: 1});
knowledgeEngagementsSchema.index({engagement: -1});

export default mongoose.model('KnowledgeEngagements', knowledgeEngagementsSchema);
