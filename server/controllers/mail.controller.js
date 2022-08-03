import serverConfig from '../config';
import {checkOptionSendMail} from './userOption.controller.js';
export function sendMail(data) {
  Promise.resolve(checkOptionSendMail(data.data.cuid)).then((res) => {
    if (res) {
      switch (data.type) {
        case 'registryAccount':
          sendMailRegistry(data.data);
          break;
        case 'forgotPassword':
          sendMailForgotPassword(data.data);
          break;
        case 'joinExpert':
          sendMailJoinExpert(data.data);
          break;
        case 'appointment':
          sendMailMakeAppointment(data.data);
          break;
        case 'appointmentComment':
          sendMailAppointmentComment(data.data);
          break;
        case 'approvedExpert':
          sendMailApprovedExpert(data.data);
          break;
        case 'rejectExpert':
          sendMailRejectExpert(data.data);
          break;
        case 'banUserByAdmin':
          sendMailBanUserByAdmin(data.data);
          break;
        case 'unBanUserByAdmin':
          sendMailUnBanUserByAdmin(data.data);
          break;
        case 'unsetExpertByAdmin':
          sendMailUnsetExpertByAdmin(data.data);
          break;
        case 'deleteUserByAdmin':
          sendMailDeleteUserByAdmin(data.data);
          break;
        case 'sendVerifyCode':
          sendVerifyCode(data.data);
          break;
      }
    } else {
      switch (data.type) {
        case 'registryAccount':
          sendMailRegistry(data.data);
          break;
        case 'forgotPassword':
          sendMailForgotPassword(data.data);
          break;
        case 'joinExpert':
          sendMailJoinExpert(data.data);
          break;
        case 'banUserByAdmin':
          sendMailBanUserByAdmin(data.data);
          break;
        case 'unBanUserByAdmin':
          sendMailUnBanUserByAdmin(data.data);
          break;
        case 'deleteUserByAdmin':
          sendMailDeleteUserByAdmin(data.data);
          break;
        case 'sendVerifyCode':
          sendVerifyCode(data.data);
          break;
      }
    }
  });
}
function sendMailRegistry(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  if(data.type == 'registry-expert'){
    var mailOptions={
      from: 'Tesse Inc <notification@tesse.io>',
      to : data.email,
      subject : 'Confirm your Tesse account, ' + data.firstName + ' ' + data.lastName,
      html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Confirm your Tesse account</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hello ' + data.firstName + ' ' + data.lastName + ',</p><p>Welcome to Tesse!</p><p>Please confirm your account by clicking "Confirm account". </p><a href="' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '&expert=1"> “Confirm account” </a><p>Or copy the link below to your browser and click "Enter":</p><p>' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '&expert=1</p><br><p>Tesse Team.</p><br><p>This email can\'t receive replies. For more information, please contact “support@tesse.io”</p></body></html>'
    }
  } else {
    var mailOptions={
      from: 'Tesse Inc <notification@tesse.io>',
      to : data.email,
      subject : 'Confirm your Tesse account, ' + data.firstName + ' ' + data.lastName,
      html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Confirm your Tesse account</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hello ' + data.firstName + ' ' + data.lastName + ',</p><p>Welcome to Tesse!</p><p>Please confirm your account by clicking "Confirm account". </p><a href="' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '"> “Confirm account” </a><p>Or copy the link below to your browser and click "Enter":</p><p>' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '</p><br><p>Tesse Team.</p><br><p>This email can\'t receive replies. For more information, please contact “support@tesse.io”</p></body></html>'
    }
  }

  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}
