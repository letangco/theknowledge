import serverConfig from '../config';
import {checkOptionSendMail} from '../controllers/userOption.controller.js';
import momentFormat from "moment/moment";
import { EMAIL_CONTACT_INFO, TEACHER_MEMBERSHIP_TYPE, TEACHER_MEMBERSHIP_PACKAGE_TYPE, EMAIL_CONTACT_INFO_AGENT_PAGE } from '../../config/globalConstants';

let language = 'en';
export async function sendMail(data) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(serverConfig.sendgridApiKey);
  language = data.language;
  let mailOptions = await getMailOptions(data);
  // console.log(mailOptions);
  if (mailOptions && mailOptions.to && validateEmail(mailOptions.to)) {
    const msg = {
      to: mailOptions.to,
      from: mailOptions.from,
      subject: mailOptions.subject,
      html: mailOptions.html,
    };
    // console.log("Send mail :",msg);
    sgMail.send(msg);
  }
}
function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
async function getMailOptions(data) {
  let res = await checkOptionSendMail(data.data.cuid);
  if (res) {
    switch (data.type) {
      case 'registryAccountAgentPage':
        return getOptsMailRegistryAgentPage(data.data);
      case 'registryAccount':
        return getOptsMailRegistry(data.data);
      case 'forgotPassword':
        return getOptsMailForgotPassword(data.data);
      case 'resultTest':
        return getOptMailResultTest(data.data);
      case 'joinExpert':
        return getOptsMailJoinExpert(data.data);
      case 'appointment':
        return getOptsMailMakeAppointment(data.data);
      case 'appointmentComment':
        return getOptsMailAppointmentComment(data.data);
      case 'completeExpert':
        return getOptsMailCompleteExpert(data.data);
      case 'approvedExpert':
        return getOptsMailApprovedExpert(data.data);
      case 'rejectExpert':
        return getOptsMailRejectExpert(data.data);
      case 'banUserByAdmin':
        return getOptsMailBanUserByAdmin(data.data);
      case 'unBanUserByAdmin':
        return getOptsMailUnBanUserByAdmin(data.data);
      case 'unsetExpertByAdmin':
        return getOptsMailUnsetExpertByAdmin(data.data);
      case 'deleteUserByAdmin':
        return getOptsMailUnBanUserByAdmin(data.data);
      case 'sendVerifyCode':
        return getOptsVerifyCode(data.data);
      case 'adminNotification':
        return getOptsAdminNotification(data.data);
      case 'emailInvite':
        return getOptsEmailInvite(data.data);
      case "joinCourses":
        return getOptsJoinCourses(data.data);
      case "joinCoursesToAuthor":
        return getOptsJoinCoursesToAuthor(data.data);
      case "LiveScheduleStream":
        return getOptsLiveScheduleStream(data.data);
      case "approveCourse":
        return getOptsApproveCourse(data.data);
      case "rejectCourse":
        return getOptsRejectCourse(data.data);
      case 'kurentoMail':
        return getOptsKurentoSendMail(data.data);
      case 'userSentTicket':
        return getOptsuserSentTicket(data.data);
      case 'userBuyTicket':
        return getOptsuserBuyTicket(data.data);
      case 'joinMemberShip':
      case 'joinMemberShipCoupon':
        return getOptsuserJoinMemberShip(data.data);
      case 'RemindRenewMemberShip':
        return getOptsRemindRenewMemberShip(data.data);
      case 'memberCodeTrial':
        return getOptsMemberCodeTrial(data.data);
      case 'memberCodeVTCPay':
        return getOptsMemberCodeVTCPay(data.data);
      case 'transferPay':
        return getOptsMemberTransferPay(data.data);
      case 'OrderSuccess':
        return getOptsOrder(data.data);
      case 'teacherMembership':
        return getOptsTeacherMembershipOrder(data.data);
      case 'userContact':
        return getOptsUserContact(data.data);
      default:
        return null;
    }
  } else {
    switch (data.type) {
      case 'registryAccountAgentPage':
        return getOptsMailRegistryAgentPage(data.data);
      case 'registryAccount':
        return getOptsMailRegistry(data.data);
      case 'forgotPassword':
        return getOptsMailForgotPassword(data.data);
      case 'resultTest':
        return getOptMailResultTest(data.data);
      case 'joinExpert':
        return getOptsMailJoinExpert(data.data);
      case 'approvedExpert':
        return getOptsMailApprovedExpert(data.data);
      case 'banUserByAdmin':
        return getOptsMailBanUserByAdmin(data.data);
      case 'unBanUserByAdmin':
        return getOptsMailUnBanUserByAdmin(data.data);
      case 'deleteUserByAdmin':
        return getOptsMailDeleteUserByAdmin(data.data);
      case 'sendVerifyCode':
        return getOptsVerifyCode(data.data);
      case 'adminNotification':
        return getOptsAdminNotification(data.data);
      case 'emailInvite':
        return getOptsEmailInvite(data.data);
      case "joinCourses":
        return getOptsJoinCourses(data.data);
      case "joinCoursesToAuthor":
        return getOptsJoinCoursesToAuthor(data.data);
      case "LiveScheduleStream":
        return getOptsLiveScheduleStream(data.data);
      case "approveCourse":
        return getOptsApproveCourse(data.data);
      case "rejectCourse":
        return getOptsRejectCourse(data.data);
      case 'kurentoMail':
        return getOptsKurentoSendMail(data.data);
      case 'userSentTicket':
        return getOptsuserSentTicket(data.data);
      case 'userBuyTicket':
        return getOptsuserBuyTicket(data.data);
      case 'joinMemberShip':
        return getOptsuserJoinMemberShip(data.data);
      case 'RemindRenewMemberShip':
        return getOptsRemindRenewMemberShip(data.data);
      case 'memberCodeTrial':
        return getOptsMemberCodeTrial(data.data);
      case 'memberCodeVTCPay':
        return getOptsMemberCodeVTCPay(data.data);
      case 'transferPay':
        return getOptsMemberTransferPay(data.data);
      case 'OrderSuccess':
        return getOptsOrder(data.data);
      case 'teacherMembership':
        return getOptsTeacherMembershipOrder(data.data);
      case 'userContact':
        return getOptsUserContact(data.data);
      default:
        return null;
    }
  }
}

