import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const checkinWebinarSchema = new Schema({
  webinar: {type: Schema.ObjectId, ref: 'LiveStream', required: true},
  ticketCode: {type: String, required: true, unique: true},
  user: {type: String},
  created_at: {type: Date, required: true, default: Date.now},
  updated_at: {type: Date, required: true, default: Date.now},
});

checkinWebinarSchema.index({webinar: 1, ticketCode: 1});
checkinWebinarSchema.index({webinar: 1, created_at: -1});

export default mongoose.model('CheckinWebinar', checkinWebinarSchema);
