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
        subject: 'Xác thực tài khoản của bạn',
        html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> \
        <html>\
          <head>\
            <title>Xác thực tài khoản của bạn</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Chào '+ data.lastName + ' ' + data.firstName +'!</p>\
          <p>Cảm ơn bạn đã tạo tài khoản trên VirtualAgent.Theknowledge.Ai/!</p>\
          <p>Để kích hoạt tài khoản của bạn, vui lòng xác thực email bằng cách click vào nút bên dưới:</p>\
          <p> <a href="' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '&expert=1"> “Xác nhận email” </a> </p>\
          <p>Hoặc copy đường dẫn bên dưới vào trình duyệt và ấn “Enter":</p>\
          <p>' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '&expert=1</p>\
          <p>Vui lòng không trả lời email này. Nếu bạn có bất kỳ thắc mắc gì, hãy gửi email tới hello@virtualagent.theknowledge.ai</p>\
          <p>Xin cảm ơn,</p>' +
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
          <p>Thank you for signing up! We can’t wait to see you on VirtualAgent.Theknowledge.Ai!</p>\
          <p>To <b>activate your account</b>, please verify your email by clicking the button below: </p>\
          <p> <a href="' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '"> “Verify email” </a> </p>\
          <p>Or copy the link below into your browser and press “Enter”:</p>\
          <p>' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '</p><br><p>The Knowledge Team.</p>\
          <p>Please do not reply to this email. If you have any queries, please send an email to hello@virtualagent.theknowledge.ai</p>\
          <p>Thank you,</p>' +
          EMAIL_CONTACT_INFO_AGENT_PAGE +
        '</body></html>'
    }
  }
  return mailOptions;
}
// 1.  Mail đăng ký:
function getOptsMailRegistry(data) {
  let mailOptions = null;
  if(language == 'vi'){
    // if (data.type === 'registry-expert') {
    // You can use data.type: 'registry-expert' to send email to expert and another to student
      mailOptions = {
        from: serverConfig.fromMail,
        to: data.email,
        subject: 'Xác thực tài khoản của bạn',
        html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> \
        <html>\
          <head>\
            <title>Xác thực tài khoản của bạn</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Chào '+ data.lastName + ' ' + data.firstName +'!</p>\
          <p>Cảm ơn bạn đã tạo tài khoản trên TheKnowledge.Ai!</p>\
          <p>Để kích hoạt tài khoản của bạn, vui lòng xác thực email bằng cách click vào nút bên dưới:</p>\
          <p> <a href="' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '&expert=1"> “Xác nhận email” </a> </p>\
          <p>Hoặc copy đường dẫn bên dưới vào trình duyệt và ấn “Enter":</p>\
          <p>' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '&expert=1</p>\
          <p>Vui lòng không trả lời email này. Nếu bạn có bất kỳ thắc mắc gì, hãy gửi email tới Hello@theknowledge.ai</p>\
          <p>Xin cảm ơn,</p>' +
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
          <p>Thank you for signing up! We can’t wait to see you on TheKnowledge.Ai!</p>\
          <p>To <b>activate your account</b>, please verify your email by clicking the button below: </p>\
          <p> <a href="' + serverConfig.clientHttpsHost + '/confirm?tokenConfirm=' + data.token + '&cuid=' + data.cuid + '"> “Verify email” </a> </p>\
          <p>Or copy the link below into your browser and press “Enter”:</p>\
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
    subject: 'The Knowledge - Thông tin liên hệ',
    html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Thông tin liên hệ</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Họ tên: ' + data.name + '</p><p>Email: ' + data.email + '</p><p>SDT: ' + data.phone + '</p><p>Gói dịch vụ: ' + data.type + '</p><p>Yêu cầu: ' + data.content + '</p></body></html>'
  };
}
// 2. Quên mật khẩu
function getOptsMailForgotPassword(data) {
  if(language == 'vi'){
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Đặt lại mật khẩu',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Đặt lại mật khẩu</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
        <p> Chào '+ data.lastName + ' ' + data.firstName +' </p>\
        <p>Chúng tôi vừa nhận được yêu cầu đổi mật khẩu cho tài khoản của bạn trên TheKnowledge.Ai '+ data.email +'. Bạn có thể đặt lại mật khẩu của mình bằng cách click vào nút bên dưới và làm theo hướng dẫn. </p>\
        <p> <a href="' + serverConfig.clientHttpsHost + '/reset?token=' + data.token + '"> “Đặt lại mật khẩu" </a> </p>\
        <p>Nếu bạn không đưa ra yêu cầu này, hãy gửi email tới Hello@theknowledge.ai để báo cho chúng tôi.</p>\
        <p>Xin cảm ơn.</p>' +
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
          <p><a href="' + serverConfig.clientHttpsHost + '/reset?token=' + data.token + '"> “Reset your password” </a> </p>\
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
      + '</td></tr><tr> <td>Speaking:</td><td>' + data.result.speaking + '</td></tr></table> <hr/> <br/> <p> Well done! Keep up the good work and improve your skills on <a href="' + serverConfig.clientHttpsHost + '">TheKnowledge.Ai</a> </p><p> If you have any questions regarding your test results, please reply to this email. </p><br/> <hr/> <p> <strong>TheKnowledge.Ai</strong> is a live e-learning platform connecting millions of learners and educators around the world. Join <strong>TheKnowledge.Ai</strong> to get access to: </p><ul> <li><strong>Various courses</strong> in many majors to enrich your knowledge and enhance your skills</li><li>Opportunities to connect with <strong>overseas professors</strong>, <strong>experts</strong>, <strong>coaches</strong>, <strong>trainers</strong>, ...</li><li><strong>Powerful tools</strong> that help to improve your e-learning experience and your learning outcome for both 1on1 and group class.</li></ul> <br><p>Don’t hesitate! Start learning with <a href="' + serverConfig.clientHttpsHost + '">TheKnowledge.Ai</a> now!</p></body></html>'
  };
}

function getOptsMailJoinExpert(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Cảm ơn bạn đã tham gia The Knowledge!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Cảm ơn bạn đã tham gia The Knowledge</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào,</p><p>Bạn đã đăng ký thành công như là một chuyên gia trên The Knowledge với email ' + data.email + '. Bước cuối cùng, vui lòng xác nhận địa chỉ email của bạn trong liên kết dưới đây và bắt đầu. </p><a href="' + serverConfig.clientHttpsHost + '/experts?token=' + data.token + '"> Nhấp để đăng ký tài khoản chuyên gia </a><p><br><p>The Knowledge Vietam.</p><br><p>Email này không thể nhận phản hồi. Để biết thêm thông tin, vui lòng liên hệ “Hello@theknowledge.ai”</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Thank you for joining The Knowledge!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Thank you for joining The Knowledge</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hello,</p><p>You have successfully registered as an expert on The Knowledge with the email ' + data.email + '. Final step, please confirm your email address in the link below and let’s get started. </p><a href="' + serverConfig.clientHttpsHost + '/experts?token=' + data.token + '"> Click to sign up expert account </a><p><br><p>The The Knowledge team.</p><br><p>This email can\'t receive replies. For more information, please contact “Hello@theknowledge.ai”</p></body></html>'
    };
  }
}