function getOptsMailRegistryAgentPage(data) {
  let mailOptions = null;
  if(language == 'vi'){
    // if (data.type === 'registry-expert') {
    // You can use data.type: 'registry-expert' to send email to expert and another to student
      mailOptions = {
        from: serverConfig.fromMailAgentPage,
        to: data.email,
        subject: 'X??c th???c t??i kho???n c???a b???n',
        html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> \
        <html>\
          <head>\
            <title>X??c th???c t??i kho???n c???a b???n</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Ch??o '+ data.lastName + ' ' + data.firstName +'!</p>\
          <p>C???m ??n b???n ???? t???o t??i kho???n tr??n VirtualAgent.Theknowledge.Ai/!</p>\
          <p>????? k??ch ho???t t??i kho???n c???a b???n, vui l??ng x??c th???c email b???ng c??ch click v??o n??t b??n d?????i:</p>\
          <p> <a href="' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '&expert=1"> ???X??c nh???n email??? </a> </p>\
          <p>Ho???c copy ???????ng d???n b??n d?????i v??o tr??nh duy???t v?? ???n ???Enter":</p>\
          <p>' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '&expert=1</p>\
          <p>Vui l??ng kh??ng tr??? l???i email n??y. N???u b???n c?? b???t k??? th???c m???c g??, h??y g???i email t???i hello@virtualagent.theknowledge.ai</p>\
          <p>Xin c???m ??n,</p>' +
          EMAIL_CONTACT_INFO_AGENT_PAGE +
        '</body></html>'
      }
  } else {
    mailOptions = {
      from: serverConfig.fromMailAgentPage,
      to: data.email,
      subject: 'Verify your account',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Verify your account</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Hello ' + data.firstName + ' ' + data.lastName + '! </p>\
          <p>Thank you for signing up! We can???t wait to see you on VirtualAgent.Theknowledge.Ai!</p>\
          <p>To <b>activate your account</b>, please verify your email by clicking the button below: </p>\
          <p> <a href="' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '"> ???Verify email??? </a> </p>\
          <p>Or copy the link below into your browser and press ???Enter???:</p>\
          <p>' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '</p><br><p>The Knowledge Team.</p>\
          <p>Please do not reply to this email. If you have any queries, please send an email to hello@virtualagent.theknowledge.ai</p>\
          <p>Thank you,</p>' +
          EMAIL_CONTACT_INFO_AGENT_PAGE +
        '</body></html>'
    }
  }
  return mailOptions;
}
// 1.  Mail ????ng k??:
function getOptsMailRegistry(data) {
  let mailOptions = null;
  if(language == 'vi'){
    // if (data.type === 'registry-expert') {
    // You can use data.type: 'registry-expert' to send email to expert and another to student
      mailOptions = {
        from: serverConfig.fromMail,
        to: data.email,
        subject: 'X??c th???c t??i kho???n c???a b???n',
        html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> \
        <html>\
          <head>\
            <title>X??c th???c t??i kho???n c???a b???n</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Ch??o '+ data.lastName + ' ' + data.firstName +'!</p>\
          <p>C???m ??n b???n ???? t???o t??i kho???n tr??n TheKnowledge.Ai!</p>\
          <p>????? k??ch ho???t t??i kho???n c???a b???n, vui l??ng x??c th???c email b???ng c??ch click v??o n??t b??n d?????i:</p>\
          <p> <a href="' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '&expert=1"> ???X??c nh???n email??? </a> </p>\
          <p>Ho???c copy ???????ng d???n b??n d?????i v??o tr??nh duy???t v?? ???n ???Enter":</p>\
          <p>' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '&expert=1</p>\
          <p>Vui l??ng kh??ng tr??? l???i email n??y. N???u b???n c?? b???t k??? th???c m???c g??, h??y g???i email t???i Hello@theknowledge.ai</p>\
          <p>Xin c???m ??n,</p>' +
          EMAIL_CONTACT_INFO +
        '</body></html>'
      }
  } else {
    mailOptions = {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Verify your account',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Verify your account</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Hello ' + data.firstName + ' ' + data.lastName + '! </p>\
          <p>Thank you for signing up! We can???t wait to see you on TheKnowledge.Ai!</p>\
          <p>To <b>activate your account</b>, please verify your email by clicking the button below: </p>\
          <p> <a href="' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '"> ???Verify email??? </a> </p>\
          <p>Or copy the link below into your browser and press ???Enter???:</p>\
          <p>' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '</p><br><p>The Knowledge Team.</p>\
          <p>Please do not reply to this email. If you have any queries, please send an email to Hello@theknowledge.ai</p>\
          <p>Thank you,</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    }
  }
  return mailOptions;
}
// supscription ?????
function getOptsUserContact(data) {
  return {
    from: data.email,
    to: serverConfig.sendMailTo,
    subject: 'The Knowledge - Th??ng tin li??n h???',
    html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Th??ng tin li??n h???</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>H??? t??n: ' + data.name + '</p><p>Email: ' + data.email + '</p><p>SDT: ' + data.phone + '</p><p>G??i d???ch v???: ' + data.type + '</p><p>Y??u c???u: ' + data.content + '</p></body></html>'
  };
}
// 2. Qu??n m???t kh???u
function getOptsMailForgotPassword(data) {
  if(language == 'vi'){
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: '?????t l???i m???t kh???u',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>?????t l???i m???t kh???u</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
        <p> Ch??o '+ data.lastName + ' ' + data.firstName +' </p>\
        <p>Ch??ng t??i v???a nh???n ???????c y??u c???u ?????i m???t kh???u cho t??i kho???n c???a b???n tr??n TheKnowledge.Ai '+ data.email +'. B???n c?? th??? ?????t l???i m???t kh???u c???a m??nh b???ng c??ch click v??o n??t b??n d?????i v?? l??m theo h?????ng d???n. </p>\
        <p> <a href="' + serverConfig.clientHttpsHost + '/reset?token=' + data.token + '"> ????????t l???i m???t kh???u" </a> </p>\
        <p>N???u b???n kh??ng ????a ra y??u c???u n??y, h??y g???i email t???i Hello@theknowledge.ai ????? b??o cho ch??ng t??i.</p>\
        <p>Xin c???m ??n.</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Reset your password',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Reset your password</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Hi ' + data.firstName + ' ' + data.lastName + ',</p>\
          <p>We have recently received a request to reset the password for your TheKnowledge.Ai account ' + data.email + '. You can reset your password by clicking the button below and follow the instructions.</p>\
          <p>You can reset your password by clicking the link below: </p>\
          <p><a href="' + serverConfig.clientHttpsHost + '/reset?token=' + data.token + '"> ???Reset your password??? </a> </p>\
          <p>If you did not make this request, please contact us at Hello@theknowledge.ai</p>\
          <p>Thank you</p>'+ 
          EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }
}

function getOptMailResultTest(data) {
  return {
    from: serverConfig.fromMail,
    to: data.email,
    subject: 'TheKnowledge.Ai - English Language Test Result',
    html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html> <head> <title>English Language Test Result!</title> <meta http-equiv="Content-Type" content="text/html; charset=utf-8"> </head> <body> <p>Subject: English Language Test Result!</p><br/> <p>Hi '
      + data.user.fullName + ', your English Language Test results are released!</p><table> <tr> <td>Name:</td><td>' + data.user.fullName + '</td></tr><tr> <td>Member Code:</td><td>TE-000039</td></tr><tr> <td>Test Date (DD/MM/YYYY):</td><td>' + data.result.updateAt + '</td></tr></table> <hr/> <strong> Your Results </strong> <hr/> <table> <tr> <td><strong>Overall:</strong></td><td><strong>' + data.result.total + '</strong></td></tr><tr> <td>Listening:</td><td>' + data.result.listening + '</td></tr><tr> <td>Reading:</td><td>1.0</td></tr><tr> <td>Writing:</td><td>' + data.result.writing
      + '</td></tr><tr> <td>Speaking:</td><td>' + data.result.speaking + '</td></tr></table> <hr/> <br/> <p> Well done! Keep up the good work and improve your skills on <a href="' + serverConfig.clientHttpsHost + '">TheKnowledge.Ai</a> </p><p> If you have any questions regarding your test results, please reply to this email. </p><br/> <hr/> <p> <strong>TheKnowledge.Ai</strong> is a live e-learning platform connecting millions of learners and educators around the world. Join <strong>TheKnowledge.Ai</strong> to get access to: </p><ul> <li><strong>Various courses</strong> in many majors to enrich your knowledge and enhance your skills</li><li>Opportunities to connect with <strong>overseas professors</strong>, <strong>experts</strong>, <strong>coaches</strong>, <strong>trainers</strong>, ...</li><li><strong>Powerful tools</strong> that help to improve your e-learning experience and your learning outcome for both 1on1 and group class.</li></ul> <br><p>Don???t hesitate! Start learning with <a href="' + serverConfig.clientHttpsHost + '">TheKnowledge.Ai</a> now!</p></body></html>'
  };
}

function getOptsMailJoinExpert(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'C???m ??n b???n ???? tham gia The Knowledge!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>C???m ??n b???n ???? tham gia The Knowledge</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o,</p><p>B???n ???? ????ng k?? th??nh c??ng nh?? l?? m???t chuy??n gia tr??n The Knowledge v???i email ' + data.email + '. B?????c cu???i c??ng, vui l??ng x??c nh???n ?????a ch??? email c???a b???n trong li??n k???t d?????i ????y v?? b???t ?????u. </p><a href="' + serverConfig.clientHttpsHost + '/experts?token=' + data.token + '"> Nh???p ????? ????ng k?? t??i kho???n chuy??n gia </a><p><br><p>The Knowledge Vietam.</p><br><p>Email n??y kh??ng th??? nh???n ph???n h???i. ????? bi???t th??m th??ng tin, vui l??ng li??n h??? ???Hello@theknowledge.ai???</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Thank you for joining The Knowledge!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Thank you for joining The Knowledge</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hello,</p><p>You have successfully registered as an expert on The Knowledge with the email ' + data.email + '. Final step, please confirm your email address in the link below and let???s get started. </p><a href="' + serverConfig.clientHttpsHost + '/experts?token=' + data.token + '"> Click to sign up expert account </a><p><br><p>The The Knowledge team.</p><br><p>This email can\'t receive replies. For more information, please contact ???Hello@theknowledge.ai???</p></body></html>'
    };
  }
}

