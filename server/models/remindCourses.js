import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const remindModel = new Schema({
  courseId : {type:Schema.ObjectId, ref:'courses', index:1},
  lessonId : {type:Schema.ObjectId, ref:'liveStreams', required:true, index:1},
  jobId : {type:'Mixed', required:true, index:1},
  type: {type:String, index:1}
});


export default mongoose.model("remind",remindModel);
