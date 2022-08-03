import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const subscribemodel = new Schema({
  from:{type:Schema.ObjectId, required:true, refs:'users', index:true},
  object:{type:Schema.ObjectId, required:true, index:true},
  createdAt:{type:Date, default:Date.now, required:true},
  type:{type:String,
        required:true,
        index:true
      }
});

export default mongoose.model('subscribe', subscribemodel);
