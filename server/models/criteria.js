import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const criteriaSchema = new Schema({
  key:  {type: 'String', required: true, unique: true},
  name: {type: 'String', required: true}
});

export default mongoose.model('Criteria', criteriaSchema);