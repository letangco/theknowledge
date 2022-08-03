import mongoose from 'mongoose';
import User from './user';
import AnswerUpvote from './questionAnswerUpvote';
import QuestionAnswer from './questionAnswers';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';
import {cacheImage} from '../libs/imageCache'
import Subscribe from "./subscribe";
import Question from "./questions";
import * as LibsNotification from "../libs/notification";
import Knowledge from "./knowledge";
const Schema = mongoose.Schema;
const questionAnswerSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users'},
  question: {type: Schema.ObjectId, ref: 'questions', required: true},
  publishedDate: {type: Date, default: Date.now, required: true},
  content: {type: String, required: true},
  parentId: {type: Schema.ObjectId, ref: 'questionAnswers'},
  upVotes: {type: Number, default: 0, required: true},
  anonymous: {type: Boolean, default: false, required: true}
});

questionAnswerSchema.index({question: 1});
questionAnswerSchema.index({publishedDate: -1});
questionAnswerSchema.post('save', async function (created, next) {
  let question = await Question.findById(created.question);
  if(created.user.toString() !== question.user.toString()){
    if(created.parentId){
      let answer = await QuestionAnswer.findById(created.parentId);
      if(created.user.toString() !== answer.user.toString()){
        let subscribe = {
          from:created.user,
          object:created.parentId,
          type:"ReplyAnswer"
        };
        let subs = await Subscribe.findOne(subscribe);
        if(!subs){
          await Subscribe.create(subscribe);
        }
      }
    }else {
      let subscribe = {
        from:created.user,
        object:created.question,
        type:"Answer"
      };
      let subs = await Subscribe.findOne(subscribe);
      if(!subs){
        await Subscribe.create(subscribe);
      }
    }
  }
  next()
});
questionAnswerSchema.post('save', async function (created, next) {
  if(!created.parentId){
    let question = await Question.findById(created.question);
    if(created.anonymous){
      if(question.user.toString() !== created.user.toString()){
        let data = await LibsNotification.AnswerQuestionToAuthor(created);
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
      }
    }else {
      if(question.user.toString() !== created.user.toString()){
        let data = await LibsNotification.AnswerQuestionToAuthor(created);
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
      }

      // Add Notification Vote
      let conditionsVote = {
        object:created.question,
        type:"VoteQuestion"
      };
      let arrayVote = await Subscribe.find(conditionsVote);
      let userVote = [];
      await arrayVote.map(e =>{
        if(e.from.toString() !== created.user.toString() && e.from.toString() !== question.user.toString()){
          userVote.push(e.from);
        }
      });
      let notifyVote = await LibsNotification.AnswerNotifications(created,userVote,"answerQuestionUserVote","Answer");
      //console.log("NotifyVote : ", notifyVote);
      notifyVote.forEach(e => {
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, e);
      });
      let userVoteComment = await userVote.map(e=>{
        return e.toString();
      });
      // Add Notification Answer
      let conditionsComment = {
        object:created.question,
        type:"Answer"
      };
      let arraycomment = await Subscribe.find(conditionsComment);
      let usercomment = [];
      await arraycomment.map(e => {
        if(e.from.toString() !== created.user.toString() && userVoteComment.indexOf(e.from.toString()) === -1 && e.from.toString() !== question.user.toString()){
          usercomment.push(e.from);
        }
      });
      let notifycomment = await LibsNotification.AnswerNotifications(created,usercomment,"answerQuestionUserAnswer","Answer");
      notifycomment.forEach(e =>{
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, e);
      });
    }

  }else {
    //Q.create(globalConstants.jobName.KNOWLEDGE_REPLY_ENGAGEMENT, created).removeOnComplete(true).save();
    let questionAnswer = await QuestionAnswer.findById(created.parentId);
    if(created.anonymous) {
      if (questionAnswer.user.toString() !== created.user.toString()) {
        let data = await LibsNotification.ReplyAnswerNotificationsToAuthor(created);
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
      }
    }else {
      if(questionAnswer.user.toString() !== created.user.toString()){
        let data = await LibsNotification.ReplyAnswerNotificationsToAuthor(created);
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
      }
      // Add Notification UserVote
      let conditionsVote = {
        object:created.parentId,
        type:"VoteAnswer"
      };
      let arrayVote = await Subscribe.find(conditionsVote);
      let userVote = [];
      await arrayVote.map(e =>{
        if(e.from.toString() !== created.user.toString() && e.from.toString() !== questionAnswer.user.toString()){
          userVote.push(e.from);
        }
      });
      let notifyVote = await LibsNotification.ReplyAnswerNotificationToAnswer(created,userVote,"answerReplyQuestionUserVote","ReplyAnswer");
      //console.log("NotifyVote : ", notifyVote);
      notifyVote.forEach(e => {
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, e);
      });
      let userVoteComment = await userVote.map(e=>{
        return e.toString();
      });
      //   //Add Notification UserComment
      let conditionsComment = {
        object:created.parentId,
        type:"ReplyAnswer"
      };
      let arraycomment = await Subscribe.find(conditionsComment);
      let usercomment = [];
      await arraycomment.map(e => {
        if(e.from.toString() !== created.user.toString() && userVoteComment.indexOf(e.from.toString())===-1 && e.from.toString() !== questionAnswer.user.toString()){
          usercomment.push(e.from);
        }
      });

      let notifycomment = await LibsNotification.ReplyAnswerNotificationToAnswer(created,usercomment,"answerReplyQuestionUserReply","ReplyAnswer");
      //console.log("NotifyComment :", notifycomment);
      notifycomment.forEach(e =>{
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, e);
      });
    }
  }
  next()
});

