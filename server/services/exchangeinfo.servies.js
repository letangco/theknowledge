import StringHelper from '../util/StringHelper';
import User from '../models/user';
import Appointment from '../models/appointment';
import AppointmentComment from '../models/appointmentComment';
import Knowledge from '../models/knowledge';
import Question from '../models/questions';
import QuestionUpvote from '../models/questionUpvote';
import AnswerQuestion from '../models/questionAnswers';
import AnswerVote from '../models/questionAnswerUpvote';
import NotificationNews from '../models/notificationNew';
import Comment from '../models/comment';
import CommentUpVote from '../models/commentUpvote';
import Subscribe from  '../models/subscribe';
import KnowledgeUpvote from '../models/knowledgeUpvote';
import Answer from '../models/questionAnswers';


async function seen(number) {
  number = parseInt(number);
  if(number===0){
    return true;
  }else {
    return false;
  }
}

async function status(number) {
  number = parseInt(number);
  if(number===0){
    return true;
  }else {
    return false;
  }
}

export async function follow(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let options = {
        to: to._id,
        from: from._id,
        type:"follow",
        date: e.dateAdded,
        seen: seen(e.viewStatus),
        status:status(e.status)
      };
      return options;
      //await NotificationNews.create(options);
      //console.log('1. follow');
    }else {
      //console.log('User From Not Found!!');
    }
  } catch (err) {
    console.log("Error Convert Notifications Follow : ",err);
  }
}

export async function appointment(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let appointment = await Appointment.findOne({"cuid":e.notifyInfo.cuid});
      if(appointment){
        let options = {
          to: to._id,
          object: appointment._id,
          from: from._id,
          data:{
            cuid:e.notifyInfo.cuid,
            content:e.notifyInfo.content
          },
          type:"appointment",
          date: e.dateAdded,
          seen: seen(e.viewStatus),
          status:status(e.status)
        };
        return options;
        //await NotificationNews.create(options);
        //console.log('2. appointment');
      }else {
        //console.log('Appointment Not Found!!!');
      }
    }else {
      //console.log("User not found !!!: ");
    }
  } catch (err) {
    console.log("Error Convert Notifications Appointment : ",err);
  }
}

export async function appointmentComment(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let appointment = await AppointmentComment.findOne({cuid:e.notifyInfo.cuid});
      if(appointment) {
        let options = {
          to: to._id,
          object: appointment._id,
          from: from._id,
          data: {
            cuid:e.notifyInfo.cuid,
            content: e.notifyInfo.content
          },
          type: "appointmentComment",
          date: e.dateAdded,
          seen: seen(e.viewStatus),
          status:status(e.status)
        };
        return options;
        //await NotificationNews.create(options);
        //console.log('3. appointment');
      }else {
        //console.log('Appointment Not Found!!!');
      }
    }else {
      //console.log("User not found !!!: ");
    }
  } catch (err) {
    console.log("Error Convert Notifications AppointmentComment : ",err);
  }
}

export async function upVoteKnowledge(to,e) {
  try {
      let from = await User.findOne({cuid:e.userSendID});
      if(from){
        let idknowledge = await StringHelper.isObjectId(e.notifyInfo.knowledgeId);
        if(idknowledge){
        let knowledge = await Knowledge.findById(e.notifyInfo.knowledgeId);
          if(knowledge){
            let options = {
              to: to._id,
              object: knowledge._id,
              from: from._id,
              data:{
                number:0
              },
              type:"upVoteKnowledge",
              date: e.dateAdded,
              seen: seen(e.viewStatus),
              status:status(e.status)
            };
            return options;
            //await NotificationNews.create(options);
            //console.log('4. appointment');
          }
        }
      }
  } catch (err) {
    console.log("Error Convert Notifications upVoteKnowledge : ",err);
  }
}