function getOptsMailMakeAppointment(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Lịch hẹn mới trên The Knowledge (' + data.date + ')',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Ai đó cần sự giúp đỡ của bạn</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.firstNameExpert + ',</p><p>Bạn đã nhận được yêu cầu trợ giúp từ ' + data.firstName + ' ' + data.lastName + ' lúc ' + data.time + ' (' + data.timeZone + ') ' + data.date + ' .</p><p>"' + data.content + '"</p><p><a href="' + serverConfig.clientHttpsHost + '/appointment-detail/' + data.cuid + '">Chi tiết lịch hẹn</a></p><p>Theknowledge.ai</p><br><p>Email này không thể nhận phản hồi. Để biết thêm thông tin, vui lòng liên hệ “Hello@theknowledge.ai”</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'New customer appointment on The Knowledge (' + data.date + ')',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Someone need your help</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstNameExpert + ',</p><p>You\'ve received a request for a paid session from ' + data.firstName + ' ' + data.lastName + ' at ' + data.time + ' (' + data.timeZone + ') ' + data.date + ' .</p><p>"' + data.content + '"</p><p><a href="' + serverConfig.clientHttpsHost + '/appointment-detail/' + data.cuid + '">Appointment details</a></p><p>The The Knowledge team.</p><br><p>This email can\'t receive replies. For more information, please contact “Hello@theknowledge.ai”</p></body></html>'
    };
  }
}

