import mongoose from 'mongoose';
import Subscribe from "./subscribe";
import globalConstants from "../../config/globalConstants";
import Answer from "./questionAnswers";
import * as LibsNotifcation from "../libs/notification";
import AMPQ from '../../rabbitmq/ampq';
import Notification from "./notificationNew";
import QuestionAnswer from './questionAnswers';

const Schema = mongoose.Schema;

const questionAnswerUpvoteSchema = new Schema({
  questionAnswer: {type: Schema.ObjectId, ref: 'questionanswers', required: true},
  user: {type: Schema.ObjectId, ref: 'users', required: true},
});

questionAnswerUpvoteSchema.index({questionAnswer: 1, user: 1}, {unique: true});
questionAnswerUpvoteSchema.post('save', async function (created, next) {
  await QuestionAnswer.update({_id:created.questionAnswer},{$inc:{upVotes:1}});
  let voteAnswer = await Answer.findById(created.questionAnswer);
  if(voteAnswer.user.toString() !== created.user.toString()) {
    let subscribe = {
      from: created.user,
      object: created.questionAnswer,
      type: "VoteAnswer"
    };
    let subs = await Subscribe.findOne(subscribe);
    if (!subs) {
      await Subscribe.create(subscribe);
    }
  }
  next();
});
questionAnswerUpvoteSchema.post('save', async function (created, next) {
  // Q.create(globalConstants.jobName.KNOWLEDGE_UPVOTE_ENGAGEMENT, created).save();
  //Add Notification
  let voteAnswer = await Answer.findById(created.questionAnswer);
  if(voteAnswer.user.toString() !== created.user.toString()){
    let conditions = {
      to:voteAnswer.user,
      object:voteAnswer.question,
      parentId:voteAnswer._id,
      type:"VoteAnswerToAuthorAnswer"
    };
    let notify = await Notification.findOne(conditions).lean();
    if(notify){
      //console.log("AAAAAAAAAAAAAAAAAAAA");
      let news = {
        from:created.user
      };
      let data = await LibsNotifcation.UpdateUpvote(notify,news);
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
    }else {
      let data = {
        to: voteAnswer.user,
        from: created.user,
        object: voteAnswer.question,
        parentId: voteAnswer._id,
        data: {
          number: 0,
        },
        type: "VoteAnswerToAuthorAnswer"
      };
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
    }
  }
  return next();
});


questionAnswerUpvoteSchema.post('remove',async function (next) {
  await QuestionAnswer.update({_id:created.questionAnswer},{$inc:{upVotes:-1}})
  next();
});
export default mongoose.model('questionAnswerUpvote', questionAnswerUpvoteSchema);
