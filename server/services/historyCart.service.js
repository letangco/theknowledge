import User from '../models/user';
import HistoryCart from '../models/historyCart.model';
import StringHelper from "../util/StringHelper";
import Course from '../models/courses';
import Coupon from '../models/coupon';
import HistoryCoupon from '../models/historyCoupon';
import Configs from '../config';
import Payment from '../models/payment';
import {cacheImage} from "../libs/imageCache";
import cuid from "cuid";
import JoinCourse from "../models/joinCourse";
import MemberShip from "../models/memberShip";
import {createUser} from "./users.service";
import logger from '../util/log';
import { addTeacherMemberShipFromOrder } from '../components/teacherMembership/teacherMembership.service';
import {
  ORDER_TYPE
} from '../../config/globalConstants';
import { getObjectId } from '../util/string.helper';

export async function createCart(options, type) {
  try {
    let courses = options.info.courses;
    if(courses && courses.length){
      let flag = true;
      for (let i = 0; i < courses.length; i++){
        let course = await Course.findOne({
          $or:[
            {
              _id: courses[i]._id,
              status: [1,2,3]
            },
            {
              status: 4,
              type: 'video'
            }
          ]
        }).lean();
        if(!course){
          flag = false;
          break;
        }
      }
      if(!flag){
        return Promise.reject({status: 400, success: false, error: 'Course not found.'})
      }
    }
    if(options.coupon){
      let coupon = await Coupon.findOne({
        code: options.coupon,
        status: true,
        discount_products:{
          $in:[0,2,4,7]
        }
      }).lean();
      if(!coupon){
        return Promise.reject({status: 400, success: false, error: 'Coupon not apply.'})
      }
      let info = await mathCouponWithOrder(options.info, coupon, options.user);
      options.info = info[0];
      options.total = info[1];
      options.total_payment = info[2];
    } else {
      options.total_payment = options.total;
    }
    if(type === 'create') {
      if (options.password) {
        let user = await createUser({
          fullName: options.userName,
          telephone: options.phoneNumber,
          email: options.email,
          password: options.password,
          address: options.address
        });
        options.user =  user._id;
      }
      options.code = await getCodeCart();
      options.codeActive = StringHelper.generalCodeActiveOrder();
      let data = await HistoryCart.create(options);
      data = await getMetaDataCart(data);
      return data[0];
    } else {
      return options;
    }
  } catch (err) {
    console.log('error createCart : ', err);
    return Promise.reject({status: 500, success: false, error:'Internal Server Error.'})
  }
}

export async function getCodeCart() {
  try {
    let cart = await HistoryCart.find({}).sort({code: -1}).limit(1).lean();
    if(cart.length){
      return cart[0].code + 1;
    } else {
      return 1;
    }
  } catch (err) {
    console.log('error getCodeCart : ',err);
    throw {
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    }
  }
}

export async function mathCouponWithOrder(info, coupon, userId = null) {
  try {
    if(coupon.date_Start && parseInt(coupon.date_Start) > Date.now()){
      return Promise.reject({status: 400, success:false, error: 'CODE_NOT_STARTED'})
    }
    if (coupon.date_Finish && parseInt(coupon.date_Finish) < Date.now()){
      return Promise.reject({status: 400, success:false, error: 'CODE_FINISHED'});
    }
    if (coupon.type_discount.user_buy_limit){
      if(!userId){
        return Promise.reject({status: 400, success:false, error: 'PLEASE_LOGIN_TO_USE'});
      }
      let total_use = await HistoryCoupon.count({code:coupon.code, user:userId});
      if(coupon.type_discount.user_buy_limit <= total_use) {
        return Promise.reject({status: 400, success:false, error: 'YOU_HAVE_FULL_USED'});
      }
    }
    if (coupon.type_discount.maximum > 0){
      let total = await HistoryCoupon.count({code:coupon.code}).lean();
      if (total >= coupon.type_discount.maximum){
        return {status: 400, success:false, error: 'FULL_DISCOUNT'};
      }
    }
    let list_courses_discount = info.courses || [];
    let list_membership_discount = info.memberships || [];
    let total_price = 0;
    let total_price_discount = 0;
    if(list_courses_discount.length){
      let promise_course = list_courses_discount.map(async e => {
        let total = e.price;
        if ([0,2,4].indexOf(coupon.discount_products) !== -1) {
          if( coupon.discount_products === 4) {
            if(coupon.courses.indexOf(e._id.toString()) !== -1){
              total = await getPrice(coupon, e.price);
              e.code = coupon.code;
            }
          } else {
            total = await getPrice(coupon, e.price);
            e.code = coupon.code;
          }
        }
        e.price_discount = total;
        total_price += e.price;
        total_price_discount += total;
        return e;
      });
      info.courses = await Promise.all(promise_course);
    }
    if(list_membership_discount.length){
      let promise_membership = list_membership_discount.map(async e => {
        let total = e.price * e.quantity;
        if(coupon.memberships.indexOf(e.type) !== -1 || coupon.memberships.indexOf('all') !== -1) {
          total = await getPrice(coupon, e.price * e.quantity);
          e.code = coupon.code;
        }
        e.price_discount = total;
        total_price += e.price * e.quantity;
        total_price_discount += total;
        return e;
      });
      info.memberships = await Promise.all(promise_membership);
    }
    return [info, total_price, total_price_discount];
  } catch (err) {
    console.log('error mathCouponWithOrder : ',err);
    throw {
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    }
  }
}