function getOptsMailAppointmentComment(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Phản hồi mới của cuộc hẹn trên The Knowledge',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Phản hồi mới của cuộc hẹn trên The Knowledge</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.firstNameSend + ',</p><p>Bạn đã nhận được cập nhật mới cho cuộc hẹn từ ' + data.firstName + ' ' + data.lastName + '.</p><p>"' + data.content + '"</p><p><a href="' + serverConfig.clientHttpsHost + '/appointment-detail/' + data.appointment + '">Xem cập nhập</a></p><p>Theknowledge.ai</p><br><p>Email này không thể nhận phản hồi. Để biết thêm thông tin, vui lòng liên hệ “Hello@theknowledge.ai”</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'New comment appointment on The Knowledge',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>New comment appointment on The Knowledge</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstNameSend + ',</p><p>You\'ve received a new update for the appointment from ' + data.firstName + ' ' + data.lastName + '.</p><p>"' + data.content + '"</p><p><a href="' + serverConfig.clientHttpsHost + '/appointment-detail/' + data.appointment + '">View updates</a></p><p>The The Knowledge team.</p><br><p>This email can\'t receive replies. For more information, please contact “Hello@theknowledge.ai”</p></body></html>'
    };
  }
}
/*fixed 01/12*/
function getOptsMailCompleteExpert(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Bạn đã ứng tuyển trở thành giáo viên trên The Knowledge.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Bạn đã ứng tuyển trở thành giáo viên trên The Knowledge.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.firstName + ',</p>' +
        '<p>Bạn đã ứng tuyển trở thành giáo viên trên The Knowledge. Vui lòng chờ đợi để đội ngũ tuyển dụng giáo viên liên hệ cho bước tiếp theo. ' +
        '<br><p>Cảm ơn và xin chào.</p>' +
        '<br><p>The The Knowledge team.</p>' +
        '<p>Connecting Global Knowledge</p><br><p>Email này không thể nhận phản hồi. Để biết thêm thông tin, vui lòng liên hệ “Hello@theknowledge.ai”</p>' +
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
        ' or edit your profile here <a href="' + serverConfig.clientHttpsHost + '/profile/' + data.cuid + '">profile’s link</a></p>' +
        '<p>Thank you and Goodbye,</p>' +
        '<br><p>The The Knowledge team.</p><p>Connecting Global Knowledge</p><br><p>This email can\'t receive replies. For more information, please contact “Hello@theknowledge.ai”</p></body></html>'
    };
  }
}
// Khi đăng ký thành công từ học viên -> giáo viên
function getOptsMailApprovedExpert(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Bạn đã trở thành giảng viên trên TheKnowledge.Ai',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Bạn đã trở thành giảng viên trên TheKnowledge.Ai</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head>' +
        '<body><p>Chào ' + data.lastName + ' ' + data.firstName + ',</p>' +
        '<p>Xin chúc mừng! Tài khoản của bạn đã được nâng cấp thành tài khoản giảng viên! Bây giờ, bạn có thể tạo khóa học và bắt đầu chia sẻ kiến thức đến với mọi người trên TheKnowledge.Ai!' +
        '<p>Hãy xem qua trang giảng viên của bạn và điền vào vài thông tin để giới thiệu bản thân:</p>' +
        '<p> <a href="'+ serverConfig.clientHttpsHost + '/profile/' + data.cuid +'"> “Hồ sơ cá nhân” </a> </p>' +
        '<p>Vui lòng không trả lời email này. Nếu bạn có bất kỳ thắc mắc gì, hãy gửi email tới Hello@theknowledge.ai</p>' +
        '<p>Xin cảm ơn, </p>' +
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
        '<p><a href="'+ serverConfig.clientHttpsHost + '/profile/' + data.cuid +'"> “Tutor profile” </a> </p>' +
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
      subject: 'Xin lỗi! Bạn chưa thể trở thành giáo viên trên The Knowledge.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Xin lỗi! Bạn chưa thể trở thành giáo viên trên The Knowledge.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>' +
        '<p>Xin chào ' + data.firstName + ',</p><p>Xin lỗi! Bạn chưa thể trở thành giáo viên trên The Knowledge. Hãy ứng tuyển lại vào lần khác. ' +
        '<br><p>Cảm ơn và xin chào.</p>' +
        '<br><p>The The Knowledge team.</p>' +
        '<p>Connecting Global Knowledge</p><br><p>Email này không thể nhận phản hồi. Để biết thêm thông tin, vui lòng liên hệ “Hello@theknowledge.ai”</p>' +
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
        '<br><p>The The Knowledge team.</p><p>Connecting Global Knowledge</p><br><p>This email can\'t receive replies. For more information, please contact “Hello@theknowledge.ai”</p></body></html>'
    };
  }
}

/*fixed 01/12*/
function getOptsMailBanUserByAdmin(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Rất tiếc! Tài khoản của bạn đã bị khóa.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Rất tiếc! Tài khoản của bạn đã bị khóa.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.firstName + ',</p><p>Tài khoản của bạn đã bị khóa do vi phạm Điều khoản Sử dụng của chúng tôi.</p><p>Vui lòng liên hệ (<a href="https://theknowledge.ai/profile/cj0dl08pn0015kk7myjy7mz2y">Hỗ trợ The Knowledge</a>) để biết thêm chi tiết.</p><p>Theknowledge.ai</p><p>Kết nối kiến thức toàn cầu</p><br><p>Email này không thể nhận phản hồi. Để biết thêm thông tin, vui lòng liên hệ “Hello@theknowledge.ai”</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Oops! Your account has been banned.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Oops! Your account has been banned.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ',</p><p>Your account has been banned due to a violation of our Terms of Use.</p><p>Please contact (<a href="https://theknowledge.ai/profile/cj0dl08pn0015kk7myjy7mz2y">The Knowledge support profile’s</a>) for more details.</p><p>The The Knowledge team.</p><p>Connecting Global Knowledge</p><br><p>This email can\'t receive replies. For more information, please contact “Hello@theknowledge.ai”</p></body></html>'
    };
  }
}

