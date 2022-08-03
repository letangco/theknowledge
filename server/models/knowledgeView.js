import mongoose from 'mongoose';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';

const Schema = mongoose.Schema;
const knowledgeViewSchema = new Schema({
    knowledgeId: {type: Schema.ObjectId, ref: 'knowledges', required: true},
    user: {type: Schema.ObjectId, ref: 'users'},
    ip: {type: String, required: true},
    viewDate: {type: Date, default: Date.now, required: true}
});

knowledgeViewSchema.index({knowledgeId: 1, ip: 1, viewDate: 1});

knowledgeViewSchema.post('save', (created, next) => {
  Q.create(globalConstants.jobName.VIEW_ENGAGEMENT, created).removeOnComplete(true).save();
  return next();
});

export default mongoose.model('knowledgeView', knowledgeViewSchema);