export async function getPrice(coupon, price) {
  try {
    let total = price;
    let value = coupon.type_discount.type === 'percent' ? ((total * coupon.type_discount.value)/100).toFixed(2) : (coupon.type_discount.value).toFixed(2);
    total = (total - value).toFixed(2) * 1;
    if (total < 0){
      total = 0;
    }
    if (coupon.type_discount.limit_discount < value && coupon.type_discount.type === 'percent'){
      total = price - coupon.type_discount.limit_discount;
    }
    // console.log('Price - total : ', price);
    if (coupon.type_discount.apply_products){
      if (coupon.type_discount.apply_products.compare === 'gt' && price < coupon.type_discount.apply_products.value){
        total = price;
      }
      if (coupon.type_discount.apply_products.compare === 'lt' && price > coupon.type_discount.apply_products.value){
        total = price; // done
      }
    }
    return total;
  } catch (err) {
    console.log('error getPrice : ',err);
    throw {
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    }
  }
}

export async function getMetaDataCart(data) {
  try {
    if(!Array.isArray(data)){
      data = [data];
    }
    let promise = data.map(async e => {
      e.user = e.user ? await User.findById(e.user, '_id avatar fullName email telephone').lean() : null;
      e.code = StringHelper.generalCodeOrder(e.code);
      // if(e.paymentId)
      // switch (e.status) {
      //   case 1:
      //     e.status = 'pending';
      //     break;
      //   case 2:
      //     e.status = 'success';
      //     break;
      //   case 3:
      //     e.status = 'fail';
      //     break;
      //   case 4:
      //     e.status = 'error_customer';
      //     break;
      //   case 5:
      //     e.status = 'deleted';
      //     break;
      //   default:
      //     break;
      // }
      let info = e.info;
      if(info.courses.length) {
        let promise_course = info.courses.map(async course => {
          let detail = await Course.findById(course._id, '_id title slug').lean();
          course.title = detail ? detail.title : '';
          course.slug = detail ? detail.slug : '';
          return course;
        });
        e.info.courses = await Promise.all(promise_course);
      }
      return e;
    });
    return await Promise.all(promise);
  } catch (err) {
    console.log('error getMetaDataCart : ',err);
    throw {
      status: 500, success: false, error: 'Internal Server Error.'
    }
  }
}

export async function getTotalPrice(listProduct, langCode) {
  try {
    let total = 0;
    let money_rate =  1;
    let courses = listProduct.courses || [];
    let memberShips = listProduct.memberships || [];
    const teacherMembership = listProduct.teacherMembership;
    if ( courses.length ) {
      let promise_course = courses.map(async e => {
        let course = await Course.findById(e._id).lean();
        if(course){
          total += (course.price * money_rate);
        }
        e._id = getObjectId(e._id);
        e.price = course.price * money_rate;
        e.price_discount = e.price;
        e.quantity = 1;
        return e;
      });
      courses = await Promise.all(promise_course);
    }
    return {
      total,
      info: {
        courses: courses
      },
    }
  } catch (err) {
    console.log('error getTotalPrice : ',err);
    return Promise.reject({status: 500, success: false, error:'Internal Server Error.'})
  }
}

