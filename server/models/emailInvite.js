import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const emailInivteSchema = new Schema({
  user: { type: Schema.ObjectId, ref: 'users', required: true, unique: true },
  emails:  {type: Array}
});

export default mongoose.model('emailInivte', emailInivteSchema);

