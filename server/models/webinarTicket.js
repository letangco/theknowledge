import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const webinarTicketSchema = new Schema({
  webinar: {type: Schema.ObjectId, ref: 'LiveStream', required: true, index: true},
  price: {type: Number},
  quantity: {type: Number},
  sold: {type: Number, default: 0}
});

export default mongoose.model('WebinarTicket', webinarTicketSchema);