export async function getListProductById(options) {
  try {
    let data = {
      courses: [],
      memberships: [],
      total: 0,
    };
    if(options.courses.length) {
      const langCode = options.lang;
      let priceRate = Configs.moneyExchangeRate[langCode] ? Configs.moneyExchangeRate[langCode] : 1;
      let courses = options.courses;
      let promise = courses.map(async e => {
        let course = await Course.findById(e._id, '_id title creator lectures price regularPrice thumbnail').lean();
        let user = await User.findById(course.creator, '_id fullName email telephone avatar').lean();
        if (user) {
          if (user.avatar) {
            let data = {
              src: user.avatar,
              size: 150
            };
            user.avatar = await cacheImage(data) || user.avatar;
          }
          course.creator = user;
        } else {
          course.creator = null
        }
        course.price = langCode === 'vi' ? course.price * Configs.moneyExchangeRate.vi : course.price;
        course.regularPriceText = (course.regularPrice * priceRate).toFixed(2)*1;
        course.total_price = course.price * e.quantity;
        data.total += course.total_price;
        if(course.thumbnail) {
          let data = {
            src: course.thumbnail,
            size: 100
          };
          course.thumbnail = await cacheImage(data) || course.thumbnail;
        }
        return course;
      });
      courses = await Promise.all(promise);
      data.courses = courses;
    }
    if (options.memberships.length) {
      let memberships = options.memberships;
      let promise_membership = memberships.map(async e => {
        let money = 0;
        switch (e.type) { // "one-month", "three-month", "six-month", "one-years"
          case 'one-month':
            money = Configs.memberShips.value.MONTH;
            break;
          case 'three-month' :
            money = Configs.memberShips.value.THREEMONTH;
            break;
          case 'six-month' :
            money = Configs.memberShips.value.SIXMONTH;
            break;
          case 'one-years':
            money = Configs.memberShips.value.YEAR;
            break;
          default:
            break;
        }
        e.price = options.lang === 'vi' ? money : parseFloat((money/Configs.moneyExchangeRate.vi).toFixed(2));
        e.total_price = e.price * e.quantity;
        data.total += e.total_price;
        return e;
      });
      data.memberships = await Promise.all(promise_membership);
    }
    return data;
  } catch (err) {
    console.log('error getListProductById : ',err);
    return Promise.reject({status: 500, success: false, error:'Internal Server Error.'})
  }
}

export async function createPaymentOrder(paymentInfo, userId) {
  try {
    let user = await User.findById(userId).lean();
    if(!user) {
      throw {
        status: 400,
        success: false,
        error: 'USER_NOT_FOUND'
      }
    }
    let balance = user.balance;
    let payment;
    if(balance > paymentInfo.amount) {
      await User.update({
        _id: userId
      },{
        $set: {
          $inc:{
            balance: (0 - paymentInfo.amount)
          }
        }
      });
      payment = await Payment.create({
        cuid: cuid(),
        userId: user.cuid,
        paymentType: 'wallet_user',
        amount: paymentInfo.amount,
        type: 1,
        paymentInfo: paymentInfo,
        status: 1
      });
      return {
        success: true,
        payment
      }
    } else {
      let charge = Math.ceil(paymentInfo.amount - balance);
      return {
        success: false,
        error: "BALANCE_NOT_ENOUGH",
        missing: charge,
        currency: paymentInfo.currency,
        status: 400
      }
    }
  } catch (err) {
    console.log('error createPaymentOrder : ',err);
    return Promise.reject({status: 500, success: false, error:'Internal Server Error.'})
  }
}

export async function deleteOrder(options) {
  try {
    let order = await HistoryCart.findById(options.id);
    if(!order){
      return Promise.reject({status: 400, success: false, error: 'Order Not Found.'})
    }
    if(order.status === 2) {
      return Promise.reject({status: 400, success: false, error: 'Not_Delete'})
    }
    order.status = 5;
    await order.save();
    let data = await getMetaDataCart(order);
    return data[0];
  } catch (err) {
    console.log('error deleteOrder : ',err);
    return Promise.reject({status: 500, success: false, error:'Internal Server Error.'})
  }
}
export async function editOrder(options) {
  try {
    let order = await HistoryCart.findById(options.id);
    if(!order){
      return Promise.reject({status: 400, success: false, error: 'Order Not Found.'})
    }
    order.status = options.status || order.status;
    order.info = options.info || order.info;
    order.userName = options.userName || order.userName;
    order.phoneNumber = options.phoneNumber || order.phoneNumber;
    order.email = options.email || order.email;
    order.address = options.address || order.address;
    await order.save();
    let data = await getMetaDataCart(order);
    return data[0];
  } catch (err) {
    console.log('error editOrder : ',err);
    return Promise.reject({status: 500, success: false, error:'Internal Server Error.'})
  }
}

export async function getListOrder(options) {
  try {
    let conditions = {};
    if(options.status) {
      conditions.status = options.status
    }
    if(options.type) {
      if(options.type === ORDER_TYPE.COURSE){
        conditions['info.teacherMembership'] = null
      } else if(options.type === ORDER_TYPE.MEMBERSHIP){
        conditions['info.teacherMembership'] = {$exists: true, $ne: null}
      }
    }
    if (options.text) {
      conditions["$or"] = [
        {
          address: {$regex:options.text, $options: "i"}
        },
        {
          userName: {$regex:options.text, $options: "i"}
        },
        {
          phoneNumber: {$regex:options.text, $options: "i"}
        },
        {
          email: {$regex:options.text, $options: "i"}
        }
      ]
    }
    let count = await HistoryCart.count(conditions);
    let data = await HistoryCart.find(conditions).sort({code: -1}).limit(options.limit).skip(options.skip).lean();
    data = await getMetaDataCart(data);
    return [count, data]
  } catch (err) {
    console.log('error getListOrder : ',err);
    return Promise.reject({status: 500, success: false, error:'Internal Server Error.'})
  }
}

