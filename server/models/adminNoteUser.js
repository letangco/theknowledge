import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const adminNoteUser = new Schema({
  content: {type: String, required: true},
  supporter : {type: Schema.ObjectId, required: true},
  date: {type: Number, required:true},
  user: {type: Schema.ObjectId, required: true}
});

export default mongoose.model('adminNoteUser', adminNoteUser);