function getOptsMailMakeAppointment(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'L???ch h???n m???i tr??n The Knowledge (' + data.date + ')',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Ai ???? c???n s??? gi??p ????? c???a b???n</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.firstNameExpert + ',</p><p>B???n ???? nh???n ???????c y??u c???u tr??? gi??p t??? ' + data.firstName + ' ' + data.lastName + ' l??c ' + data.time + ' (' + data.timeZone + ') ' + data.date + ' .</p><p>"' + data.content + '"</p><p><a href="' + serverConfig.clientHttpsHost + '/appointment-detail/' + data.cuid + '">Chi ti???t l???ch h???n</a></p><p>Theknowledge.ai</p><br><p>Email n??y kh??ng th??? nh???n ph???n h???i. ????? bi???t th??m th??ng tin, vui l??ng li??n h??? ???Hello@theknowledge.ai???</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'New customer appointment on The Knowledge (' + data.date + ')',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Someone need your help</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstNameExpert + ',</p><p>You\'ve received a request for a paid session from ' + data.firstName + ' ' + data.lastName + ' at ' + data.time + ' (' + data.timeZone + ') ' + data.date + ' .</p><p>"' + data.content + '"</p><p><a href="' + serverConfig.clientHttpsHost + '/appointment-detail/' + data.cuid + '">Appointment details</a></p><p>The The Knowledge team.</p><br><p>This email can\'t receive replies. For more information, please contact ???Hello@theknowledge.ai???</p></body></html>'
    };
  }
}

function getOptsMailAppointmentComment(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Ph???n h???i m???i c???a cu???c h???n tr??n The Knowledge',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Ph???n h???i m???i c???a cu???c h???n tr??n The Knowledge</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.firstNameSend + ',</p><p>B???n ???? nh???n ???????c c???p nh???t m???i cho cu???c h???n t??? ' + data.firstName + ' ' + data.lastName + '.</p><p>"' + data.content + '"</p><p><a href="' + serverConfig.clientHttpsHost + '/appointment-detail/' + data.appointment + '">Xem c???p nh???p</a></p><p>Theknowledge.ai</p><br><p>Email n??y kh??ng th??? nh???n ph???n h???i. ????? bi???t th??m th??ng tin, vui l??ng li??n h??? ???Hello@theknowledge.ai???</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'New comment appointment on The Knowledge',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>New comment appointment on The Knowledge</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstNameSend + ',</p><p>You\'ve received a new update for the appointment from ' + data.firstName + ' ' + data.lastName + '.</p><p>"' + data.content + '"</p><p><a href="' + serverConfig.clientHttpsHost + '/appointment-detail/' + data.appointment + '">View updates</a></p><p>The The Knowledge team.</p><br><p>This email can\'t receive replies. For more information, please contact ???Hello@theknowledge.ai???</p></body></html>'
    };
  }
}
/*fixed 01/12*/
function getOptsMailCompleteExpert(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'B???n ???? ???ng tuy???n tr??? th??nh gi??o vi??n tr??n The Knowledge.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>B???n ???? ???ng tuy???n tr??? th??nh gi??o vi??n tr??n The Knowledge.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.firstName + ',</p>' +
        '<p>B???n ???? ???ng tuy???n tr??? th??nh gi??o vi??n tr??n The Knowledge. Vui l??ng ch??? ?????i ????? ?????i ng?? tuy???n d???ng gi??o vi??n li??n h??? cho b?????c ti???p theo. ' +
        '<br><p>C???m ??n v?? xin ch??o.</p>' +
        '<br><p>The The Knowledge team.</p>' +
        '<p>Connecting Global Knowledge</p><br><p>Email n??y kh??ng th??? nh???n ph???n h???i. ????? bi???t th??m th??ng tin, vui l??ng li??n h??? ???Hello@theknowledge.ai???</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'You have completed the application to become a teacher on The Knowledge.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>You have completed the application to become a teacher on The Knowledge.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>' +
        '<p>Dear ' + data.firstName + ',</p>' +
        '<p>You have completed the application to become a teacher on The Knowledge. Please wait until our recruitment team contacts you for the next step. ' +
        'Please wait until our recruitment team contacts you for the next step. You can find more infomation at ' +
        ' <a href=http://teacher.Theknowledge.aiio/">teacher.Theknowledge.aiio</a> ' +
        ' or edit your profile here <a href="' + serverConfig.clientHttpsHost + '/profile/' + data.cuid + '">profile???s link</a></p>' +
        '<p>Thank you and Goodbye,</p>' +
        '<br><p>The The Knowledge team.</p><p>Connecting Global Knowledge</p><br><p>This email can\'t receive replies. For more information, please contact ???Hello@theknowledge.ai???</p></body></html>'
    };
  }
}
// Khi ????ng k?? th??nh c??ng t??? h???c vi??n -> gi??o vi??n
function getOptsMailApprovedExpert(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'B???n ???? tr??? th??nh gi???ng vi??n tr??n TheKnowledge.Ai',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>B???n ???? tr??? th??nh gi???ng vi??n tr??n TheKnowledge.Ai</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head>' +
        '<body><p>Ch??o ' + data.lastName + ' ' + data.firstName + ',</p>' +
        '<p>Xin ch??c m???ng! T??i kho???n c???a b???n ???? ???????c n??ng c???p th??nh t??i kho???n gi???ng vi??n! B??y gi???, b???n c?? th??? t???o kh??a h???c v?? b???t ?????u chia s??? ki???n th???c ?????n v???i m???i ng?????i tr??n TheKnowledge.Ai!' +
        '<p>H??y xem qua trang gi???ng vi??n c???a b???n v?? ??i???n v??o v??i th??ng tin ????? gi???i thi???u b???n th??n:</p>' +
        '<p> <a href="'+ serverConfig.clientHttpsHost + '/profile/' + data.cuid +'"> ???H??? s?? c?? nh??n??? </a> </p>' +
        '<p>Vui l??ng kh??ng tr??? l???i email n??y. N???u b???n c?? b???t k??? th???c m???c g??, h??y g???i email t???i Hello@theknowledge.ai</p>' +
        '<p>Xin c???m ??n, </p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'You\'ve become a tutor on TheKnowledge.Ai.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>You\'ve become a tutor on TheKnowledge.Ai.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head>' +
        '<body><p>Dear ' + data.firstName + ' ' + data.lastName + ',</p>' +
        '<p>Congratulations! Your account has been upgraded to tutor account. You can now create your course and start sharing knowledge to everyone on TheKnowledge.Ai!' +
        '<p>Take a look at your new tutor profile and fill in some information to introduce yourself: </p>' +
        '<p><a href="'+ serverConfig.clientHttpsHost + '/profile/' + data.cuid +'"> ???Tutor profile??? </a> </p>' +
        '<p>Please do not reply to this email. If you have any queries, please send an email to Hello@theknowledge.ai</p>'+
        '<p>Thank you,</p>'+
        '</body></html>'
    };
  }
}
/*fixed 01/12*/
function getOptsMailRejectExpert(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Xin l???i! B???n ch??a th??? tr??? th??nh gi??o vi??n tr??n The Knowledge.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Xin l???i! B???n ch??a th??? tr??? th??nh gi??o vi??n tr??n The Knowledge.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>' +
        '<p>Xin ch??o ' + data.firstName + ',</p><p>Xin l???i! B???n ch??a th??? tr??? th??nh gi??o vi??n tr??n The Knowledge. H??y ???ng tuy???n l???i v??o l???n kh??c. ' +
        '<br><p>C???m ??n v?? xin ch??o.</p>' +
        '<br><p>The The Knowledge team.</p>' +
        '<p>Connecting Global Knowledge</p><br><p>Email n??y kh??ng th??? nh???n ph???n h???i. ????? bi???t th??m th??ng tin, vui l??ng li??n h??? ???Hello@theknowledge.ai???</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Sorry! You can not become a teacher on The Knowledge now.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Sorry! You can not become a teacher on The Knowledge now.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>' +
        '<p>Dear ' + data.firstName + ',</p>' +
        '<p>Sorry! You can not become a teacher on The Knowledge now. Let\'s try at another time. ' +
        '<p>Thank you and Goodbye,</p>' +
        '<br><p>The The Knowledge team.</p><p>Connecting Global Knowledge</p><br><p>This email can\'t receive replies. For more information, please contact ???Hello@theknowledge.ai???</p></body></html>'
    };
  }
}

