// import Post from './models/post';
// import PostDescription from './models/postDescription';
// import PostComment from './models/postComment';
// import PostCommentReply from './models/postCommentReply';
// import PostRating from './models/postRating';
import User from './models/user';
// import Skill from './models/skill';
// import UserRating from './models/userRating';
// import UserToCategory from './models/userToCategory';
// import UserToTag from './models/userToTag';
// import Category from './models/category';
// import CategoryDescription from './models/categoryDescription';
// import Tags from './models/tags';
// import Rating from './models/rating';
// import RatingDescription from './models/ratingDescription';
// import RatingGroup from './models/ratingGroup';
// import RatingGroupDescription from './models/ratingGroupDescription';
import Criteria from './models/criteria';
//import {load} from 'mongodb';
import LanguageSupport from './models/languageSupport';
import Country from './models/country';
import State from './models/state';
import configs from './config';
import logger from './util/log';

//import Redis from './libs/Redis';
// import MongoScripts from './scripts/mongo_scripts';
import StringHelper from './util/StringHelper';
// import { slugBuilder } from './util/string.helper';
// import migrate_skills_to_elasticsearch_2 from './scripts/migrate/migrate_skills_to_elasticsearch_2';
// import migrate_users_to_elasticsearch from './scripts/migrate/migrate_users_to_elasticsearch';
// import migrate_knowledge_to_elasticsearch from './scripts/migrate/migrate_knowledge_to_elasticsearch';
// import migrate_question_to_elasticsearch from './scripts/migrate/migrate_questions_to_elasticsearch';
// import migrate_category_new_format from './scripts/migrate/migrate_category_new_format';
import { generateInviteCode, generatePassword } from './models/functions'
// import sanitizeHtml from 'sanitize-html';
// import cuid from 'cuid';
import { getObjectId } from './util/string.helper';
import { languageSupportData } from './constants';
import countries from '../mongo/countries.data';
import states from '../mongo/countryState';

export default async function () {
  // let scriptsImported = await Redis.get('mongoscripts');
  // console.log('mongo scripts imported:', scriptsImported);
  // if(!scriptsImported) {
  //   let mongoScripts = new MongoScripts();
  //   await mongoScripts.startImport();
  //   Redis.set('mongoscripts', {data: true})
  // }

  Criteria.count()
    .then(count => {
      if(count) {
        return;
      }
      const criterion = [
        {name: 'Expert Communication', key: 'exc'},
        {name: 'Service as Described', key: 'sad'},
        {name: 'Professional', key: 'pro'},
        {name: 'Not Prolonged', key: 'npr'}
      ];
      Criteria.create(criterion)
        .then(criterion => {
          if(criterion) {
            console.log('dummy criterion success.');
            let reviews = {
              numRate: 0,
              details: criterion.map(criteria => {
                return {
                  criteriaId: criteria._id,
                  criteriaName: criteria.name,
                  avgRate: 0
                };
              })
            };
            return User.update({}, {$set: {reviews: reviews}}, {multi: true}).exec();
          }
          return console.log('dummy criterion fail.');
        })
    });
/*
  let categories = await Category.find({slug: null});
  let promises = categories.map(cate => {
    cate.slug = slugBuilder(cate.title);
    return cate.save();
  });
  await Promise.all(promises);
*/

  let languages = await LanguageSupport.find().lean();
  languages.forEach(language => {
    configs.languageMapper[language.cuid] = {cuid: language.cuid, name: language.name};
  });
  // await Promise.all([
    // migrate_skills_to_elasticsearch_2(),
    // migrate_knowledge_to_elasticsearch(),
    // migrate_question_to_elasticsearch()
  // ])

  let users = await User.find({affiliateCode: null});
  let affiliateCode;
  let affiliateCodes = [];
  let userPromises = users.map(async user => {
    do {
      affiliateCode = generateInviteCode();
    } while (affiliateCodes.indexOf(affiliateCode) >= 0);
    affiliateCodes.push(affiliateCode);
    user.affiliateCode = affiliateCode;
    return user.save();
  });
  await Promise.all(userPromises);
  // await migrate_category_new_format();

/*  let new_skills = require('./skills.json');
  let new_skill_promises = new_skills.map(skill => {
    let description = skill.description;
    return Skill.update({_id: skill._id}, {$set: {description: description}});
  });
  await Promise.all(new_skill_promises);
  console.log('migrate new skill done.');
*/
  //Create functions
  //  load('../../Documents/mongodb script/getHistory/01192017/functions/getFollow.min.js');
  //var db = require('mongodb').Db;
  //db.system.js.save({_id:"getAmountShareAndLearnTest",value:function(t){var a={userID:t,sharing:{totalTransaction:0,totalAmount:0},learning:{totalTransaction:0,totalAmount:0}},n=db.transactions.aggregate([{$match:{sharers:t}},{$group:{_id:"$sharers",totalTransaction:{$sum:1},totalAmount:{$sum:"$moneyEarnings"}}}]).toArray();n.length>0&&(a.sharing.totalTransaction=n[0].totalTransaction,a.sharing.totalAmount=n[0].totalAmount.toFixed(2));var o=db.transactiondetails.aggregate([{$match:{learnerID:t}},{$group:{_id:"$learnerID",totalTransaction:{$sum:1},totalAmount:{$sum:"$fees"}}}]).toArray();return o.length>0&&(a.learning.totalTransaction=o[0].totalTransaction,a.learning.totalAmount=o[0].totalAmount.toFixed(2)),a}});
}