questionAnswerSchema.statics.getMetadata = async function (_this, questionAnswer, userId) {
  questionAnswer = JSON.parse(JSON.stringify(questionAnswer));
  if(userId) {
    let upvote = await AnswerUpvote.count({questionAnswer: questionAnswer._id, user: userId});
    questionAnswer.upVoted = !!upvote;
    if(questionAnswer.user.toString() === userId.toString()) {
      questionAnswer.isOwner = true;
    }
  }
  if(!questionAnswer.parentId) {
    questionAnswer.replyCount = await _this.count({parentId: questionAnswer._id});
  }
  if(questionAnswer.anonymous) {
    if(userId && questionAnswer.user.toString() === userId.toString()) {
      questionAnswer.canAction = true;
    }
    questionAnswer.user = {
      avatar: 'https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg',
      fullName: 'Anonymous'
    };
  } else {
    let promises = [User.findById(questionAnswer.user, 'cuid userName fullName avatar active')];
    if(userId) {
      promises.push(AnswerUpvote.count({questionAnswer: questionAnswer._id, user: userId}));
    }
    let data = await Promise.all(promises);

    let user = data[0];
    user = JSON.parse(JSON.stringify(user));
    if(user && user.avatar){
      let data={
        src: user.avatar,
        size: 150
      }
      let thumb = await cacheImage(data);
      user.avatar = thumb;
    }
    // if(user){
    //   user.active = user.active === 1 ? 1 : 0;
    // }
    questionAnswer.user = user;
    questionAnswer.upVoted = !!data[1];
  }
  return questionAnswer;
};

questionAnswerSchema.statics.createFeeds = async function (_this, feedOptions) {
  if(feedOptions.comment.parentId) {
    return _this.createFeedsForReply(_this, feedOptions);
  } else {
    return _this.createFeedsForAllUsers(feedOptions);
  }
};

questionAnswerSchema.statics.createFeedsForAllUsers = async function (feedOptions) {
  // create feed for all users
  let users = await User.find({active: 1}, '_id');
  users.forEach(user => {
    let opt = Object.assign({object: feedOptions.question, owner: user._id}, feedOptions);
    opt.comment = feedOptions.comment._id;
    Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
  });
};

questionAnswerSchema.statics.createFeedsForReply = async function (_this, feedOptions) {
  let promises = [
    AnswerUpvote.find({questionAnswer: feedOptions.comment.parentId}),
    _this.find({parentId: feedOptions.comment.parentId}),
    _this.findById(feedOptions.comment.parentId)
  ];
  let results = await Promise.all(promises);

  // create feeds for user who liked parent comment
  let commentUpvotes = results[0];
  let votedUserIds = commentUpvotes.map(upvote => {return upvote.user});
  votedUserIds.forEach((userId, index, arr) => {
    if(arr.indexOf(userId) === index && userId !== feedOptions.actor) {
      let obj = {
        object: feedOptions.comment.question,
        owner: userId,
        action: 'replied_voted'
      };
      // console.log('aaaa');
      let opt = Object.assign(obj, feedOptions);
      Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
    }
  });

  // create feeds for user who replied to parent comment
  let replies = await results[1];
  let repliedUserIds = [];
  replies.forEach(reply => {
    repliedUserIds.push(reply.user);
  });
  repliedUserIds.forEach((userId, index, arr) => {
    if(arr.indexOf(userId) === index && userId !== feedOptions.actor) {
      let obj = {
        object: feedOptions.comment.question,
        owner: userId,
        action: 'replied_replied'
      };
      // console.log('bbbb');
      let opt = Object.assign(obj, feedOptions);
      Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
    }
  });

  // create feeds for user who is parent comment's author
  let parent = results[2];
  let obj = {
    object: feedOptions.comment.question,
    owner: parent.user,
    action: 'replied_your'
  };

  let opt = Object.assign(obj, feedOptions);
  // console.log('cccc:', opt);
  Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
};


export default mongoose.model('QuestionAnswers', questionAnswerSchema);
