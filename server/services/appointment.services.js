import Appointment from '../models/appointment';
import AppointmentComment from '../models/appointmentComment';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';
import User from '../models/user';

export async function bookAppointment(options,lang) {
  try {
    let expert = await User.findOne({cuid:options.expertID});
    if(!expert){
      return Promise.reject({status:400, success:false, err:"Expert Not Found"});
    }
    let user = await User.findOne({cuid:options.userID});
    let dataSendMail = {
      type: 'appointment',
      language: lang,
      data: {
        cuid: options.userID,
        firstName: user.firstName,
        lastName: user.lastName,
        email: expert.email,
        firstNameExpert: expert.firstName,
        lastNameExpert: expert.lastName,
        date: options.date,
        time: options.hour + ':' + options.minute,
        timeZone: options.timeZone,
        content: options.content
      }
    };
    Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
    return await Appointment.create(options) ;
  }catch (err){
    console.log("err bookAppointment Services :", err);
    return Promise.reject({status:500 , success:false , err:"Error Services!!!"})
  }
}

export async function addCommentAppointment(options,userReviceMail,lang) {
  try{
    let appointment = await Appointment.findOne({cuid:options.appointmentID});
    if(!appointment){
      return Promise.reject({status:400 , success:false , err:"Appointment Not Found!!"})
    }
    // Send Mail
    let userSend = await User.findOne({cuid:userReviceMail});
    let user = await User.findOne({cuid:options.userID}).lean();
    let dataSendMail = {
      type: 'appointmentComment',
      language: lang,
      data: {
        cuid: user.userID,
        firstName: user.firstName,
        lastName: user.lastName,
        email: userSend.email,
        firstNameSend: userSend.firstName,
        lastNameSend: userSend.lastName,
        appointment: appointment._id,
        content: appointment.content
      }
    };
    await Appointment.update({cuid: options.appointmentID}, {
      $set: {status: options.status}
    })
    //Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
    return await AppointmentComment.create(options);
  }catch (err){
    console.log("err addCommentAppointment Services : ", err);
    return Promise.reject({status:500, success:false, err:"Error Services!!!"})
  }
}
