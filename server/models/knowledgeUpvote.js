import mongoose from 'mongoose';
import * as SubscribeServices from '../services/subcribe.services';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import * as LibsNotifcation from '../libs/notification';
import globalConstants from '../../config/globalConstants';
import Knowledge from './knowledge';
import Notification from './notificationNew';
import Subscribe from './subscribe';

const Schema = mongoose.Schema;
const knowledgeUpvoteSchema = new Schema({
    knowledgeId: {type: Schema.ObjectId, ref: 'knowledges', required: true},
    userId: {type: Schema.ObjectId, ref: 'users', required: true},
});

knowledgeUpvoteSchema.index({knowledgeId: 1, userId: 1});
knowledgeUpvoteSchema.post('save', async function (created,next) {
  await Knowledge.update({_id:created.knowledgeId},{$inc: {upVotes:1}});
  let knowledge = await Knowledge.findById(created.knowledgeId);
  if(created.userId.toString() !== knowledge.authorId.toString()){
    let subs = {
      from:created.userId,
      object:created.knowledgeId,
      type:"VoteKnowledge"
    };
    let subscribe = await Subscribe.findOne(subs);
    if(!subscribe){
      await SubscribeServices.addSubscribe(subs);
    }
  }
  next();
});
knowledgeUpvoteSchema.post('save',async function (created, next) {
  //Add Notification
  let knowledge = await Knowledge.findById(created.knowledgeId);
  if(knowledge.authorId.toString() !== created.userId.toString()){
    let conditions = {
      to:knowledge.authorId,
      object:knowledge._id,
      type:"upVoteKnowledge"
    };
    let notify = await Notification.findOne(conditions).lean();
    if(notify){
      //console.log("AAAAAAAAAAAAAAAAAAAA");
      let news = {
        from:created.userId
      };
      let data = await LibsNotifcation.UpdateUpvote(notify,news);
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
    }else{
      let data = {
        to:knowledge.authorId,
        from:created.userId,
        object:knowledge._id,
        data:{
          number:0
        },
        type:"upVoteKnowledge"
      };
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
    }
  }
  Q.create(globalConstants.jobName.KNOWLEDGE_UPVOTE_ENGAGEMENT, created).removeOnComplete(true).save();
  return next();
});

export default mongoose.model('knowledgeUpvote', knowledgeUpvoteSchema);