export async function activeCodeOrder(userId, code) {
  try {
    let created = await HistoryCart.findOne({codeActive: code});
    if (!created) {
      throw {
        success: false,
        status: 404,
        error: 'CODE_NOT_FOUND'
      }
    } else {
      if(userId){
        if (created.info.courses && created.info.courses.length) {
          let promise = created.info.courses.map(async e => {
            if(e.code){
              await HistoryCoupon.update({
                code: e.code,
                code_cart: created.code
              },{
                $set: {
                  object: e._id,
                  platform: 'course',
                  quantity: e.quantity,
                  total_price: e.price,
                  price_discount: e.price_discount,
                  user: userId || null
                }
              }, {
                upsert: true
              })
            }
            /**
             * Update Model JoinCourse
             * */
            let course = await Course.findById(e._id).lean();
            let commission = course.commission || 100;
            let tesseBank = await User.findById(Configs.tesseBank._id);
            let options = {
              user: userId,
              course: e._id,
              course_price: e.code ? e.price_discount : course.price,
              currency: created.currency
            };
            let langCode = created.currency === 'VND' ? 'vi' : 'en';
            options.fee = (commission * options.course_price).toFixed(2);
            options.course_creator_receive = parseFloat(options.course_price) - parseFloat(options.fee);
            options.priceRate = Configs.moneyExchangeRate[langCode] ? Configs.moneyExchangeRate[langCode] : 1;
            await JoinCourse.create(options);
            tesseBank.balance = parseFloat(tesseBank.balance) + (options.course_creator_receive).toFixed(2) * 1;
            await tesseBank.save();
          });
          await Promise.all(promise)
        }
        if(created.info.memberships && created.info.memberships.length){
          let user = await User.findById(userId, 'balance memberShip').lean();
          let total_membership = user.memberShip > Date.now() ? user.memberShip : Date.now();
          let promise_membership = created.info.memberships.map(async e => {
            if(e.code){
              await HistoryCoupon.update({
                code: e.code,
                code_cart: created.code
              },{
                $set: {
                  platform: 'membership',
                  quantity: e.quantity,
                  total_price: e.price,
                  price_discount: e.price_discount,
                  user: userId || null
                }
              }, {
                upsert: true
              })
            }
            let memberShip = '';
            switch (e.type) {
              case 'one-month':
                memberShip = 'MONTH';
                break;
              case 'three-month':
                memberShip = 'THREEMONTH';
                break;
              case 'six-month':
                memberShip = 'SIXMONTH';
                break;
              case 'one-year':
                memberShip = 'YEAR';
                break;
            }
            total_membership += (Configs.memberShipsTime[memberShip] * e.quantity);
            let joinMemberShip = {
              user: userId,
              memberShip: memberShip,
              type: user.memberShip ? 'renewalMemberShip' : 'joinMemberShip',
              total: e.code ? e.price_discount : e.price * e.quantity,
              time: total_membership,
              currency: created.currency,
              priceRate: created.currency === 'VND' ? Configs.moneyExchangeRate.vi : 1,
              contactInfo: {
                userName: created.userName || '',
                phoneNumber: created.phoneNumber || '',
                email: created.email || '',
                address: created.address || '',
              }
            };
            await MemberShip.create(joinMemberShip);
          });
          await Promise.all(promise_membership);
          await User.updateOne({
            _id: userId
          },{
            $set:{
              memberShip: total_membership
            }
          })
        }
        created.isActive = true;
        created.userUse = userId;
        created.dateUse = Date.now();
        await created.save();
      }
      return created;
    }
  } catch (err) {
    console.log('error activeCodeOrder : ',err);
    return Promise.reject({status: 500, success: false, error:'Internal Server Error.'})
  }
}

/**
 * @param params
 * @param params.userId
 * @param params.type
 * @param params.packageType
 * @param params.payment
 * @param params.total_payment
 * @returns {Promise<void>}
 */
export async function activeTeacherMembership(params) {
  try {
    // Add user teacher membership
    await addTeacherMemberShipFromOrder({
      packageType: params.packageType,
      userId: params.userId,
      type: params.type,
      payment: params.payment,
      total_payment: params.total_payment,
    });
  } catch (error) {
    logger.error(`activeTeacherMembership error: ${error.toString()}`);
    throw error;
  }
}
