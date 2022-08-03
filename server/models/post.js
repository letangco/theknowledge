import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const postSchema = new Schema({
  userID        : { type: 'String', required: true },
  categoryID    : { type: 'String', required: true },
  dateAdded     : { type: 'Date', default: Date.now, required: true },
  dateModified  : { type: 'Date', default: Date.now},
  cuid          : { type: 'String', required: true }
});

export default mongoose.model('Post', postSchema);