/*fixed 01/12*/
function getOptsMailBanUserByAdmin(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'R???t ti???c! T??i kho???n c???a b???n ???? b??? kh??a.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>R???t ti???c! T??i kho???n c???a b???n ???? b??? kh??a.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.firstName + ',</p><p>T??i kho???n c???a b???n ???? b??? kh??a do vi ph???m ??i???u kho???n S??? d???ng c???a ch??ng t??i.</p><p>Vui l??ng li??n h??? (<a href="https://theknowledge.ai/profile/cj0dl08pn0015kk7myjy7mz2y">H??? tr??? The Knowledge</a>) ????? bi???t th??m chi ti???t.</p><p>Theknowledge.ai</p><p>K???t n???i ki???n th???c to??n c???u</p><br><p>Email n??y kh??ng th??? nh???n ph???n h???i. ????? bi???t th??m th??ng tin, vui l??ng li??n h??? ???Hello@theknowledge.ai???</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Oops! Your account has been banned.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Oops! Your account has been banned.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ',</p><p>Your account has been banned due to a violation of our Terms of Use.</p><p>Please contact (<a href="https://theknowledge.ai/profile/cj0dl08pn0015kk7myjy7mz2y">The Knowledge support profile???s</a>) for more details.</p><p>The The Knowledge team.</p><p>Connecting Global Knowledge</p><br><p>This email can\'t receive replies. For more information, please contact ???Hello@theknowledge.ai???</p></body></html>'
    };
  }
}

function getOptsMailUnsetExpertByAdmin(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Xin l???i! T??i kho???n c???a b???n ???? b??? h???y b??? l?? m???t chuy??n gia.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>T??i kho???n c???a b???n ???? b??? h???y b??? l?? m???t chuy??n gia</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.firstName + ',</p><p>T??i kho???n chuy??n gia c???a b???n ???? b??? h???y do vi ph???m ??i???u kho???n S??? d???ng c???a ch??ng t??i.</p><p>Vui l??ng li??n h??? ???Hello@theknowledge.ai??? ????? bi???t th??m chi ti???t.</p><p>Theknowledge.ai</p><br><p>Email n??y kh??ng th??? nh???n ph???n h???i. ????? bi???t th??m th??ng tin, vui l??ng li??n h??? ???Hello@theknowledge.ai???</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Sorry! Your account been canceled be an expert.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Banned your account</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ',</p><p>Your account has been canceled be an expert due to our Term of Use.</p><p>Please contact ???Hello@theknowledge.ai??? for more detail.</p><p>The Knowledge Team.</p><br><p>This email can\'t receive replies. For more information, please contact ???Hello@theknowledge.ai???</p></body></html>'
    };
  }
}

/*fixed 01/12*/
function getOptsMailUnBanUserByAdmin(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Ch??o m???ng tr??? l???i! T??i kho???n c???a b???n ???? ???????c k??ch ho???t tr??? l???i!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Ch??o m???ng tr??? l???i! T??i kho???n c???a b???n ???? ???????c k??ch ho???t tr??? l???i</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.firstName + ',</p><p>Nh??? b??o c??o c???a b???n, Ch??ng t??i ???? m??? l???i t??i kho???n c???a b???n. Ch??ng t??i r???t xin l???i v??? s??? b???t ti???n n??y.</p><p>Nh???p v??o ????y ????? xem h??? s?? c???a b???n (<a href="' + serverConfig.clientHttpsHost + '/profile/' + data.cuid + '">h??? s?? c???a b???n</a>)</p><p>The Knowledge </p><p>K???t n???i ki???n th???c to??n c???u</p><br><p>Email n??y kh??ng th??? nh???n ph???n h???i. ????? bi???t th??m th??ng tin, vui l??ng li??n h??? ???Hello@theknowledge.ai???</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Welcome back! Your account is back in business!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Welcome back! Your account is back in business</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ',</p><p>Thanks to your report, We have opened your account again. We are sorry for this inconvenience.</p><p>Click here to view your profile (<a href="' + serverConfig.clientHttpsHost + '/profile/' + data.cuid + '">user profile</a>)</p><p>The The Knowledge team </p><p>Connecting Global Knowledge</p><br><p>This email can\'t receive replies. For more information, please contact ???Hello@theknowledge.ai???</p></body></html>'
    };
  }
}

