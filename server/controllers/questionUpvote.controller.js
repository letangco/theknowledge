import * as QuestionServices from '../services/question.services';
import User from '../models/user';
import StringHelper from '../util/StringHelper';
import Question from '../models/questions';
import {addNotification} from './notification.controller.js';

export async function addQuestionUpvote(req, res) {
  try {
    let idquestion = await StringHelper.isObjectId(req.params.id);
    if(!idquestion){
      throw {
        status:400,
        success:false,
        err:"Not Format QuestionID !!"
      }
    }
    let options = {
      question:req.params.id,
      user:req.user._id
    }
    let data = await QuestionServices.VoteQuestions(options);
    data.success = true;
    return res.json(data);
    // let question = await Question.findById(req.params.id);
    // if (!question) {
    //   return res.status(404).json({success: false, error: 'Question not found.'});
    // }
    //
    // let conditions = {
    //   question: question._id,
    //   user: req.user._id
    // };
    //
    // let questionUppvote = await QuestionUpvote.findOne(conditions);
    // if (questionUppvote) {
    //   question.upVotes--;
    //   await Promise.all([
    //     questionUppvote.remove(),
    //     question.save()
    //   ]);
    //   return res.json({success: true, upvoted: false, upVotes: question.upVotes});
    // }
    //
    // question.upVotes++;
    // await Promise.all([
    //   QuestionUpvote.create(conditions),
    //   question.save()
    // ]);
    // let userRec = await User.findById(question.user).exec();
    // let userSend = await User.findById(req.user._id).exec();
    // if (userRec.cuid != userSend.cuid) {
    //   var dataNotify = {
    //     userID: userRec.cuid,
    //     userSendID: userSend.cuid,
    //     type: 'upVoteQuestion',
    //     data: {
    //       questionId: req.params.id
    //     }
    //   };
    //   addNotification(dataNotify);
    // }
    // return res.json({success: true, upvoted: true, upVotes: question.upVotes});
  } catch (err) {
    console.log('err on addQuestionUpvote:', err);
    return res.status(err.status).json(err);
  }
}