function sendMailForgotPassword(data){
  var nodemailer = require('nodemailer');
  let opts = {
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  };
  var smtpTransport = nodemailer.createTransport(opts);
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'Tesse - Forgotten password reset',
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Forgotten password reset</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Somebody (hopefully you) requested a new password for the Tesse account for ' + data.email + '. No changes have been made to your account yet.</p><p>You can reset your password by clicking the link below: </p><a href="' + serverConfig.clientHttpsHost + '/reset?token=' + data.token + '"> Reset password </a><p>If you did not request a new password, please let us know immediately by replying to this email.</p><br><p>The Tesse team</p></body></html>'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    console.log('callback ne');
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}
function sendMailJoinExpert(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'We glad you joined us on Tesse!',
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>We glad you joined us on Tesse</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hello,</p><p>You have successfully registered as an expert on Tesse with the email ' + data.email + '. Final step, please confirm your email address in the link below and let’s get started. </p><a href="' + serverConfig.clientHttpsHost + '/experts?token=' + data.token + '"> Click to sign up expert account </a><p><br><p>The Tesse team.</p></body></html>'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}
function sendMailMakeAppointment(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'New customer appointment on Tesse (' + data.date + ')',
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Someone need your help!</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstNameExpert + ',</p><p>You\'ve received a request for a paid session from ' + data.firstName + ' ' + data.lastName + ' at ' + data.time + ' (' + data.timeZone+ ') ' + data.date+ ' .</p><p>"'+data.content+'"</p><p><a href="' + serverConfig.clientHttpsHost + '/appointment-detail/' + data.cuid + '">Appointment details</a></p><p>The Tesse team.</p></body></html>'
  };
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}
function sendMailAppointmentComment(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'New comment appointment on Tesse',
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>New comment appointment on Tesse!</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstNameSend + ',</p><p>You\'ve received a new update for the appointment from ' + data.firstName + ' ' + data.lastName + '.</p><p>"'+data.content+'"</p><p><a href="' + serverConfig.clientHttpsHost + '/appointment-detail/' + data.appointment + '">View updates</a></p><p>The Tesse team.</p></body></html>'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}
function sendMailApprovedExpert(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'Congratulation, your expert profile was approved!',
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Approved expert account</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ',</p><p>Thanks you for join Tesse\'s expert community, your expert profile was approved!</p><p><a href="' + serverConfig.clientHttpsHost + '/profile/' + data.cuid + '">Continue with Tesse</a></p><p>Tesse Team.</p><br><p>This email can\'t receive replies. For more information, please contact “support@tesse.io”</p></body></html>'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}

function sendMailRejectExpert(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'Sorry! You have been rejected to be an expert on Tesse!',
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Rejected expert account</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Welcome to Tesse!</p><p>Hi ' + data.firstName + ',</p><p>You have been rejected to be an expert on Tesse.</p><p>View and update your profile here (<a href="' + serverConfig.clientHttpsHost + '/profile/' + data.cuid + '">profile’s link</a>)</p><p>Tesse Team.</p><br><p>This email can\'t receive replies. For more information, please contact “support@tesse.io”</p></body></html>'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}

function sendMailBanUserByAdmin(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'Sorry! Your account has been banned!',
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Banned your account</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Welcome to Tesse!</p><p>Hi ' + data.firstName + ',</p><p>Your account has been banned due to our Term of Use.</p><p>Please contact “support@tesse.io” for more detail.</p><p>Tesse Team.</p><br><p>This email can\'t receive replies. For more information, please contact “support@tesse.io”</p></body></html>'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}

function sendMailUnsetExpertByAdmin(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'Sorry! Your account been canceled be an expert.!',
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Banned your account</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Welcome to Tesse!</p><p>Hi ' + data.firstName + ',</p><p>Your account has been canceled be an expert due to our Term of Use.</p><p>Please contact “support@tesse.io” for more detail.</p><p>Tesse Team.</p><br><p>This email can\'t receive replies. For more information, please contact “support@tesse.io”</p></body></html>'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}

function sendMailUnBanUserByAdmin(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'Welcome back! Your account has been opened again!',
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Reopen your account</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Welcome to Tesse!</p><p>Hi ' + data.firstName + ',</p><p>Due to your report, Tesse has opened your account again, sorry for this unconvenient.</p><p>Click here to view your profile (<a href="' + serverConfig.clientHttpsHost + '/profile/' + data.cuid + '">user profile</a>)</p><p>Tesse Team.</p><br><p>This email can\'t receive replies. For more information, please contact “support@tesse.io”</p></body></html>'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}

function sendMailDeleteUserByAdmin(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'Sorry! Your account has been banned!',
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Deleted your account</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Welcome to Tesse!</p><p>Hi ' + data.firstName + ',</p><p>Your account has been banned due to our Term of Use.</p><p>Please contact “support@tesse.io” for more detail.</p><p>Tesse Team.</p><br><p>This email can\'t receive replies. For more information, please contact “support@tesse.io”</p></body></html>'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}
function sendVerifyCode(data){
  var nodemailer = require('nodemailer');
  var smtpTransport = nodemailer.createTransport({
    host: serverConfig.hostMail,
    port: serverConfig.portMail,
    auth: {
      user: serverConfig.userMail,
      pass: serverConfig.passMail
    }
  });
  var mailOptions={
    from: 'Tesse Inc <notification@tesse.io>',
    to : data.email,
    subject : 'Code verification your email, ' + data.firstName + ' ' + data.lastName,
    html : '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Code verification code your email</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ',</p><p>You has been changed your email.</p><p>Code verification: </p><p><h3>' + data.verifyCode + '<h3></p><p>Tesse Team.</p><br><p>This email can\'t receive replies. For more information, please contact “support@tesse.io”</p></body></html>'
  }
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
  });
}

export function testMail(req, res) {
  var dataSendMail = {
    type: 'forgotPassword',
    data: {
      email: 'rexviet@gmail.com',
      token: '123'
    }
  };
  sendMail(dataSendMail);
  return res.json(dataSendMail);
}
