import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userSearchSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users'},
  search_text: {type: 'String', required: true},
  createdDate: {type: 'Date', default: Date.now, required: true},
  type: {
    type: 'String',
    enum: ['expert', 'knowledge'],
    required: true
  }
});

userSearchSchema.index({user: 1});
userSearchSchema.index({type: 1});
userSearchSchema.index({createdDate: -1});

export default mongoose.model('UserSearch', userSearchSchema);
