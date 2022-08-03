import WebinarTicket from '../models/webinarTicket';
import BookingWebinar from '../models/bookingWebinar';
import {checkCoupon} from "./coupon.service";
import LiveStream from '../models/liveStream';
import Coupon from '../models/coupon';
import User from '../models/user';
import {generateInviteCode} from '../models/functions';
import configs from '../config';
import globalConstants from '../../config/globalConstants';
import {Q} from '../libs/Queue';
import mongoose from 'mongoose';
import * as HandleNumber from '../util/HandleNumber';
import HistoryCoupon from "../models/historyCoupon";
const msg_error = {
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  EXCEED_USER_CAN_BUY: 'EXCEED_USER_CAN_BUY',
  EXCEED_MAXIMUM_CODE: 'EXCEED_MAXIMUM_CODE',
  CODE_NOT_FOUND: 'CODE_NOT_FOUND',
  CODE_NOT_APPLY:'CODE_NOT_APPLY',
  YOU_HAVE_USED:'YOU_HAVE_USED',
  FULL_DISCOUNT:'FULL_DISCOUNT',
  CODE_NOT_STARTED:'CODE_NOT_STARTED',
  CODE_FINISHED:'CODE_FINISHED',
  LEVEL_DISCOUNT:'LEVEL_DISCOUNT',
  NOT_ENOUGH_BALANCE:'NOT_ENOUGH_BALANCE',
  CODE_LOCKED:'CODE_LOCKED',
  USER_NOT_FOUND:'USER_NOT_FOUND'
};
export async function createWebinarTicket(ticket_info) {
  try {
    return await WebinarTicket.create(ticket_info);
  } catch (err) {
    console.log('err on createWebinarTicket:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
export async function updateWebinarTicket(ticket_info) {
  try{
    let ticket = ticket_info[0];
    if (ticket._id){
      let webinar = await WebinarTicket.findById(ticket._id).lean();
      if(webinar) {
        if (parseInt(ticket.quantity) < webinar.sold) {
          return Promise.reject({
            status: 400,
            success: false,
            err: 'The number of tickets must not be less than the number of tickets sold'
          })
        }
        await WebinarTicket.update(
          {_id:ticket._id},
          {
            $set:
              {
                quantity:parseInt(ticket.quantity),
                price:!!parseFloat(ticket.price) ? parseFloat(ticket.price).toFixed(2) : 0
              }
          }
        )
      }
    }else {
      let webinar = await WebinarTicket.findOne({webinar:ticket.webinar}).lean();
      if(webinar) {
        if (parseInt(ticket.quantity) < webinar.sold) {
          return Promise.reject({
            status: 400,
            success: false,
            err: 'The number of tickets must not be less than the number of tickets sold'
          })
        }
        await WebinarTicket.update(
          {_id:webinar._id},
          {
            $set:
              {
                quantity:parseInt(ticket.quantity),
                price:!!parseFloat(ticket.price) ? parseFloat(ticket.price).toFixed(2) : 0
              }
          }
        )
      }else {
        let data = {
          webinar:ticket.webinar,
          quantity:parseInt(ticket.quantity),
          price:!!parseFloat(ticket.price) ? parseFloat(ticket.price).toFixed(2) : 0
        }
        await WebinarTicket.create(data);
      }
    }
  }catch (err){
    console.log('err on updateWebinarTicket:', err);
    return Promise.reject({status: 500, err: 'Internal error.'});
  }
}
export async function getWebinarTickets(webinarId, langCode, requestId) {
  try {
    let tickets = await WebinarTicket.find({webinar: webinarId}).lean();
    tickets = JSON.parse(JSON.stringify(tickets));
    let priceRate = configs.moneyExchangeRate[langCode] ? configs.moneyExchangeRate[langCode] : 1;
    let currency = configs.currency[langCode] ? configs.currency[langCode] : 'USD';

    let promises = tickets.map(async ticket => {
      if (!requestId){
        delete ticket.sold;
      } else {
        let webinar = await LiveStream.findById(webinarId).lean();
        if (webinar.user.toString() !== requestId.toString()){
          delete ticket.sold;
        }
      }
      ticket.currency = currency;
      ticket.price *= priceRate;
      return ticket;
    });

    return await Promise.all(promises);
  } catch (err) {
    console.log('err on getWebinarTickets:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function checkBuyAble(userId, ticketId, quantity, langCode, code) {
  try {
    let resources = await Promise.all([
      User.findById(userId, 'balance').lean(),
      WebinarTicket.findById(ticketId, 'price sold quantity webinar').lean(),
    ]);

    let user = resources[0], ticket = resources[1];
    if(!ticket) {
      return Promise.reject({status: 404, success:false, err: msg_error.TICKET_NOT_FOUND});
    }
    if(!user) {
      return Promise.reject({status: 404, success:false, err: msg_error.USER_NOT_FOUND});
    }

    let rate = configs.moneyExchangeRate[langCode] ? configs.moneyExchangeRate[langCode] : 1;
    let currency = configs.currency[langCode] ? configs.currency[langCode] : 'USD';
    let webinar = await LiveStream.findById(ticket.webinar).lean();
    let balance = user.balance * rate;
    let data = {};
    let total = quantity * ticket.price
    // If user use code coupon
    if (code){
      data = await checkCoupon(userId, webinar,quantity,ticket.price,'webinar', langCode, code);
      if (data.success){
        total = data.price_discount;
        data.apply_code = true;
        data.price_discount = data.price_discount * rate;
      } else {
        data.apply_code = false;
      }
      delete data.success;
    }
    //console.log('data: ', data)
    //end
    let buyAble = false, reason = '';
    if(ticket.quantity - ticket.sold < quantity) {
      reason = 'out_of_stock';
    } else if (user.balance < total) {
      reason = 'missing';
      data.missing = total - user.balance;
    } else {
      buyAble = true;
    }
    if(!buyAble) {
      if(reason === 'missing'){
        data.missing = langCode === 'vi' ? await HandleNumber.numberRound((data.missing) * rate, 1000) : (data.missing) * rate;
        if(currency == 'USD' && data.missing < 0.5){
          data.missing = 0.5
        }
        if(currency == 'VND' && data.missing < 10000){
          data.missing = 10000
        }
      }
    }
    let dataWebinar = {
      balance: balance,
      price: ticket.price * rate,
      buyAble: buyAble,
      quantity: ticket.quantity - ticket.sold,
      currency: currency,
      reason: reason
    };
    Object.assign(data, dataWebinar);
    return data;
  } catch (err) {
    console.log('err on checkBuyAble:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function bookWebinarTicket(userId, ticketId, quantity, langCode, contactInfo, affCode, code) {
  try {
    let resources = await Promise.all([
      User.findById(userId, 'balance'),
      WebinarTicket.findById(ticketId),
    ]);
    let historyCoupon;
    let user = resources[0], ticket = resources[1];
    if(!ticket) {
      return Promise.reject({status: 404, success:false, error: msg_error.TICKET_NOT_FOUND});
    }
    let webinar = await LiveStream.findById(ticket.webinar).lean();
    if(ticket.quantity - ticket.sold < quantity) {
      return Promise.reject({status: 400, success:false, error: msg_error.INVALID_QUANTITY});
    }

    let total = quantity * ticket.price;
    // If user use code coupon
    if (code){
      historyCoupon = await checkCoupon(userId, webinar, quantity, ticket.price, 'webinar', langCode, code);
      if (!historyCoupon.success){
        return Promise.reject(historyCoupon);
      }
      delete historyCoupon.success;
      total = historyCoupon.price_discount;
    }
    total = parseFloat(total.toString());
    if(user.balance < total) {
      return Promise.reject({status: 400, success:false, error: msg_error.NOT_ENOUGH_BALANCE, missing: total - user.balance});
    }
    let tesseBank = await User.findById(configs.tesseBank._id);

    let fee = (configs.webinar_fee * total).toFixed(2);


    let bookingWebinar = {
      webinar: ticket.webinar,
      user: userId,
      ticket: ticketId,
      amount: quantity,
      price: ticket.price,
      total,
      uniqueCode: await generateUniqueCode(ticket.webinar, quantity),
      fee: fee,
      creator_receive: total - fee,
      currency: configs.currency[langCode] ? configs.currency[langCode] : 'USD',
      priceRate: configs.moneyExchangeRate[langCode] ? configs.moneyExchangeRate[langCode] : 1,
      contactInfo: {
        fullName: contactInfo.fullName,
        email: contactInfo.email,
        phoneNumber: contactInfo.phoneNumber,
      }
    };
    if (code){
      bookingWebinar.code = code;
    }
    user.balance = (user.balance - total).toFixed(2);
    await user.save();
    tesseBank.balance = (tesseBank.balance + total).toFixed(2);
    await tesseBank.save();

    let booked = await BookingWebinar.create(bookingWebinar);

    Q.create(globalConstants.jobName.CREATE_PMT_HISTORY, {booked, action: 'book_webinar_ticket'}).removeOnComplete(true).save();
    Q.create(globalConstants.jobName.CREATE_AFF_HISTORY,{type: 3, orderObject: booked, affCode}).removeOnComplete(true).save();

    ticket.sold += quantity;
    await ticket.save();

    if(webinar.booked.indexOf(user._id) < 0) {
      await LiveStream.update(
        {_id:ticket.webinar},
        {
          $push:{
            booked:user._id
          }
        }
      );
    }
    if (code){
      historyCoupon.paymentId = booked._id;
      await HistoryCoupon.create(historyCoupon);
    }
    return {
      balance: user.balance,
      booked: booked
    }
  } catch (err) {
    console.log('err on bookWebinarTicket:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

async function generateUniqueCode(webinarId, quantity) {
  try {
    let booking = await BookingWebinar.find({webinar: webinarId}, 'uniqueCode').lean();
    let codes = [];
    booking.forEach(book => Array.prototype.push.apply(codes, book.uniqueCode));
    let results = [];
    while(results.length < quantity) {
      let uniqueCode;
      do {
        uniqueCode = generateInviteCode(8);
      } while (codes.indexOf(uniqueCode) >= 0);

      results.push(uniqueCode);
    }


    return results;
  } catch (err) {
    console.log('err on generateUniqueCode:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getBookedTickets(webinarId, userId) {
  try {
    return await BookingWebinar.find({webinar: webinarId, user: userId}, 'contactInfo uniqueCode').lean();
  } catch (err) {
    console.log('err on getBookedTickets:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function getAuthorBookedTickets(webinarId, userId) {
  try {
    let webinarInfo = await LiveStream.findOne({_id: webinarId, user: userId}).lean();
    if(webinarInfo){
      return await BookingWebinar.find({webinar: webinarId}, 'contactInfo uniqueCode created_at').lean();
    }
    return null
  } catch (err) {
    console.log('err on getBookedTickets:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}
/*Todo: Than hardCode number item = 1000*/
export async function statisticWebinar(webinarId, page) {
  try {
    let skip = (page - 1) * 1000;
    let conditions = { webinar: webinarId };
    let results = await Promise.all([
      BookingWebinar.aggregate([
        {
          $match: {webinar: mongoose.Types.ObjectId(webinarId)}
        },
        {
          $group: {
            _id: '$webinar',
            sum_price: {'$sum': '$total'},
            sum_fee: {'$sum': '$fee'},
            sum_income: {$sum: '$creator_receive'}
          }
        }
      ]),
      BookingWebinar.count(conditions),
      BookingWebinar.find(conditions, 'contactInfo price amount total ﻿priceRate ﻿currency').sort({created_at: -1}).skip(skip).limit(10)
    ]);

    let summary = results[0][0], total_items = results[1], histories = results[2];
    if(!summary) {
      summary = {}
    }
    summary.fee = configs.webinar_fee;
    return {
      summary,
      history: {
        current_page: page,
        last_page: Math.ceil(total_items / 1000),
        total_items,
        data: histories
      }
    }
  } catch (err) {
    console.log('err on statisticWebinar:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}

export async function validateTicket(webinarId, ticketCode) {
  try {
    let booking = await BookingWebinar.findOne({webinar: webinarId, uniqueCode: ticketCode}).lean();
    return !!booking;
  } catch (err) {
    console.log('err on validateTicket:', err);
    return Promise.reject({status: 500, error: 'Internal error.'});
  }
}


export async function removeWebinarTicket(webinarId) {
  try{

  }catch (err){
    console.log('')
  }
}
