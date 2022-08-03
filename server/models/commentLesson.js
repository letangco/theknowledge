import mongoose from 'mongoose';
import CommentLesson from './commentLesson';
const Schema = mongoose.Schema;
const commentLessonSchema = new Schema({
  publisherId: {type: Schema.ObjectId, ref: 'users', required: true},
  lessonId: {type: Schema.ObjectId, ref: 'livestreams', required: true},
  publishedDate: {type: Date, default: Date.now, required: true},
  content: {type: String, required: true},
  parentId: {type: Schema.ObjectId, ref: 'commentlessons'},
});

// for querying
commentLessonSchema.index({lessonId: 1});
commentLessonSchema.index({parentId: 1});
// for sorting
commentLessonSchema.index({publishedDate: -1});
export default mongoose.model('CommentLesson', commentLessonSchema);
