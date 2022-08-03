import Notification from '../models/notificationNew';
import Knowledge from '../models/knowledge';
import Comment from '../models/comment';
import Question from '../models/questions';
import QuestionAnswer from '../models/questionAnswers';
import Subscribe from '../models/subscribe';
import * as SubscribeServices from '../services/subcribe.services';
import {answerReplyQuestionUserVote} from "../services/exchangeinfo.servies";


export async function UpdateUpvote(old,news) {
  try {
    if(old.parentId){
      await Notification.remove({_id:old._id});
      return  {
        to:old.to,
        from:news.from,
        object:old.object,
        parentId:old.parentId,
        data:{
          number:parseInt(old.data.number) + 1
        },
        type:old.type
      };
    }else {
      await Notification.remove({_id:old._id});
      return  {
        to:old.to,
        from:news.from,
        object:old.object,
        data:{
          number:parseInt(old.data.number) + 1
        },
        type:old.type
      };
    }
  }catch (err){
    console.log("err Update Libs Notifications :", err);
  }
}



export async function CommentNotificationToAuthor(options) {
  try {
    let knowledge = await Knowledge.findById(options.knowledgeId);
    let conditions = {to:knowledge.authorId,object:knowledge._id,type:"commentKnowledgeAuthor"};
    let notify = await Notification.findOne(conditions).lean();
    let count = await Subscribe.count({object:knowledge._id,type:"Comment"});
    if(notify){
      let news ={
        from:options.publisherId,
        content:options.content,
        commentId:options._id,
        number:count-1
      };
      return await UpdateHaveSubscribe(notify,news);
    }else {
      return {
        to:knowledge.authorId,
        from:options.publisherId,
        object:knowledge._id,
        data:{
          number:0,
          content:options.content,
          commentID:options._id
        },
        type:"commentKnowledgeAuthor"
      }
    }
  }catch (err){
    console.log("err CommentNotificationToAuthor Libs Notifications : ", err);
  }
}


export async function CommentNotifications(options,arrayuser, typeNotify, typeSubscribe) {
  try {
    let notifications = await arrayuser.map(async e =>{
        let conditions = {
          to:e,
          object:options.knowledgeId,
          type:typeNotify
        };
        let subConditions = {
          object:options.knowledgeId,
          type:typeSubscribe
        };
        let count = await Subscribe.count(subConditions);
        let notify = await Notification.findOne(conditions).lean();
        if(notify){
          let news = {
            from:options.publisherId,
            content:options.content,
            commentId:options._id,
            number:count-1
          };
          return await UpdateHaveSubscribe(notify,news);
        }else {
          return {
            to:e,
            from:options.publisherId,
            object:options.knowledgeId,
            data:{
              number:count-1,
              content:options.content,
              commentID:options._id
            },
            type:typeNotify
          }
        }
    });
    return Promise.all(notifications);
  }catch (err){
    console.log("Error CommentNotifications :", err);
  }
}

export async function ReplyCommentNotificationsToAuthor(options) {
  try{
    let comment = await Comment.findById(options.parentId);
    let conditions = {
      to:comment.publisherId,
      object:options.knowledgeId,
      parentId:options.parentId,
      type:"commentReplyKnowledgeAuthor"
    };
    let conditionsubs = {
      object:options.parentId,
      type:"ReplyComment"
    };
    let count = await Subscribe.count(conditionsubs);
    let notify = await Notification.findOne(conditions);
    if(notify){
      let news = {
        from:options.publisherId,
        parentId:options.parentId,
        content:options.content,
        commentId:options._id,
        number:count-1
      };
      return await UpdateHaveSubscribe(notify,news);
    }else {
      return {
        to:comment.publisherId,
        from:options.publisherId,
        object:options.knowledgeId,
        parentId:options.parentId,
        data:{
          number:count-1,
          content:options.content,
          commentID:options._id
        },
        type:"commentReplyKnowledgeAuthor"
      }
    }
  }catch (err){
    console.log("Error ReplyCommentNotificationsToAuthor Libs Notifications : ", err);
  }
}