/*fixed 01/12*/
function getOptsMailDeleteUserByAdmin(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Xin l???i, t??i kho???n c???a b???n ???? b??? x??a.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Xin l???i, t??i kho???n c???a b???n ???? b??? x??a.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.firstName + ',</p><p>T??i kho???n c???a b???n ???? b??? x??a do vi ph???m ??i???u kho???n S??? d???ng c???a ch??ng t??i.</p><p>Vui l??ng li??n h??? (<a href="https://theknowledge.ai/profile/cj0dl08pn0015kk7myjy7mz2y">H??? tr??? The Knowledge</a>) ????? bi???t th??m chi ti???t.</p><p>Theknowledge.ai</p><p>K???t n???i ki???n th???c to??n c???u</p><br><p>Email n??y kh??ng th??? nh???n ph???n h???i. ????? bi???t th??m th??ng tin, vui l??ng li??n h??? ???Hello@theknowledge.ai???</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Oops! Your account has been deleted.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Oops! Your account has been deleted.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ',</p><p>Your account has been deleted due to a violation of our Terms of Use.</p><p>Please contact (<a href="https://theknowledge.ai/profile/cj0dl08pn0015kk7myjy7mz2y">The Knowledge support profile???s</a>) for more details.</p><p>The The Knowledge team.</p><p>Connecting Global Knowledge</p><br><p>This email can\'t receive replies. For more information, please contact ???Hello@theknowledge.ai???</p></body></html>'
    };
  }
}
// 3. M?? x??c nh???n ?????i email
function getOptsVerifyCode(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'M?? x??c nh???n ?????i email',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>M?? x??c nh???n ?????i email</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Ch??o ' + data.lastName + ' ' + data.firstName + ',</p>\
          <p>H??y d??ng m?? b??n d?????i ????? thay ?????i ?????a ch??? email c???a b???n tr??n TheKnowledge.Ai</p>\
          <h3>' + data.verifyCode + '</h3>\
          <p>Vui l??ng kh??ng tr??? l???i email n??y. N???u b???n c?? b???t k??? th???c m???c g??, h??y g???i email t???i Hello@theknowledge.ai</p>\
          <p>Xin c???m ??n,</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Verification code to change email',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Verification code to change email</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Hi ' + data.firstName + ' ' + data.lastName + ',</p>\
          <p>Please use the code below to change your email address on TheKnowledge.Ai</p>\
          <h3>' + data.verifyCode + '</h3>\
          <p>Please do not reply to this email. If you have any queries, please send an email to Hello@theknowledge.ai</p>\
          <p>Thank you,</p>'+
          EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }
}
// 4. Admin g???i email th??ng b??o
function getOptsAdminNotification(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: data.subject,
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>' + data.subject + '</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
        <p>Ch??o ' + data.lastName + ' ' + data.firstName + ',</p>\
        <p>Admin c???a TheKnowledge.Ai ???? g???i cho b???n m???t th??ng b??o:</p>\
        <p>' + data.content + '</p>\
        <p>Vui l??ng kh??ng tr??? l???i email n??y. N???u b???n c?? b???t k??? th???c m???c g??, h??y g???i email t???i Hello@theknowledge.ai</p>\
        <p>Xin c???m ??n,</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: data.subject,
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>' + data.subject + '</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Hi ' + data.firstName + ' ' + data.lastName + ',</p>\
          <p>You???ve got a message from TheKnowledge.Ai???s admin: </p>\
          <p>' + data.content + '</p>\
          <p>Please do not reply to this email. If you have any queries, please send an email to Hello@theknowledge.ai</p>\
          <p>Thank you, </p>' + 
          EMAIL_CONTACT_INFO +
          '</body></html>'
    };
  }
}
function getOptsEmailInvite(data) {
  if(language == 'vi') {
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'T??i m???i b???n tham gia c??ng t??i tr??n The Knowledge!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>T??i m???i b???n tham gia c??ng t??i tr??n The Knowledge!</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Ch??o b???n,</p><p>T??i s??? d???ng The Knowledge ????? chia s??? ki???n th???c c???a t??i v?? k???t n???i v???i c??c chuy??n gia to??n c???u! S??? d???ng li??n k???t d?????i ????y ????? b???t ?????u k???t n???i v?? ki???m ???????c $2 The Knowledge credit khi b???n ho??n t???t cu???c g???i video ?????u ti??n.</p><p><a href="' + serverConfig.clientHttpsHost + '?ref=' + data.inviteCode + '">Link m???i</a></p><p>' + data.firstName + ' ' + data.lastName + '</p><p>Ch??ng t??i r???t mu???n c?? b???n t???i The Knowledge.</p><p>Theknowledge.ai</p><br><p>Email n??y kh??ng th??? nh???n ph???n h???i. ????? bi???t th??m th??ng tin, vui l??ng li??n h??? ???Hello@theknowledge.ai???</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'I invite you to join me on The Knowledge!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>I invite you to join me on The Knowledge!</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi friend,</p><p>I use The Knowledge to share my knowledge and connect with global experts! Use the link below to start connecting and earn $2 in The Knowledge credit when you complete your first video call.</p><p><a href="' + serverConfig.clientHttpsHost + '?ref=' + data.inviteCode + '">Link invite</a></p><p>' + data.firstName + ' ' + data.lastName + '</p><p>We???d love to have you at The Knowledge.</p><p>The The Knowledge Team.</p><br><p>This email can\'t receive replies. For more information, please contact ???Hello@theknowledge.ai???</p></body></html>'
    };
  }
}
// ????ng k?? th??nh c??ng kh??a h???c
function getOptsJoinCourses(data) {
  if(language === "vi"){
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Ch??o m???ng b???n ?????n v???i' + data.course.title,
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Ch??c m???ng b???n ???? ????ng k?? th??nh c??ng 1 kh??a h???c "' + data.course.title + '" tr??n The Knowledge!</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Ch??o ' + data.lastName + ' ' + data.firstName + ',</p>\
          <p>B???n ???? ????ng k?? th??nh c??ng v??o kh??a h???c ' + data.course.title + '. Ch??ng t??i r???t h??o h???ng v?? mong ch??? ?????n l??c ???????c g???p b???n trong l???p h???c!</p>\
          <p>H??y chu???n b??? cho m???t cu???c h??nh tr??nh ?????y ni???m vui v?? ki???n th???c ??ang ch??? b???n ph??a tr?????c! Ch??ng t??i r???t vui khi ???????c gi??p b???n bi???t th??m nhi???u ki???n th???c th?? v??? trong kh??a h???c n??y!</p>\
          <p>B???n c?? th??? xem n???i dung c???a kh??a h???c <a href="' + serverConfig.clientHttpsHost + '/course/' + data.course.slug + '"> t???i ????y </a> </p>\
          <p>Vui l??ng kh??ng tr??? l???i email n??y. N???u b???n c?? b???t k??? th???c m???c g??, h??y g???i email t???i Hello@theknowledge.ai</p>\
          <p>Xin c???m ??n,</p>'+
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else {
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Welcome to' + data.course.title,
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Welcome to' + data.course.title + '</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Dear ' + data.firstName + ' ' + data.lastName + ',</p>\
          <p>You have successfully enrolled in ' + data.course.title + '. We are all excited and can???t wait to see you in class!</p>\
          <p>Now prepare yourself for a journey full of joy and knowledge ahead! We are looking forward to helping you grow your knowledge in this course!</p>\
          <p>You can check out your course contents <a href="' + serverConfig.clientHttpsHost + '/course/' + data.course.slug + '"> here </a> </p>\
          <p>Please do not reply to this email. If you have any queries, please send an email to Hello@theknowledge.ai</p>\
          <p>Thank you, </p>' +
          EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }
}
// Khi c?? h???c vi??n ????ng k?? kh??a h???c
function getOptsJoinCoursesToAuthor(data) {
  if(language === "vi"){
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'M???t h???c sinh ???? ????ng k?? kh??a h???c c???a b???n',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> \
      <html>\
        <head>\
          <title>M???t h???c sinh ???? ????ng k?? kh??a h???c c???a b???n</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
        <p>Ch??o ' + data.lastName + ' ' + data.firstName + ',</p>\
        <p> ' + data.userBuy.lastName + ' ' + data.userBuy.firstName + ' ???? ????ng k?? v??o kh??a h???c '+ data.course.title +' c???a b???n. H??y ch??o ????n ' + data.userBuy.lastName + ' ' + data.userBuy.firstName + ' v?? gi??p anh ???y/c?? ???y h???c th??m nhi???u ki???n th???c m???i nh??!</p>\
        <p>Vui l??ng kh??ng tr??? l???i email n??y. N???u b???n c?? b???t k??? th???c m???c g??, h??y g???i email t???i Hello@theknowledge.ai</p>\
        <p>Xin c???m ??n,</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'A student has enrolled in your course',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>A student has enrolled in your course</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
        <p>Hi ' + data.firstName + ' ' + data.lastName + ',</p>\
        <p>' + data.userBuy.firstName + ' ' + data.userBuy.lastName + ' has enrolled in your ' + data.course.title + ' course. Let???s welcome ' + data.userBuy.firstName + ' ' + data.userBuy.lastName + ' to the course and help him/her enrich his/her knowledge!.</p>\
        <p>Please do not reply to this email. If you have any queries, please send an email to Hello@theknowledge.ai</p>\
        <p>Thank you,</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }
}

// Kh??a h???c ???? b???t ?????u
function getOptsLiveScheduleStream(data) {
  if(language === "vi"){
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Kho?? h???c ???? b???t ?????u!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Kho?? h???c ???? b???t ?????u!!</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Ch??o ' + data.lastName + ' ' + data.firstName + ',</p>\
          <p>Kh??a h???c '+ data.course.title +' c???a b???n ???? b???t ?????u! Click v??o n??t b??n d?????i ????? xem n???i dung kh??a h???c v?? b???t ?????u h???c th??i!</p>\
          <p><a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '" style="background-color: #0f9755;border: none;color: white;padding: 15px 32px;text-align: center;text-decoration: none;display: inline-block;margin: 4px 2px;cursor: pointer;">B???t ?????u</a></p>\
          <p>Vui l??ng kh??ng tr??? l???i email n??y. N???u b???n c?? b???t k??? th???c m???c g??, h??y g???i email t???i Hello@theknowledge.ai</p>\
          <p>Xin c???m ??n,</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Your course has begun!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Your course has begun!</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Hi ' + data.firstName + ' ' + data.lastName + ',</p>\
          <p>Your '+ data.course.title +' course has just begun! Click the button below to check out the course contents and start learning!</p>\
          <p><a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '" style="background-color: #0f9755;border: none;color: white;padding: 15px 32px;text-align: center;text-decoration: none;display: inline-block;margin: 4px 2px;cursor: pointer;"> Start </a></p>\
          <p>Please do not reply to this email. If you have any queries, please send an email to Hello@theknowledge.ai.</p>\
          <p>Thank you,</p>'+
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }
}
// Khi ???????c admin duy???t y??u c???u t???o kh??a h???c
function getOptsApproveCourse(data) {
  if(language === "vi"){
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Kh??a h???c c???a b???n ???? ???????c duy???t',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Kh??a h???c c???a b???n ???? ???????c duy???t</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
       <body>\
          <p>Ch??o ' + data.lastName + ' ' + data.firstName + ',</p>\
          <p>Kh??a h???c '+ data.course.title +' ???? ???????c duy???t b???i admin. B??y gi???, b???n c?? th??? b???t ?????u chia s??? nh???ng ki???n th???c b??? ??ch trong kh??a h???c n??y ?????n v???i m???i ng?????i tr??n TheKnowledge.Ai r???i ?????y! </p>\
          <p>Ch??ng t??i r???t tr??n tr???ng nh???ng ????ng g??p c???a b???n tr??n TheKnowledge.Ai. H??y ti???p t???c ph??t huy nh??!</p>\
          <p>Vui l??ng kh??ng tr??? l???i email n??y. N???u b???n c?? b???t k??? th???c m???c g??, h??y g???i email t???i Hello@theknowledge.ai</p>\
          <p>Xin c???m ??n,</p>' +
          EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Your course has been approved',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Your course has been approved</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Dear ' + data.firstName + ' ' + data.lastName + ',</p>\
          <p>Your '+ data.course.title +' course has been approved by the admin. You can now start sharing valuable knowledge in this course to everyone on TheKnowledge.Ai! </p>\
          <p>We truly appreciate your contributions on TheKnowledge.Ai. Keep up the good work!</p>\
          <p>Please do not reply to this email. If you have any queries, please send an email to Hello@theknowledge.ai.</p>\
          <p>Thank you,</p>' +
          EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }
}

function getOptsRejectCourse(data) {
  if(language === "vi"){
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Kh??a h???c c???a b???n ???? b??? t??? ch???i',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Kh??a h???c ' + data.course.title + ' ???? b??? t??? ch???i</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Ch??o ' + data.firstName + ' ' + data.lastName + ',</p><p>L?? do kh??a h???c kh??ng ???????c duy???t : <b>' + data.notes + '</b></p><br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Your course has been rejected',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Course ' + data.course.title + ' has been rejected! </title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ' ' + data.lastName + ',</p><p>Reason not approved : <b>' + data.notes + '</b></p><br><p>The The Knowledge Team</p></body></html>'
    };
  }
}

