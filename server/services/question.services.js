import QuestionVote from '../models/questionUpvote';
import Question from '../models/questions';

export async function VoteQuestions(options) {
  try {
    let question = await Question.findById(options.question);
    if(!question){
      return Promise.reject({status:400, success:false, err:"Question Not Found !!"})
    }
    let voteQuestion = await QuestionVote.findOne(options);
    let count = await QuestionVote.count({question:question._id});
    if(voteQuestion){
      await voteQuestion.remove();
      return {
        upvoted:false,
        upvotes:count-1
      }
    }
    await QuestionVote.create(options);
    return {
      upvoted:true,
      upvotes:count+1
    }
  }catch (err){
    // console.log("err VoteQuestions Services :", err);
    return Promise.reject({status:500, success:false, err:"Error Services !!!"})
  }
}