function getOptsMailUnsetExpertByAdmin(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Xin lỗi! Tài khoản của bạn đã bị hủy bỏ là một chuyên gia.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Tài khoản của bạn đã bị hủy bỏ là một chuyên gia</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.firstName + ',</p><p>Tài khoản chuyên gia của bạn đã bị hủy do vi phạm Điều khoản Sử dụng của chúng tôi.</p><p>Vui lòng liên hệ “Hello@theknowledge.ai” để biết thêm chi tiết.</p><p>Theknowledge.ai</p><br><p>Email này không thể nhận phản hồi. Để biết thêm thông tin, vui lòng liên hệ “Hello@theknowledge.ai”</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Sorry! Your account been canceled be an expert.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Banned your account</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ',</p><p>Your account has been canceled be an expert due to our Term of Use.</p><p>Please contact “Hello@theknowledge.ai” for more detail.</p><p>The Knowledge Team.</p><br><p>This email can\'t receive replies. For more information, please contact “Hello@theknowledge.ai”</p></body></html>'
    };
  }
}

/*fixed 01/12*/
function getOptsMailUnBanUserByAdmin(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Chào mừng trở lại! Tài khoản của bạn đã được kích hoạt trở lại!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Chào mừng trở lại! Tài khoản của bạn đã được kích hoạt trở lại</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.firstName + ',</p><p>Nhờ báo cáo của bạn, Chúng tôi đã mở lại tài khoản của bạn. Chúng tôi rất xin lỗi về sự bất tiện này.</p><p>Nhấp vào đây để xem hồ sơ của bạn (<a href="' + serverConfig.clientHttpsHost + '/profile/' + data.cuid + '">hồ sơ của bạn</a>)</p><p>The Knowledge </p><p>Kết nối kiến thức toàn cầu</p><br><p>Email này không thể nhận phản hồi. Để biết thêm thông tin, vui lòng liên hệ “Hello@theknowledge.ai”</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Welcome back! Your account is back in business!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Welcome back! Your account is back in business</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ',</p><p>Thanks to your report, We have opened your account again. We are sorry for this inconvenience.</p><p>Click here to view your profile (<a href="' + serverConfig.clientHttpsHost + '/profile/' + data.cuid + '">user profile</a>)</p><p>The The Knowledge team </p><p>Connecting Global Knowledge</p><br><p>This email can\'t receive replies. For more information, please contact “Hello@theknowledge.ai”</p></body></html>'
    };
  }
}

