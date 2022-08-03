import SimpleQuestion from '../../models/simpleQuestions';
import Training from '../../models/training';
import Answer from '../../models/answers';
import Elasticsearch from '../../libs/Elasticsearch';

module.exports = async function () {
  let trainingESDoc = [];

  let agg = await Answer.aggregate([
    {
      $group: {
        _id: '$question',
        answer_count: {$sum: 1}
      }
    }
  ]);

  let questionIds = agg.map(quest => quest._id);
  let simpleQuestions = await SimpleQuestion.find({_id: {$in: questionIds}}, 'question_text');
  console.log(simpleQuestions.length + ' questions');
  let promises = simpleQuestions.map(async question => {
    let answers = await Answer.find({question: question._id}).sort({upvotes: -1}).limit(1);
    let answer = answers.shift();

    return {
      user: '58e61e310fc0f92c8685b223',
      question: question.question_text,
      answer: answer.content,
      trainerRole: 'admin'
    };
  });
  let training = await Promise.all(promises);
  training = await Training.create(training);
  console.log('created ', training.length + ' training');
  let esDocs = training.map(train => {
    return {
      id: train._id.toString(),
      search_text: train.question,
      trainerRole: train.trainerRole
    };
  });

  await Elasticsearch.multiIndex('questions', esDocs, 'train');
  console.log('done');
};
