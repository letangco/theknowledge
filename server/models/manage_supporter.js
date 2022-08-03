import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ManageSupport = new Schema({
  user: {type: Schema.ObjectId, required: true},
  supporter : {type: Schema.ObjectId, required: true},
  step: {type: Number},
  nextDateSupport: {type: Number},
  note: {type: Array, default: []},
  createdAt: {type: Date, default: Date.now}
});

export default mongoose.model('ManageSupport', ManageSupport);
