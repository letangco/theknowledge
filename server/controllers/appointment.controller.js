import Appointment from '../models/appointment.js';
import * as AppointmentServices from '../services/appointment.services';
import AppointmentComment from '../models/appointmentComment.js';
import User from '../models/user.js';
import sanitizeHtml from 'sanitize-html';
import cuid from 'cuid';
// import {sendMail} from '../controllers/mail.controller';
import {addNotification} from './notification.controller.js';
import mongoose from 'mongoose';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';

export async function bookAppointment(req, res) {
  try{
    let from = req.user.cuid;
    let to = sanitizeHtml(req.body.expertID);
    let content = sanitizeHtml(req.body.messeger);
    let date = sanitizeHtml(req.body.date);
    let hour = sanitizeHtml(req.body.hours);
    let minute = sanitizeHtml(req.body.minutes);
    let timeZone = sanitizeHtml(req.body.timezone);
    let language = req.headers.lang;
    if(!to || !content || !date || !hour || !minute || !timeZone){
      throw {
        status: 404,
        success: false,
        err: 'Invalid element.'
      }
    }
    let options = {
      cuid:cuid(),
      userID:from,
      expertID:to,
      content:content,
      date:date,
      hour:hour,
      minute:minute,
      timeZone:timeZone
    };
    let data = await AppointmentServices.bookAppointment(options,language);

    return res.json({
      success:true,
      data:data
    })
  }catch (err) {
    res.status(err.status).json(err);
  }
}
export async function addComment(req, res) {
  try{
    let cuidAppoint = await sanitizeHtml(req.body.appointmentID);
    let content = await sanitizeHtml(req.body.content);
    let timezone = await sanitizeHtml(req.body.timezone);
    let status = await sanitizeHtml(req.body.status);
    let userReciveMail = await sanitizeHtml(req.body.userSendMail);
    let language = req.headers.lang;
    if(!cuid || !content || !timezone || !status){
      throw {
        status: 404,
        success: false,
        err: 'Invalid element.'
      }
    }
    let options = {
      cuid:cuid(),
      appointmentID:cuidAppoint,
      timezone:timezone,
      status:status,
      userID:req.user.cuid,
      content:content,
    }
    let data = await AppointmentServices.addCommentAppointment(options,userReciveMail,language);
    return res.json({
      success:true,
      data:data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
  // var result = {
  //   key: -10,
  //   value: ''
  // };
  // User.findOne({token: sanitizeHtml(req.body.userID)}).exec((err, user) => {
  //   if (err) {
  //     result.key = -2;
  //     result.message = 'System error.';
  //     res.json({result});
  //   } else {
  //     if (user) {
  //       var appointmentAdd = new AppointmentComment();
  //       appointmentAdd.cuid = cuid();
  //       appointmentAdd.appointmentID = sanitizeHtml(req.body.appointmentID);
  //       appointmentAdd.userID = sanitizeHtml(user.cuid);
  //       appointmentAdd.content = sanitizeHtml(req.body.content);
  //       appointmentAdd.timezone = sanitizeHtml(req.body.timezone);
  //       appointmentAdd.status = sanitizeHtml(req.body.status);
  //       //Comment app comment
  //       appointmentAdd.save((err) => {
  //         if (err) {
  //           result.value = 'System error.';
  //           res.json({result});
  //         } else {
  //           var dataNotify = {
  //             userID : req.body.userSendMail,
  //             userSendID : user.cuid,
  //             type : 'appointmentComment',
  //             data : {
  //               cuid : sanitizeHtml(req.body.appointmentID),
  //               content : sanitizeHtml(req.body.content)
  //             }
  //           }
  //           // addNotification(dataNotify);
  //           AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
  //           User.findOne({cuid: sanitizeHtml(req.body.userSendMail)}).exec((err, userSend) => {
  //             if (err) {
  //               result.key = -2;
  //               result.message = 'System error.';
  //               res.json({result});
  //             } else {
  //               if (userSend) {
  //                 Appointment.update({cuid: sanitizeHtml(req.body.appointmentID)}, {
  //                     $set: {status: sanitizeHtml(req.body.status)}
  //                   },
  //                   function (err, numberAffected, rawResponse) {
  //                     if (err) {
  //                       res.status(500).send(err);
  //                     }
  //                     var dataSendMail = {
  //                       type: 'appointmentComment',
  //                       language: req.headers.lang,
  //                       data: {
  //                         cuid: user.cuid,
  //                         firstName: user.firstName,
  //                         lastName: user.lastName,
  //                         email: userSend.email,
  //                         firstNameSend: userSend.firstName,
  //                         lastNameSend: userSend.lastName,
  //                         appointment: sanitizeHtml(req.body.appointmentID),
  //                         content: appointmentAdd.content
  //                       }
  //                     };
  //                     Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
  //                     // sendMail(dataSendMail);
  //                     result.key = 1;
  //                     result.value = 'Success.';
  //                     result.data = true;
  //                     res.json({result});
  //                   });
  //               } else {
  //                 result.key = -2;
  //                 result.message = 'System error.';
  //                 res.json({result});
  //               }
  //             }
  //           });
  //         }
  //       });
  //       //End comment
  //     }
  //   }
  // });
}
export async function getBookAppointments(req, res) {
  try{
    let user = await User.findOne({token:req.params.token}).lean();
    if (!user){
      return res.json({result:{
          key:-2,
          value:'',
          message:'Please check your request. Can\'t find data.'
      }});
    }
    let appointments = await Appointment.find({expertID:user.cuid}).sort({dateAdded:-1}).lean();
    let promises = appointments.map(async e =>{
      delete e.__v;
      let userId = await User.findOne({cuid:e.userID}).lean();
      if (userId){
        e.fullName = userId.fullName;
        e.userName = userId.userName;
      } else {
        e.fullName = 'User Deleted';
        e.userName = 'User Deleted';
      }
      return e;
    });
    return res.json({
      result:{
        key:1,
        value:'',
        message:'Success',
        data:await Promise.all(promises)
      }
    })
  }catch (err){
    console.log(err);
    return res.status(err.status).json({err})
  }
}

export async function getComment(req, res) {
  try{
    let cuid = req.params.cuid;
    if (!cuid){
      return res.json({result:{
          key:-2,
          value:'',
          message:'Please check your request. Can\'t find data.'
        }})
    }
    let commentAppointment = await AppointmentComment.find({appointmentID:cuid}).sort({dateAdded:-1}).lean();
    let promises = commentAppointment.map(async e =>{
      delete e.__v;
      let user = await User.findOne({cuid:e.userID}).lean();
      if (!user){
        e.fullName = 'User not exist!';
        e.userName = 'User not exist!';
      }else {
        e.fullName = user.fullName;
        e.userName = user.userName;
      }
      return e;
    });
    return res.json({
      result:{
        key:1,
        message:'Success',
        value:'',
        data:await Promise.all(promises)
      }
    })
  }catch (err){
    return res.json({
      result:{
        key:-2,
        value:'',
        message:'System error!'
      }
    })
  }
  // var result = {
  //   key: -10,
  //   value: ''
  // };
  // mongoose.connection.db.eval("getHistoryAppointment('" + req.params.cuid + "')", function (err, comments) {
  //   if (err) {
  //     result.key = -2;
  //     result.message = 'Please check your request. Can\'t find data.';
  //     res.json({result});
  //   } else {
  //     result.key = 1;
  //     result.message = 'Success';
  //     result.data = comments;
  //     res.json({result});
  //   }
  // });
}

export function getAppointment(req, res) {
  var result = {
    key: -10,
    value: ''
  };
  Appointment.findOne({cuid: req.params.cuid}).exec((err, appointment) => {
    if (err) {
      result.key = -2;
      result.message = 'System error.';
      res.json({result});
    } else {
      if (appointment) {
        result.key = 1;
        result.message = 'Success';
        result.data = appointment;
        res.json({result});
      } else {
        result.key = -1;
        result.message = 'Please check your request. Can\'t find your appointment.';
        res.json({result});
      }
    }
  });
}

export async function getMyAppointments(req, res) {
  try{
    let user = await User.findOne({token:req.params.token}).lean();
    if (!user){
      return res.json({result:{
          key:-2,
          value:'',
          message:'Please check your request. Can\'t find data.'
        }});
    }
    let appointments = await Appointment.find({userID:user.cuid}).sort({dateAdded:-1}).lean();
    let promises = appointments.map(async e =>{
      let userId = await User.findOne({cuid:e.expertID}).lean();
      if (userId){
        e.fullName = userId.fullName;
        e.userName = userId.userName;
      } else {
        e.fullName = 'User Deleted';
        e.userName = 'User Deleted';
      }
      return e;
    });
    return res.json({
      result:{
        key:1,
        value:'',
        message:'Success',
        data: await Promise.all(promises)
      }
    })
  }catch (err){
    console.log(err);
    return res.json({
      result:{
        key:-2,
        value:'',
        message:'System error!'
      }
    })
  }
}
