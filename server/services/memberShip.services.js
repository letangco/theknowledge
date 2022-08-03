import Cart from '../models/historyCart.model';
import MemberShip from '../models/memberShip';
import Payment from '../models/payment';
import {checkCouponMembership} from '../services/coupon.service';
import globalConstants from '../../config/globalConstants';
import Notification from '../models/notificationNew';
import User from '../models/user';
import configs from '../config';
import { Q } from '../libs/Queue';
import StringHelper from "../util/StringHelper";
import {generateInviteCode} from "../models/functions";
import cuid from "cuid";
import Setting from "../models/setting";
import momentFormat from "moment";
import CourseCode from '../models/courseCode';
import UserToCourse from '../models/userToCourse';
import {activeCodeOrder} from "./historyCart.service";

const slack = require('slack-notify')(configs.slack.webhook);
const packageMember = {
  DATE: 'Học thử',
  THREEDATE: '3 ngày',
  MONTH: '1 tháng',
  THREEMONTH: '3 tháng',
  SIXMONTH: '6 tháng',
  YEAR: '1 năm'
};
const paymentType = {
  transferBank: 'Chuyển khoản ngân hàng',
  vtcPay: 'Thanh toán online',
  Cod: 'COD',
  QRpay: 'Momo, Zalo pay'
}
export function mathTime(data) {
  try{
    let timezone = parseInt(data.utcOffset) / 60;
    let datelive = parseInt(data.date) + (parseInt(data.hour) - timezone) * 3600000 + parseInt(data.minute) * 60 * 1000;
    return datelive;
  }catch (err){
    console.log(err);
  }
}
export async function buyMemberShip(userId, memberShip, langCode, contactInfo, affCode = '', charge = true) {
  try {
    let user = await User.findById(userId, 'balance memberShip');
    let total = configs.memberShips.value[memberShip] / configs.moneyExchangeRate[configs.memberShips.lang];
    if(charge) {
      if (user.balance < total) {
        return Promise.reject({status: 400, error: 'Not enough money.'});
      }
      let tesseBank = await User.findById(configs.tesseBank._id);

      user.balance -= total;
      await user.save();

      tesseBank.balance += total;
      await tesseBank.save();

    }
    var time = user.memberShip > Date.now() ? user.memberShip + configs.memberShipsTime[memberShip] :
      Date.now() + configs.memberShipsTime[memberShip];
    let joinMemberShip = {
      user: userId,
      memberShip: memberShip,
      type: user.memberShip ? 'renewalMemberShip' : 'joinMemberShip',
      total: total,
      time: time,
      currency: configs.currency[langCode] ? configs.currency[langCode] : 'USD',
      priceRate: configs.moneyExchangeRate[langCode] ? configs.moneyExchangeRate[langCode] : 1,
      contactInfo: contactInfo
    };
    let booked = await MemberShip.create(joinMemberShip);

    await Notification.remove({
      to:userId,
      type:"RemindRenewMemberShip"
    });
    let jobData = {type: 4, orderObject: booked};
    if (affCode){
      jobData.affCode = affCode;
      Q.create(globalConstants.jobName.CREATE_AFF_HISTORY, jobData).removeOnComplete(true).save();
    }
    await User.update({ _id: userId }, { $set: { memberShip: time } });
    // if(contactInfo &&
    //   contactInfo.inviteCode){
    //   let userInvite = await User.findOne({'inviteCode': contactInfo.inviteCode.trim(), _id: { '$ne': userId }}, 'cuid').lean();
    //   if(userInvite){
    //     activeInviteMembership(userId, userInvite._id, memberShip, configs.memberShipsTime[memberShip])
    //   }
    // }
    if(contactInfo &&
      contactInfo.inviteCode){
      let promotionInfo = await checkPromotionCode(userId, contactInfo.inviteCode);
      if(promotionInfo && promotionInfo.success){
        let userInvite = await User.findOne({'inviteCode': contactInfo.inviteCode.trim()}).lean();
        activeInviteMembership(userId, userInvite._id, memberShip, configs.memberShipsTime[memberShip], promotionInfo)
      }
    }
    Q.create(globalConstants.jobName.CREATE_PMT_HISTORY, {
      booked,
      action: 'book_membership'
    }).removeOnComplete(true).save();

    return {
      booked: booked
    }
  } catch (err) {
    console.log('err on buyMemberShip:', err);
    return Promise.reject({ status: 500, error: 'Internal error.' });
  }
 }
 // Backup function invite code: 100% membership
