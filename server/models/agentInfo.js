import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const agentInfoSchema = new Schema({
    user: { type: Schema.Types.ObjectId, required: true }, 
    cuid: { type: 'String', required: true },
    email: { type: 'String', required: true },
    role: { type: 'String', required: true },
    telephone: { type: 'String', required: true },
    organization: { type: 'String', required: true },
    ABNNumber: { type: 'String', required: true },
    country: { type: Schema.Types.ObjectId, required: true },
    state: { type: Schema.Types.ObjectId, required: true },
    address: { type: 'String', required: true },
    tags: { type: Array, default: [] }, // tags agent
    // agent
    MARANumber: { type: 'String', default: '' },
    // university
    CIRCONumber: { type: 'String', default: '' },
    status: {type: Number, default: 0},
}, { timestamps: true });

export default mongoose.model('AgentInfo', agentInfoSchema);