function getOptsKurentoSendMail(data) {
  return {
    from: 'The Knowledge Inc <notification@theknowledge.ai>',
    to: data.email,
    subject:'Server Kurento - have reseted',
    html:'<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Server Kurento Notification</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi Thanh_Nhan,</p><p>Server kurento have restarted in ' +new Date(Date.now())+ '</p><br><p>Error restarted: <b>' +data.content+ '</b></p><br/><p>The The Knowledge Team</p></body></html>'
  }
}

function getOptsuserSentTicket(data) {
  if(language === "vi"){
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: '???? c?? ng?????i mua v?? h???i th???o c???a b???n tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Ch??c m???ng b???n !<br/>' + data.firstName + ' ' + data.lastName + ' ???? mua v?? trong h???i th???o ' + data.webinar.title + ' c???a b???n</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Ch??o ' + data.firstName + ' ' + data.lastName + ',</p><p>H???i th???o c???a b???n ???? c?? th??m th??nh vi??n m???i. Xem chi ti???t <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '">t???i ????y</a></p><br><p>The The Knowledge Team</p></body></html>'
    };
  }else{
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Someone buys tickets to your workshop on The Knowledge!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Congratulation!<br/>' + data.firstName + ' ' + data.lastName + ' bought tickets in the workshop ' + data.webinar.title + ' your workshop</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ' ' + data.lastName + ',</p><p>Your workshop has more members. See details <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '">here</a></p><br><p>The The Knowledge Team</p></body></html>'
    };
  }
}

