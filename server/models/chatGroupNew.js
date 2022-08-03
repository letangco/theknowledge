import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ChatGroups = new Schema({
  cuid:{type:String, required:true},
  user:[String],
  createdAt:{type:Date, default:Date.now, required:true},
  updatedAt:{type:Date, default:Date.now},
  type: {
    type: 'String',
    enum: ['normal', 'training', 'findingExperts'],
    required: true,
    default: 'normal'
  }
});

export default mongoose.model("ChatGroupsNew",ChatGroups);
