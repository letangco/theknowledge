import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const dailyTrackingSchema = new Schema({
  key:  {type: 'String', required: true},
  val: {type: 'Number', required: true},
  createdDate: {type: 'Date', default: Date.now}
});

dailyTrackingSchema.index({key: 1, createdDate: 1});

export default mongoose.model('DailyTracking', dailyTrackingSchema);