export async function ReplyCommentNotificationToComment(options,arrayuser, typeNotify, typeSubscribe) {
  try{
    let notifications = await arrayuser.map(async e => {
      let conditions = {
        to:e,
        object:options.knowledgeId,
        parentId:options.parentId,
        type:typeNotify
      };
      let conditionsubs = {
        object:options.parentId,
        type:typeSubscribe
      };
      let count = await Subscribe.count(conditionsubs);
      let notify = await Notification.findOne(conditions).lean();
      if(notify){
        let news = {
          from:options.publisherId,
          content:options.content,
          commentId:options._id,
          parentId:options.parentId,
          number:count-1
        };
          return await UpdateHaveSubscribe(notify,news);
      }else {
        return {
          to:e,
          from:options.publisherId,
          object:options.knowledgeId,
          parentId:options.parentId,
          data:{
            number:count - 1,
            content:options.content,
            commentID:options._id
          },
          type:typeNotify
        }
      }
    });
    return Promise.all(notifications);
  }catch (err){
    console.log("err ReplyCommentNotificationToComment Libs Notifications : ", err);
  }
}

// Question
export async function AnswerQuestionToAuthor(options) {
  try {
    if(options.anonymous){
      let question = await Question.findById(options.question);
      let conditions = {to:question.user,object:question._id,type:"answerQuestionAuthor"};
      let notify = await Notification.findOne(conditions).lean();
      if(notify){
        let old = {
          to:question.user,
          object:question._id,
          data:{
            number:notify.data.number + 1,
            answerId:options._id,
            anonymous: options.anonymous,
          },
          type:"answerQuestionAuthor"
        };
        await Notification.remove(conditions);
        return old;
      }else {
        return {
          to:question.user,
          object:question._id,
          data:{
            number:0,
            content:options.content,
            answerId:options._id,
            anonymous:options.anonymous
          },
          type:"answerQuestionAuthor"
        }
      }
    }else {
      let question = await Question.findById(options.question);
      let conditions = {to:question.user,object:question._id,type:"answerQuestionAuthor"};
      let notify = await Notification.findOne(conditions).lean();
      let count = await Subscribe.count({object:question._id,type:"Answer"});
      let countAnonymous = await QuestionAnswer.count({question:options.question,parentId:null,anonymous:true});
      if(notify){
        let news = {
          from:options.user,
          content:options.content,
          answerId:options._id,
          anonymous:options.anonymous,
          number:count - 1 + countAnonymous
        };
        return await UpdateHaveSubscribeAnswer(notify,news);
      }else {
        return {
          to:question.user,
          from:options.user,
          object:question._id,
          data:{
            number:0,
            content:options.content,
            answerId:options._id,
            anonymous:options.anonymous
          },
          type:"answerQuestionAuthor"
        }
      }
    }

  }catch (err){
    console.log("err AnswerQuestionToAuthor Libs Notifications : ", err);
  }
}

export async function AnswerNotifications(options, arrayuser, typeNotify, typeSubscribe) {
  try {
    let notifications = await arrayuser.map(async e =>{
      let conditions = {
        to:e,
        object:options.question,
        type:typeNotify
      };
      let subConditions = {
        object:options.question,
        type:typeSubscribe
      };
      let count = await Subscribe.count(subConditions);
      let notify = await Notification.findOne(conditions).lean();
      let countAnonymous = await QuestionAnswer.count({question:options.question,parentId:null,anonymous:true});
      if(notify){
        let news = {
          from:options.user,
          content:options.content,
          answerId:options._id,
          anonymous:options.anonymous,
          number:count - 1 + countAnonymous
        };
        return await UpdateHaveSubscribeAnswer(notify,news);
      }else {
        return {
          to:e,
          from:options.user,
          object:options.question,
          data:{
            number:count - 1 + countAnonymous,
            content:options.content,
            answerId:options._id,
            anonymous:options.anonymous
          },
          type:typeNotify
        }
      }
    });
    return Promise.all(notifications);
  }catch (err){
    console.log("Error CommentNotifications :", err);
  }
}

