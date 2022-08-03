import mongoose from 'mongoose';
import liveStream from "./liveStream";
import {Q} from "../libs/Queue";
import globalConstants from "../../config/globalConstants";
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  userId: { type: Schema.ObjectId, ref: 'users', required: true, index: true},
  userSend: { type: Schema.ObjectId, ref: 'users', index: true},
  amount: { type: Number, default: 0 },
  status: {
    type: Number,
    enum: [0 /* Pedding*/, 1 /*  Approved*/, 2 /*  Rejected*/],
    default: 0
  },
  type: { type: 'String', default: '' },
  content: { type: Object},
  dateAdded: { type: 'Date', default: Date.now, required: true },
})
export default mongoose.model('Task', taskSchema);
