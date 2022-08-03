import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const knowledgeBookmarkSchema = new Schema({
  userId : {type: Schema.ObjectId, ref: 'users', required: true},
  knowledgeId : {type: Schema.ObjectId, ref: 'knowledges', required: true},
  dateAdded : {type: 'Date', default: Date.now, required: true},
});

knowledgeBookmarkSchema.index({knowledgeId: 1, userId: 1});

export default mongoose.model('knowledgeBookmark', knowledgeBookmarkSchema);