/*fixed 01/12*/
function getOptsMailDeleteUserByAdmin(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Xin lỗi, tài khoản của bạn đã bị xóa.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Xin lỗi, tài khoản của bạn đã bị xóa.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.firstName + ',</p><p>Tài khoản của bạn đã bị xóa do vi phạm Điều khoản Sử dụng của chúng tôi.</p><p>Vui lòng liên hệ (<a href="https://theknowledge.ai/profile/cj0dl08pn0015kk7myjy7mz2y">Hỗ trợ The Knowledge</a>) để biết thêm chi tiết.</p><p>Theknowledge.ai</p><p>Kết nối kiến thức toàn cầu</p><br><p>Email này không thể nhận phản hồi. Để biết thêm thông tin, vui lòng liên hệ “Hello@theknowledge.ai”</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Oops! Your account has been deleted.',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Oops! Your account has been deleted.</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi ' + data.firstName + ',</p><p>Your account has been deleted due to a violation of our Terms of Use.</p><p>Please contact (<a href="https://theknowledge.ai/profile/cj0dl08pn0015kk7myjy7mz2y">The Knowledge support profile’s</a>) for more details.</p><p>The The Knowledge team.</p><p>Connecting Global Knowledge</p><br><p>This email can\'t receive replies. For more information, please contact “Hello@theknowledge.ai”</p></body></html>'
    };
  }
}
// 3. Mã xác nhận đổi email
function getOptsVerifyCode(data) {
  if(language == 'vi') {
    return {
      from: serverConfig.fromMail,
      to: data.email,
      subject: 'Mã xác nhận đổi email',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Mã xác nhận đổi email</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Chào ' + data.lastName + ' ' + data.firstName + ',</p>\
          <p>Hãy dùng mã bên dưới để thay đổi địa chỉ email của bạn trên TheKnowledge.Ai</p>\
          <h3>' + data.verifyCode + '</h3>\
          <p>Vui lòng không trả lời email này. Nếu bạn có bất kỳ thắc mắc gì, hãy gửi email tới Hello@theknowledge.ai</p>\
          <p>Xin cảm ơn,</p>' +
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
// 4. Admin gửi email thông báo
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
        <p>Chào ' + data.lastName + ' ' + data.firstName + ',</p>\
        <p>Admin của TheKnowledge.Ai đã gửi cho bạn một thông báo:</p>\
        <p>' + data.content + '</p>\
        <p>Vui lòng không trả lời email này. Nếu bạn có bất kỳ thắc mắc gì, hãy gửi email tới Hello@theknowledge.ai</p>\
        <p>Xin cảm ơn,</p>' +
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
          <p>You’ve got a message from TheKnowledge.Ai’s admin: </p>\
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
      subject: 'Tôi mời bạn tham gia cùng tôi trên The Knowledge!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Tôi mời bạn tham gia cùng tôi trên The Knowledge!</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Chào bạn,</p><p>Tôi sử dụng The Knowledge để chia sẻ kiến thức của tôi và kết nối với các chuyên gia toàn cầu! Sử dụng liên kết dưới đây để bắt đầu kết nối và kiếm được $2 The Knowledge credit khi bạn hoàn tất cuộc gọi video đầu tiên.</p><p><a href="' + serverConfig.clientHttpsHost + '?ref=' + data.inviteCode + '">Link mời</a></p><p>' + data.firstName + ' ' + data.lastName + '</p><p>Chúng tôi rất muốn có bạn tại The Knowledge.</p><p>Theknowledge.ai</p><br><p>Email này không thể nhận phản hồi. Để biết thêm thông tin, vui lòng liên hệ “Hello@theknowledge.ai”</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  } else {
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'I invite you to join me on The Knowledge!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>I invite you to join me on The Knowledge!</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Hi friend,</p><p>I use The Knowledge to share my knowledge and connect with global experts! Use the link below to start connecting and earn $2 in The Knowledge credit when you complete your first video call.</p><p><a href="' + serverConfig.clientHttpsHost + '?ref=' + data.inviteCode + '">Link invite</a></p><p>' + data.firstName + ' ' + data.lastName + '</p><p>We’d love to have you at The Knowledge.</p><p>The The Knowledge Team.</p><br><p>This email can\'t receive replies. For more information, please contact “Hello@theknowledge.ai”</p></body></html>'
    };
  }
}
// Đăng ký thành công khóa học
function getOptsJoinCourses(data) {
  if(language === "vi"){
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Chào mừng bạn đến với' + data.course.title,
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Chúc mừng bạn đã đăng ký thành công 1 khóa học "' + data.course.title + '" trên The Knowledge!</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Chào ' + data.lastName + ' ' + data.firstName + ',</p>\
          <p>Bạn đã đăng ký thành công vào khóa học ' + data.course.title + '. Chúng tôi rất hào hứng và mong chờ đến lúc được gặp bạn trong lớp học!</p>\
          <p>Hãy chuẩn bị cho một cuộc hành trình đầy niềm vui và kiến thức đang chờ bạn phía trước! Chúng tôi rất vui khi được giúp bạn biết thêm nhiều kiến thức thú vị trong khóa học này!</p>\
          <p>Bạn có thể xem nội dung của khóa học <a href="' + serverConfig.clientHttpsHost + '/course/' + data.course.slug + '"> tại đây </a> </p>\
          <p>Vui lòng không trả lời email này. Nếu bạn có bất kỳ thắc mắc gì, hãy gửi email tới Hello@theknowledge.ai</p>\
          <p>Xin cảm ơn,</p>'+
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
          <p>You have successfully enrolled in ' + data.course.title + '. We are all excited and can’t wait to see you in class!</p>\
          <p>Now prepare yourself for a journey full of joy and knowledge ahead! We are looking forward to helping you grow your knowledge in this course!</p>\
          <p>You can check out your course contents <a href="' + serverConfig.clientHttpsHost + '/course/' + data.course.slug + '"> here </a> </p>\
          <p>Please do not reply to this email. If you have any queries, please send an email to Hello@theknowledge.ai</p>\
          <p>Thank you, </p>' +
          EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }
}
// Khi có học viên đăng ký khóa học
function getOptsJoinCoursesToAuthor(data) {
  if(language === "vi"){
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Một học sinh đã đăng ký khóa học của bạn',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> \
      <html>\
        <head>\
          <title>Một học sinh đã đăng ký khóa học của bạn</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
        <p>Chào ' + data.lastName + ' ' + data.firstName + ',</p>\
        <p> ' + data.userBuy.lastName + ' ' + data.userBuy.firstName + ' đã đăng ký vào khóa học '+ data.course.title +' của bạn. Hãy chào đón ' + data.userBuy.lastName + ' ' + data.userBuy.firstName + ' và giúp anh ấy/cô ấy học thêm nhiều kiến thức mới nhé!</p>\
        <p>Vui lòng không trả lời email này. Nếu bạn có bất kỳ thắc mắc gì, hãy gửi email tới Hello@theknowledge.ai</p>\
        <p>Xin cảm ơn,</p>' +
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
        <p>' + data.userBuy.firstName + ' ' + data.userBuy.lastName + ' has enrolled in your ' + data.course.title + ' course. Let’s welcome ' + data.userBuy.firstName + ' ' + data.userBuy.lastName + ' to the course and help him/her enrich his/her knowledge!.</p>\
        <p>Please do not reply to this email. If you have any queries, please send an email to Hello@theknowledge.ai</p>\
        <p>Thank you,</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }
}