// export async function activeInviteMembership(sender, receiver, membership, timer){
//   let senderInfo = await User.findById(sender, 'memberShip');
//   if(senderInfo){
//     let time = senderInfo.memberShip > Date.now() ? senderInfo.memberShip + timer :
//       Date.now() + timer;
//     await User.update({ _id: sender }, { $set: { memberShip: time } });
//     await Notification.remove({
//       to:sender,
//       type:"RemindRenewMemberShip"
//     });
//     let joinMemberShip = {
//       user: sender,
//       type: 'senderInvite',
//       memberShip: membership,
//       total: 0,
//       time: time,
//       currency: '',
//       priceRate: '',
//       contactInfo: {
//         userId: receiver
//       }
//     };
//     await MemberShip.create(joinMemberShip);
//   }
//   let receiverInfo = await User.findById(receiver, 'memberShip');
//   if(receiverInfo){
//     let time = receiverInfo.memberShip > Date.now() ? receiverInfo.memberShip + timer :
//       Date.now() + timer;
//     await User.update({ _id: receiver }, { $set: { memberShip: time } });
//     await Notification.remove({
//       to:receiverInfo,
//       type:"RemindRenewMemberShip"
//     });
//     let joinMemberShip = {
//       user: receiver,
//       type: 'receiverInvite',
//       memberShip: membership,
//       total: 0,
//       time: time,
//       currency: '',
//       priceRate: '',
//       contactInfo: {
//         userId: sender
//       }
//     };
//     await MemberShip.create(joinMemberShip);
//   }
// }
export async function reportMembershipByMonth(dateStart) {
  let timeStart = new Date(dateStart).getTime()
  return  await User.find({
    '$and': [
      {memberShip: {$gt : timeStart}}
    ]
  }, '_id').lean()
}
export async function activeInviteMembership(sender, receiver, membership, timer, promotion = {}){

  if(promotion && promotion.userReceive !== 'buyer'){
    if(promotion.type === 'percent'){
      timer = parseInt(timer * parseInt(promotion.value) / 100);
    } else {
      timer = parseInt(promotion.value) * 24*60*60*1000;
    }
    let senderInfo = await User.findById(sender, 'memberShip');
    if(senderInfo){
      let time = senderInfo.memberShip > Date.now() ? senderInfo.memberShip + timer :
        Date.now() + timer;
      await User.update({ _id: sender }, { $set: { memberShip: time } });
      await Notification.remove({
        to:sender,
        type:"RemindRenewMemberShip"
      });
      let joinMemberShip = {
        user: sender,
        type: 'senderInvite',
        memberShip: membership,
        total: 0,
        time: time,
        currency: '',
        priceRate: '',
        contactInfo: {
          userId: receiver
        }
      };
      await MemberShip.create(joinMemberShip);
    }
  }
  if(promotion && promotion.userReceive !== 'inviter') {
    let receiverInfo = await User.findById(receiver, 'memberShip');
    if (receiverInfo) {
      let time = receiverInfo.memberShip > Date.now() ? receiverInfo.memberShip + timer :
        Date.now() + timer;
      await User.update({_id: receiver}, {$set: {memberShip: time}});
      await Notification.remove({
        to: receiverInfo,
        type: "RemindRenewMemberShip"
      });
      let joinMemberShip = {
        user: receiver,
        type: 'receiverInvite',
        memberShip: membership,
        total: 0,
        time: time,
        currency: '',
        priceRate: '',
        contactInfo: {
          userId: sender
        }
      };
      await MemberShip.create(joinMemberShip);
    }
  }
}
export async function activeMembershipByCode(userId, code, langCode, inviteCode = '') {
  try {
    let user = await User.findById(userId, 'telephone email cuid memberShip');
    if(!user){
      return {status: 400, error: 'USER_NOT_FOUND'};
    }
    if(code.length === 10){
      let couponInfo = await checkCouponMembership(code, user);
      if(couponInfo && couponInfo.next === false){
        return couponInfo.booked ? {
          booked: couponInfo.booked
        } : couponInfo;
      }
      let paymentData = await Payment.findOne({memberCode: code});
      if(!paymentData){
        return {status: 400, error: 'CODE_NOT_FOUND'};
      }
      if(paymentData.status === 1){
        return {status: 400, error: 'CODE_USED'};
      }
      if(paymentData.status === -1){
        return {status: 400, error: 'CODE_NOT_FOUND'};
      }
      if(paymentData.paymentInfo && paymentData.paymentInfo.type === 'course'){
        paymentData.user_id = userId;
        Q.create(globalConstants.jobName.JOIN_COURSE_AFTER_PAY, paymentData).removeOnComplete(true).save();
        return {status: 400, error: 'CODE_NOT_FOUND'};
      }
      if(!paymentData.paymentInfo ||
        !paymentData.paymentInfo.data ||
        !paymentData.paymentInfo.data.memberShip ||
        !paymentData.paymentInfo.data.memberShip.key){
        return {status: 400, error: 'PAYMENT_ERROR'};
      }
      let memberShip = paymentData.paymentInfo.data.memberShip.key;
      let time = user.memberShip > Date.now() ? user.memberShip + configs.memberShipsTime[memberShip] :
        Date.now() + configs.memberShipsTime[memberShip];
      let total = configs.memberShips.value[memberShip] / configs.moneyExchangeRate[configs.memberShips.lang];
      let joinMemberShip = {
        user: userId,
        type: user.memberShip ? 'renewalMemberShip' : 'joinMemberShip',
        memberShip: memberShip,
        total: total,
        time: time,
        currency: configs.currency[langCode] ? configs.currency[langCode] : 'USD',
        priceRate: configs.moneyExchangeRate[langCode] ? configs.moneyExchangeRate[langCode] : 1,
        contactInfo: paymentData.paymentInfo.data.memberShip.contactInfo
      };
      let booked = await MemberShip.create(joinMemberShip);
      await Notification.remove({
        to:userId,
        type:"RemindRenewMemberShip"
      });
      if(booked){
        paymentData.status = 1;
        paymentData.userId = user.cuid;
        paymentData.save();
      }
      let jobData = {type: 4, orderObject: booked};
      if (paymentData.affCode){
        jobData.affCode = paymentData.affCode;
        Q.create(globalConstants.jobName.CREATE_AFF_HISTORY, jobData).removeOnComplete(true).save();
      }
      await User.update({ _id: userId }, { $set: { memberShip: time } });
      let paymentInfo = paymentData.paymentInfo;
      if(!inviteCode){
        if(paymentInfo &&
          paymentInfo.data &&
          paymentInfo.data.contactInfo &&
          paymentInfo.data.contactInfo.inviteCode){
          inviteCode = paymentInfo.data.contactInfo.inviteCode;
        }
      }
      if(inviteCode){
        let promotionInfo = await checkPromotionCode(userId, inviteCode);
        if(promotionInfo && promotionInfo.success){
          await Payment.update({_id: paymentData._id}, {$set: {'paymentInfo.data.contactInfo.inviteCode': inviteCode}});
          let userInvite = await User.findOne({'inviteCode': inviteCode.trim()}).lean();
          activeInviteMembership(userId, userInvite._id, memberShip, configs.memberShipsTime[memberShip], promotionInfo)
        } else {
          await Payment.update({_id: paymentData._id}, {$set: {'paymentInfo.data.contactInfo.inviteCode': ''}})
        }
      }
      return {
        type: 'membership',
        booked: booked
      }
    }
    if(code.length === 6){
      let check_code = await CourseCode.findOne({code}).lean();
      if(!check_code){
        return {status: 400, error:'CODE_COURSE_NOT_FOUND'}
      }
      if(check_code.userUsedId){
        return {status: 400, error:'CODE_COURSE_HAVE_USED'}
      }
      await CourseCode.update({
        _id: check_code._id
      },{
        $set:{
          userUsedId: userId,
          info_contact : {
            numberPhone: user.telephone || '',
            email: user.email || ''
          },
          usedDate: Date.now()
        }
      });
      let courses = check_code.courseId;
      if(courses && !Array.isArray(courses)){
        courses = [courses]
      }
      let promise = courses.map(async e => {
        let check_user = await UserToCourse.findOne({
          user: userId,
          course: e
        });
        if(!check_user){
          await UserToCourse.create({
            user: userId,
            course: e
          });
          Q.create(globalConstants.jobName.AFTER_JOIN_COURSE, {
            course: e,
            user: userId
          }).removeOnComplete(true).save();
        }
      });
      await Promise.all(promise);
      return check_code;
    }
    if(code.length === 14) {
      let check = await Cart.findOne({codeActive: code}).lean();
      if (!check) {
        return {status: 400, error:'CODE_ORDER_NOT_FOUND'}
      }
      if (check.status !== 2) {
        return {status: 400, error:'ORDER_NOT_YET_PAYMENT'}
      }
      let data = await activeCodeOrder(userId, code);
      return data;
    }
  } catch (err) {
    console.log('err on activeMembershipByCode:', err);
    return Promise.reject({ status: 500, error: 'Internal error.' });
  }
}

