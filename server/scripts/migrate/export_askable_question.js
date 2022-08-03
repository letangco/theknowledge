import Answer from '../../models/answers';
import SimpleQuestion from '../../models/simpleQuestions';

module.exports = async function () {
  let agg = await Answer.aggregate([
    {
      $group: {
        _id: '$question',
        answer_count: {$sum: 1}
      }
    }
  ]);

  // console.log(agg);
  let questionIds = agg.map(quest => quest._id);
  let questions = await SimpleQuestion.find({_id: {$in: questionIds}}, 'question_text');
  // let string = "";
  let strings = questions.map(question => question.question_text);
  strings = strings.join('\n');

  require('fs').writeFileSync('./questions.txt', strings, 'utf8');
  console.log('done');
};

