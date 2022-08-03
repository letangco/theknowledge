import Notification from '../models/notificationNew';
import User from '../models/user';
import Appointment from '../models/appointment';
import Knowledge from '../models/knowledge';
import Question from '../models/questions';
import LiveStream from '../models/liveStream';
import AnswerQuestion from '../models/questionAnswers';
import Review from '../models/reviewCourse';
import * as Review_Services from '../services/reviewCourse.services'
import Comment from '../models/comment';
import Course from '../models/courses';

const TypeNotifyMobile = ["follow","appointmentComment","appointment","approvedExpert","rejectExpert","unsetExpertByAdmin","adminNotification","followLivestream","inviteLivestream",
                          "RemindSchedule","RemindScheduleAuthor","InviteCourses","RemindScheduleBefore24h", "RemindScheduleAuthorBefore24h"];

export async function AddNotification(options) {
  try {
    let notification = await Notification.findOne(options);
    if(notification){
      return Promise.reject({status:404, success:false, err:"Notification Da Ton Tai!"});
    }
    return await Notification.create(options);
  }catch (err){
    console.log("err AddNotification : ", err);
    return Promise.reject({status:500, success:false, err:"Error!!"});
  }
}

export async function getNotificationByUser(options, langCode) {
  try {
    let notifications = [];
    if (options.lastId){
      if (options.type === 'web'){
        notifications = await Notification.find({_id:{$gt:options.lastId},to:options.to}).sort({date:-1}).skip(options.skip).limit(options.limit).lean();
      }else {
        notifications = await Notification.find({_id:{$gt:options.lastId},to:options.to,type:{$in:TypeNotifyMobile}}).sort({date:-1}).skip(options.skip).limit(options.limit).lean();
      }
    } else {
      if (options.type === 'web'){
        notifications = await Notification.find({to:options.to}).sort({date:-1}).skip(options.skip).limit(options.limit).lean();
      }else {
        notifications = await Notification.find({to:options.to,type:{$in:TypeNotifyMobile}}).sort({date:-1}).skip(options.skip).limit(options.limit).lean();
      }
    }
    await User.update(
      {_id:options.to},
      {$set:
          {unReceiveNotify:0}
      });
    await Notification.update(
      {to:options.to,status:false},
      {$set:
          {status:true}
      },
      {multi:true}
    );
    return await getMetaData(notifications, langCode);
  }catch (err){
    console.log("err getNotificationByUser : ", err);
    return Promise.reject({status:500, success:false, err:"Error!!"});
  }
}

export async function getMetaData(notifications, langCode){
  try {
    let promise = notifications.map(async notify =>{
      let user = await User.findById(notify.from).lean();
      if(user){
        notify.from = {
          fullName:user.fullName,
          avatar:user.avatar,
          cuid:user.cuid,
          _id:user._id,
        };
        let data = await loadDataObject(notify, langCode);
        //console.log('data tren',data);
        return data;
      }else {
        if(notify.type === "answerQuestionAnonymous" || notify.type === "replyAnswerQuestionAnonymous"){
          notify.img = "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg"
        }
        let data = await loadDataObject(notify, langCode);
        //console.log('data duoi',data);
        return data;
      }
    });
    return Promise.all(promise);
  }catch (err){
    console.log("err getMetaUser : ", err);
    return Promise.reject({status:500, success:false, err:"Error!!"});
  }
}

export async function countNotification(options) {
  try{
    let conditions = options.type === 'mobi' ? {to:options.to,type:{$in:TypeNotifyMobile}}:{to:options.to};
    return await Notification.count(conditions);
  }catch (err){
    console.log("err countNotification : ", err);
    return Promise.reject({status:500, success:false, err:"Error!!"});
  }
}