export async function checkMemberShip(memberShip, user, rate, currency) {
  try {
    let langDefault = configs.memberShips.lang;
    let balance = 0, valueText = 0;
    if (currency === 'VND') {
      balance = Math.round(user.balance * rate)
      valueText = memberShip
    } else {
      balance = StringHelper.roundNumber(user.balance * rate, 2, true);
      valueText = StringHelper.roundNumber(memberShip / configs.moneyExchangeRate[langDefault], 2, true);
    }

    let data = {};
    if (valueText > balance) {
      data.buyAble = false;
      data.missing = valueText - balance;
    } else {
      data.buyAble = true;
    }
    if (!data.buyAble && data.missing) {
      if (currency == 'USD' && data.missing < 0.5) {
        data.missing = 0.5
      }
      if (currency == 'VND' && data.missing < 10000) {
        data.missing = 10000
      }
    }
    data.balance = balance;
    data.currency = currency;
    return data;
  } catch (err) {
    console.log('err on checkMemberShip:', err);
    return Promise.reject({ status: 500, error: 'Internal error.' });
  }

}

export async function checkResTrialMembership(memberShip, email) {
  try {
    let info = await Payment.findOne({'paymentInfo.data.memberShip.key': memberShip, 'paymentInfo.data.contactInfo.email': email}).lean()
    if(info){
      return false
    }
    return true
  } catch (err) {
    console.log('err on checkMemberShip:', err);
    return Promise.reject({ status: 500, error: 'Internal error.' });
  }

}
export async function sendCodeTrialToEmail(memberShip, contact, user) {
  try {
    const newPayment = new Payment();
    newPayment.cuid = cuid();
    newPayment.userId = user ? user.cuid : '';
    newPayment.paymentType = 'MemberShipTrial';
    newPayment.currency = {};
    newPayment.paymentInfo = {
      data: {
        contactInfo : contact,
        memberShip: {
          "currency" : "VND",
          "valueTextDefault" : 0,
          "valueText" : 0,
          "valueDefault" : 0,
          "value" : 0,
          "key" : memberShip
        }
      },
      type: "memberShip",
      status: -3,
      amount: 0
    }
    newPayment.memberCode = await generateInviteCode(10);
    let payment = await newPayment.save();
    if(!payment)
      return false;
    var dataSendMail = {
      type: 'memberCodeTrial',
      language: 'vi',
      data: {
        fullName: contact.fullName,
        email: contact.email,
        code: payment.memberCode
      }
    };
    Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
    return true
  } catch (err) {
    console.log('err on checkMemberShip:', err);
    return Promise.reject({ status: 500, error: 'Internal error.' });
  }

}

