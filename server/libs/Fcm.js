import {FirebaseAdmin} from "./firebaseAdmin";
import User from '../models/user';
import UserOption from '../models/userOption';
import Notification from '../models/notificationNew';
import configs from '../config';
import languages from '../language';
import Knowledge from '../models/knowledge';
import Livestream from '../models/liveStream';
import Courses from '../models/courses';
import Questions from '../models/questions';
import momentFormat from "moment/moment";
const serviceAccount = require("../../config/tesse_firebase.json");


export async function switchDataNotify(notify, language = 'en'){
  let userInfo = await User.findById(notify.from).lean();
  let userName = '';
  let languageData = languages[language];
  let src = 'assets/images/logo.png';
  let link = 'https://tesse.io';
  let knowledgeInfo = {};
  let questionInfo = {};
  let livestream = {};
  let courses = {};
  if(notify.data && notify.data.anonymous){
    userName = languageData.anonymous;
    src = 'https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg';
  } else {
    if(userInfo){
      userName =  userInfo.fullName ? userInfo.fullName :  userInfo.firstName + ' ' + userInfo.lastName;
      src = userInfo.avatar;
      if(src){
        const subString = src.substring(0, 7);
        if(subString === 'uploads') {
          src = `${configs.host}${src}`;
        }
      } else {
        src = configs.host + 'assets/images/logo.png';
      }
    } else {
      userName = languageData.somebody;
      src = configs.host + 'assets/images/logo.png';
    }
  }
  switch (notify.type) {
    case 'follow':
      /**
       * Follow nguoi dung
       * */
      if(userInfo){
        if(userInfo.userName){
          link = configs.host + userInfo.userName;
        } else {
          link = configs.host + 'profile/' + userInfo.cuid;
        }
      }
      return {
        title: 'Tesse',
        body: userName + languageData.follow,
        click_action: link,
        icon: src
      }
    case 'appointment':
      /**
       * Đặt lịch hẹn
       * */
      return {
        title: 'Tesse',
        body: userName + languageData.appointment,
        click_action: configs.host + 'appointment-detail/' + notify.data.cuid,
        icon: src
      }
    case 'appointmentComment':
      /**
       * Thảo luận cuộc hẹn
       * */
      return {
        title: 'Tesse',
        body: userName + languageData.appointmentComment,
        click_action: configs.host + 'appointment-detail/' + notify.data.cuid,
        icon: src
      }
    case 'upVoteKnowledge':
      /**
       * Like Knowledge
       * */
      knowledgeInfo = await Knowledge.findById(notify.object).lean();
      if(knowledgeInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.upvoteKnowledge,
          click_action: configs.host + 'post/' + knowledgeInfo.slug,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.upvoteKnowledge,
          click_action: configs.host + 'post/' + notify.object,
          icon: src
        }
      }
    case 'commentKnowledgeAuthor':
      /**
       * Thông báo cho tác giả khi bài viết có bình luận
       * */
      knowledgeInfo = await Knowledge.findById(notify.object).lean();
      if(knowledgeInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.upvoteKnowledge,
          click_action: configs.host + 'post/' + knowledgeInfo.slug + '?commentId=' + notify.data.commentID,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.commentKnowledgeAuthor,
          click_action: configs.host + 'post/' + notify.object + '?commentId=' + notify.data.commentID,
          icon: src
        }
      }
      break;
    case 'commentKnowledgeUserVote':
      /**
       * Thông báo cho user đã like khi bài viết có bình luận
       * */
      knowledgeInfo = await Knowledge.findById(notify.object).lean();
      if(knowledgeInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.commentKnowledgeUserVote,
          click_action: configs.host + 'post/' + knowledgeInfo.slug + '?commentId=' + notify.data.commentID,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.commentKnowledgeUserVote,
          click_action: configs.host + 'post/' + notify.object + '?commentId=' + notify.data.commentID,
          icon: src
        }
      }
    case 'commentKnowledgeUserComment':
      /**
       * Thông báo cho user đã Comment khi bài viết có bình luận
       * */
      knowledgeInfo = await Knowledge.findById(notify.object).lean();
      if(knowledgeInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.commentKnowledgeUserComment,
          click_action: configs.host + 'post/' + knowledgeInfo.slug + '?commentId=' + notify.data.commentID,
          icon: src
        }
      } else {
        return {
        title: 'Tesse',
        body: userName + languageData.commentKnowledgeUserComment,
        click_action: configs.host + 'post/' + notify.object + '?commentId=' + notify.data.commentID,
        icon: src
      }}

    case 'commentReplyKnowledgeAuthor':
      /**
       * Thông báo cho chủ nhân bình luận khi comment đó có reply
       * */
      knowledgeInfo = await Knowledge.findById(notify.object).lean();
      if(knowledgeInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.commentReplyKnowledgeAuthor,
          click_action: configs.host + 'post/' + knowledgeInfo.slug + '?parentId=' + notify.parentId + '&commentId=' + notify.data.commentID,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.commentReplyKnowledgeAuthor,
          click_action: configs.host + 'post/' + notify.object + '?parentId=' + notify.parentId + '&commentId=' + notify.data.commentID,
          icon: src
        }
      }
    case 'commentReplyKnowledgeComment':
      /**
       * Thông báo cho user đã reply trong comment khi comment đó có reply
       * */
      knowledgeInfo = await Knowledge.findById(notify.object).lean();
      if(knowledgeInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.commentReplyKnowledgeComment,
          click_action: configs.host + 'post/' + knowledgeInfo.slash + '?parentId=' + notify.parentId + '&commentId=' + notify.data.commentID,
          icon: src
        }

      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.commentReplyKnowledgeComment,
          click_action: configs.host + 'post/' + notify.object + '?parentId=' + notify.parentId + '&commentId=' + notify.data.commentID,
          icon: src
        }

      }
    case 'censorKnowledge':
      /**
       * Thông báo cho author knowledge khi bài viết được duyệt
       * */
      knowledgeInfo = await Knowledge.findById(notify.object).lean();
      if(knowledgeInfo){
        return {
          title: 'Tesse',
          body: languageData.censorKnowledge,
          click_action: configs.host + 'post/' + knowledgeInfo.slug,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: languageData.censorKnowledge,
          click_action: configs.host + 'post/' + notify.object,
          icon: src
        }
      }
    case 'adminRejectKnowledge':
      /**
       * Thông báo cho author knowledge khi bài viết bị từ chối
       * */
      return {
        title: 'Tesse',
        body: languageData.rejectKnowledge,
        click_action: configs.host + 'profile/cj0dl08pn0015kk7myjy7mz2y',
        icon: src
      }
    case 'answerQuestionUserVote':
      /**
       * Thông báo cho user đã vote Question khi Question có Answer
       * */
      questionInfo = await Questions.findById(notify.object).lean();
      if(questionInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.answerQuestionUserVote,
          click_action: configs.host + 'ask/' + questionInfo.slug + '?answerId=' + notify.data.answerId,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.answerQuestionUserVote,
          click_action: configs.host + 'ask/' + notify.object + '?answerId=' + notify.data.answerId,
          icon: src
        }
      }
    case 'answerQuestionUserAnswer':
      /**
       * Thông báo cho user đã Answer Question khi Question có Answer
       * */
      questionInfo = await Questions.findById(notify.object).lean();
      if(questionInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.answerQuestionUserAnswer,
          click_action: configs.host + 'ask/' + questionInfo.slug + '?answerId=' + notify.data.answerId,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.answerQuestionUserAnswer,
          click_action: configs.host + 'ask/' + notify.object + '?answerId=' + notify.data.answerId,
          icon: src
        }
      }
    case 'answerQuestionAuthor':
      /**
       * Thông báo cho Author Question khi Question có Answer
       * */
      questionInfo = await Questions.findById(notify.object).lean();
      if(questionInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.answerQuestionAuthor,
          click_action: configs.host + 'ask/' + questionInfo.slug + '?answerId=' + notify.data.answerId,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.answerQuestionAuthor,
          click_action: configs.host + 'ask/' + notify.object + '?answerId=' + notify.data.answerId,
          icon: src
        }
      }
    case 'upVoteQuestion':
      /**
       * Thông báo cho Author Question khi Question có Vote
       * */
      questionInfo = await Questions.findById(notify.object).lean();
      if(questionInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.upVoteQuestion,
          click_action: configs.host + 'ask/' + questionInfo.slug,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.upVoteQuestion,
          click_action: configs.host + 'ask/' + notify.object,
          icon: src
        }
      }
    case 'answerReplyQuestionUserVote':
      /**
       * Thông báo cho user đã Vote Answer khi Answer có Reply
       * */
      questionInfo = await Questions.findById(notify.object).lean();
      if(questionInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.answerReplyQuestionUserVote,
          click_action: configs.host + 'ask/' + questionInfo.slug + '?parentId=' + notify.parentId + '&replyId=' + notify.data.answerId,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.answerReplyQuestionUserVote,
          click_action: configs.host + 'ask/' + notify.object + '?parentId=' + notify.parentId + '&replyId=' + notify.data.answerId,
          icon: src
        }
      }
    case 'answerReplyQuestionUserReply':
      /**
       * Thông báo cho user đã Reply Answer khi Answer có Reply
       * */
      questionInfo = await Questions.findById(notify.object).lean();
      if(questionInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.answerReplyQuestionUserReply,
          click_action: configs.host + 'ask/' + questionInfo.slug + '?parentId=' + notify.parentId + '&replyId=' + notify.data.answerId,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.answerReplyQuestionUserReply,
          click_action: configs.host + 'ask/' + notify.object + '?parentId=' + notify.parentId + '&replyId=' + notify.data.answerId,
          icon: src
        }
      }
    case 'VoteAnswerToAuthorAnswer':
      /**
       * Thông báo cho Author Answer khi Answer có Vote
       * */
      questionInfo = await Questions.findById(notify.object).lean();
      if(questionInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.VoteAnswerToAuthorAnswer,
          click_action: configs.host + 'ask/' + questionInfo.slug + '?parentId=' + notify.parentId,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.VoteAnswerToAuthorAnswer,
          click_action: configs.host + 'ask/' + notify.object + '?parentId=' + notify.parentId,
          icon: src
        }
      }
    case 'answerReplyQuestionAuthor':
      /**
       * Thông báo cho Author Answer khi Answer có Reply
       * */
      questionInfo = await Questions.findById(notify.object).lean();
      if(questionInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.answerReplyQuestionAuthor,
          click_action: configs.host + 'ask/' + questionInfo.slug + '?parentId=' + notify.parentId + '&replyId=' + notify.data.answerId,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.answerReplyQuestionAuthor,
          click_action: configs.host + 'ask/' + notify.object + '?parentId=' + notify.parentId + '&replyId=' + notify.data.answerId,
          icon: src
        }
      }
    case 'replyQuestionAnswer':
      questionInfo = await Questions.findById(notify.object).lean();
      if(questionInfo){
        return {
          title: 'Tesse',
          body: userName + languageData.replyQuestionAnswer,
          click_action: configs.host + 'ask/' + questionInfo.slug + '?parentId=' + notify.parentId + '&replyId=' + notify.data.answerId,
          icon: src
        }
      } else {
        return {
          title: 'Tesse',
          body: userName + languageData.replyQuestionAnswer,
          click_action: configs.host + 'ask/' + notify.object + '?parentId=' + notify.parentId + '&replyId=' + notify.data.answerId,
          icon: src
        }
      }
    case 'userInviteCode':
      return {
        title: 'Tesse',
        body: userName + languageData.userInviteCode + userName + languageData.userInviteCode1,
        click_action: configs.host + 'payment?tab=earn-free-credit',
        icon: src
      }
    case 'userInvited':
      return {
        title: 'Tesse',
        body: languageData.userInvited + userName + languageData.userInvited1,
        click_action: configs.host + 'payment?tab=earn-free-credit',
        icon: src
      }
    case 'userUsedInvited':
      return {
        title: 'Tesse',
        body: languageData.userUsedInvited,
        click_action: configs.host + 'payment?tab=earn-free-credit',
        icon: src
      }
    case 'adminDeleteKnowledge':
      /**
       * Thông báo cho Author Knowledge khi Admin xóa Knowledge
       * */
      return {
        title: 'Tesse',
        body: languageData.deleteKnowledge,
        click_action: configs.host + 'profile/cj0dl08pn0015kk7myjy7mz2y',
        icon: src
      }
    case 'approvedExpert':
      /**
       * Thông báo cho User khi Admin duyệt Expert
       * */
      link = 'https://tesse.io';
      if(userInfo){
        if(userInfo.userName){
          link = configs.host + userInfo.userName;
        } else {
          link = configs.host + 'profile/' + userInfo.cuid;
        }
      }
      return {
        title: 'Tesse',
        body: languageData.approvedExpert,
        click_action: link,
        icon: src
      };
    case 'completeExpert':
      /**
       * Thông báo cho User khi Admin duyệt Expert
       * */
      link = 'https://tesse.io';
      if(userInfo){
        if(userInfo.userName){
          link = configs.host + userInfo.userName;
        } else {
          link = configs.host + 'profile/' + userInfo.cuid;
        }
      }
      return {
        title: 'Tesse',
        body: languageData.completeExpert,
        click_action: link,
        icon: src
      };

    case 'rejectExpert':
      /**
       * Thông báo cho User khi Admin từ chối Expert
       * */
      return {
        title: 'Tesse',
        body: languageData.rejectExpert,
        click_action: configs.host + 'profile/cj0dl08pn0015kk7myjy7mz2y',
        icon: src
      };
    case 'unsetExpertByAdmin':
      /**
       * Thông báo cho User khi Admin hủy Expert
       * */
      link = 'https://tesse.io';
      if(userInfo){
        if(userInfo.userName){
          link = configs.host +  userInfo.userName;
        } else {
          link = configs.host + 'profile/' + userInfo.cuid;
        }
      }
      return {
        title: 'Tesse',
        body: languageData.unsetExpert,
        click_action: link,
        icon: src
      };
    case 'adminApproveSuggestSkill':
      /**
       * Thông báo cho User khi Admin duyệt suggest skill
       * */
      link = 'https://tesse.io';
      if(userInfo){
        if(userInfo.userName){
          link = configs.host +  userInfo.userName;
        } else {
          link = configs.host + 'profile/' + userInfo.cuid;
        }
      }
      return {
        title: 'Tesse',
        body: languageData.approveSuggestSkill,
        click_action: link,
        icon: src
      };
    case 'adminRejectSuggestSkill':
      /**
       * Thông báo cho User khi Admin từ chối suggest skill
       * */
      return {
        title: 'Tesse',
        body: languageData.rejectSuggestSkill,
        click_action: configs.host + 'profile/cj0dl08pn0015kk7myjy7mz2y',
        icon: src
      };
    case 'adminNotification':
      /**
       * Thông báo cho User khi Admin Notification
       * */
      link = 'https://tesse.io';
      if(notify.data.link){
        link = notify.data.link;
      }
      return {
        title: 'Tesse',
        body: notify.data.content,
        click_action: link,
        icon: src
      };
    case "followLivestream":
      /**
       * Thông báo cho User đã follow Author LiveStream
       * */
      return {
        title:"Tesse",
        body: userName + languageData.streaming,
        click_action:configs.host + notify.data.url,
        icon:src
      }
    case "inviteLivestream":
      /**
       * Thông báo cho User đã được Author LiveStream mời tham gia
       * */
      return {
        title:"Tesse",
        body:userName + languageData.inviteStream,
        click_action:configs.host + notify.data.url,
        icon:src
      };


    case "ScheduleStreamInvite":
      /**
       * Thông báo cho User đã được Author Schedule mời tham gia
       * */
      return {
        title: "Tesse",
        body: userName + languageData.ScheduleStreamInvite,
        click_action: configs.host + notify.data.url,
        icon: src
      };
    case "ScheduleStream":
      /**
       * Thông báo cho User đã được follow Author LiveStream
       * */
      return {
        title: "Tesse",
        body: userName + languageData.ScheduleStream,
        click_action: configs.host + notify.data.url,
        icon: src
      };
    case "followCourses":
      /**
       * Thông báo cho User đã được follow Author and Lectures Courses
       * */
      return {
        title: "Tesse",
        body:userName + languageData.followCourses,
        click_action:configs.host + notify.data.url,
        icon: src
      };
    case "joinCourses":
      /**
       * Thông báo cho User đã được mua Course thành công
       * */
      return {
        title: "Tesse",
        body:languageData.joinCourses,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "joinCoursesToAuthor":
      /**
       * Thông báo cho Author khi có người mua khóa học thành công
       * */
      return {
        title: "Tesse",
        body:languageData.joinCoursesToAuthor,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    // case 'LiveScheduleStream':
    //   return {
    //     title: "Tesse",
    //     body:userName + languageData.LiveScheduleStream,
    //     click_action: configs.host + notify.data.url,
    //     icon:src
    //   };
    case 'RemindSchedule':
      /**
       * Thông báo nhắc nhở User khi khóa học sắp bắt đầu
       * */
      return {
        title: "Tesse",
        body:languageData.RemindSchedule,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindScheduleAuthor":
      /**
       * Thông báo nhắc nhở Author khi khóa học sắp bắt đầu
       * */
      return {
        title: "Tesse",
        body:languageData.RemindScheduleAuthor,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "InviteCourses":
      /**
       * Thông báo cho Lectures được mời dạy cùng trong khóa học
       * */
      return {
        title: "Tesse",
        body:userName + languageData.InviteCourses,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "AuthorCourses":
      /**
       * Thông báo cho Author khi khóa học được duyệt
       * */
      return {
        title: "Tesse",
        body:languageData.AuthorCourses,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RejectCourse":
      /**
       * Thông báo cho Author khi khóa học bi huy
       * */
      return {
        title: "Tesse",
        body:languageData.RejectCourse,
        click_action: '',
        icon:src
      };
    case "inviteLiveLesson":
      return {
        title: "Tesse",
        body:languageData.inviteLiveLesson,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "interactWebinar":
      return {
        title: "Tesse",
        body:userName + languageData.interactWebinar,
        click_action: '',
        icon:src
      };
    case "userSentTicket":
      return {
        title: "Tesse",
        body:userName + languageData.userSentTicket,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "userBuyTicket":
      return {
        title: "Tesse",
        body:languageData.userBuyTicket,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindScheduleBefore24h":
      return {
        title: "Tesse",
        body:languageData.RemindScheduleBefore24h,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindScheduleAuthorBefore24h":
      return {
        title: "Tesse",
        body:languageData.RemindScheduleAuthorBefore24h,
        click_action: configs.host + notify.data.urlManage,
        icon:src
      };
    case "RemindWebinar":
      return {
        title: "Tesse",
        body:languageData.RemindWebinar,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindWebinarAuthor":
      return {
        title: "Tesse",
        body:languageData.RemindWebinarAuthor,
        click_action: configs.host + notify.data.urlManage,
        icon:src
      };
    case "RemindWebinarBefore24h":
      return {
        title: "Tesse",
        body:languageData.RemindWebinarBefore24h,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindWebinarAuthorBefore24h":
      return {
        title: "Tesse",
        body:languageData.RemindWebinarAuthorBefore24h,
        click_action: configs.host + notify.data.urlManage,
        icon:src
      };
    case "followTicket":
      return {
        title: "Tesse",
        body:userName + languageData.followTicket,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "liveTicket":
      return {
        title: "Tesse",
        body:userName + languageData.liveTicket,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "joinMemberShip":
    case "joinMemberShipCoupon":
      return {
        title: "Tesse",
        body:`${languageData.memberShip} ${momentFormat(parseInt(notify.data.time)).format(languageData.dateTimeFormat)}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "renewalMemberShip":
      return {
        title: "Tesse",
        body:`${languageData.renewalMemberShip} ${momentFormat(parseInt(notify.data.time)).format(languageData.dateTimeFormat)}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "adminActive":
      return {
        title: "Tesse",
        body: `${languageData.memberShip} ${notify.data.plus} ${languageData.adminActiveMore} 
        ${momentFormat(parseInt(notify.data.time)).format(languageData.dateTimeFormat)}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "plusMemberShip":
      return {
        title: "Tesse",
        body: `${languageData.adminActive} ${notify.data.dateActive} ${languageData.adminActiveMore} 
        ${momentFormat(parseInt(notify.data.time)).format(languageData.dateTimeFormat)}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "receiverInvite":
      return {
        title: "Tesse",
        body:`${languageData.memberShipReceiverInvite} ${notify.data.memberShip} ${languageData.memberShipReceiverInviteMore} 
        ${momentFormat(parseInt(notify.data.time)).format(languageData.dateTimeFormat)}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "senderInvite":
      return {
        title: "Tesse",
        body:`${languageData.memberShipSenderInvite} ${notify.data.memberShip} ${languageData.memberShipSenderInviteMore} 
        ${momentFormat(parseInt(notify.data.time)).format(languageData.dateTimeFormat)}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindMemberShipWebinar":
      livestream = await Livestream.findById(notify.data.webinarId).lean();
      if(!livestream) return;
      return {
        title: "Tesse",
        body:`${languageData.Webinar} ${livestream.title || ''} ${languageData.RemindMemberShipWebinar}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindMemberShipCourse":
      courses = await Courses.findById(notify.data.courseId).lean();
      return {
        title: "Tesse",
        body:`${languageData.Course} "${courses.title}" ${languageData.RemindMemberShipCourse}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindMemberShipWebinarDay":
      livestream = await Livestream.findById(notify.data.webinarId).lean();
      if(!livestream) return;
      return {
        title: "Tesse",
        body:`${languageData.Webinar} ${livestream.title || ''} ${languageData.RemindMemberShipWebinarDay}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindMemberShipCourseDay":
      courses = await Courses.findById(notify.data.courseId).lean();
      return {
        title: "Tesse",
        body:`${languageData.Course} "${courses.title}" ${languageData.RemindMemberShipCourseDay}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindMemberShipWebinarHour":
      livestream = await Livestream.findById(notify.data.webinarId).lean();
      if(!livestream) return;
      return {
        title: "Tesse",
        body:`${languageData.Webinar}  ${livestream.title || ''} ${languageData.RemindMemberShipWebinarHour}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindMemberShipCourseHour":
      courses = await Courses.findById(notify.data.courseId).lean();
      return {
        title: "Tesse",
        body:`${languageData.Course} "${courses.title}" ${languageData.RemindMemberShipCourseHour}`,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case "RemindRenewMemberShip":
      // let day = 24*60*60*1000;
      // let hour = 60*60*1000;
      // let membership = Math.floor((parseInt(notify.data.memberShip) - Date.now())/day);
      // if(membership === 0){
      //   membership = Math.ceil((parseInt(notify.data.memberShip) - Date.now())/hour);
      //   membership = `${membership}h`
      // }else {
      //   membership = `${membership}d`
      // }
      let messages = ''
      if(notify.data.memberShip > Date.now()){
        messages = `${languageData.RemindRenewMemberShip} ${momentFormat(parseInt(notify.data.memberShip)).format(languageData.dateTimeFormat)}. ${languageData.RemindRenewMemberShipMore}`;
      }  else {
        messages = `${languageData.RemindRenewMemberShipExpire} ${momentFormat(parseInt(notify.data.memberShip)).format(languageData.dateTimeFormat)}. ${languageData.RemindRenewMemberShipMore}`;
      }
      return {
        title: "Tesse",
        body: messages,
        click_action: configs.host + notify.data.url,
        icon:src
      };
    case 'notification_teacher':
      let message = `${languageData.student} "${userName}" ${languageData.hasRecive} "${notify.data.course}" ${notify.content}`;
      return {
        title: "Tesse",
        body: message,
        click_action: configs.host + notify.data.url,
        icon: src
      };
    default:
      return;
  }
}
export async function pushNotifyToUser(notifyOptions) {
  try {
    let deviceTokens = notifyOptions.deviceTokens;
    if (deviceTokens.length > 0){
      /*than: get content notify to desktop notify*/
      let notify = JSON.parse(notifyOptions.data);
      delete notify.__v;delete notify.seen;delete notify.status;
      let user = await User.findById(notify.to).lean();
      let userSetting = await UserOption.findOne({'userID': user.cuid.toString()}).lean();
      if(notify){
        let language = userSetting && userSetting.language ? userSetting.language : 'en';
        let notifyData = await switchDataNotify(notify, language);
        if(notifyData){
          delete notify.from;
          notify.data = JSON.stringify(notify.data);
          let payload = {
            notification: notifyData,
            data: JSON.parse(JSON.stringify(notify)) || {}
          };
          return await FirebaseAdmin.messaging().sendToDevice(deviceTokens, payload).catch(function(error) {
            console.log("Error sending message: ", error, payload);
          });
        }
      }
    }

  } catch (err) {
    console.log('pushNotifyToUser error:', err);
    throw err;
  }
}

// export async function pushNotifyToUserV2(notifyOptions) {
//   try {
//     //console.log("Da Vao Dc ROi nhe!");
//     let deviceTokens = notifyOptions.deviceTokens;
//     /*than: get content notify to desktop notify*/
//     let informations = JSON.parse(JSON.stringify(notifyOptions.data));
//     delete informations.__v; delete informations.seen, delete informations.from;
//     if(informations.to && informations._id){
//       let user = await User.findById(informations.to);
//       let userSetting = await UserOption.findOne({'userID': user.cuid.toString()}).lean();
//       let notify = await Notification.findById(informations._id).lean();
//       delete notify.__v;delete notify.seen;delete notify.from;
//
//
//       if(notify){
//         let language = userSetting
//         && userSetting.language ?
//           userSetting.language :
//           'en';
//         let notifyData = await switchDataNotify(notify, language);
//         informations.data = JSON.stringify(informations.data);
//         let payload = {
//           notification: notifyData,
//           data: informations || {}
//         };
//
//         console.log('payload:', payload);
//
//         return FirbaseAdmin.messaging().sendToDevice(deviceTokens, payload);
//       }
//     }
//   } catch (err) {
//     throw err;
//   }
// }

export async function pushMessageNotifyToUser(notifyOptions) {
  try {
    let deviceTokens = notifyOptions.deviceTokens;
    if(!deviceTokens || !deviceTokens.length) {
      return;
    }
    let payload = {
      notification: {
        title: notifyOptions.title || 'Tesse',
        body: notifyOptions.body || '',
        click_action: configs.host + notifyOptions.click_action || 'https://tesse.io',
        icon: notifyOptions.icon || 'assets/images/logo.png',
        sound: "default"
      },
      data: notifyOptions.data || {}
    };
    return await FirebaseAdmin.messaging().sendToDevice(deviceTokens, payload).catch(function(error) {
      console.log("Error sending message: ", error, payload);
    });

  } catch (err) {
    throw err;
  }
}

