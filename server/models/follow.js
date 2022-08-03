import mongoose from 'mongoose';
import Knowledge from './knowledge';
import globalConstants from '../../config/globalConstants'
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';

const Schema = mongoose.Schema;

const followSchema = new Schema({
    from: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
    to: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
    dateAdd: {type: Date, default: Date.now}
});
followSchema.index({from: 1, to: 1}, {unique: true});

followSchema.statics.createFeeds = async function(follow) {
  let knowledges = await Knowledge.find({authorId: follow.to, state: globalConstants.knowledgeState.PUBLISHED}).sort({createdDate: -1}).limit(10);
  knowledges.forEach(knowledge => {
    let feedOptions = {
      knowledge: knowledge,
      actor: knowledge.authorId,
      action: 'published',
      type: 'knowledge'
    };
    Knowledge.createFeeds(Knowledge, feedOptions);
  });
};
followSchema.post('save',async (created,next)=>{
    let data = {
      to:created.to,
      from:created.from,
      type:"follow",
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
    Q.create(globalConstants.jobName.CREATE_FEED_AFTER_FOLLOW, created).removeOnComplete(true).save();
  next();
});

export default mongoose.model('Follow', followSchema);