async function appendInfoForMember(members) {
  return Promise.all(members.map(async (member) => {
    return { ...member, user: await User.findOne({ cuid: member.userId }, '_id cuid fullName').lean() }
  }));
}

export async function queryMembership(paymentType, status, options) {

  const query = {
    'paymentInfo.type': 'memberShip'
  };

  if (status !== null){
    query.status = status;
  }

  if (paymentType !== null){
    query.paymentType = paymentType;
  }

  let [members, totalItems] = await Promise.all([
    Payment.find(query).sort({ dateAdded: -1 }).skip(options.skip).limit(options.limit).lean(),
    Payment.count(query)
  ]);

  const membersWithInfo = await appendInfoForMember(members);

  return Promise.resolve({ members: membersWithInfo, totalItems });
}

export async function searchMembership(searchText) {
  const members = await Payment.find({
    $and: [ {$or: [
      {'paymentInfo.data.contactInfo.fullName': { $regex: searchText, $options: 'gi' }},
      {'paymentInfo.data.contactInfo.phoneNumber': { $regex: searchText, $options: 'gi' }},
      {'paymentInfo.data.contactInfo.email': { $regex: searchText, $options: 'gi' }},
      {'memberCode': { $regex: searchText, $options: 'gi' }}
    ]}, {'paymentInfo.type': 'memberShip'}]
  }).sort({ dateAdded: -1 }).limit(30).lean();

  return appendInfoForMember(members);
}
export async function updateStatus(options) {
  let payment = await Payment.findById(options.paymentId);
  if (!payment){
    return Promise.reject({success:false, status:400, error:'Payment not found!'});
  }
  if(payment.status === 1){
    let user = await User.findOne({cuid:payment.userId});
    if (user){
      let time = 0;
      switch (payment.paymentInfo.data.memberShip.key){
        case "DATE":
          time = configs.memberShipsTime.DATE;
          break;
        case "WEEK":
          time = configs.memberShipsTime.WEEK;
          break;
        case "MONTH":
          time = configs.memberShipsTime.MONTH;
          break;
        case "THREEMONTH":
          time = configs.memberShipsTime.THREEMONTH;
          break;
        case "SIXMONTH":
          time = configs.memberShipsTime.SIXMONTH;
          break;
        case "YEAR":
          time = configs.memberShipsTime.YEAR;
          break;
        default:
          break;
      }
      user.memberShip = user.memberShip - time;
      await user.save();
    }
  }
  payment.status = options.status;
  return await payment.save();
}
/*Create code membership when user not login pay with VTCpay*/
export async function generalCode(options) {
  let payment = await Payment.findById(options.paymentId);
  if (!payment){
    return Promise.reject({success:false, status:400, error:'Payment not found!'});
  }
  if (payment.memberCode ){
    return Promise.reject({success:false, status:400, error:'Code membership is exist'});
  }
  payment.memberCode = await  generateInviteCode(10);
  return await payment.save();
}
export async function activeMembership(options) {
  try{
    let payment = await Payment.findById(options.paymentId);
    if (!payment){
      return Promise.reject({success:false, status:400, error:'Payment not found!'});
    }
    let user = await User.findOne({cuid:payment.userId});
    if (!user){
      return Promise.reject({success:false, status:400, error:'User not found!'});
    }
    let time = user.memberShip > Date.now() ? user.memberShip : Date.now();
    switch (payment.paymentInfo.data.memberShip.key){
      case "DATE":
        time += configs.memberShipsTime.DATE;
        break;
      case "WEEK":
        time += configs.memberShipsTime.WEEK;
        break;
      case "MONTH":
        time += configs.memberShipsTime.MONTH;
        break;
      case "THREEMONTH":
        time += configs.memberShipsTime.THREEMONTH;
        break;
      case "SIXMONTH":
        time += configs.memberShipsTime.SIXMONTH;
        break;
      case "YEAR":
        time += configs.memberShipsTime.YEAR;
        break;
      default:
        break;
    }
    let membership = {
      user:user._id,
      type: user.memberShip ? 'renewalMemberShip' : 'joinMemberShip',
      memberShip:payment.paymentInfo.data.memberShip.key,
      time,
      contactInfo:payment.paymentInfo.data.memberShip.contactInfo,
      priceRate:payment.currency.rate,
      currency:payment.currency.currency,
      total:payment.currency.currency === 'VND' ? payment.paymentInfo.data.memberShip.value / 23000 : payment.paymentInfo.data.memberShip.value
    };
    let memberShip = payment.paymentInfo.data.memberShip.key;
    let data = await MemberShip.create(membership);
    user.memberShip = time;
    await user.save();
    payment.status = 1;
    await payment.save();
    if(payment.paymentInfo &&
      payment.paymentInfo.data &&
      payment.paymentInfo.data.contactInfo &&
      payment.paymentInfo.data.contactInfo.inviteCode){
      let inviteCode = payment.paymentInfo.data.contactInfo.inviteCode;
      let promotionInfo = await checkPromotionCode(user._id, inviteCode);
      if(promotionInfo && promotionInfo.success){
        let userInvite = await User.findOne({'inviteCode': inviteCode.trim()}).lean();
        activeInviteMembership(user._id, userInvite._id, memberShip, configs.memberShipsTime[memberShip], promotionInfo)
      } else {
        await Payment.update({_id: payment._id}, {$set: {'paymentInfo.data.contactInfo.inviteCode': ''}})
      }
    }
    // if(payment.paymentInfo &&
    //   payment.paymentInfo.data &&
    //   payment.paymentInfo.data.contactInfo &&
    //   payment.paymentInfo.data.contactInfo.inviteCode){
    //   let userInvite = await User.findOne({'inviteCode': payment.paymentInfo.data.contactInfo.inviteCode.trim(), _id: { '$ne': user._id }}, 'cuid memberShip').lean();
    //   if(userInvite && userInvite.memberShip > new Date().getTime() + 14*24*60*60*1000){
    //     activeInviteMembership(user._id, userInvite._id, payment.paymentInfo.data.memberShip.key, configs.memberShipsTime[payment.paymentInfo.data.memberShip.key])
    //   }
    // }
    let jobData = {type: 4, orderObject: data};
    if (payment.affCode){
      jobData.affCode = payment.affCode;
      Q.create(globalConstants.jobName.CREATE_AFF_HISTORY, jobData).removeOnComplete(true).save();
    }
    return data;
  }catch (err){
    console.log('err activeMembership : ',err);
    return Promise.reject({status:500, success:false, error:"Error!!"});
  }
}

