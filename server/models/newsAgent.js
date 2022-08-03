import mongoose from 'mongoose';
import slug from 'slug';
import { TrunkPage } from 'twilio/lib/rest/trunking/v1/trunk';

const Schema = mongoose.Schema;
const NewsAgentSchema = new Schema({
    userAgent: { type: Schema.ObjectId, required: true},
    title: { type: String, required: true },
    priority: { type: Boolean, default: false },
    sort: { type: Number, default: 1 }, // index show news
    banner: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    authorName: { type: String, required: true },
    comment: { type: Object, default: {} },
    authorRole: { type: String, required: true },
    searchString: { type: String },
    status: { type: Boolean, default: true },
    tag: { type: Array },
    shortDescription: { type: String, required: true },
    breadcrumb: { type: String, default: '' }
}, { timestamps: true });

NewsAgentSchema.pre('save', async function (next) {
    this.searchString = slug(`${this.title}`, ' ');
    return next();
});

export default mongoose.model('NewsAgent', NewsAgentSchema);
