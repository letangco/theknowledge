import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const deleteCourseSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  course: {type: Schema.ObjectId, ref: 'courses', required: true, index: true},
  admin: {type: Schema.ObjectId, ref: 'users', index: true},
  status: {
    type: String,
    enum: ['waiting', 'approved', 'rejected'],
    default: 'waiting',
    index: true
  },
  notes: {type: String},
  created_at: {type: Date, default: Date.now},
  approved_at: {type: Date}
});

deleteCourseSchema.index({created_at: -1});

deleteCourseSchema.post('save', async function (created,next) {
  try{

    next();
  }catch (err){
    console.log(err);
  }
});

export default mongoose.model('DeleteCourse', deleteCourseSchema);
