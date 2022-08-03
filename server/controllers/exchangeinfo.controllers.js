import Notifications from '../models/notification';
import * as ExchangeInfoServices from '../services/exchangeinfo.servies';
import * as MergeInfoServices from '../services/mergeinfo.services';
import User from '../models/user';
import {Q} from "../libs/Queue";
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from "../../config/globalConstants";

const COMMENT_LIMIT = 200;
const arrayNotify = [
  "follow",
  "appointment",
  "appointmentComment",
  "upVoteKnowledge",
  "commentKnowledgeAuthor",
  "commentKnowledgeUserVote",
  "commentKnowledgeUserComment",
  "commentReplyKnowledgeAuthor",
  "commentReplyKnowledgeComment",
  "censorKnowledge",
  "adminRejectKnowledge",
  "adminDeleteKnowledge",
  "approvedExpert",
  "rejectExpert",
  "unsetExpertByAdmin",
  "adminApproveSuggestSkill",
  "answerQuestionUserVote",
  "answerQuestionUserAnswer",
  "answerQuestionAuthor",
  "upVoteQuestion",
  "answerReplyQuestionUserVote",
  "answerReplyQuestionUserReply",
  "answerReplyQuestionAuthor",
  "replyQuestionAnswer",
  "adminNotification",
  "userInviteCode",
  "userInvited",
  "userUsedInvited"
];
const pageArray = [];