export async function commentKnowledgeAuthor(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idcomment = await StringHelper.isObjectId(e.notifyInfo.commentId);
      if(idcomment){
        let comment = await Comment.findById(e.notifyInfo.commentId);
        let knowledge = await Knowledge.findById(e.notifyInfo.knowledgeId);
        if(comment && knowledge){
          let options = {
            to: to._id,
            object: knowledge._id,
            from: from._id,
            data:{
              number:0,
              content: e.notifyInfo.content,
              commentID: comment._id
            },
            type:"commentKnowledgeAuthor",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);
          //console.log('5. appointment');
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications commentKnowledgeAuthor : ",err);
  }
}

export async function commentKnowledgeUserVote(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idcomment = await StringHelper.isObjectId(e.notifyInfo.commentId);
      if(idcomment){
        let comment = await Comment.findById(e.notifyInfo.commentId);
        let knowledge = await Knowledge.findById(e.notifyInfo.knowledgeId);
        if(comment && knowledge){
          let options = {
            to: to._id,
            object: knowledge._id,
            from: from._id,
            data:{
              number:0,
              content: e.notifyInfo.content,
              commentID: comment._id
            },
            type:"commentKnowledgeUserVote",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);
          //console.log('6. appointment');
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications commentKnowledgeUserVote : ",err);
  }
}

export async function commentKnowledgeUserComment(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idcomment = await StringHelper.isObjectId(e.notifyInfo.commentId);
      if(idcomment){
        let comment = await Comment.findById(e.notifyInfo.commentId);
        let knowledge = await Knowledge.findById(e.notifyInfo.knowledgeId);
        if(comment && knowledge){
          let options = {
            to: to._id,
            object: knowledge._id,
            from: from._id,
            data:{
              number:0,
              content: e.notifyInfo.content,
              commentID: comment._id
            },
            type:"commentKnowledgeUserComment",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);
          //console.log('7. appointment');
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications commentKnowledgeUserComment : ",err);
  }
}

export async function commentReplyKnowledgeAuthor(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idcomment = await StringHelper.isObjectId(e.notifyInfo.parentId);
      let idreply = await StringHelper.isObjectId(e.notifyInfo.commentId);
      let idknowledge = await StringHelper.isObjectId(e.notifyInfo.knowledgeId);
      if(idcomment && idreply && idknowledge){
        let comment = await Comment.findById(e.notifyInfo.parentId);
        let reply = await Comment.findById(e.notifyInfo.commentId);
        let knowledge = await Knowledge.findById(e.notifyInfo.knowledgeId);
        if(comment && knowledge && reply){
          let options = {
            to: to._id,
            object: knowledge._id,
            from: from._id,
            parentId: comment._id,
            data:{
              number:0,
              content: e.notifyInfo.content,
              commentID: reply._id
            },
            type:"commentReplyKnowledgeAuthor",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          }
          return options;
          //await NotificationNews.create(options);
          //console.log('8. appointment');
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications commentReplyKnowledgeAuthor : ",err);
  }
}

export async function commentReplyKnowledgeComment(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idcomment = await StringHelper.isObjectId(e.notifyInfo.parentId);
      let idreply = await StringHelper.isObjectId(e.notifyInfo.commentId);
      let idknowledge = await StringHelper.isObjectId(e.notifyInfo.knowledgeId);
      if(idcomment && idreply && idknowledge){
        let comment = await Comment.findById(e.notifyInfo.parentId);
        let reply = await Comment.findById(e.notifyInfo.commentId);
        let knowledge = await Knowledge.findById(e.notifyInfo.knowledgeId);
        if(comment && knowledge && reply){
          let options = {
            to: to._id,
            object: knowledge._id,
            from: from._id,
            parentId: comment._id,
            data:{
              number:0,
              content: e.notifyInfo.content,
              commentID: reply._id
            },
            type:"commentReplyKnowledgeComment",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);
          //console.log('9. appointment');
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications commentReplyKnowledgeComment : ",err);
  }
}
export async function censorKnowledge(to,e) {
  try {
      let knowledge = await Knowledge.findById(e.notifyInfo.knowledgeId);
      if(knowledge){
        let options = {
          to: to._id,
          object: knowledge._id,
          type: "censorKnowledge",
          date: e.dateAdded,
          seen: seen(e.viewStatus),
          status:status(e.status)
        };
        return options;
        //await NotificationNews.create(options);
        //console.log('10. appointment');
    }
  } catch (err) {
    console.log("Error Convert Notifications censorKnowledge : ",err);
  }
}

export async function adminRejectKnowledge(to,e) {
  try {
    let idknowledge = await StringHelper.isObjectId(e.notifyInfo.knowledgeId);
    if(idknowledge){
      let knowledge = await Knowledge.findById(e.notifyInfo.knowledgeId);
      if(knowledge){
        let options = {
          to: to._id,
          object: knowledge._id,
          type: "adminRejectKnowledge",
          date: e.dateAdded,
          seen: seen(e.viewStatus),
          status:status(e.status)
        };
        return options;
        //await NotificationNews.create(options);
        //console.log('10. appointment');
      }
    }
      // let options = {
      //   to: to._id,
      //   data:{
      //     content:e.notifyInfo.content
      //   },
      //   type: "adminRejectKnowledge",
      //   date: e.dateAdded,
      //   seen: seen(e.status)
      // }
      // await NotificationNews.create(options);
  } catch (err) {
    console.log("Error Convert Notifications adminRejectKnowledge : ",err);
  }
}

export async function adminDeleteKnowledge(to,e) {
  try{
    let knowledge = await Knowledge.findById(e.notifyInfo.knowledgeId);
    if(knowledge){
      let options = {
        to: to._id,
        object: knowledge._id,
        type: "adminDeleteKnowledge",
        date: e.dateAdded,
        seen: seen(e.viewStatus),
        status:status(e.status)
      };
      return options;
      //await NotificationNews.create(options);
      //console.log('10. appointment');

    }
    // let options = {
    //   to: to._id,
    //   data:{
    //     content:e.notifyInfo.content
    //   },
    //   type: "adminDeleteKnowledge",
    //   date: e.dateAdded,
    //   seen: seen(e.status)
    // }
    // await NotificationNews.create(options);
  } catch (err) {
    console.log("Error Convert Notifications adminDeleteKnowledge : ",err);
  }
}

export async function approvedExpert(to,e) {
  try {
    let optionsapprovedExpert = {
      to:to._id,
      type:"approvedExpert",
      date: e.dateAdded,
      seen: seen(e.status)
    };
    return optionsapprovedExpert;
    //await NotificationNews.create(optionsapprovedExpert);
    //console.log('13. appointment');
  } catch (err) {
    console.log("Error Convert Notifications approvedExpert : ",err);
  }
}

export async function rejectExpert(to,e) {
  try {
    let optionsrejectExpert = {
      to:to._id,
      type:"rejectExpert",
      date: e.dateAdded,
      seen: seen(e.viewStatus),
      status:status(e.status)
    };
    return optionsrejectExpert;
    //await NotificationNews.create(optionsrejectExpert);
    //console.log('14. appointment');
  } catch (err) {
    console.log("Error Convert Notifications rejectExpert : ",err);
  }
}

export async function unsetExpertByAdmin(to,e) {
  try {
    let optionsunsetExpertByAdmin = {
      to:to._id,
      type:"unsetExpertByAdmin",
      date: e.dateAdded,
      seen: seen(e.viewStatus),
      status:status(e.status)
    };
    return optionsunsetExpertByAdmin;
    //await NotificationNews.create(optionsunsetExpertByAdmin);
    //console.log('15. appointment');
  } catch (err) {
    console.log("Error Convert Notifications unsetExpertByAdmin : ",err);
  }
}

export async function adminApproveSuggestSkill(to,e) {
  try {
    let optionsadminApproveSuggestSkill = {
      to:to._id,
      type:"adminApproveSuggestSkill",
      data:{
        content:e.notifyInfo.content
      },
      date: e.dateAdded,
      seen: seen(e.viewStatus),
      status:status(e.status)
    }
    return optionsadminApproveSuggestSkill;
    //await NotificationNews.create(optionsadminApproveSuggestSkill);
    //console.log('16. appointment');
  } catch (err) {
    console.log("Error Convert Notifications adminApproveSuggestSkill : ",err);
  }
}

export async function answerQuestionUserVote(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idquestion = await StringHelper.isObjectId(e.notifyInfo.questionId);
      let idanswer = await StringHelper.isObjectId(e.notifyInfo.answerId);
      if(idquestion && idanswer){

        let question = await Question.findById(e.notifyInfo.questionId);
        let answer = await AnswerQuestion.findById(e.notifyInfo.answerId);
        if(question && answer && !e.notifyInfo.anonymous){
          let options = {
            to:to._id,
            from:from._id,
            object:question._id,
            data:{
              number:0,
              answerId: answer._id,
              content: e.notifyInfo.content,
              anonymous: e.notifyInfo.anonymous
            },
            type: "answerQuestionUserVote",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);
          //console.log('17. appointment');
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications answerQuestionUserVote : ",err);
  }
}

export async function answerQuestionUserAnswer(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idquestion = await StringHelper.isObjectId(e.notifyInfo.questionId);
      let idanswer = await StringHelper.isObjectId(e.notifyInfo.answerId);
      if(idquestion && idanswer){

        let question = await Question.findById(e.notifyInfo.questionId);
        let answer = await AnswerQuestion.findById(e.notifyInfo.answerId);
        if(question && answer && !e.notifyInfo.anonymous){
          let options = {
            to:to._id,
            from:from._id,
            object:question._id,
            data:{
              number:0,
              answerId: answer._id,
              content: e.notifyInfo.content,
              anonymous: e.notifyInfo.anonymous
            },
            type: "answerQuestionUserAnswer",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);
          //console.log('18. appointment');
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications answerQuestionUserAnswer : ",err);
  }
}

export async function answerQuestionAuthor(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idquestion = await StringHelper.isObjectId(e.notifyInfo.questionId);
      let idanswer = await StringHelper.isObjectId(e.notifyInfo.answerId);
      if(idquestion && idanswer && !e.notifyInfo.anonymous){

        let question = await Question.findById(e.notifyInfo.questionId);
        let answer = await AnswerQuestion.findById(e.notifyInfo.answerId);
        if(question && answer){
          let options = {
            to:to._id,
            from:from._id,
            object:question._id,
            data:{
              number:0,
              answerId: answer._id,
              content: e.notifyInfo.content,
              anonymous: e.notifyInfo.anonymous
            },
            type: "answerQuestionAuthor",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);
          //console.log('19. appointment');
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications answerQuestionAuthor : ",err);
  }
}

export async function upVoteQuestion(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idquestion = await StringHelper.isObjectId(e.notifyInfo.questionId);
      if(idquestion){
        let question = await Question.findById(e.notifyInfo.questionId);
        if(question){
          let options = {
            to:to._id,
            from:from._id,
            object:question._id,
            data:{
              number:0
            },
            type: "upVoteQuestion",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);
          //console.log('20. appointment');
        }
      }
     }
  } catch (err) {
    console.log("Error Convert Notifications upVoteQuestion : ",err);
  }
}

export async function answerReplyQuestionUserVote(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idquestion = await StringHelper.isObjectId(e.notifyInfo.questionId);
      let idanswer = await StringHelper.isObjectId(e.notifyInfo.parentId);
      let idreplyanswer = await StringHelper.isObjectId(e.notifyInfo.replyId);
      if(idquestion && idanswer && idreplyanswer){
        let question = await Question.findById(e.notifyInfo.questionId);
        let answer = await AnswerQuestion.findById(e.notifyInfo.parentId);
        let reply = await AnswerQuestion.findById(e.notifyInfo.replyId);
        if(question && answer && reply && !e.notifyInfo.anonymous){
          let options = {
            to:to._id,
            from:from._id,
            object:question._id,
            parentId: answer._id,
            data:{
              number:0,
              answerId: reply._id,
              content: e.notifyInfo.content,
              anonymous: e.notifyInfo.anonymous
            },
            type: "answerReplyQuestionUserVote",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          }
          return options;
          //await NotificationNews.create(options);
          //console.log('21. appointment');
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications answerReplyQuestionUserVote : ",err);
  }
}

export async function answerReplyQuestionUserReply(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idquestion = await StringHelper.isObjectId(e.notifyInfo.questionId);
      let idanswer = await StringHelper.isObjectId(e.notifyInfo.parentId);
      let idreplyanswer = await StringHelper.isObjectId(e.notifyInfo.replyId);
      if(idquestion && idanswer && idreplyanswer){
        let question = await Question.findById(e.notifyInfo.questionId);
        let answer = await AnswerQuestion.findById(e.notifyInfo.parentId);
        let reply = await AnswerQuestion.findById(e.notifyInfo.replyId);
        if(question && answer && reply && !e.notifyInfo.anonymous){
          let options = {
            to:to._id,
            from:from._id,
            object:question._id,
            parentId: answer._id,
            data:{
              number:0,
              answerId: reply._id,
              content: e.notifyInfo.content,
              anonymous: e.notifyInfo.anonymous
            },
            type: "answerReplyQuestionUserReply",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);
          //console.log('22. appointment');
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications answerReplyQuestionUserReply : ",err);
  }
}

export async function answerReplyQuestionAuthor(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idquestion = await StringHelper.isObjectId(e.notifyInfo.questionId);
      let idanswer = await StringHelper.isObjectId(e.notifyInfo.parentId);
      let idreplyanswer = await StringHelper.isObjectId(e.notifyInfo.replyId);
      if(idquestion && idanswer && idreplyanswer){
        let question = await Question.findById(e.notifyInfo.questionId);
        let answer = await AnswerQuestion.findById(e.notifyInfo.parentId);
        let reply = await AnswerQuestion.findById(e.notifyInfo.replyId);
        if(question && answer && reply && !e.notifyInfo.anonymous){
          let options = {
            to:to._id,
            from:from._id,
            object:question._id,
            parentId: answer._id,
            data:{
              number:0,
              answerId: reply._id,
              content: e.notifyInfo.content,
              anonymous: e.notifyInfo.anonymous
            },
            type: "answerReplyQuestionAuthor",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);

        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications answerReplyQuestionAuthor : ",err);
  }
}

export async function replyQuestionAnswer(to,e) {
  try{
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let idquestion = await StringHelper.isObjectId(e.notifyInfo.questionId);
      let idanswer = await StringHelper.isObjectId(e.notifyInfo.parentId);
      let idreplyanswer = await StringHelper.isObjectId(e.notifyInfo.replyId);
      if(idquestion && idanswer && idreplyanswer){
        let question = await Question.findById(e.notifyInfo.questionId);
        let answer = await AnswerQuestion.findById(e.notifyInfo.parentId);
        let reply = await AnswerQuestion.findById(e.notifyInfo.replyId);
        if(question && answer && reply && !e.notifyInfo.anonymous){
          let options = {
            to:to._id,
            from:from._id,
            object:question._id,
            parentId: answer._id,
            data:{
              number:0,
              answerId: reply._id,
              content: e.notifyInfo.content,
              anonymous: e.notifyInfo.anonymous
            },
            type: "replyQuestionAnswer",
            date: e.dateAdded,
            seen: seen(e.viewStatus),
            status:status(e.status)
          };
          return options;
          //await NotificationNews.create(options);
        }
      }
    }
  } catch (err) {
    console.log("Error Convert Notifications replyQuestionAnswer : ",err);
  }
}

export async function adminNotification(to,e) {
  try {
    let optionsadminNotification = {
      to:to._id,
      data:{
        content: e.notifyInfo.content,
        link:e.notifyInfo.link
      },
      type: "adminNotification",
      date: e.dateAdded,
      seen: seen(e.viewStatus),
      status:status(e.status)
    };
    return optionsadminNotification;
    //await NotificationNews.create(optionsadminNotification);
  } catch (err) {
    console.log("Error Convert Notifications adminNotification : ",err);
  }
}

export async function userInviteCode(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let optionsuserInviteCode = {
        to:to._id,
        from:from._id,
        type:"userInviteCode",
        date: e.dateAdded,
        seen: seen(e.viewStatus),
        status:status(e.status)
      };
      return optionsuserInviteCode;
      //await NotificationNews.create(optionsuserInviteCode);
    }
  } catch (err) {
    console.log("Error Convert Notifications userInviteCode : ",err);
  }
}

export async function userInvited(to,e) {
  try {
    let from = await User.findOne({cuid:e.userSendID});
    if(from){
      let options = {
        to:to._id,
        from:from._id,
        type:"userInvited",
        date: e.dateAdded,
        seen: seen(e.viewStatus),
        status:status(e.status)
      };
      return options;
    }
  } catch (err) {
    console.log("Error Convert Notifications userInvited : ",err);
  }
}

export async function userUsedInvited(to,e) {
  try {
      let options = {
        to:to._id,
        type:"userUsedInvited",
        date: e.dateAdded,
        seen: seen(e.viewStatus),
        status:status(e.status)
      };
      return options;

      //await NotificationNews.create(options);

  } catch (err) {
    console.log("Error Convert Notifications userUsedInvited : ",err);
  }
}

export async function uploaddata() {
  try {
    //Comment
    let comment = await Comment.aggregate([
      {$match:{parentId:{$exists:false}}},
      {
        $group:{
          _id:{object:"$knowledgeId",from:"$publisherId"},
          count:{$sum:1}
        }
      }
    ]);
    await createSubscribe(comment,"Comment");
    //ReplyComment
    let replyComments = await Comment.aggregate([
      {$match:{parentId:{$exists:true}}},
      {
        $group:{
          _id:{object:"$knowledgeId",from:"$publisherId"},
          count:{$sum:1}
        }
      }
    ]);
    await createSubscribe(replyComments,"ReplyComment");
    //UpvoteComment
    let upvoteComment = await CommentUpVote.aggregate([
      {
        $group:{
          _id:{object:"$commentId",from:"$userId"},
          count:{$sum:1}
        }
      }
    ]);
    await createSubscribe(upvoteComment,"VoteComment");
    // Upvote Knowledge
    let upvoteKnowledge = await KnowledgeUpvote.aggregate([
      {
        $group:{
          _id:{object:"$knowledgeId",from:"$userId"},
          count:{$sum:1}
        }
      }
    ]);
    await createSubscribe(upvoteKnowledge,"VoteKnowledge");
    // Answer Question
    let answerQuestion = await Answer.aggregate([
      {
        $match:{parentId:{$exists:false},anonymous:false}
      },
      {
        $group:{
          _id:{object:"$question",from:"$user"},
          count:{$sum:1}
        }
      }
    ]);
    await createSubscribe(answerQuestion,"Answer");
    // Reply Answer
    let replyAnswer = await Answer.aggregate([
      {
        $match:{parentId:{$exists:true},anonymous:false}
      },
      {
        $group:{
          _id:{object:"$question",from:"$user"},
          count:{$sum:1}
        }
      }
    ]);
    await createSubscribe(replyAnswer,"ReplyAnswer");
    // Answer Upvote
    let upvoteAnswer = await AnswerVote.aggregate([
      {
        $group:{
          _id:{object:"$questionAnswer",from:"$user"},
          count:{$sum:1}
        }
      }
    ]);
    await createSubscribe(upvoteAnswer,"VoteAnswer");
    // Question Upvote
    let upvoteQuestion = await QuestionUpvote.aggregate([
      {
        $group:{
          _id:{object:"$question",from:"$user"},
          count:{$sum:1}
        }
      }
    ]);
    await createSubscribe(upvoteQuestion,"VoteQuestion");
    return {
      success:true,
      msg:"Convert Subscribe thanh cong!"
    }
  }catch (err){
    console.log("err uploaddata : ",err);
    return Promise.reject({status: 500, success: false, err: 'Internal error.'});
  }
}


export async function createSubscribe(options,type) {
  try{
    options.map(async sub =>{
        let subscribe = {
          from:sub._id.from,
          object:sub._id.object,
          type:type
        };
        let subs = await Subscribe.findOne(subscribe).lean();
        if(!subs){
          await Subscribe.create(subscribe);
        }
    });
  }catch (err){
    console.log("err createSubscribe", err);
  }
}