export async function activeMemberShipSchedule(options) {
  try{
    let user = await User.findById(options.userId,'_id cuid fullName memberShip');
    if (!user){
      return Promise.reject({status:400, success:false, error:'User not found'})
    }
    let time = user.memberShip > Date.now() ? user.memberShip : Date.now();
    time += options.days*24*60*60*1000;
    user.memberShip = time;
    await user.save();
    let membership = {
      user:user._id,
      type: 'adminActive',
      memberShip:"ADMIN_ACTIVE",
      time,
      days_active:options.days
    };
    return await MemberShip.create(membership);
  }catch (err){
    console.log('err activeMemberShipSchedule : ',err);
    return Promise.reject({status:500, success:false, error:"Error!!"});
  }
}
export async function checkPromotion(code, user) {
  try {
    let info = await Setting.findOne({'type': 'promotion'}, 'data').lean();
    let promotion = info.data;
    if (!promotion || promotion.status === 'disabled') {
      return Promise.reject({success: false, status:400, error: 'NOTE_FOUND'});
    }
    if (parseInt(promotion.expireDate) && new Date(promotion.expireDate).getTime() < new Date().getTime()) {
      return Promise.reject({success: false, status:400, error: 'EXPIRED'});
    }
    let userInfo = await User.findOne({inviteCode: code}).lean();
    if(!userInfo){
      return Promise.reject({success: false, status:400, error: 'USER_NOT_FOUND'});
    }
    if(user && user.toString() === userInfo._id.toString()){
      return Promise.reject({success: false, status:400, error: 'CODE_YOURSELF'});
    }
    if(promotion.userGroup === 'allMemberShip'){
      if(!userInfo.memberShip){
        return Promise.reject({success: false, status:400, error: 'USER_NOT_MEMBERSHIP'});
      }
    }
    if(promotion.userGroup === 'activeMemberShip'){
      if(!userInfo.memberShip || parseInt(userInfo.memberShip) < new Date().getTime()){
        return Promise.reject({success: false, status:400, error: 'USER_EXPIRED_MEMBERSHIP'});
      }
    }
    return {
      userReceive: promotion.userReceive,
      type: promotion.type,
      value: promotion.type === 'time' ? promotion.timeValue : promotion.percentValue,
    }
  }catch (err){
    console.log('err checkPromotion : ',err);
    return Promise.reject({status:500, success:false, error:"Error!!"});
  }
}
export async function checkPromotionCode(user, code) {
  try {
    let info = await Setting.findOne({'type': 'promotion'}, 'data').lean();
    let promotion = info.data;
    if (!promotion || promotion.status === 'disabled') {
      return {success: false, error: 'NOTE_FOUND'}
    }
    if (parseInt(promotion.expireDate) && new Date(promotion.expireDate).getTime() < new Date().getTime()) {
      return {success: false,  error: 'EXPIRED'};
    }
    let userInfo = await User.findOne({inviteCode: code}).lean();
    if(!userInfo){
      return {success: false, error: 'USER_NOT_FOUND'}
    }
    if(user && user.toString() === userInfo._id.toString()){
      return{success: false, error: 'CODE_YOURSELF'}
    }
    if(promotion.userGroup === 'allMemberShip'){
      if(!userInfo.memberShip){
        return {success: false, error: 'USER_NOT_MEMBERSHIP'}
      }
    }
    if(promotion.userGroup === 'activeMemberShip'){
      if(!userInfo.memberShip || parseInt(userInfo.memberShip) < new Date().getTime()){
        return {success: false, error: 'USER_EXPIRED_MEMBERSHIP'}
      }
    }
    return {
      success: true,
      userReceive: promotion.userReceive,
      type: promotion.type,
      value: promotion.type === 'time' ? promotion.timeValue : promotion.percentValue,
    }
  }catch (err){
    console.log('err checkPromotion : ',err);
    return {success:false, error:"Error!!"}
  }
}
export async function getListMembership(options) {
  try{
    let fields = ['fullName', 'avatar', 'cuid', 'email', 'dateOffline', 'dateAdded', 'active', 'expert', 'deleteDate'].join(' ');
    let conditions = {
      memberShip: {$gt:Date.now()}
    };
    let rs = await Promise.all([
      User.count(conditions),
      User.find(conditions,fields).skip(options.skip).limit(options.limit).lean()
    ]);
    return rs;
  }catch (err){
    console.log('err getListMembership : ',err);
    return Promise.reject({status:500, success:false, error:"Error!!"});
  }
}