function getOptsuserBuyTicket(data) {
  let listTicket = data.code.map(e =>{
    return '<li>'+e+'</li>'
  });
  if(language === "vi"){
    return {
      from: data.fullName +  ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'B???n ???? mua v?? h???i th???o th??nh c??ng tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>B???n ???? mua v?? h???i th???o th??nh c??ng tr??n The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Ch??o ' + data.fullName + ',</p><p>B???n ???? mua v?? h???i th???o <b><i style="color: red">' + data.webinar.title + '</i></b> th??nh c??ng</p>B???n c?? th??? xem h???i th???o <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '">t???i ????y</a><br><p>Danh s??ch v?? b???n ???? mua: <br><ul>'+ listTicket +'</ul></p><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.fullName +  ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'You have successfully purchase a ticket on the The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>You have successfully purchased a ticket on the The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.fullName + ',</p><p>You bought a seminar ticket <b><i style="color: red">' + data.webinar.title + '</i></b> successfully</p>See webinar <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '">here</a><br><p>Your ticket: <br><ul>'+ listTicket +'</ul></p><p>The The Knowledge Team</p></body></html>'
    };
  }
}


function getOptsuserJoinMemberShip(data) {
  if(language === "vi"){
    return {from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Ch??c m???ng, b???n ???? ????ng k?? membership tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>B???n ???? ????ng k?? membership th??nh c??ng tr??n The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.firstName + ' ' + data.lastName + ',</p><p>B???n ???? ????ng k?? membership <b><i style="color: red">' + data.memberShip + '</i></b> th??nh c??ng.</p>B???n c?? th??? xem th??ng tin <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '"> t???i ????y</a><br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Congratulations! You successfully registered a membership on the The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>You have successfully purchased a membership on the The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ' ' + data.lastName + ',</p><p>You purchased a membership <b><i style="color: red">' + data.memberShip + '</i></b> successfully</p>See your membership <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '"> here</a><br><p>The The Knowledge Team</p></body></html>'
    };
  }
}

function getOptsMemberCodeTrial(data) {
  if(language === "vi"){
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Ch??c m???ng, b???n ???? ????ng k?? th??nh c??ng g??i h???c th??? tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>B???n ???? ????ng k?? g??i h???c th??? th??nh c??ng tr??n The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.fullName + ',</p><p>B???n ???? ????ng k?? th??nh c??ng g??i h???c th??? m???t ng??y tr??n The Knowledge.</p><p>M?? k??ch ho???t c???a b???n l??: <strong>' + data.code + '</strong></p>B???n c?? th??? k??ch ho???t t??i kho???n membership <a href="' + serverConfig.clientHttpsHost + '/active-membership' + '"> t???i ????y</a><br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Ch??c m???ng, b???n ???? ????ng k?? th??nh c??ng g??i h???c th??? tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>B???n ???? ????ng k?? g??i h???c th??? th??nh c??ng tr??n The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.fullName + ',</p><p>B???n ???? ????ng k?? th??nh c??ng g??i h???c th??? m???t ng??y tr??n The Knowledge.</p><p>M?? k??ch ho???t c???a b???n l??: <strong>' + data.code + '</strong></p>B???n c?? th??? k??ch ho???t t??i kho???n membership <a href="' + serverConfig.clientHttpsHost + '/active-membership' + '"> t???i ????y</a><br><p>The The Knowledge Team</p></body></html>'
    };
  }
}

function getOptsMemberCodeVTCPay(data) {
  if(language === "vi"){
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Ch??c m???ng, b???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>B???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.fullName + ',</p><p>B???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge.</p><p>M?? k??ch ho???t c???a b???n l??: <strong>' + data.code + '</strong></p>B???n c?? th??? k??ch ho???t t??i kho???n membership <a href="' + serverConfig.clientHttpsHost + '/active-membership' + '"> t???i ????y</a><br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Ch??c m???ng, b???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>B???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.fullName + ',</p><p>B???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge.</p><p>M?? k??ch ho???t c???a b???n l??: <strong>' + data.code + '</strong></p>B???n c?? th??? k??ch ho???t t??i kho???n membership <a href="' + serverConfig.clientHttpsHost + '/active-membership' + '"> t???i ????y</a><br><p>The The Knowledge Team</p></body></html>'
    };
  }
}

function getOptsRemindRenewMemberShip(data) {
  if(language === "vi"){
    return {from: 'The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Th??ng b??o, th???i h???n membership c???a b???n tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Th??nh vi??n membership tr??n The Knowledge Inc c???a b???n s???p h???t h???n!</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o,</p><p>Th??? th??nh vi??n membership c???a b???n tr??n The Knowledge Inc s??? h???t h???n v??o ng??y ' + new Date(data.membership) + '</p>B???n c?? th??? gia h???n ti???p <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '"> t???i ????y</a><br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {from:'The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Your membership membership on The Knowledge Inc is about to expire!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Your membership membership on The Knowledge Inc is about to expire!</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi,</p><p>Your membership membership card on The Knowledge Inc. will expire on ' + new Date(data.membership) + '</p>You can renew membership <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '"> here</a><br><p>The The Knowledge Team</p></body></html>'
    };
  }
}