export async function ReplyAnswerNotificationsToAuthor(options) {
  try{
    if(options.anonymous){
      let answer = await QuestionAnswer.findById(options.parentId);
      let conditions = {
        to:answer.user,
        object:options.question,
        parentId:options.parentId,
        type:"answerReplyQuestionAuthor"
      };
      let notify = await Notification.findOne(conditions).lean();
      if(notify){
        let old = {
          to:answer.user,
          object:options.question,
          parentId:options.parentId,
          data:{
            number:notify.data.number +1,
            content:options.content,
            answerId:options._id,
            anonymous:options.anonymous
          },
          type:"answerReplyQuestionAuthor"
        };
        await Notification.remove(conditions);
        return old;
      }else {
        return {
          to:answer.user,
          object:options.question,
          parentId:options.parentId,
          data:{
            number:0,
            content:options.content,
            answerId:options._id,
            anonymous:options.anonymous
          },
          type:"answerReplyQuestionAuthor"
        }
      }
    }else {
      let answer = await QuestionAnswer.findById(options.parentId);
      let conditions = {
        to:answer.user,
        object:options.question,
        parentId:options.parentId,
        type:"answerReplyQuestionAuthor"
      };
      let notify = await Notification.findOne(conditions);
      let conditionsubs = {
        object:options.parentId,
        type:"ReplyAnswer"
      };
      let count = await Subscribe.count(conditionsubs);
      let countAnonymous = await QuestionAnswer.count({question:options.question,parentId:options.parentId,anonymous:true});
      if(notify){
        let news = {
          from:options.user,
          parentId:options.parentId,
          content:options.content,
          answerId:options._id,
          anonymous:options.anonymous,
          number:count - 1 + countAnonymous
        };
        return await UpdateHaveSubscribeAnswer(notify,news);
      }else {
        return {
          to:answer.user,
          from:options.user,
          object:options.question,
          parentId:options.parentId,
          data:{
            number:0,
            content:options.content,
            answerId:options._id,
            anonymous:options.anonymous
          },
          type:"answerReplyQuestionAuthor"
        }
      }
    }
  }catch (err){
    console.log("Error ReplyCommentNotificationsToAuthor Libs Notifications : ", err);
  }
}

export async function ReplyAnswerNotificationToAnswer(options,arrayuser, typeNotify, typeSubscribe) {
  try{
    let notifications = await arrayuser.map(async e => {
      let conditions = {
        to:e,
        object:options.question,
        parentId:options.parentId,
        type:typeNotify
      };
      let conditionsubs = {
        object:options.parentId,
        type:typeSubscribe
      };
      let notify = await Notification.findOne(conditions).lean();
      let count = await Subscribe.count(conditionsubs);
      let countAnonymous = await QuestionAnswer.count({question:options.question,parentId:options.parentId,anonymous:true});
      if(notify){
        let news = {
          from:options.user,
          content:options.content,
          answerId:options._id,
          parentId:options.parentId,
          anonymous:options.anonymous,
          number:count - 1 + countAnonymous
        };
        return await UpdateHaveSubscribeAnswer(notify,news);
      }else {
        return {
          to:e,
          from:options.user,
          object:options.question,
          parentId:options.parentId,
          data:{
            number:count - 1 + countAnonymous,
            content:options.content,
            answerId:options._id,
            anonymous:options.anonymous
          },
          type:typeNotify
        }
      }
    });
    return Promise.all(notifications);
  }catch (err){
    console.log("err ReplyAnswerNotificationToAnswer Libs Notifications : ", err);
  }
}


export async function UpdateHaveSubscribe(old,news) {
  try {
    if(!news.parentId){
      await Notification.remove({_id:old._id});
      return  {
        to:old.to,
        from:news.from,
        object:old.object,
        data:{
          number:news.number,
          content:news.content,
          commentID:news.commentId,
        },
        type:old.type
      };
    }else {
      await Notification.remove({_id:old._id});
      return  {
        to:old.to,
        from:news.from,
        object:old.object,
        parentId:news.parentId,
        data:{
          number:news.number,
          content:news.content,
          commentID:news.commentId
        },
        type:old.type
      };
    }

  }catch (err){
    console.log("err UpdateHaveSubscribe",err);
  }
}

export async function UpdateHaveSubscribeAnswer(old,news) {
  try {
    if(!news.parentId){
      await Notification.remove({_id:old._id});
      return  {
        to:old.to,
        from:news.from,
        object:old.object,
        data:{
          number:news.number,
          content:news.content,
          answerId:news.answerId,
          anonymous: news.anonymous
        },
        type:old.type
      };
    }else {
      await Notification.remove({_id:old._id});
      return  {
        to:old.to,
        from:news.from,
        object:old.object,
        parentId:news.parentId,
        data:{
          number:news.number,
          content:news.content,
          answerId:news.answerId,
          anonymous: news.anonymous
        },
        type:old.type
      };
    }

  }catch (err){
    console.log("err UpdateHaveSubscribeAnswer",err);
  }
}