/**
 * Send notification to slack when have new membership or membership expired
 * @param notificationInfo
 */
export async function sendNotificationToSlack(notificationInfo) {
  try {
    let data = notificationInfo.detail;
    let action = notificationInfo.action;
    let text = '';
    switch (action) {
      case 'newMembership' :
        text = `*${data.paymentInfo.data.contactInfo.fullName}* vừa đăng ký gói *${packageMember[data.paymentInfo.data.memberShip.key]}*. \n`;
        if (data.paymentType !== 'MemberShipTrial') {
          text += `Phương thức thanh toán *${data.paymentType ? paymentType[data.paymentType] : ''}*. \n`;
        }
        text += `Thông tin liên hệ khách hàng: \n
         Họ tên: *${data.paymentInfo.data.contactInfo.fullName}*. \n
         Email: *${data.paymentInfo.data.contactInfo.email}*. \n
         SDT: *${data.paymentInfo.data.contactInfo.phoneNumber}*. \n \n \n`;
        return slack.send({
          channel: configs.slack.channel,
          text,
          unfurl_links: 1,
          icon_url: configs.slack.icon_url_success,
          username: '*Đăng ký Membership*'
        });
      case 'renewMembership' :
        if (data.memberShip > Date.now()) {
          text = `*${data.fullName}* sắp hết hạn membership. \n`;
          text += `Hạn membership đến: *${momentFormat(parseInt(data.memberShip)).format('hh:mm A, D/M/YYYY')}*. \n`;
          text += `Thông tin liên hệ khách hàng: \n
         Họ tên: *${data.fullName}*. \n
         Email: *${data.email}*. \n
         SDT: *${data.telephone}*. \n \n \n`;
          return slack.send({
            channel: configs.slack.channel,
            text,
            unfurl_links: 1,
            icon_url: configs.slack.icon_url_success,
            username: '*Membership sắp hết hạn*'
          });
        } else {
          text = `*${data.fullName}* hết hạn membership. \n`;
          text += `Membership hết hạn lúc: *${momentFormat(parseInt(data.memberShip)).format('hh:mm A, D/M/YYYY')}*. \n`;
          text += `Thông tin liên hệ khách hàng: \n
         Họ tên: *${data.fullName}*. \n
         Email: *${data.email}*. \n
         SDT: *${data.telephone}*. \n \n \n`;
          return slack.send({
            channel: configs.slack.channel,
            text,
            unfurl_links: 1,
            icon_url: configs.slack.icon_url_success,
            username: '*Membership hết hạn*'
          });
        }
      default :
        break;
    }
  } catch (err) {
    console.log('err on job sendNotificationToSlack:', err);
  }
}
/**
 * Check user is membership or not
 * @param userId
 * @returns {Promise.<boolean>}
 */
export async function checkUserIsMemberShip(userId) {
  try {
    let user = await User.findById(userId);
    if (!user) {
      return false;
    }
    return user.memberShip > new Date().getTime() || false;
  } catch (err) {
    console.log('err on checkUserIsMemberShip:', err.message);
    return false;
  }
}
