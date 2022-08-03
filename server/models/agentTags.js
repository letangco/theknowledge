import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const agentTagsSchema = new Schema({
    tagName: { type: String, required: true },
    sort: { type: Number, default: 0 },
    type: { type: String, required: true } // agent/university
}, { timestamps: true });

export default mongoose.model('AgentTags', agentTagsSchema);

