import mongoose from 'mongoose';
import Appointment from './appointment';
// import {Q} from "../libs/Queue";
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from "../../config/globalConstants";
import User from './user';
const Schema = mongoose.Schema;

const expertSchema = new Schema({
  cuid : {type: String, required: true},
  appointmentID : {type: String, required: true},
  userID : {type: String, required: true},
  content : { type: 'Mixed',  required: true },
  dateAdded : {type: 'Date', default: Date.now, required: true},
  timezone : {type: String, required: true},
  status: {type: 'Number', default: 0},
});

expertSchema.post('save',async(created,next)=>{
  Appointment.update({cuid:created.appointmentID},{$set: {status:created.status}});
  let appointment = await Appointment.findOne({cuid:created.appointmentID}).lean();
  let userfrom = await User.findOne({cuid:created.userID}).lean();
  if(created.userID === appointment.expertID){
    let userto = await User.findOne({cuid:appointment.userID}).lean();
    let data = {
      to: userto._id,
      from: userfrom._id,
      object: appointment._id,
      data: {
        cuid: created._id,
        content: created.content
      },
      type: "appointmentComment"
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
  }else {
    let userto = await User.findOne({cuid:appointment.expertID}).lean();
    let data = {
      to: userto._id,
      from: userfrom._id,
      object: appointment._id,
      data: {
        cuid: created._id,
        content: created.content
      },
      type: "appointmentComment"
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, data);
  }
  next();
});
export default mongoose.model('appointmentComment', expertSchema);
