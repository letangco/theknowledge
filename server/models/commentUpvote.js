import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const commentUpvoteSchema = new Schema({
    commentId: {type: Schema.ObjectId, ref: 'comments', required: true},
    userId: {type: Schema.ObjectId, ref: 'users', required: true},
});

commentUpvoteSchema.index({commentId: 1, userId: 1});

export default mongoose.model('commentUpvote', commentUpvoteSchema);
