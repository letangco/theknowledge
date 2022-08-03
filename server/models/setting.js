import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const settingSchema = new Schema({
  type : {type: String},
  data : {type: Object},
});
export default mongoose.model('Settings', settingSchema);