export async function exchangeinfo(req,res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    if(isNaN(page)) {
      return res.status(400).json({success: false, err: 'Invalid page number.'});
    }
    if(pageArray.indexOf(page)!==-1){
      return res.status(404).json({success: false, err:`Page ${page} da duoc exchange!!!`});
    }else {
      pageArray.push(page);
    }
    let options = {
      skip: (page - 1) * COMMENT_LIMIT,
      limit: COMMENT_LIMIT
    };
    let result = await Promise.all([
      await Notifications.count({}),
      await Notifications.find({}).skip(options.skip).limit(options.limit)
    ]);
    let notifications = result[1];
    console.log("======================================== Start Merge ============================");
    let promises = notifications.map(async notify => {
      console.log(notify.userID);
      let to = await User.findOne({cuid:notify.userID});
      if(!to){
        console.log('Ko co User :'+notify.userID);
      }else {
        let notifyList = notify.notifyList;

        //console.log(notifyList[0]);
        let data = await getMetaData(notifyList,to);
        data = await data.filter(e =>{
          if(e){
            return e;
          }
        });
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
        //console.log("======================================== Start Merge ============================");

        await getMergeInfo(to);

        //console.log("======================================== End Merge ============================");

      }
    });
    await Promise.all(promises);
    console.log("======================================== End Merge ============================");
    return res.json({
      success:true,
      total:result[0],
      totalpage:Math.ceil(result[0] / COMMENT_LIMIT),
      page:page,
      from:options.skip,
      to:options.skip + options.limit,
    })
  } catch (err) {
    console.log(err);
    res.status(404).json({success:false, err:'Loi nhe'})
  }
}
// GETMETADATA
function getMetaData(notify,to) {
   let promises = notify.map(async e => {
    switch (e.notifyType) {
    case "follow":
      return ExchangeInfoServices.follow(to,e);
    // --------------------------------- APOINTMENT ----------------------------------
    case "appointment":
      return ExchangeInfoServices.appointment(to,e);
    // ---------------------------------- COMMENT_APOINTMENT ------------------------
    // ******************************************************************************
    case "appointmentComment":
      return ExchangeInfoServices.appointmentComment(to,e);
    //break;
    // ---------------------------------- upVoteKnowledge -----------------------------
    // ********************************************************************************
      case "upVoteKnowledge":
        return ExchangeInfoServices.upVoteKnowledge(to,e);
      //break;
    // ---------------------------------- commentKnowledgeAuthor -----------------------------
      case "commentKnowledgeAuthor":
        return ExchangeInfoServices.commentKnowledgeAuthor(to,e);
      //break;
    // ---------------------------------- commentKnowledgeUserVote -----------------------------
    // ********************************************************************************
      case "commentKnowledgeUserVote":
        return ExchangeInfoServices.commentKnowledgeUserVote(to,e);
      //break;
      // ---------------------------------- commentKnowledgeUserComment -----------------------------
      // ********************************************************************************
      case "commentKnowledgeUserComment":
        return ExchangeInfoServices.commentKnowledgeUserComment(to,e);
      //break;
      // ---------------------------------- commentReplyKnowledgeAuthor -----------------------------
      case "commentReplyKnowledgeAuthor":
        return ExchangeInfoServices.commentReplyKnowledgeAuthor(to,e);
      //break;
      // ---------------------------------- commentReplyKnowledgeComment -----------------------------
      // ********************************************************************************
      case "commentReplyKnowledgeComment":
        return ExchangeInfoServices.commentReplyKnowledgeComment(to,e);
      //break;
      // ---------------------------------- censorKnowledge -----------------------------
      case "censorKnowledge":
        return ExchangeInfoServices.censorKnowledge(to,e);
      //break;
      // ---------------------------------- adminRejectKnowledge -----------------------------
      case "adminRejectKnowledge":
        return ExchangeInfoServices.adminRejectKnowledge(to,e);
      //break;
      // ---------------------------------- adminDeleteKnowledge -----------------------------
      case "adminDeleteKnowledge":
        return ExchangeInfoServices.adminDeleteKnowledge(to,e);
      //break;
      // ---------------------------------- approvedExpert -----------------------------
      case "approvedExpert":
        return ExchangeInfoServices.approvedExpert(to,e);

      // ---------------------------------- rejectExpert -----------------------------
      case "rejectExpert":
        return ExchangeInfoServices.rejectExpert(to,e);
      //break;
      // ---------------------------------- unsetExpertByAdmin -----------------------------
      case "unsetExpertByAdmin":
        return ExchangeInfoServices.unsetExpertByAdmin(to,e);
      // break;
      // ---------------------------------- adminApproveSuggestSkill -----------------------------
      case "adminApproveSuggestSkill":
        return ExchangeInfoServices.adminApproveSuggestSkill(to,e);
      // break;
      // ---------------------------------- answerQuestionUserVote -----------------------------
      case "answerQuestionUserVote":
        return ExchangeInfoServices.answerQuestionUserVote(to,e);
      // break;
      // ---------------------------------- answerQuestionUserAnswer -----------------------------
      case "answerQuestionUserAnswer":
        return ExchangeInfoServices.answerQuestionUserAnswer(to,e);
      // break;
      // ---------------------------------- answerQuestionAuthor -----------------------------
      case "answerQuestionAuthor":
        return ExchangeInfoServices.answerQuestionAuthor(to,e);
      // break;
      // ---------------------------------- upVoteQuestion -----------------------------
      case "upVoteQuestion":
        return ExchangeInfoServices.upVoteQuestion(to,e);
      // break;
      // ---------------------------------- answerReplyQuestionUserVote -----------------------------
      case "answerReplyQuestionUserVote":
        return ExchangeInfoServices.answerReplyQuestionUserVote(to,e);
      // break;
      // ---------------------------------- answerReplyQuestionUserReply -----------------------------
      case "answerReplyQuestionUserReply":
        return ExchangeInfoServices.answerReplyQuestionUserReply(to,e);
      // break;
      // ---------------------------------- answerReplyQuestionAuthor -----------------------------
      case "answerReplyQuestionAuthor":
        return ExchangeInfoServices.answerReplyQuestionAuthor(to,e);
      // break;
      // ---------------------------------- replyQuestionAnswer -----------------------------
      case "replyQuestionAnswer":
        return ExchangeInfoServices.replyQuestionAnswer(to,e);
      // break;
      // ---------------------------------- adminNotification -----------------------------
      case "adminNotification":
        return ExchangeInfoServices.adminNotification(to,e);
      // break;
      // ---------------------------------- userInviteCode -----------------------------
      case "userInviteCode":
        return ExchangeInfoServices.userInviteCode(to,e);
      // break;
      // // ---------------------------------- userInvited -----------------------------
      case "userInvited":
        return ExchangeInfoServices.userInvited(to,e);
      // break;
      // ---------------------------------- userUsedInvited -----------------------------
      case "userUsedInvited":
        return ExchangeInfoServices.userUsedInvited(to,e);
      // break;
      default:
        break;
    }
  });
   return Promise.all(promises);
}
// MERGE_INFO
function getMergeInfo(to) {
  let promises = arrayNotify.map(async e =>{
    switch (e){
      case "appointmentComment":
        return MergeInfoServices.Merge(to,e);
      case "upVoteKnowledge":
        return MergeInfoServices.Merge(to,e);
      case "commentKnowledgeAuthor":
        return MergeInfoServices.Merge(to,e);
      case "commentKnowledgeUserVote":
        return MergeInfoServices.Merge(to,e);
      case "commentKnowledgeUserComment":
        return MergeInfoServices.Merge(to,e);
      case "commentReplyKnowledgeAuthor":
        return MergeInfoServices.MergerReply(to,e);
      case "commentReplyKnowledgeComment":
        return MergeInfoServices.MergerReply(to,e);
      case "answerQuestionUserVote":
        return MergeInfoServices.Merge(to,e);
      case "answerQuestionUserAnswer":
        return MergeInfoServices.Merge(to,e);
      case "answerQuestionAuthor":
        return MergeInfoServices.Merge(to,e);
      case "upVoteQuestion":
        return MergeInfoServices.Merge(to,e);
      case "answerReplyQuestionUserVote":
        return MergeInfoServices.MergerReply(to,e);
      case "answerReplyQuestionUserReply":
        return MergeInfoServices.MergerReply(to,e);
      case "answerReplyQuestionAuthor":
        return MergeInfoServices.MergerReply(to,e);
      case "replyQuestionAnswer":
        return MergeInfoServices.MergerReply(to,e);
      default:break;
    }
  });
  return Promise.all(promises);
}


export async function subscribe(req,res) {
  try{
    let data = await ExchangeInfoServices.uploaddata();
    return res.json({success:true, data:data});
  }catch (err){
    return res.status(404).json({success:false, err:"Loi nhe ban!"});
  }
}
