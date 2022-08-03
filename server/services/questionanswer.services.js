import QuestionAnswerVote from '../models/questionAnswerUpvote';
import Answer from '../models/questionAnswers';

export async function addVoteAnswer(options) {
  try {
    let answer = await Answer.findById(options.questionAnswer);
    if(!answer){
      return Promise.reject({status:400, success:false, err:"Answer Not Found !!!"})
    }
    let voteAnswer = await QuestionAnswerVote.findOne(options);
    if(voteAnswer){
      return Promise.reject({status:400, success:false, err:"You did voted Answer "})
    }
    return await QuestionAnswerVote.create(options);
  }catch (err){
    console.log("err addVoteAnswer Services :", err);
    return Promise.reject({status:500, success:false, err:"Error Services !!"})
  }
}
