import mongoose from 'mongoose';
import CommentUpvote from './commentUpvote';
import Comment from './comment';
import Knowledge from './knowledge';
import Subscribe from './subscribe';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';
import * as LibsNotification from '../libs/notification';

const Schema = mongoose.Schema;
const commentSchema = new Schema({
    publisherId: {type: Schema.ObjectId, ref: 'users', required: true},
    knowledgeId: {type: Schema.ObjectId, ref: 'knowledges', required: true},
    publishedDate: {type: Date, default: Date.now, required: true},
    content: {type: String, required: true},
    parentId: {type: Schema.ObjectId, ref: 'comments'},
    upVotes: {type: Number, default: 0, required: true}
});

// for querying
commentSchema.index({knowledgeId: 1});
commentSchema.index({parentId: 1});
// for sorting
commentSchema.index({publishedDate: -1});
commentSchema.index({upVotes: -1});
commentSchema.post('save',async function(created,next){
  let knowledge = await Knowledge.findById(created.knowledgeId)
  if(knowledge.authorId.toString() !== created.publisherId.toString()){
    if(created.parentId){
      let comment = await Comment.findById(created.parentId);
      if(comment.publisherId.toString() !== created.publisherId.toString()){
        let subscribe = {
          from:created.publisherId,
          object:created.parentId,
          type:"ReplyComment"
        };
        let subs = await Subscribe.findOne(subscribe);
        if(!subs){
          await Subscribe.create(subscribe);
        }
      }
    }else {
      let subscribe = {
        from:created.publisherId,
        object:created.knowledgeId,
        type:"Comment"
      };
      let subs = await Subscribe.findOne(subscribe);
      if(!subs){
        await Subscribe.create(subscribe);
      }
    }
  }
  next();
});
commentSchema.post('save',async function (created, next) {
  if(!created.parentId) {
    let knowledge = await Knowledge.findById(created.knowledgeId);
    Q.create(globalConstants.jobName.KNOWLEDGE_COMMENT_ENGAGEMENT, created).removeOnComplete(true).save();
    if(knowledge.authorId.toString() !== created.publisherId.toString()){
      let data = await LibsNotification.CommentNotificationToAuthor(created);
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
    }
    // Add Notification UserVote
    let conditionsVote = {
      object:created.knowledgeId,
      type:"VoteKnowledge"
    };
    let arrayVote = await Subscribe.find(conditionsVote);
    let userVote = [];
    await arrayVote.map(e =>{
      if(e.from.toString() !== created.publisherId.toString() && e.from.toString() !== knowledge.authorId.toString()){
        userVote.push(e.from);
      }
    });
    let notifyVote = await LibsNotification.CommentNotifications(created,userVote,"commentKnowledgeUserVote","VoteKnowledge");
    //console.log("NotifyVote : ", notifyVote);
    notifyVote.forEach(e => {
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, e);
    });
    let userVoteComment = await userVote.map(e => {
      return e.toString();
    });
    //   //Add Notification UserComment
    let conditionsComment = {
      object:created.knowledgeId,
      type:"Comment"
    };
    let arraycomment = await Subscribe.find(conditionsComment);
    let usercomment = [];
    await arraycomment.map(e => {
      if(e.from.toString() !== created.publisherId.toString() && userVoteComment.indexOf(e.from.toString())===-1 && e.from.toString() !== knowledge.authorId.toString()){
        usercomment.push(e.from);
      }
    });
    let notifycomment = await LibsNotification.CommentNotifications(created,usercomment,"commentKnowledgeUserComment","Comment");
    notifycomment.forEach(e =>{
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, e);
    });
  } else {
    //console.log("Co ParentId nhe !!!!!!!!!!!!!!!!!!!");
    Q.create(globalConstants.jobName.KNOWLEDGE_REPLY_ENGAGEMENT, created).removeOnComplete(true).save();
    let comment = await Comment.findById(created.parentId);
    if(comment.publisherId.toString() !== created.publisherId.toString()){
      let data = await LibsNotification.ReplyCommentNotificationsToAuthor(created);
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
    }
    //   //Add Notification UserComment
    let conditionsComment = {
      object:created.parentId,
      type:"ReplyComment"
    };
    let arraycomment = await Subscribe.find(conditionsComment);
    let usercomment = [];
    await arraycomment.map(e => {
      if(e.from.toString() !== created.publisherId.toString() && e.from.toString() !== comment.publisherId.toString()){
        usercomment.push(e.from);
      }
    });
    let notifycomment = await LibsNotification.ReplyCommentNotificationToComment(created,usercomment,"commentReplyKnowledgeComment","ReplyComment");
    notifycomment.forEach(e =>{
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, e);
    });
  }
  return next();
});
commentSchema.statics.createFeeds = function(_this, feedOptions) {
  if(feedOptions.comment.parentId) {
    return _this.createFeedsForReply(_this, feedOptions);
  } else {
    feedOptions.action = 'commented';
    return _this.createFeedsForComment(feedOptions);
  }
}

commentSchema.statics.createFeedsForComment = async function(feedOptions) {
  let knowledge = await Knowledge.findById(feedOptions.comment.knowledgeId);
  feedOptions.knowledge = knowledge;
  Knowledge.createFeeds(Knowledge, feedOptions);
}

commentSchema.statics.createFeedsForReply = async function(_this, feedOptions) {
  let promises = [
    CommentUpvote.find({commentId: feedOptions.comment.parentId}),
    _this.find({parentId: feedOptions.comment.parentId}),
    _this.findById(feedOptions.comment.parentId)
  ];
  let results = await Promise.all(promises);

  // create feeds for user who liked parent comment
  let commentUpvotes = results[0];
  let votedUserIds = commentUpvotes.map(upvote => {return upvote.userId});
  votedUserIds.forEach((userId, index, arr) => {
    if(arr.indexOf(userId) === index && userId !== feedOptions.actor) {
      let obj = {
        object: feedOptions.comment.knowledgeId,
        owner: userId,
        action: 'replied_voted'
      };
      let opt = Object.assign(obj, feedOptions);
      Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
    }
  });

  // create feeds for user who replied to parent comment
  let replies = await results[1];
  let repliedUserIds = [];
  replies.forEach(reply => {
   repliedUserIds.push(reply.publisherId);
  });
  repliedUserIds.forEach((userId, index, arr) => {
    if(arr.indexOf(userId) === index && userId !== feedOptions.actor) {
      let obj = {
        object: feedOptions.comment.knowledgeId,
        owner: userId,
        action: 'replied_replied'
      };
      let opt = Object.assign(obj, feedOptions);
      Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
    }
  });

  // create feeds for user who is parent comment's author
  let parent = results[2];
  let obj = {
    object: feedOptions.comment.knowledgeId,
    owner: parent.publisherId,
    action: 'replied_your'
  };
  let opt = Object.assign(obj, feedOptions);
  Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
}

export default mongoose.model('Comment', commentSchema);