function getOptsMemberTransferPay(data) {
  if(language === "vi"){
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: [data.email, serverConfig.emailSale],
      subject: 'Ch??c m???ng, b???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>B???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.fullName + ',</p><p>B???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge.</p>'
        + '<p>Th??ng tin ????n h??ng: </p>'
        + '<p>- H??? t??n: <b>' + data.fullName + '</b></p>'
        + '<p>- Email: <b>' + data.email + '</b></p>'
        + '<p>- S??? ??i???n tho???i: <b>' + data.telephone + '</b></p>'
        + `${data.address ? '<p>- ?????a ch??? nh???n m?? k??ch ho???t: <b>' + data.address + '</b></p>' : ''}`
        + '<p>- H??nh th???c thanh to??n: <b>' + data.paymentType + '</b></p>'
        + '<p>- Tr???ng th??i: <b>?????i thanh to??n</b></p>'
        + '<p>- Ng??y ????ng k??: <b>' + momentFormat(Date.now()).format('M/D/YYYY, hh:mm A') + '</b></p>' +
        '<br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: [data.email, serverConfig.emailSale],
      subject: 'Ch??c m???ng, b???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>B???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.fullName + ',</p><p>B???n ???? ????ng k?? th??nh c??ng membership tr??n The Knowledge.</p>'
        + '<p>Th??ng tin ????n h??ng: </p>'
        + '<p>- H??? t??n: <b>' + data.fullName + '</b></p>'
        + '<p>- Email: <b>' + data.email + '</b></p>'
        + '<p>- S??? ??i???n tho???i: <b>' + data.telephone + '</b></p>'
        + `${data.address ? '<p>- ?????a ch??? nh???n m?? k??ch ho???t: <b>' + data.address + '</b></p>' : ''}`
        + '<p>- H??nh th???c thanh to??n: <b>' + data.paymentType + '</b></p>'
        + '<p>- Tr???ng th??i: <b>?????i thanh to??n</b></p>'
        + '<p>- Ng??y ????ng k??: <b>' + momentFormat(Date.now()).format('M/D/YYYY, hh:mm A') + '</b></p>' +
        '<br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }
}

function getOptsOrder(data) {
  if(language === "vi"){
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Ch??c m???ng, b???n ???? thanh to??n th??nh c??ng ????n h??ng tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>B???n ???? thanh to??n th??nh c??ng ????n h??ng tr??n The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.fullName + ',</p><p>B???n ???? thanh to??n th??nh c??ng ????n h??ng tr??n The Knowledge.</p>'
        + '<p>Th??ng tin ????n h??ng: </p>'
        + '<p>- H??? t??n: <b>' + data.fullName + '</b></p>'
        + '<p>- Email: <b>' + data.email + '</b></p>'
        + '<p>- S??? ??i???n tho???i: <b>' + data.phoneNumber + '</b></p>'
        + `${data.address ? '<p>- ?????a ch???: <b>' + data.address + '</b></p>' : ''}`
        + '<p>- M?? ????n h??ng: <b>' + data.code + '</b></p>'
        + '<p>- T???ng gi?? tr??? : <b>' + data.total_payment + 'VND</b></p>'
        + '<p>- Tr???ng th??i: <b>???? thanh to??n</b></p>'
        + '<p>- Code active : <b>' + data.codeActive + '</b></p>' +
        '<br><p>Vui l??ng ????ng k?? t??i kho???n tr??n <a href="https://theknowledge.ai">Theknowledge.ai</a> v?? k??ch ho???t m?? code <a href="https://theknowledge.ai/active-membership">T???i ????y</a></p>' +
        '<br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Ch??c m???ng, b???n ???? thanh to??n th??nh c??ng ????n h??ng tr??n The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>B???n ???? thanh to??n th??nh c??ng ????n h??ng tr??n The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin ch??o ' + data.fullName + ',</p><p>B???n ???? thanh to??n th??nh c??ng ????n h??ng tr??n The Knowledge.</p>'
        + '<p>Th??ng tin ????n h??ng: </p>'
        + '<p>- H??? t??n: <b>' + data.fullName + '</b></p>'
        + '<p>- Email: <b>' + data.email + '</b></p>'
        + '<p>- S??? ??i???n tho???i: <b>' + data.phoneNumber + '</b></p>'
        + `${data.address ? '<p>- ?????a ch???: <b>' + data.address + '</b></p>' : ''}`
        + '<p>- M?? ????n h??ng: <b>' + data.code + '</b></p>'
        + '<p>- T???ng gi?? tr??? : <b>' + data.total_payment + 'VND</b></p>'
        + '<p>- Tr???ng th??i: <b>???? thanh to??n</b></p>'
        + '<p>- Code active : <b>' + data.codeActive + '</b></p>' +
        '<br><p>Vui l??ng ????ng k?? t??i kho???n tr??n <a href="https://theknowledge.ai">Theknowledge.ai</a> v?? k??ch ho???t m?? code <a href="https://theknowledge.ai/active-membership">T???i ????y</a></p>' +
        '<br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }
}

/**
 * @param data
 * @param data.email
 * @param data.fullName
 * @param data.packageType
 * @param data.type
 * @param data.total_payment
 * @param data.beginTime
 * @param data.endTime
 * @param data.days
 * @returns {{subject: string, from: string, html: string, to: *}}
 */
function getOptsTeacherMembershipOrder(data) {
  if (data.packageType === TEACHER_MEMBERSHIP_PACKAGE_TYPE.TEACHER) {
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Ch??c m???ng b???n ???? ????ng k?? th??nh c??ng t??i kho???n gi??o vi??n tr??n The Knowledge Inc.',
      html:
      `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">
      <html>
        <head>
          <title>Ch??c m???ng b???n ???? ????ng k?? th??nh c??ng t??i kho???n gi??o vi??n tr??n The Knowledge Inc.</title>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
         </head>
        <body>
          <p>Xin ch??o ${data.fullName}</p>
          <p>Ch??c m???ng b???n ???? ????ng k?? th??nh c??ng t??i kho???n gi??o vi??n tr??n The Knowledge Inc.</p>
          <p>B??y gi??? b???n ???? c?? th??? t???o kho?? h???c v?? b???t ?????u d???y tr??n The Knowledge</p>
          <p>??i ?????n <a href="${serverConfig.clientHttpsHost}/teacher-dashboard">trang qu???n l?? d??nh cho gi??o vi??n</a></p>
          ${EMAIL_CONTACT_INFO}
        </body>
      </html>`
    };
  }
  const beginTime = (new Date(data.beginTime)).toString();
  const endTime = (new Date(data.endTime)).toString();
  let type;
  switch (data.type) {
    case TEACHER_MEMBERSHIP_TYPE.DAILY:
      type = 'theo ng??y';
      break;
    case TEACHER_MEMBERSHIP_TYPE.MONTHLY:
      type = 'Theo th??ng';
      break;
    case TEACHER_MEMBERSHIP_TYPE.ANNUAL:
      type = 'Theo n??m';
      break;
    default:
      type = 'Theo ng??y';
  }
  let subject, title, packageType;
  switch (data.packageType) {
    case TEACHER_MEMBERSHIP_PACKAGE_TYPE.ADMIN_RENEW:
      subject = 'Ch??c m???ng, b???n ???? ???????c admin gia h???n g??i membership cho gi??o vi??n tr??n The Knowledge Inc.';
      title = 'B???n ???? ???????c admin gia h???n g??i membership cho gi??o vi??n tr??n The Knowledge Inc.';
      packageType = 'Admin gia h???n';
      break;
    case TEACHER_MEMBERSHIP_PACKAGE_TYPE.CENTER:
      packageType = 'D??nh cho trung t??m';
      subject = 'Ch??c m???ng, b???n ???? ????ng k?? th??nh c??ng g??i membership cho gi??o vi??n tr??n The Knowledge Inc.';
      title = 'B???n ???? ????ng k?? th??nh c??ng g??i membership cho gi??o vi??n tr??n The Knowledge Inc.';
      break;
    default:
      subject = 'Ch??c m???ng, b???n ???? ????ng k?? th??nh c??ng g??i membership cho gi??o vi??n tr??n The Knowledge Inc.';
      title = 'B???n ???? ????ng k?? th??nh c??ng g??i membership cho gi??o vi??n tr??n The Knowledge Inc.';
      packageType = data.packageType;
  }
  return {
    from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
    to: data.email,
    subject: subject,
    html:
      `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">
      <html>
        <head>
          <title>${title}</title>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
         </head>
        <body>
          <p>Xin ch??o ${data.fullName}</p>
          <p>${title}</p>
          <p><b>Th??ng tin ${data.packageType === TEACHER_MEMBERSHIP_PACKAGE_TYPE.ADMIN_RENEW ? 'g??i' : '????n h??ng'}: <b></p>
          <p><b>H??? t??n: </b>${data.fullName}</p>
          <p><b>Email: </b>${data.email}</p>
          <p><b>G??i: </b>${packageType}</p>
          <p><b>Lo???i: </b>${type}</p>
          ${data.days ? `<p> <b>S??? ng??y: </b>${data.days} ng??y</p>` : ''}
          <p><b>B???t ?????u l??c: </b>${beginTime}</p>
          <p><b>K???t th??c l??c: </b>${endTime}</p>
          ${data.total_payment ? `<p> <b>T???ng gi?? tr???: </b>${data.total_payment} VND</p>` : ''}
          ${EMAIL_CONTACT_INFO}
        </body>
      </html>`
  };
}
