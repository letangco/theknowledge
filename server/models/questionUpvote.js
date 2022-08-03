import mongoose from 'mongoose';
import Subscribe from "./subscribe";
import * as SubscribeServices from "../services/subcribe.services";
import Question from "./questions";

// import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';
import * as LibsNotifcation from "../libs/notification";
// import Knowledge from "./knowledge";
import Notification from "./notificationNew";

const Schema = mongoose.Schema;

const questionUpvoteSchema = new Schema({
  question: {type: Schema.ObjectId, ref: 'questions', required: true},
  user: {type: Schema.ObjectId, ref: 'users', required: true},
});

questionUpvoteSchema.index({question: 1, user: 1}, {unique: true});
questionUpvoteSchema.post('save', async function (created,next) {
  await Question.update({_id:created.knowledgeId},{$inc: {upVotes:1}});
  //Add Subscribe
  let question = await Question.findById(created.question)
  if(created.user.toString() !== question.user.toString()){
    let subs = {
      from:created.user,
      object:created.question,
      type:"VoteQuestion"
    };
    let subscribe = await Subscribe.findOne(subs);
    if(!subscribe){
      await SubscribeServices.addSubscribe(subs);
    }
  }
  next()
});
questionUpvoteSchema.post('save',async function(created, next) {
  //Add Notification
  let question = await Question.findById(created.question)
  if(created.user.toString() !== question.user.toString()){
    let conditions = {
      to:question.user,
      object:question._id,
      type:"upVoteQuestion"
    };
    let notify = await Notification.findOne(conditions).lean();
    if(notify){
      //console.log("AAAAAAAAAAAAAAAAAAAA");
      let news = {
        from:created.user
      };
      let data = await LibsNotifcation.UpdateUpvote(notify,news);
      //console.log('data',data);
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
    }else{
      let data = {
        to:question.user,
        from:created.user,
        object:question._id,
        data:{
          number:0
        },
        type:"upVoteQuestion"
      };
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
    }
  }

  // Q.create(globalConstants.jobName.KNOWLEDGE_UPVOTE_ENGAGEMENT, created).save();
  next();
});
export default mongoose.model('questionUpvote', questionUpvoteSchema);
