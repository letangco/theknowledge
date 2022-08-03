import mongoose from 'mongoose';
import liveStream from './liveStream';
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';
const Schema = mongoose.Schema;

const likeStreamModel = new Schema({
  from : {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  stream:{type: Schema.ObjectId, ref: 'stream', required: true, index: true},
  createdAt: { type:Date, default: Date.now, required:true }
});
likeStreamModel.index({createdAt:-1});

likeStreamModel.post('save',async (data,next)=>{
  await liveStream.update({_id:data.stream}, {$inc:{like:1}});
  let lives = await liveStream.findOne({_id:data.stream});
  if(lives){
    AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {type:'getTotalVote', obj: {
      count: lives.like,
      liveStream: data.stream
    }});
  }
  return next();
})
likeStreamModel.post('remove', async (data,next)=>{
  await liveStream.update({_id:data.stream},{$inc:{like:-1}});
  let lives = await liveStream.findOne({_id:data.stream});
  if(lives){
    AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {type:'getTotalVote', obj: {
      count: lives.like,
      liveStream: data.stream
    }});
  }
  return next();
})
export default mongoose.model('likeStreamModel',likeStreamModel);
