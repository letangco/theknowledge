import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const commentReviewCourseSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  review: {type: Schema.ObjectId, index: true},
  content: {type: String},
  createdDate: {type: Date, required: true, default: Date.now}
});

commentReviewCourseSchema.index({createdDate: -1});

export default mongoose.model('CommentReviewCourse', commentReviewCourseSchema);
