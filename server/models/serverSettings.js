import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const serverSettingSchema = new Schema({
  key: {type: String, required: true},
  value: {type: String, required: true}
});

serverSettingSchema.index({key: 1});

export default mongoose.model('ServerSettings', serverSettingSchema);