// Khóa học đã bắt đầu
function getOptsLiveScheduleStream(data) {
  if(language === "vi"){
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Khoá học đã bắt đầu!',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Khoá học đã bắt đầu!!</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
        <body>\
          <p>Chào ' + data.lastName + ' ' + data.firstName + ',</p>\
          <p>Khóa học '+ data.course.title +' của bạn đã bắt đầu! Click vào nút bên dưới để xem nội dung khóa học và bắt đầu học thôi!</p>\
          <p><a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '" style="background-color: #0f9755;border: none;color: white;padding: 15px 32px;text-align: center;text-decoration: none;display: inline-block;margin: 4px 2px;cursor: pointer;">Bắt đầu</a></p>\
          <p>Vui lòng không trả lời email này. Nếu bạn có bất kỳ thắc mắc gì, hãy gửi email tới Hello@theknowledge.ai</p>\
          <p>Xin cảm ơn,</p>' +
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
// Khi được admin duyệt yêu cầu tạo khóa học
function getOptsApproveCourse(data) {
  if(language === "vi"){
    return {
      from: data.firstName + ' ' + data.lastName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Khóa học của bạn đã được duyệt',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">\
      <html>\
        <head>\
          <title>Khóa học của bạn đã được duyệt</title>\
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">\
        </head>\
       <body>\
          <p>Chào ' + data.lastName + ' ' + data.firstName + ',</p>\
          <p>Khóa học '+ data.course.title +' đã được duyệt bởi admin. Bây giờ, bạn có thể bắt đầu chia sẻ những kiến thức bổ ích trong khóa học này đến với mọi người trên TheKnowledge.Ai rồi đấy! </p>\
          <p>Chúng tôi rất trân trọng những đóng góp của bạn trên TheKnowledge.Ai. Hãy tiếp tục phát huy nhé!</p>\
          <p>Vui lòng không trả lời email này. Nếu bạn có bất kỳ thắc mắc gì, hãy gửi email tới Hello@theknowledge.ai</p>\
          <p>Xin cảm ơn,</p>' +
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
      subject: 'Khóa học của bạn đã bị từ chối',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Khóa học ' + data.course.title + ' đã bị từ chối</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Chào ' + data.firstName + ' ' + data.lastName + ',</p><p>Lí do khóa học không được duyệt : <b>' + data.notes + '</b></p><br><p>The The Knowledge Team</p>' +
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
      subject: 'Đã có người mua vé hội thảo của bạn trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html><head><title>Chúc mừng bạn !<br/>' + data.firstName + ' ' + data.lastName + ' đã mua vé trong hội thảo ' + data.webinar.title + ' của bạn</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Chào ' + data.firstName + ' ' + data.lastName + ',</p><p>Hội thảo của bạn đã có thêm thành viên mới. Xem chi tiết <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '">tại đây</a></p><br><p>The The Knowledge Team</p></body></html>'
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
      subject: 'Bạn đã mua vé hội thảo thành công trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Bạn đã mua vé hội thảo thành công trên The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Chào ' + data.fullName + ',</p><p>Bạn đã mua vé hội thảo <b><i style="color: red">' + data.webinar.title + '</i></b> thành công</p>Bạn có thể xem hội thảo <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '">tại đây</a><br><p>Danh sách vé bạn đã mua: <br><ul>'+ listTicket +'</ul></p><p>The The Knowledge Team</p>' +
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
      subject: 'Chúc mừng, bạn đã đăng ký membership trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Bạn đã đăng ký membership thành công trên The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.firstName + ' ' + data.lastName + ',</p><p>Bạn đã đăng ký membership <b><i style="color: red">' + data.memberShip + '</i></b> thành công.</p>Bạn có thể xem thông tin <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '"> tại đây</a><br><p>The The Knowledge Team</p>' +
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
      subject: 'Chúc mừng, bạn đã đăng ký thành công gói học thử trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Bạn đã đăng ký gói học thử thành công trên The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.fullName + ',</p><p>Bạn đã đăng ký thành công gói học thử một ngày trên The Knowledge.</p><p>Mã kích hoạt của bạn là: <strong>' + data.code + '</strong></p>Bạn có thể kích hoạt tài khoản membership <a href="' + serverConfig.clientHttpsHost + '/active-membership' + '"> tại đây</a><br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Chúc mừng, bạn đã đăng ký thành công gói học thử trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Bạn đã đăng ký gói học thử thành công trên The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.fullName + ',</p><p>Bạn đã đăng ký thành công gói học thử một ngày trên The Knowledge.</p><p>Mã kích hoạt của bạn là: <strong>' + data.code + '</strong></p>Bạn có thể kích hoạt tài khoản membership <a href="' + serverConfig.clientHttpsHost + '/active-membership' + '"> tại đây</a><br><p>The The Knowledge Team</p></body></html>'
    };
  }
}

function getOptsMemberCodeVTCPay(data) {
  if(language === "vi"){
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Chúc mừng, bạn đã đăng ký thành công membership trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Bạn đã đăng ký thành công membership trên The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.fullName + ',</p><p>Bạn đã đăng ký thành công membership trên The Knowledge.</p><p>Mã kích hoạt của bạn là: <strong>' + data.code + '</strong></p>Bạn có thể kích hoạt tài khoản membership <a href="' + serverConfig.clientHttpsHost + '/active-membership' + '"> tại đây</a><br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Chúc mừng, bạn đã đăng ký thành công membership trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Bạn đã đăng ký thành công membership trên The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.fullName + ',</p><p>Bạn đã đăng ký thành công membership trên The Knowledge.</p><p>Mã kích hoạt của bạn là: <strong>' + data.code + '</strong></p>Bạn có thể kích hoạt tài khoản membership <a href="' + serverConfig.clientHttpsHost + '/active-membership' + '"> tại đây</a><br><p>The The Knowledge Team</p></body></html>'
    };
  }
}

function getOptsRemindRenewMemberShip(data) {
  if(language === "vi"){
    return {from: 'The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Thông báo, thời hạn membership của bạn trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Thành viên membership trên The Knowledge Inc của bạn sắp hết hạn!</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào,</p><p>Thẻ thành viên membership của bạn trên The Knowledge Inc sẽ hết hạn vào ngày ' + new Date(data.membership) + '</p>Bạn có thể gia hạn tiếp <a href="' + serverConfig.clientHttpsHost + '/' + data.url+ '"> tại đây</a><br><p>The The Knowledge Team</p>' +
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
      subject: 'Chúc mừng, bạn đã đăng ký thành công membership trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Bạn đã đăng ký thành công membership trên The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.fullName + ',</p><p>Bạn đã đăng ký thành công membership trên The Knowledge.</p>'
        + '<p>Thông tin đơn hàng: </p>'
        + '<p>- Họ tên: <b>' + data.fullName + '</b></p>'
        + '<p>- Email: <b>' + data.email + '</b></p>'
        + '<p>- Số điện thoại: <b>' + data.telephone + '</b></p>'
        + `${data.address ? '<p>- Địa chỉ nhận mã kích hoạt: <b>' + data.address + '</b></p>' : ''}`
        + '<p>- Hình thức thanh toán: <b>' + data.paymentType + '</b></p>'
        + '<p>- Trạng thái: <b>Đợi thanh toán</b></p>'
        + '<p>- Ngày đăng ký: <b>' + momentFormat(Date.now()).format('M/D/YYYY, hh:mm A') + '</b></p>' +
        '<br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: [data.email, serverConfig.emailSale],
      subject: 'Chúc mừng, bạn đã đăng ký thành công membership trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Bạn đã đăng ký thành công membership trên The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.fullName + ',</p><p>Bạn đã đăng ký thành công membership trên The Knowledge.</p>'
        + '<p>Thông tin đơn hàng: </p>'
        + '<p>- Họ tên: <b>' + data.fullName + '</b></p>'
        + '<p>- Email: <b>' + data.email + '</b></p>'
        + '<p>- Số điện thoại: <b>' + data.telephone + '</b></p>'
        + `${data.address ? '<p>- Địa chỉ nhận mã kích hoạt: <b>' + data.address + '</b></p>' : ''}`
        + '<p>- Hình thức thanh toán: <b>' + data.paymentType + '</b></p>'
        + '<p>- Trạng thái: <b>Đợi thanh toán</b></p>'
        + '<p>- Ngày đăng ký: <b>' + momentFormat(Date.now()).format('M/D/YYYY, hh:mm A') + '</b></p>' +
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
      subject: 'Chúc mừng, bạn đã thanh toán thành công đơn hàng trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Bạn đã thanh toán thành công đơn hàng trên The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.fullName + ',</p><p>Bạn đã thanh toán thành công đơn hàng trên The Knowledge.</p>'
        + '<p>Thông tin đơn hàng: </p>'
        + '<p>- Họ tên: <b>' + data.fullName + '</b></p>'
        + '<p>- Email: <b>' + data.email + '</b></p>'
        + '<p>- Số điện thoại: <b>' + data.phoneNumber + '</b></p>'
        + `${data.address ? '<p>- Địa chỉ: <b>' + data.address + '</b></p>' : ''}`
        + '<p>- Mã đơn hàng: <b>' + data.code + '</b></p>'
        + '<p>- Tổng giá trị : <b>' + data.total_payment + 'VND</b></p>'
        + '<p>- Trạng thái: <b>Đã thanh toán</b></p>'
        + '<p>- Code active : <b>' + data.codeActive + '</b></p>' +
        '<br><p>Vui lòng đăng ký tài khoản trên <a href="https://theknowledge.ai">Theknowledge.ai</a> và kích hoạt mã code <a href="https://theknowledge.ai/active-membership">Tại Đây</a></p>' +
        '<br><p>The The Knowledge Team</p>' +
        EMAIL_CONTACT_INFO +
        '</body></html>'
    };
  }else{
    return {
      from: data.fullName + ' - The Knowledge Inc <notification@theknowledge.ai>',
      to: data.email,
      subject: 'Chúc mừng, bạn đã thanh toán thành công đơn hàng trên The Knowledge Inc',
      html: '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd"> <html>' + '<head><title>Bạn đã thanh toán thành công đơn hàng trên The Knowledge Inc</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body><p>Xin chào ' + data.fullName + ',</p><p>Bạn đã thanh toán thành công đơn hàng trên The Knowledge.</p>'
        + '<p>Thông tin đơn hàng: </p>'
        + '<p>- Họ tên: <b>' + data.fullName + '</b></p>'
        + '<p>- Email: <b>' + data.email + '</b></p>'
        + '<p>- Số điện thoại: <b>' + data.phoneNumber + '</b></p>'
        + `${data.address ? '<p>- Địa chỉ: <b>' + data.address + '</b></p>' : ''}`
        + '<p>- Mã đơn hàng: <b>' + data.code + '</b></p>'
        + '<p>- Tổng giá trị : <b>' + data.total_payment + 'VND</b></p>'
        + '<p>- Trạng thái: <b>Đã thanh toán</b></p>'
        + '<p>- Code active : <b>' + data.codeActive + '</b></p>' +
        '<br><p>Vui lòng đăng ký tài khoản trên <a href="https://theknowledge.ai">Theknowledge.ai</a> và kích hoạt mã code <a href="https://theknowledge.ai/active-membership">Tại Đây</a></p>' +
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
      subject: 'Chúc mừng bạn đã đăng ký thành công tài khoản giáo viên trên The Knowledge Inc.',
      html:
      `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/1999/REC-html401-19991224/strict.dtd">
      <html>
        <head>
          <title>Chúc mừng bạn đã đăng ký thành công tài khoản giáo viên trên The Knowledge Inc.</title>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
         </head>
        <body>
          <p>Xin chào ${data.fullName}</p>
          <p>Chúc mừng bạn đã đăng ký thành công tài khoản giáo viên trên The Knowledge Inc.</p>
          <p>Bây giờ bạn đã có thể tạo khoá học và bất đầu dạy trên The Knowledge</p>
          <p>Đi đến <a href="${serverConfig.clientHttpsHost}/teacher-dashboard">trang quản lý dành cho giáo viên</a></p>
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
      type = 'theo ngày';
      break;
    case TEACHER_MEMBERSHIP_TYPE.MONTHLY:
      type = 'Theo tháng';
      break;
    case TEACHER_MEMBERSHIP_TYPE.ANNUAL:
      type = 'Theo năm';
      break;
    default:
      type = 'Theo ngày';
  }
  let subject, title, packageType;
  switch (data.packageType) {
    case TEACHER_MEMBERSHIP_PACKAGE_TYPE.ADMIN_RENEW:
      subject = 'Chúc mừng, bạn đã được admin gia hạn gói membership cho giáo viên trên The Knowledge Inc.';
      title = 'Bạn đã được admin gia hạn gói membership cho giáo viên trên The Knowledge Inc.';
      packageType = 'Admin gia hạn';
      break;
    case TEACHER_MEMBERSHIP_PACKAGE_TYPE.CENTER:
      packageType = 'Dành cho trung tâm';
      subject = 'Chúc mừng, bạn đã đăng ký thành công gói membership cho giáo viên trên The Knowledge Inc.';
      title = 'Bạn đã đăng ký thành công gói membership cho giáo viên trên The Knowledge Inc.';
      break;
    default:
      subject = 'Chúc mừng, bạn đã đăng ký thành công gói membership cho giáo viên trên The Knowledge Inc.';
      title = 'Bạn đã đăng ký thành công gói membership cho giáo viên trên The Knowledge Inc.';
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
          <p>Xin chào ${data.fullName}</p>
          <p>${title}</p>
          <p><b>Thông tin ${data.packageType === TEACHER_MEMBERSHIP_PACKAGE_TYPE.ADMIN_RENEW ? 'gói' : 'đơn hàng'}: <b></p>
          <p><b>Họ tên: </b>${data.fullName}</p>
          <p><b>Email: </b>${data.email}</p>
          <p><b>Gói: </b>${packageType}</p>
          <p><b>Loại: </b>${type}</p>
          ${data.days ? `<p> <b>Số ngày: </b>${data.days} ngày</p>` : ''}
          <p><b>Bất đầu lúc: </b>${beginTime}</p>
          <p><b>Kết thúc lúc: </b>${endTime}</p>
          ${data.total_payment ? `<p> <b>Tổng giá trị: </b>${data.total_payment} VND</p>` : ''}
          ${EMAIL_CONTACT_INFO}
        </body>
      </html>`
  };
}
