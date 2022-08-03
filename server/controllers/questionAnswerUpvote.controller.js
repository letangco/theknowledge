import QuestionAnswer from '../models/questionAnswers';
import QuestionAnswerUpvote from '../models/questionAnswerUpvote';
import * as AnswerVoteServices from '../services/questionanswer.services';

export async function addAnswerUpvote(req, res) {
  try {
    if(!req.params.id || String(req.params.id).valueOf() === 'undefined') {
      return res.status(404).json({success: false, error: 'Answer not found.'});
    }
    let options = {
      questionAnswer: req.params.id,
      user: req.user._id
    };

    let data = await AnswerVoteServices.addVoteAnswer(options);
    return res.json({success: true, upvoted: true, data:data});

  } catch (err) {
    //console.log('err on addAnswerUpvote:', err);
    return res.status(err.status).json(err);
  }
}
