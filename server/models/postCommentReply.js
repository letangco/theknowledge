import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const postCommentReplySchema = new Schema({
    commentID     :     { type: 'String', required: true },
    userID        :     { type: 'String', required: true },
    description   :     { type: 'Mixed', required: true },
    dateAdded     :     { type: 'Date', default: Date.now, required: true },
    dateModified  :     { type: 'Date', default: Date.now},
    cuid          :     { type: 'String', required: true }
});

export default mongoose.model('PostCommentReply', postCommentReplySchema);
