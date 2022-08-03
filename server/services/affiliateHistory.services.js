import AffiliateHistory from '../models/affiliateHistory';
import User from '../models/user';
import JoinCourse from '../models/joinCourse';
import Course from '../models/courses';
import MemberShip from '../models/memberShip';
import BookingWebinarModel from '../models/bookingWebinar';
import LiveStreamModel from '../models/liveStream';
import * as HandleNumber from '../util/HandleNumber';
import TransactionDetail from '../models/transactionDetail';
import ArrayHelper from '../util/ArrayHelper';
import configs from '../config'

export const LIMIT = 10;

export async function getMyAffiliateHistories(ownerId, page, lang) {
  try {
    let skip = (page - 1) * LIMIT;
    let conditions = { owner: ownerId };
    let results = await Promise.all([
      AffiliateHistory.count(conditions),
      AffiliateHistory.find(conditions).sort({ createdAt: -1 }).skip(skip).limit(LIMIT).lean()
    ]);

    let total_items = results[0];
    let data = await getMetadata(results[1], lang, false);
    let statistic = {
      total: 0,
      received: 0,
      left: 0,
      currency: lang === 'en' ? 'USD' : 'VND'
    };

    data.forEach((item) => {
      statistic.total += item.value;
      if (item.isWithdrawn) {
        statistic.received += item.value;
      } else {
        statistic.left += item.value
      }
    });

    return {
      data,
      statistic,
      total_items,
      current_page: page,
      last_page: Math.ceil(total_items / LIMIT),
    };
  } catch (err) {
    console.log('err on getMyAffiliateHistories:', err);
    return Promise.reject({ status: 500, error: 'Internal error.' });
  }
}


export async function getMetadata(affHistoryModels, lang, checkuser) {
  try {
    if (!(affHistoryModels instanceof Array)) {
      affHistoryModels = [affHistoryModels];
    }
    affHistoryModels = JSON.parse(JSON.stringify(affHistoryModels));

    let userIds = [];
    let joinCourseIds = [];
    let transactionDetailIds = [];
    let bookingWebinarsIds = [];
    let memberShips = [];
    let owners = [];
    affHistoryModels.forEach(affHistory => {
      owners.push(affHistory.owner);
      userIds.push(affHistory.user);
      if (affHistory.type === 1)
        transactionDetailIds.push(affHistory.orderObject);
      else if (affHistory.type === 2) {
        joinCourseIds.push(affHistory.orderObject);
      } else if (affHistory.type === 3){
        bookingWebinarsIds.push(affHistory.orderObject);
      } else {
        memberShips.push(affHistory.orderObject)
      }
    });

    let resources = await Promise.all([
      User.formatBasicInfo(User, userIds),
      JoinCourse.find({ _id: { $in: joinCourseIds } }).lean(),
      TransactionDetail.find({ _id: { $in: transactionDetailIds } }).lean(),
      BookingWebinarModel.find({ _id: { $in: bookingWebinarsIds } }).lean(),
      MemberShip.find({_id: {$in : memberShips}}).lean(),
      User.formatBasicInfo(User, owners)
    ]);
    let users = resources[0];
    let ownerss = resources[5];
    let joinCourses = JSON.parse(JSON.stringify(resources[1]));
    let transactionDetails = JSON.parse(JSON.stringify(resources[2]));
    let bookedWebinars = JSON.parse(JSON.stringify(resources[3]));
    let listMemberships = JSON.parse(JSON.stringify(resources[4]));

    let userMapper = ArrayHelper.toObjectByKey(users, '_id');
    let ownerMapper = ArrayHelper.toObjectByKey(ownerss, '_id');
    let courseIds = joinCourses.map(joinCourse => joinCourse.course);
    let webinarIds = bookedWebinars.map((webinar) => webinar.webinar);
    let sharerCuids = transactionDetails.map(transactionDetail => transactionDetail.sharers);

    let resources_2 = await Promise.all([
      Course.find({ _id: { $in: courseIds } }).lean(),
      User.find({ cuid: { $in: sharerCuids } }, 'cuid userName avatar fullName expert').lean(),
      LiveStreamModel.find({ _id: { $in: webinarIds } }).lean()
    ]);
    let courseMapper = ArrayHelper.toObjectByKey(resources_2[0], '_id');
    let sharerMapper = ArrayHelper.toObjectByKey(resources_2[1], 'cuid');
    let webinarMapper = ArrayHelper.toObjectByKey(resources_2[2], '_id');

    joinCourses = joinCourses.map(joinCourse => {
      return {
        _id: joinCourse._id,
        course: courseMapper[joinCourse.course]
      };
    });
    transactionDetails = transactionDetails.map(transactionDetail => {
      return {
        _id: transactionDetail._id,
        sharer: sharerMapper[transactionDetail.sharers]
      };
    });
    bookedWebinars = bookedWebinars.map(webinar => {
      return {
        _id: webinar._id,
        webinar: webinarMapper[webinar.webinar]
      };
    });

    let joinCourseMapper = ArrayHelper.toObjectByKey(joinCourses, '_id');
    let trxDetailMapper = ArrayHelper.toObjectByKey(transactionDetails, '_id');
    let webinarDetailMapper = ArrayHelper.toObjectByKey(bookedWebinars, '_id');
    listMemberships = ArrayHelper.toObjectByKey(listMemberships, '_id');

    const resultChooser = {
      1: trxDetailMapper,
      2: joinCourseMapper,
      3: webinarDetailMapper,
      4: listMemberships
    };
    return affHistoryModels.map(affHistory => {
      affHistory.user = userMapper[affHistory.user];
      if(checkuser){
        affHistory.owner = ownerMapper[affHistory.owner];
      }
      // console.log('hihi',resultChooser);
      if (lang === 'vi') {
        affHistory.currency = 'VND';
        affHistory.value = parseInt(affHistory.value * configs.moneyExchangeRate[lang]);
      } else {
        affHistory.currency = 'USD'
      }
      affHistory.orderObject = resultChooser[affHistory.type][affHistory.orderObject];
      return affHistory;
    });
  } catch (err) {
    console.log('err on getMetadata:', err);
    return Promise.reject({ status: 500, error: 'Internal error.' });
  }
}

