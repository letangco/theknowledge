import {generateInviteCode} from '../models/functions';
import Coupon from '../models/coupon';
import Course from '../models/courses';
import HistoryCoupon from '../models/historyCoupon';
import Webinar from '../models/liveStream';
import JoinCourse from '../models/joinCourse';
import bookingWebinar from '../models/bookingWebinar';
import User from '../models/user';
import configs from "../config";
import Notification from "../models/notificationNew";
import MemberShip from "../models/memberShip";
import mongoose from 'mongoose';
const msg_error = {
  NOT_PERMISSION : 'NOT_PERMISSION',
  NOT_ADMIN : 'NOT_ADMIN',
  CODE_NOT_FOUND: 'CODE_NOT_FOUND'

};


export async function createCoupon(options) {
  try {
    let user = await User.findById(options.author).lean();
    if (options.role === 'admin'){
      if (user.role !== 'admin'){
        return Promise.reject({status:500, success:false, err: 'User is not admin !'})
      }
    }
    options.code = generateInviteCode(10);
    return await Coupon.create(options);
  } catch (err) {
    console.log(err);
    return Promise.reject({status:500, success:false, err: 'Internal Server Error!'})
  }
}

export async function updateCoupon(options) {
  try{
    let coupon = await Coupon.findById(options.couponId);
    if (!coupon){
      return Promise.reject({status:400, success:false, err:'Coupon not found!'});
    }
    if (coupon.role !== options.role){
      return Promise.reject({status:400, success:false, err:'Not permission!'});
    }
    if (coupon.role === 'creator' && options.user_req.toString() !== coupon.author.toString()){
      return Promise.reject({status:400, success:false, err:'Not authorize!'});
    }
    coupon.discount_products = options.data.discount_products || coupon.discount_products;
    coupon.membership_to_apply = options.data.membership_to_apply || coupon.membership_to_apply;
    coupon.role = options.data.role || coupon.role;
    if (coupon.discount_products === 3){
      coupon.webinars = options.data.webinars;
      coupon.courses = [];
    }
    if (coupon.discount_products === 4){
      coupon.webinars = [];
      coupon.courses = options.data.courses;
    }
    coupon.type_discount = options.data.type_discount || coupon.type_discount;
    coupon.updateAt = Date.now();
    coupon.date_Start = options.data.date_Start || coupon.date_Start;
    if (options.data.date_Finish){
      coupon.date_Finish = options.data.date_Finish;
    } else {
      delete coupon.date_Finish;
      await Coupon.update(
        {_id:options.couponId},
        {
          $unset:{
            date_Finish:1
          }
        }
      )
    }
    await coupon.save();

    return await Coupon.findById(options.couponId).lean();
  }catch (err){
    console.log('err updateCoupon : ',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function reportCoupon(options) {
  try{
    let course = await Course.findById(options.object,'_id title creator lectures description language thumbnail price').lean();
    let webinar = await Webinar.findById(options.object,'_id title user content thumbnail description language status privacy').lean();
    let author = course ? course.creator : webinar.user;
    let user_req = await User.findById(options.user_req,'_id fullName avatar role cuid userName expert').lean();
    if (user_req.role !== 'admin'){
      if (options.user_req.toString()!== author.toString()){
        return Promise.reject({
          status:400,
          success:false,
          error: msg_error.NOT_PERMISSION
        })
      }
    }
    let user_use_coupon = await HistoryCoupon.find({object:options.object}).sort({createAt:-1}).skip(options.skip).limit(options.limit).lean()
    let total = await HistoryCoupon.count({object:options.object});
    let data = await getMetaDataHistory(user_use_coupon, course  ||  webinar)
    return [total,data]
  }catch (err){
    console.log('err reportCoupon : ',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function getMetaDataHistory(historyCoupons, object) {
  try{
    let promises = historyCoupons.map(async e =>{
      e.code = await Coupon.findOne({code:e.code},'_id author code discount_products courses webinars role date_Start date_Finish').lean();
      e.object = object || e.platform === 'course' ?
        await Course.findById(e.object,'_id title creator lectures description language thumbnail price').lean()
        :
        await Webinar.findById(e.object,'_id title user content thumbnail description language status privacy').lean();
      e.user = await User.findById(e.user,'_id fullName avatar cuid userName expert');
      e.paymentId = e.platform === 'course' ?
        await JoinCourse.findById(e.paymentId,'_id course course_price tax fee course_creator_receive currency priceRate').lean()
        :
        await bookingWebinar.findById(e.paymentId,'_id webinar ticket amount price total uniqueCode tax fee creator_receive currency priceRate contactInfo').lean();
      return e;
    });
    return await Promise.all(promises);
  }catch (err){
    console.log('Error getMetaData :',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function getCoupons(options) {
  try{
    let conditions = {};
    if (options.status){
      conditions.status = options.status;
    }
    let admin = await User.findById(options.user_req).lean();
    if (admin.role !== 'admin'){
      conditions.author = options.user_req;
    }
    let coupons = await Coupon.find(conditions).sort({createAt:-1}).skip(options.skip).limit(options.limit).lean();
    let total = await Coupon.count(conditions);
    if (total > 0){
      let data = await getMetaData(coupons, options.lang);
      return [total,data]
    }else {
      return [0,[]]
    }
  }catch (err){
    console.log('Error getCoupons : ',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function getCoupon(options) {
  try{
    //console.log(options);
    let coupon = await Coupon.findById(options.couponId).lean();
    if (!coupon){
      return Promise.reject({status:400, success:false, error: msg_error.CODE_NOT_FOUND})
    }
    let user_req = await User.findById(options.user_req,'_id fullName avatar role cuid userName expert').lean();
    if (user_req.role !== 'admin'){
      if (options.user_req.toString()!==coupon.author.toString()){
        return Promise.reject({
          status:400,
          success:false,
          error: msg_error.NOT_PERMISSION
        })
      }
    }
    delete user_req.role;
    coupon.author = user_req;
    return coupon;
  }catch (err){
    console.log('Error getCoupon : ',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function checkCouponMembership(code, user) {
  try{
    let coupon = await Coupon.findOne({code: code, discount_products: 6}).lean();
    if (!coupon){
      return {status:400, next: true}
    }
    if (!coupon.status){
      return {status: 400, error: 'CODE_LOCKED', next: false};
    }
    if (parseInt(coupon.date_Start) > Date.now()){
      return {status: 400, error: 'CODE_NOT_STARTED', next: false};
    }
    if (coupon.date_Finish && parseInt(coupon.date_Finish) < Date.now()){
      return {status: 400, error: 'CODE_FINISHED', next: false};
    }
    let buy_coupon = await HistoryCoupon.count({code: code, user: user._id}).lean();
    if (buy_coupon){
      return {status: 400, error: 'YOU_HAVE_USE', next: false};
    }
    if (coupon.type_discount.maximum > 0){
      let total = await HistoryCoupon.count({code:code}).lean();
      if (total >= coupon.type_discount.maximum){
        return {status: 400, error: 'FULL_DISCOUNT', next: false};
      }
    }
    let memberShip = coupon.membership_to_apply;
    let time = user.memberShip > Date.now() ? user.memberShip + configs.memberShipsTime[memberShip] :
      Date.now() + configs.memberShipsTime[memberShip];
    await Notification.remove({
      to:user._id,
      type:"RemindRenewMemberShip"
    });
    await User.update({ _id: user._id }, { $set: { memberShip: time } });

    let joinMemberShip = {
      user: user._id,
      type: user.memberShip ? 'renewalMemberShip' : 'joinMemberShipCoupon',
      memberShip: memberShip,
      total: 0,
      time: time,
      currency: '',
      priceRate: '',
    };
    let booked = await MemberShip.create(joinMemberShip);
    let historyCoupon = {
      code: code,
      object: mongoose.Types.ObjectId(),
      quantity: 1,
      paymentId: mongoose.Types.ObjectId(),
      total_price: 0,
      platform: 'membership',
      price_discount: 0,
      user: user._id
    }
    await HistoryCoupon.create(historyCoupon);

    return {booked: booked, next: false};
  }catch (err){
    console.log('Error getCoupon : ',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function deleteCoupon(options) {
  try{
    let coupon = await Coupon.findById(options.couponId).lean();
    if (!coupon){
      return Promise.reject({status:400, success:false, error: msg_error.CODE_NOT_FOUND})
    }
    await Coupon.remove({_id:options.couponId});
    return true;
  }catch (err){
    console.log('Error getCoupon : ',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function getMetaData(coupons, lang) {
  try{
    if (!(coupons instanceof Array)){
      coupons = [coupons];
    }
    let priceRate = configs.moneyExchangeRate[lang] ? configs.moneyExchangeRate[lang] : 1;
    let promise = coupons.map(async coupon =>{
      coupon.author = await User.findById(coupon.author,'_id fullName avatar cuid userName expert');
      let history = await HistoryCoupon.find({code:coupon.code}).lean();
      coupon.user_used = history.length;
      let total_balance = 0;
      let total_balance_recive = 0;
      history.map( e =>{
        total_balance = (parseFloat(total_balance.toString())+ parseFloat(e.total_price)).toFixed(2);
        total_balance_recive = (parseFloat(total_balance_recive.toString()) + parseFloat(e.price_discount)).toFixed(2);
      });
      coupon.total_balance = (total_balance * priceRate).toFixed(2);
      coupon.total_balance_recive = (total_balance_recive * priceRate).toFixed(2);
      coupon.total_fee = (total_balance_recive * configs.webinar_fee * priceRate).toFixed(2);
      return coupon;
    });
    return await Promise.all(promise);
  }catch (err){
    console.log('Error getMetaData : ',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function getHistoryCoupon(options) {
  try{
    let coupon = await Coupon.findById(options.couponId).lean();
    if (!coupon){
      return Promise.reject({status:400, success:false, error: msg_error.CODE_NOT_FOUND})
    }
    let user_req = await User.findById(options.user_req,'_id fullName avatar role cuid userName expert').lean();
    if (user_req.role !== 'admin'){
      if (options.user_req.toString()!==coupon.author.toString()){
        return Promise.reject({
          status:400,
          success:false,
          error: msg_error.NOT_PERMISSION
        })
      }
    }
    delete user_req.role;
    let history = await HistoryCoupon.find({code:coupon.code}).sort({createAt:-1}).skip(options.skip).limit(options.limit).lean();
    let total = await HistoryCoupon.count({code:coupon.code});
    if (total > 0){
      let data = await getMetaDataHistory(history);
      return [total, data];
    } else {
      return [0,[]];
    }
  }catch (err){
    console.log('Error getHistoryCoupon : ',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function getHistoryCouponOfUser(options) {
  try{
    let historys = await HistoryCoupon.find({user:options.user_req}).sort({createAt:-1}).skip(options.skip).limit(options.limit).sort({}).lean();
    let total = await HistoryCoupon.count({user:options.user_req});
    if (total > 0){
      let data = await getMetaDataHistory(historys);
      return [total, data];
    } else {
      return [0,[]];
    }
  }catch (err){
    console.log('Error getHistoryCoupon : ',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function updateStatus(options) {
  try {
    let user = await User.findById(options.req_user).lean();
    let coupon = await Coupon.findById(options.code);
    if (!coupon){
      return Promise.reject({status:400, success:false, error:'COUPON_NOT_FOUND'});
    }
    if (user.role !== 'admin' && coupon.author.toString() !== user._id.toString()){
      return Promise.reject({status:400, success:false, error:'NOT_PERMISSION'});
    }
    coupon.status = !coupon.status;
    await coupon.save();
    return coupon;
  } catch (err){
    console.log('Error getHistoryCoupon : ',err);
    return Promise.reject({status:500, success:false, error: 'Internal Server Error!'})
  }
}

export async function checkCoupon(userId, Object, quantity, price, platForm, langCode, couponCode) {
  try{
    let total = quantity * price;
    let historyCoupon = {
      success:true,
      quantity:quantity,
      code : couponCode,
      object : Object._id,
      total_price : total,
      platform : platForm,
      user:userId
    };
    let user = await User.findById(userId).lean();
    if (!user){
      return {status: 400, success:false, error: 'USER_NOT_FOUND'};
    }
    let coupon = await Coupon.findOne({code:couponCode}).lean();
    if (!coupon){
      return {status: 400, success:false, error: 'CODE_NOT_FOUND'};
    }
    if (!coupon.status){
      return {status: 400, success:false, error: 'CODE_LOCKED'};
    }
    if (platForm === 'course'){
      let buy_coupon = await HistoryCoupon.count({code:couponCode, user:userId});
      if (([0, 2, 4].indexOf(coupon.discount_products) === -1)){
        return {status: 400, success:false, error: 'CODE_NOT_APPLY 2'};
      }
      if((coupon.discount_products === 4 &&
        coupon.courses.indexOf(Object._id.toString()) === -1) ||
        (coupon.discount_products === 4 &&
          coupon.role === 'creator' &&
          Object.creator.toString() !== coupon.author.toString())
      ){
        return {status: 400, success:false, error: 'CODE_NOT_APPLY 1'};
      }
      if ([0,2].indexOf(coupon.discount_products) !== -1 &&
        coupon.type_discount.user_buy_limit &&
        coupon.type_discount.user_buy_limit <= buy_coupon){
        return {status: 400, success:false, error: 'YOU_HAVE_USED'};
      }
      if (coupon.type_discount.maximum > 0){
        let total = await HistoryCoupon.count({code:couponCode}).lean();
        if (total >= coupon.type_discount.maximum){
          return {status: 400, success:false, error: 'FULL_DISCOUNT'};
        }
      }
    } else {
      let brought = await HistoryCoupon.count({code:couponCode, user:userId}).lean();
      let user_can_buy = coupon.type_discount.user_buy_limit - brought;
      if (([0,1].indexOf(coupon.discount_products) === -1) || (coupon.discount_products === 3 && coupon.webinars.indexOf(Object._id.toString()) === -1) || (coupon.discount_products === 3 && coupon.role === 'creator' && Object.user.toString() !== coupon.author.toString())){
        return {status: 400, error: 'CODE_NOT_APPLY'}; // done
      }
      if ( 0 < brought < coupon.type_discount.user_buy_limit){
        user_can_buy = coupon.type_discount.user_buy_limit - brought;
      }
      if ((user_can_buy > 0 && quantity > user_can_buy) || user_can_buy === 0){
        return {status: 400, success:false, error: 'EXCEED_USER_CAN_BUY', missing: user_can_buy}; // done
      }
      if ([0,1].indexOf(coupon.discount_products) !== -1 && user_can_buy <= 0){
        return {status: 400, success:false, error: 'YOU_HAVE_USED'}; // done
      }
      if (coupon.type_discount.maximum > 0){
        let totals = await HistoryCoupon.count({code:couponCode}).lean();
        let user_can_buys = coupon.type_discount.maximum - totals;
        if (totals >= coupon.type_discount.maximum){
          return {status: 400, success:false, error:'FULL_DISCOUNT'};
        }
        if (user_can_buys > 0 && user_can_buys < quantity){
          return {status: 400, success:false, error: 'EXCEED_MAXIMUM_CODE', missing:user_can_buys}
        }
      }
    }
    if (parseInt(coupon.date_Start) > Date.now()){
      return {status: 400, success:false, error: 'CODE_NOT_STARTED'};
    }
    if (coupon.date_Finish && parseInt(coupon.date_Finish) < Date.now()){
      return {status: 400, success:false, error: 'CODE_FINISHED'};
    }
    let value = coupon.type_discount.type === 'percent' ? ((total * coupon.type_discount.value)/100).toFixed(2) : (coupon.type_discount.value).toFixed(2);
    total = (total - value).toFixed(2) * 1;
    if (total < 0){
      total = 0;
    }
    if (!isNaN(parseFloat(coupon.type_discount.limit_discount)) &&
      parseFloat(coupon.type_discount.limit_discount) < value && coupon.type_discount.type === 'percent'){
      total = price - coupon.type_discount.limit_discount;
    }
    if (coupon.type_discount.apply_products){
      if (coupon.type_discount.apply_products.compare === 'gt' && price < coupon.type_discount.apply_products.value){
        return {status: 400, success:false, error: 'CODE_LON_HON', price:coupon.type_discount.apply_products.value}; // done
      }
      if (coupon.type_discount.apply_products.compare === 'lt' && price > coupon.type_discount.apply_products.value){
        return {status: 400, success:false, error: 'CODE_NHO_HON', price:coupon.type_discount.apply_products.value}; // done
      }
    }
    historyCoupon.price_discount = total > 0 ? total : 0;

    return historyCoupon;
  }catch (err){
    console.log('err checkCoupon : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
  }
}

export async function checkApplyCoupon(data = {}) {
  try{
    let total = data.memberShip.value;
    let historyCoupon = {
      success:true,
      code : data.code,
      total_price : total,
      platform : data.type
    };
    let coupon = await Coupon.findOne({code:data.code}).lean();
    if (!coupon){
      return {status: 400, success:false, error: 'CODE_NOT_FOUND'};
    }
    if (!coupon.status){
      return {status: 400, success:false, error: 'CODE_LOCKED'};
    }
    if (platForm === 'membership'){
      let buy_coupon = await HistoryCoupon.count({code:couponCode, user:userId}).lean();
      if (([0,2].indexOf(coupon.discount_products) === -1) || (coupon.discount_products === 4 && coupon.courses.indexOf(Object._id.toString()) === -1) || (coupon.discount_products === 4 && coupon.role === 'creator' && Object.creator.toString() !== coupon.author.toString())){
        return {status: 400, success:false, error: 'CODE_NOT_APPLY'};
      }

      if ([0,2].indexOf(coupon.discount_products) !== -1 &&
        coupon.type_discount.user_buy_limit &&
        coupon.type_discount.user_buy_limit <= buy_coupon){
        return {status: 400, success:false, error: 'YOU_HAVE_USED'};
      }
      if (coupon.type_discount.maximum > 0){
        let total = await HistoryCoupon.count({code:couponCode}).lean();
        if (total >= coupon.type_discount.maximum){
          return {status: 400, success:false, error: 'FULL_DISCOUNT'};
        }
      }
    }
    if (parseInt(coupon.date_Start) > Date.now()){
      return {status: 400, success:false, error: 'CODE_NOT_STARTED'};
    }
    if (coupon.date_Finish && parseInt(coupon.date_Finish) < Date.now()){
      return {status: 400, success:false, error: 'CODE_FINISHED'};
    }
    let value = coupon.type_discount.type === 'percent' ? ((total * coupon.type_discount.value)/100).toFixed(2) : (coupon.type_discount.value).toFixed(2);
    total = (total - value).toFixed(2) * 1;
    if (total < 0){
      total = 0;
    }

    if (coupon.type_discount.limit_discount < value && coupon.type_discount.type === 'percent'){
      total = price - coupon.type_discount.limit_discount;
    }
    if (coupon.type_discount.apply_products){
      if (coupon.type_discount.apply_products.compare === 'gt' && price < coupon.type_discount.apply_products.value){
        return {status: 400, success:false, error: 'CODE_LON_HON', price:coupon.type_discount.apply_products.value}; // done
      }
      if (coupon.type_discount.apply_products.compare === 'lt' && price > coupon.type_discount.apply_products.value){
        return {status: 400, success:false, error: 'CODE_NHO_HON', price:coupon.type_discount.apply_products.value}; // done
      }
    }
    historyCoupon.price_discount = total > 0 ? total : 0;

    return historyCoupon;
  } catch (err){
    console.log('err checkCoupon : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!!'})
  }
}