async function loadDataObject(options, langCode) {
  try {
    switch (options.type){
      case "appointment":
        let appointment = await Appointment.findById(options.object);
        options.object = appointment;
        return options;
      case "appointmentComment":
        let appointmentComment = await Appointment.findById(options.object);
        options.object = appointmentComment;
        return options;

      case "upVoteKnowledge":
        return getMetaDataObject(options, Knowledge);

      case "commentKnowledgeAuthor":
        return getMetaDataObject(options, Knowledge);

      case "commentKnowledgeUserVote":
        return getMetaDataObject(options, Knowledge);

      case "commentKnowledgeUserComment":
        return getMetaDataObject(options, Knowledge);

      case "commentReplyKnowledgeAuthor":
        return getMetaDataObjectReply(options,Knowledge,Comment);

      case "commentReplyKnowledgeComment":
        return getMetaDataObjectReply(options,Knowledge,Comment);

      case "answerQuestionUserVote":
        return getMetaDataObject(options,Question);

      case "answerQuestionUserAnswer":
        return getMetaDataObject(options,Question);

      case "answerQuestionAuthor":
        return getMetaDataObject(options,Question);

      case "upVoteQuestion":
        return getMetaDataObject(options,Question);

      case "answerReplyQuestionUserVote":
        return getMetaDataObjectReply(options,Question,AnswerQuestion);

      case "answerReplyQuestionUserReply":
        return getMetaDataObjectReply(options,Question,AnswerQuestion);
      case "VoteAnswerToAuthorAnswer":
        return getMetaDataObjectReply(options,Question,AnswerQuestion);
      case "answerReplyQuestionAuthor":
        return getMetaDataObjectReply(options,Question,AnswerQuestion);
      case "replyQuestionAnswer":
        return getMetaDataObjectReply(options,Question,AnswerQuestion);
      case "answerQuestionAnonymous":
        return getMetaDataObject(options,Question);
      case "replyAnswerQuestionAnonymous":
        return getMetaDataObjectReply(options,Question,AnswerQuestion);
      case 'censorKnowledge':
        return getMetaDataObject(options,Knowledge);
      case 'adminRejectKnowledge':
        return getMetaDataObject(options,Knowledge);
      case 'adminDeleteKnowledge':
        return getMetaDataObject(options,Knowledge);
      case 'AuthorCourses':
        return getMetaDataObject(options,Course);
      case 'inviteLiveLesson':
        return getMetaDataObject(options,Course);
      case 'InviteCourses':
        return getMetaDataObject(options,Course);
      case 'RemindScheduleAuthor':
        return getMetaDataObject(options,Course);
      case 'RemindSchedule':
        return getMetaDataObject(options,Course);
      case 'joinCourses':
        return getMetaDataObject(options,Course);
      case 'joinCoursesToAuthor':
        return getMetaDataObject(options,Course);
      case 'followCourses':
        return getMetaDataObject(options,Course);
      case 'ScheduleStream':
        return getMetaDataObject(options,LiveStream);
      case 'ScheduleStreamInvite':
        return getMetaDataObject(options,LiveStream);
      case 'interactWebinar':
        return getMetaDataObject(options,LiveStream);
      case 'goingWebinar':
        return getMetaDataObject(options,LiveStream);
      case 'userSentTicket':
        return getMetaDataObject(options,LiveStream);
      case 'userBuyTicket':
        return getMetaDataObject(options,LiveStream);
      case 'RemindScheduleBefore24h':
        return getMetaDataObject(options,Course);
      case 'RemindScheduleAuthorBefore24h':
        return getMetaDataObject(options,Course);
      case 'RemindWebinar':
        return getMetaDataObject(options,LiveStream);
      case 'RemindWebinarAuthor':
        return getMetaDataObject(options,LiveStream);
      case 'RemindWebinarBefore24h':
        return getMetaDataObject(options,LiveStream);
      case 'RemindWebinarAuthorBefore24h':
        return getMetaDataObject(options,LiveStream);
      case 'followTicket':
        return getMetaDataObject(options,LiveStream);
      case 'RemindMemberShipWebinarHour':
        return getMetaDataObject(options,LiveStream);
      case 'RemindMemberShipCourseHour':
        return getMetaDataObject(options, Course);
      case 'RemindMemberShipWebinarDay':
        return getMetaDataObject(options,LiveStream);
      case 'RemindMemberShipCourseDay':
        return getMetaDataObject(options, Course);
      case 'RemindMemberShipWebinar':
        return getMetaDataObject(options,LiveStream);
      case 'RemindMemberShipCourse':
        return getMetaDataObject(options, Course);
      case 'notification_teacher':
        let reviews = await Review.findOne(options.object).lean();
        reviews = await Review_Services.getMetaData(reviews, langCode);
        options.object = reviews[0]
        return options;
      default:
        return options;
    }
  }catch (err){
    console.log("err loadDataObject : ", err);
    return Promise.reject({status:500, success:false, err:"Error!!"});
  }
}

async function getMetaDataObject(options,models) {
  try {
    if(models===Question){
      //console.log("Question");
      let upVoteKnowledge = await models.findById(options.object,'description slug anonymous title state').lean();
      //delete upVoteKnowledge.content;
      options.object = upVoteKnowledge;
    }else if (models===Knowledge){
      let upVoteKnowledge = await models.findById(options.object,'description slug title state').lean();
      //delete upVoteKnowledge.content;
      options.object = upVoteKnowledge;
    }else if(models===Course) {
      let upVoteKnowledge = await models.findById(options.object,'description slug title state').lean();
      //delete upVoteKnowledge.content;
      options.object = upVoteKnowledge;
    }else {
      let upVoteKnowledge = await models.findById(options.object,'description slug content title').lean();
      //delete upVoteKnowledge.content;
      options.object = upVoteKnowledge;
    }
    return options;
  }catch (err){
    console.log("err getMetaDataObject : ", err);
    return Promise.reject({status:500, success:false, err:"Error!!"});
  }
}

async function getMetaDataObjectReply(options,models,modelsreply) {
  try {
    if(models===Question){
      //console.log("Question");
      let upVoteKnowledge = await models.findById(options.object,'description slug anonymous title state').lean();
      //delete upVoteKnowledge.content;
      options.object = upVoteKnowledge;
    }else {
      let upVoteKnowledge = await models.findById(options.object,'description slug title state').lean();
      //delete upVoteKnowledge.content;
      options.object = upVoteKnowledge;
    }
    if(modelsreply === AnswerQuestion){
      let commentKnowAuthor = await modelsreply.findById(options.parentId,'content user anonymous upVotes');
      options.parentId = commentKnowAuthor;
    }else {
      let commentKnowAuthor = await modelsreply.findById(options.parentId,'content publisherId upVotes');
      options.parentId = commentKnowAuthor;
    }
    return options;
  }catch(err) {
    console.log("err getMetaDataObjectReply : ", err);
    return Promise.reject({status:500, success:false, err:"Error!!"});
  }
}


export async function updateStatusByUser(options) {
  try {
    let notifications = await Notification.findById(options.notifyId);
    if(!notifications){
      return Promise.reject({status:404 , success:false, err:"Notification Not Found !!"})
    }
    if(options.to.toString() !== notifications.to.toString()){
      return Promise.reject({status:404 , success:false, err:"Not Permission !!"})
    }
    await Notification.update(
      {_id:options.notifyId},
      {$set:
          {seen:true}
      });
    return await Notification.findById(options.notifyId);
  }catch (err){
    console.log("err Services: updateStatusByUser", err);
    return Promise.reject({status:500, success:false, err:"Error !!"})
  }
}
