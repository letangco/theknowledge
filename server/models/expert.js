import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const expertSchema = new Schema({
  email: {type: 'String'},
  dateAdded: {type: 'Date', default: Date.now, required: true}
});
export default mongoose.model('Expert', expertSchema);