import mongoose from 'mongoose';
import Elasticsearch from '../libs/Elasticsearch';

const Schema = mongoose.Schema;
const simpleQuestionSchema = new Schema({
  url: {type: String, required: true, unique: true},
  question_html: {type: String, required: true},
  question_text: {type: String, required: true},
  tags: {type: Array}
});

simpleQuestionSchema.statics.toESDoc = function(simpleQuestion) {
  return {
    id: simpleQuestion._id,
    search_text: simpleQuestion.question_text
  };
} ;

simpleQuestionSchema.statics.syncToElasticsearch = async function(_this) {
  let simpleQuestions = await _this.find();
  let docs = simpleQuestions.map(sQuestion => _this.toESDoc(sQuestion));
  await Elasticsearch.multiIndex('questions', docs, 'simple');
  console.log('index simple questions to Elasticsearch done.');
};

export default mongoose.model('SimpleQuestions', simpleQuestionSchema);