export async function initBankUserAccount() {
  try {
    const accountCount = await User.count({ _id: configs.tesseBank._id });
    if (accountCount) {
      return true;
    }
    const userCount = await User.count({});
    await User.create({
      _id: getObjectId(configs.tesseBank._id),
      cuid: configs.tesseBank.cuid,
      email: 'bankaccount@mail.com',
      firstName: 'Bank',
      lastName: 'Account',
      fullName: 'Bank Account',
      verifyPhone: false,
      active: -1,
      token: generatePassword(30),
      status: -1,
      code: StringHelper.generalCodeUser(userCount + 1),
    });
    return true;
  } catch (error) {
    logger.error('initBankUserAccount error:');
    logger.error(error);
    throw error;
  }
}

export async function initChatBotAccount() {
  try {
    const accountCount = await User.count({ _id: configs.tess._id });
    if (accountCount) {
      return true;
    }
    const userCount = await User.count({});
    await User.create({
      _id: getObjectId(configs.tess._id),
      cuid: configs.tess.cuid,
      email: 'botchat@mail.com',
      firstName: 'Chat',
      lastName: 'Bot',
      fullName: 'Chat Bot',
      verifyPhone: false,
      active: -1,
      token: generatePassword(30),
      status: -1,
      code: StringHelper.generalCodeUser(userCount + 1),
    });
    return true;
  } catch (error) {
    logger.error('initChatBotAccount error:');
    logger.error(error);
    throw error;
  }
}

export async function initChatSupportAccount() {
  try {
    const accountCount = await User.count({ _id: configs.supportAccounts.tesseSupport._id });
    if (accountCount) {
      return true;
    }
    const userCount = await User.count({});
    await User.create({
      _id: getObjectId(configs.supportAccounts.tesseSupport._id),
      cuid: configs.supportAccounts.tesseSupport.cuid,
      email: 'chatsupport@mail.com',
      firstName: 'Chat',
      lastName: 'Support',
      fullName: 'Chat Support',
      verifyPhone: false,
      active: -1,
      token: generatePassword(30),
      status: -1,
      code: StringHelper.generalCodeUser(userCount + 1),
    });
    return true;
  } catch (error) {
    logger.error('initChatSupportAccount error:');
    logger.error(error);
    throw error;
  }
}

export async function initCustomerSupportAccount() {
  try {
    const accountCount = await User.count({ _id: configs.supportAccounts.customerSupport._id });
    if (accountCount) {
      return true;
    }
    const userCount = await User.count({});
    await User.create({
      _id: getObjectId(configs.supportAccounts.customerSupport._id),
      cuid: configs.supportAccounts.customerSupport.cuid,
      email: 'customersupport@mail.com',
      firstName: 'Customer',
      lastName: 'Support',
      fullName: 'Customer Support',
      verifyPhone: false,
      active: -1,
      token: generatePassword(30),
      status: -1,
      code: StringHelper.generalCodeUser(userCount + 1),
    });
    return true;
  } catch (error) {
    logger.error('initCustomerSupportAccount error:');
    logger.error(error);
    throw error;
  }
}

export async function initLanguageSupport() {
  try {
    const promises = languageSupportData.map(async (lang) => {
      const langFound = await LanguageSupport.findOne({ code: lang.code });
      if (!langFound) {
        await LanguageSupport.create(lang);
      }
      return true;
    });
    await Promise.all(promises);
    return true;
  } catch (error) {
    logger.error('initLanguageSupport error:');
    logger.error(error);
    throw error;
  }
}

export async function initCountries() {
  try {
    const countryCount = await Country.count({});
    if (countryCount) {
      return true;
    }
    const promises = countries.map(async (country) => {
      await Country.create(country);
      return true;
    });
    await Promise.all(promises);
    return true;
  } catch (error) {
    logger.error('initCountries error:');
    logger.error(error);
    throw error;
  }
}

export async function initStateCountry() {
  try {
    const stateCount = await State.count({});
    if (stateCount) {
      return true;
    }
    const promises = states.map(async (country) => {
      const hasCountry = await Country.findOne({ ISO3: country.code3, ISO2: country.code2 }, '-__v -cuid -dateModified -dateAdded');
      if (!country || !hasCountry) return true;
      const insertState = country.states.map(async (state) => {
        await State.create({
          name: state.name,
          IOS2: country.code2,
          IOS3: country.code3,
          countryId: hasCountry._id
        });
        return true;
      });
      await Promise.all(insertState);
    });
    await Promise.all(promises);
    return true;
  } catch (error) {
    logger.error('initStateCountry error:');
    logger.error(error);
    throw error;
  }
}