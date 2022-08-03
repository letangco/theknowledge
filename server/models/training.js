import mongoose from 'mongoose';
import Elasticsearch from '../libs/Elasticsearch';
const Schema = mongoose.Schema;

const trainingSchema = new Schema({
  user      : { type: Schema.ObjectId, ref: 'users', required: true },
  question  : {type: 'String', required: true},
  answer    : {type: 'String'},
  dateAdded : { type: 'Date', default: Date.now, required: true },
  trainerRole  : {
    type: 'String',
    enum: ['admin', 'expert', 'user'],
    required: true
  }
});

// trainingSchema.index({user: 1, answer: 1});

trainingSchema.post('save', async (created, next) => {
  let question = Object.assign({}, created);
  if(created.answer) {
    let doc = {
      id: created._id.toString(),
      search_text: created.question,
      trainerRole: created.trainerRole
    };
    await Elasticsearch.index('questions', doc, 'train');
  }
  return next();
});

export default mongoose.model('Trainings', trainingSchema);