export async function getAllAffiliates(options) {
  try{
    let conditions = {};
    if(options.type === 'course'){
      conditions.type = 2;
    }
    if(options.type === 'webinar'){
      conditions.type = 3;
    }
    if(options.type === 'membership'){
      conditions.type = 4;
    }
    if(options.user){
      conditions.user = options.user;
    }
    if(options.status !== 1){
      conditions.isWithdrawn = options.status;
    }
    if(options.to && !options.from){
      conditions.timestamp = {$lt:options.to}
    }
    if(options.from && !options.to){
      conditions.timestamp = {$gt:options.from}
    }
    if(options.from && options.to){
      conditions.timestamp = {$gt:options.from, $lt:options.to}
    }
    let results = await Promise.all([
      AffiliateHistory.count(conditions),
      AffiliateHistory.find(conditions).sort({createdAt:-1}).limit(options.limit).skip(options.skip).lean()
    ]);
    let data = await getMetadata(results[1], options.lang, true);
    let statistic = {
      total: 0,
      received: 0,
      left: 0,
      currency: options.lang === 'en' ? 'USD' : 'VND'
    };

    data.forEach((item) => {
      statistic.total += item.value;
      if (item.isWithdrawn) {
        statistic.received += item.value;
      } else {
        statistic.left += item.value;
      }
    });
    return [results[0], data, statistic];
  }catch (err){
    console.log('err on getAllAffiliates:', err);
    return Promise.reject({ status: 500, error: 'Internal Server Error' });
  }
}
export async function approveAffiliate(options) {
  try{
    let affHistory = await AffiliateHistory.find({_id:{$in:options.affiliates}});
    let tesseBank = await User.findById(configs.tesseBank._id);
    let total = 0;
    let total_approve = 0;
    let miss_withdrawal = 0;
    let accepted = [];
    let withdrawaled = [];
    let rejected = [];
    for(let i = 0 ; i < affHistory.length; i++){
      if(affHistory[i].isWithdrawn || tesseBank.balance < (total + affHistory[i].value)){
        if(tesseBank.balance < (total + affHistory[i].value) && !affHistory[i].isWithdrawn){
          miss_withdrawal += affHistory[i].value;
          rejected.push(affHistory[i]);
        } else {
          withdrawaled.push(affHistory[i]);
        }
      } else {
        let owner = await User.findById(affHistory[i].owner);
        if (owner){
          owner.balance += affHistory[i].value;
          await owner.save();
          affHistory[i].isWithdrawn = true;
          await affHistory[i].save();
          accepted.push(affHistory[i]);
          total += affHistory[i].value;
          total_approve +=1;
        }
      }
    }
    // let promises = affHistory.map(async e=>{
    //   if(e.isWithdrawn || tesseBank.balance < (total + e.value)){
    //     let aff = JSON.parse(JSON.stringify(e));
    //     miss_withdrawal += e.value;
    //     aff.msg = e.isWithdrawn ? 'You had withdrawal !' : 'Tesse not enough money !';
    //     rejected.push(aff);
    //     return aff;
    //   }
    //   let owner = await User.findById(e.owner);
    //   if (owner){
    //     owner.balance += e.value;
    //     await owner.save();
    //     e.isWithdrawn = true;
    //     await e.save();
    //     accepted.push(e);
    //     total += e.value;
    //     total_approve +=1;
    //   }
    //   return e;
    // });
    // await Promise.all(promises);
    tesseBank.balance -= total;
    await tesseBank.save();
    return [{
      total: affHistory.length,
      total_reject: rejected.length,
      total_withdrawaled:withdrawaled.length,
      total_accepted: total_approve,
      currency: options.lang === 'vi' ? 'VND' : 'USD',
      priceByUSD: options.lang === 'vi' ? '23000' : '1',
      miss_withdrawal: options.lang === 'vi' ?  Math.round(miss_withdrawal*23000): miss_withdrawal,
      total_withdrawal : options.lang === 'vi' ?  Math.round(total*23000): total
    }, accepted, rejected, withdrawaled];
  }catch (err){
    console.log('err on getMetadata:', err);
    return Promise.reject({ status: 500, error: 'Internal error.' });
  }
}
