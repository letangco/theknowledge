import User from '../models/user.js';
import UserOption from '../models/userOption.js';
import Payment from '../models/payment.js';
import Withdrawal from '../models/withdrawal';
import Country from '../models/country.js';
import Notification from '../models/notification';
import ChatGroup from '../models/chatGroup';
import EmailInivte from '../models/emailInvite';
import sanitizeHtml from 'sanitize-html';
import cuid from 'cuid';
import Membership from '../models/memberShip';
import * as Sheet_Services from '../services/sheet.services';
// import {updateChatGroupUserInfo} from '../controllers/chatGroup.controller';
import { updateChatGroupUserInfo } from "../services/chatGroup.services";
import { hash, validate, generatePassword, checkTimeRedelete } from '../models/functions.js';
import { getUserSupportState, isUserSessionReady } from '../routes/socket_routes/chat_socket';
import Skill from '../models/skill';
import SuggestSkill from '../models/suggestSkill';
import Category from '../models/category';
import moment from 'moment';
import jwt from '../libs/jwToken';
import { Q } from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import { cacheImage } from '../libs/imageCache';
import globalConstants, { ERR_CODE } from '../../config/globalConstants';
import ArrayHelper from '../util/ArrayHelper';
import UserUseInviteCode from '../models/userUseInviteCode';
import { formatSkillByLanguage } from "./skill.controller";
import { formatCategoryByLanguage } from "./category.controller";
import serverConfig from '../config';
import ExchangePoints from '../models/exchangePoint';
import Notifications from "../models/notificationNew";
import { buyMemberShip, checkMemberShip, checkResTrialMembership, sendCodeTrialToEmail, queryMembership, searchMembership, activeMembershipByCode } from "../services/memberShip.services";
import { searchUserByEmail, generalCodeUser, verifyAuthPhone, verifyPhoneUser,
      createUserByPhoneService, addSubscriptionNewsletter,
      getListNewsAgentByAdminService, createQuestionPointTestService,
      getListQuestionPointTestService, 
      deleteQuestionPointTestService,
      getDetailQuestionPointTestService,
      updateQuestionPointTestService, 
      getProfileByTokenService,
      createNewsByAdminService,
      getDetailNewsByAdminService,
      updateNewsByAdminService,
      deleteNewsByAdminService,
      getListNewestService,
      getDetailNewsService,
      getNewsCarouselService,
      createTagsAgentByAdminService,
      getListTagsAgentByAdminService,
      getDetailTagsAgentByAdminService,
      deleteTagsAgentsByAdminService,
      updateTagsAgentByAdminService,
      getUserManagementByAdminService,
      getDetailUserManagementByAdminService,
      updateStatusUserVirtualAgentByAdminService}
      from "../services/users.service";
// import { addTaskReferral, updateTaskInviteRegister, addTaskLoginApp, plusTaskToUser, addTaskLogin } from "../services/tasks.service";
import StringHelper from "../util/StringHelper";
// import Task from "../models/task";
import MemberShip from '../models/memberShip';
import { getViewTrackingForUser } from "../services/userViewTracking.services";
import { emitAppLoggedIn, emitAppLoginFailed } from "../routes/socket_routes/appLogin";
import HistoryActionUser from '../models/historyActionUser';
import UserTrackingViewStream from '../models/userViewStreamTracking';
import LiveStream from '../models/liveStream';
import { addTeacherRegistration } from '../services/teacherRegistration.service';
import { buildSlugUserName } from "../services/course.services";
import { commonGetQuery } from '../virtual_agent/query.js';
import AgentModel from '../models/agentInfo';
import AgentTagsModel from '../models/agentTags';
import StateModel from '../models/state';

const USER_PER_PAGE_ADMIN = 30;

export async function addUser(req, res) {

  if (!req.body.user.name || !req.body.user.username || !req.body.user.email) {
    res.status(403).end();
  }
  const newUser = new User(req.body.user);
  // Let's sanitize inputs
  newUser.name = sanitizeHtml(newUser.name);
  newUser.username = sanitizeHtml(newUser.username);
  newUser.email = sanitizeHtml(newUser.email);
  newUser.cuid = cuid();
  let count = await User.count({});
  newUser.code = StringHelper.generalCodeUser(count + 1);
  newUser.save(async (err, saved) => {
    if (err) {
      res.status(500).send(err);
    }
    // if(req.body.refTask){
    //   await addTaskReferral(saved, req.body.refTask)
    // }
    res.json({ user: saved });
  });
}

/**
 * Get user simple info (get a part of user info) via api call
 * @param req
 * @param res
 */
export function getUserCmtInfo(req, res) {
  let cuidArray = JSON.parse(req.params.cuidArray);
  User.find({ "cuid": { $in: cuidArray } }, 'code avatar firstName lastName userName country cuid online priceChat priceCall firstMinFree').exec((err, cmtUserInfoArr) => {
    if (cmtUserInfoArr !== null) {
      res.json({ cmtUserInfoArr });
    }
  });
}

export function expertApproved(req, res) {
  User.find({ "expert": 2 }, 'code cuid avatar fullName userName online country').exec((err, users) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json({ users });
  });
}

/*Thân: get all user with base information*/
export async function getAllUserInfoBase(req, res) {
  let users = await User.getAllUserBasicInfo(User)
  res.json({ users });
}

export async function testCacheImage(req, res) {
  let data = {
    src: 'uploads/stream-thumb/59f74d6ee265232cb87dbc20/1521539377867-stream-thumbnail.png',
    size: 500
  }
  await cacheImage(data);
}

export function approvedExpert(req, res) {
  User.update({ cuid: req.body.cuid }, {
      $set: { expert: 1 }
    },
    function (err, numberAffected, rawResponse) {
      if (err) {
        res.status(500).send(err);
      }
      if (numberAffected.nModified > 0) {
        getSimpleUserInfoById(req.body.cuid).then((user) => {
          var dataSendMail = {
            type: 'approvedExpert',
            language: req.headers.lang,
            data: {
              cuid: user.cuid,
              firstName: user.firstName,
              lastName: user.lastName,
              userName: user.userName,
              email: user.email
            }
          };
          Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
          // sendMail(dataSendMail);
          res.json({ result: 2 });
        });
      } else {
        res.json({ result: 1 });
      }
    });
}

export async function adminRejectExpert(req, res) {
  let ids = [];
  if (req.body.ids) {
    ids = req.body.ids;
  } else if (req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide User's Id(s) to reject become Expert."
    });
  }

  let conditions = { _id: { $in: ids } };
  let updateOptions = {
    $set: { active: 1, expert: 0 }
  };
  try {
    await User.update(conditions, updateOptions, { multi: true }).exec();
    if (req.body.ids) {
      let users = await User.find({ _id: { $in: ids } }).exec();
      users.forEach(userInfo => {
        var dataSendMail = {
          type: 'rejectExpert',
          language: req.headers.lang,
          data: {
            cuid: userInfo.cuid,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            userName: userInfo.userName,
            email: userInfo.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
        var dataNotify = {
          to: userInfo._id,
          type: 'rejectExpert',
          data: {}
        };
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
        // addNotification(dataNotify);
      });
    } else if (req.body.id) {
      getSimpleUserInfoByIdObject(req.body.id).then((user) => {
        var dataSendMail = {
          type: 'rejectExpert',
          language: req.headers.lang,
          data: {
            cuid: user.cuid,
            firstName: user.firstName,
            lastName: user.lastName,
            userName: user.userName,
            email: user.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
        var dataNotify = {
          to: user._id,
          type: 'rejectExpert',
          data: {}
        };
        // addNotification(dataNotify);
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
        res.json({ result: 2 });
      });
    }
    return res.json({ success: true });
  } catch (err) {
    console.log('err on rejectExpert:', err);
    return res.status(500).json(err);
  }
}

/**
 * Get User info by cuid
 * @param req
 * @param res
 */
export function getUserByCuid(req, res) {
  let token = req.headers && req.headers.token ? req.headers.token : '';
  let langCode = req.headers.lang || req.params.lang;
  if (!langCode || langCode === 'null') {
    console.log('null cmnr');
    langCode = 'en';
  }

  getSimpleUserInfoById(req.params.cuid, token, langCode).then((user) => {
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ user });
  });
}

/**
 * Get User info by username
 * @param req
 * @param res
 */
export function getUserByUsername(req, res) {
  let token = req.headers && req.headers.token ? req.headers.token : '';
  let langCode = req.headers.lang || req.params.lang;
  if (!langCode || langCode === 'null') {
    console.log('null cmnr');
    langCode = 'en';
  }
  getSimpleUserInfoByUsername(req.params.username, token, langCode).then((user) => {
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ user });
  });
}

export function getUserMetaByUsername(req, res) {
  User.findOne({ userName: req.params.username.toLowerCase(), active: 1 },
    'code firstName lastName fullName categories avatar reviews'
  ).exec(async (err, user) => {
    if (err) {
      return res.json({});
    }
    if (!user) {
      return res.json({});
    }
    let meta = User.getMeta(user);
    return res.json(meta);
    // try {
    //   let tags = [];
    //   let description = '';
    //   let thumbnails = [];
    //   thumbnails.push(user.avatar);
    //   if(user.categories){
    //     description = user.categories[0].description;
    //     user.categories[0].skills.map(skill => {
    //       tags.push(skill.skill_ID);
    //     });
    //   }
    //   res.json({
    //     title : user.fullName ? user.fullName : user.firstName + ' ' + user.lastName ,
    //     description : description,
    //     tags : tags,
    //     type : '',
    //     thumbnails : thumbnails,
    //   });
    // } catch (err) {
    //   res.json({});
    // }
  });
}

export function getUserMetaByCuid(req, res) {
  User.findOne({ cuid: req.params.cuid, active: 1 },
    'code firstName lastName fullName categories avatar reviews'
  ).exec(async (err, user) => {
    if (err) {
      return res.json({});
    }
    if (!user) {
      return res.json({});
    }
    return res.json(User.getMeta(user));
    // try {
    //   let tags = [];
    //   let description = '';
    //   let thumbnails = [];
    //   thumbnails.push(user.avatar);
    //   if(user.categories.length > 0){
    //     description = user.categories[0].description;
    //     user.categories[0].skills.map(skill => {
    //       tags.push(skill.skill_ID);
    //     });
    //   }
    //   res.json({
    //     title : user.fullName ? user.fullName : user.firstName + ' ' + user.lastName ,
    //     description : description,
    //     tags : tags,
    //     type : '',
    //     thumbnails : thumbnails,
    //   });
    // } catch (err) {
    //   res.json({});
    // }
  });
}

/**
 * Get User info by token
 * @param req
 * @param res
 */
export async function getUserByToken(req, res) {
  try {
    let langCode = req.headers.lang || req.params.lang;
    if (!langCode || langCode === 'null') {
      langCode = 'en';
    }
    let user = await User.findOne({
      token: req.params.token,
      active: 1
    }, '-__v -attTotalRate -attRate -idSocial').lean();
    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found.' });
    }
    let unReceiveNotify = await Notifications.count({ to: user._id, status: false });
    await User.update({ _id: user._id }, { $set: { unReceiveNotify: unReceiveNotify } });
    let userId = user._id;
    let count = await User.count({ $and: [{ _id: userId }, { interested_skills: { $gt: [] } }] });
    let donePreFeed = count > 0;
    let rs = await Promise.all([
      UserUseInviteCode.findOne({ user: userId }).lean(),
      getUserCategoryWithSkill(user, true, langCode)
    ]);
    let usedInvite = rs[0], obj = rs[1];
    if (!obj.reviews) {
      obj.reviews = [];
    }
    obj.usedInviteCode = usedInvite ? usedInvite.code : '';
    obj.donePreFeed = donePreFeed;
    obj.avatarFull = obj.avatar;
    obj.unReceiveNotify = unReceiveNotify;
    obj.hasPass = !!user.password;
    delete user.password;
    if (obj && obj.avatar) {
      let data = {
        src: obj.avatar,
        size: 150
      };
      let thumb = await cacheImage(data);
      obj.avatar = thumb;
    }
    // if(req.query.version && req.query.version === 'app'){
    //   await addTaskLoginApp(userId)
    // }
    // await addTaskLogin(userId)
    return res.json({ user: obj });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json(err);
  }
}

/**
 * Get User info
 * @param userID
 * @param token
 */
export async function getSimpleUserInfoById(userID, token, langCode) {
  try {
    let promises = [
      User.findOne({ cuid: userID, active: 1 },
        '_id code cuid firstName lastName fullName userName birthday gender telephone active ' +
        'zipCode aboutUs email avatar socialLink priceCall priceChat firstMinFree expert role ' +
        'totalRate rate dateAdded country categories online totalConnect rating ' +
        'serviceRating serviceTotalRate languageSupport workExperience education award skills reviews inviteCode memberShip teacherMembership'
      )
    ];
    if (token) {
      promises.push(User.findOne({ token: token }, 'role'));
    }

    let results = await Promise.all(promises);

    if (!results.length) {
      return null;
    }

    let user = JSON.parse(JSON.stringify(results[0])), requester = results[1];
    if (!user) {
      return null;
    }
    if (user && user.avatar) {
      user.avatarFull = user.avatar;
      let data = {
        src: user.avatar,
        size: 150
      }
      let thumb = await cacheImage(data);
      user.avatar = thumb;
    }
    let obj = await getUserCategoryWithSkill(user, user.token === token || (requester && requester.role === globalConstants.role.ADMIN), langCode);
    if (!obj.reviews) {
      obj.reviews = [];
    }
    return obj;
  } catch (err) {
    return null;
  }
  // User.findOne({cuid: userID},
  //   '_id cuid firstName lastName fullName userName birthday gender telephone active ' +
  //   'zipCode email avatar socialLink priceCall priceChat firstMinFree expert role ' +
  //   'totalRate rate dateAdded country categories online totalConnect rating token ' +
  //   'serviceRating serviceTotalRate languageSupport workExperience education award skills reviews'
  // ).exec().then(async user => {
  //   if(!user) {
  //     return resolve(null);
  //   }
  //   let obj = await getUserCategoryWithSkill(user, user.token === token || user.role === globalConstants.role.ADMIN);
  //   if(!obj.reviews) {
  //     obj.reviews = [];
  //   }
  //   return resolve(obj);
  // })
  //   .catch(err => reject(err));
}

/**
 * Get User info
 * @param id
 */
export function getSimpleUserInfoByIdObject(id) {
  return new Promise((resolve, reject) => {
    User.findById(id,
      '_id code cuid firstName lastName fullName userName birthday gender telephone active ' +
      'zipCode aboutUs email avatar socialLink priceCall priceChat firstMinFree expert ' +
      'totalRate rate dateAdded country categories online totalConnect rating ' +
      'serviceRating serviceTotalRate languageSupport workExperience education award skills inviteCode memberShip teacherMembership'
    ).exec().then(async user => {
      let obj = JSON.parse(JSON.stringify(user));
      if (obj && obj.avatar) {
        obj.avatarFull = obj.avatar;
        let data = {
          src: obj.avatar,
          size: 150
        }
        let thumb = await cacheImage(data);
        obj.avatar = thumb;
      }
      return resolve(obj);
    })
      .catch(err => reject(err));
  });
}

async function getUserCategoryWithSkill(user, isOwn, languageCode) {
  if (!user) {
    return null;
  }
  let obj = JSON.parse(JSON.stringify(user));
  let cate = null, suggestions = null;
  if (isOwn) {
    suggestions = await SuggestSkill.find({userID: obj._id});
  }
  if (obj && obj.categories && obj.categories.length) {
    for (let i = 0, l = obj.categories.length; i < l; i++) {
      cate = obj.categories[i];
      // console.log('cate:', cate);
      let resources = await Promise.all([
        Category.findOne({cuid: cate.industry.industryID}),
        Category.findOne({cuid: cate.department.departmentID}),
        Skill.find({
          categoryID: cate.department.departmentID,
          _id: {$in: obj.skills}
        }, 'description').exec()
      ]);

      // get industry name by language
      let industry = resources[0];
      let industryLangIndex = ArrayHelper.findItemByProp(industry.description, 'languageID', languageCode);
      cate.industry.title = industry.description[industryLangIndex].name;

      // get department name by language
      let department = resources[1];
      if (department) {
        let departmentLangIndex = department && department.description ? ArrayHelper.findItemByProp(department.description, 'languageID', languageCode) : '';
        if (department.description && department.description[departmentLangIndex] && department.description[departmentLangIndex].name) {
          cate.department.title = department.description[departmentLangIndex].name;
        }
        let skills = await Skill.find({
          categoryID: cate.department.departmentID,
          _id: {$in: obj.skills}
        }, 'description').exec();
        skills = formatSkillByLanguage(skills, languageCode);
        cate.skills = skills.map(skill => {
          return {
            _id: skill._id,
            skill_ID: skill.description[0].name
          };
        });
        if (suggestions && suggestions.length) {
          let suggest = null;
          for (let j = 0, max = suggestions.length; j < max; j++) {
            suggest = suggestions[j];
            if (suggest.departmentID === cate.department.departmentID) {
              cate.skills.push({_id: suggest._id, skill_ID: suggest.skill, approved: false});
            }
          }
        }
      }
      obj.categories[i] = cate;
    }
    obj = await getUserReviewWithLanguage(obj, languageCode);
    return obj;
  } else  {
    return obj;
  }
}
/**
 * Get User info
 * @param username
 * @param token
 * @param langCode
 */
export async function getSimpleUserInfoByUsername(username, token, langCode) {
  try {
    let promises = [
      User.findOne({ userName: username.toLowerCase(), active: 1 },
        '_id code cuid firstName lastName fullName userName birthday gender telephone active ' +
        'zipCode aboutUs email avatar socialLink priceCall priceChat firstMinFree expert role ' +
        'totalRate rate dateAdded country categories online totalConnect rating ' +
        'serviceRating serviceTotalRate languageSupport workExperience education award skills reviews inviteCode memberShip teacherMembership'

      )
    ];
    if (token) {
      promises.push(User.findOne({ token: token }), 'username role');
    }

    let results = await Promise.all(promises);

    if (!results.length) {
      return null;
    }

    let user = JSON.parse(JSON.stringify(results[0])), requester = results[1];
    if (user && user.avatar) {
      user.avatarFull = user.avatar;
      let data = {
        src: user.avatar,
        size: 150
      }
      let thumb = await cacheImage(data);
      user.avatar = thumb;
    }
    return user ? await getUserCategoryWithSkill(user, user.token === token || (requester && requester.role === globalConstants.role.ADMIN), langCode) : null;
  } catch (err) {
    console.log('err on getSimpleUserInfoByUsername:', err);
    return null;
  }
}

async function getUserReviewWithLanguage(user, langCode) {
  if(user.reviews && user.reviews.length > 0){
    let promises = user.reviews.map(async review => {
      let category = await Category.findOne({ cuid: review.cateCuid }).lean();
      if(category){
        let categoryLangIndex = ArrayHelper.findItemByProp(category.description, 'languageID', langCode);
        if (category.description && category.description[categoryLangIndex] && category.description[categoryLangIndex].name) {
          review.cateName = category.description[categoryLangIndex].name;
        }
      } else {
        review.cateName = ''
      }
      return review;
    });
    user.reviews = await Promise.all(promises);
  }
  return user;
}

/**
 * Get User info with balance
 * Only use to get data in server-side
 * Do not use in client side via API
 * This is use for transactionController
 * Ask NTNHAN before change anything
 * @param userID
 */
export function getSimpleUserInfoByIdWithBalance(userID) {
  return new Promise((resolve) => {
    User.findOne({ cuid: userID },
      '_id code cuid firstName lastName fullName userName birthday gender telephone ' +
      'zipCode aboutUs email avatar socialLink balance priceCall priceChat firstMinFree expert ' +
      'totalRate rate dateAdded country categories online totalConnect rating ' +
      'serviceRating serviceTotalRate languageSupport workExperience education award'
    ).exec((err, user) => {
      if (err) {
        return resolve(err);
      }
      return resolve(user);
    });
  });
}

/**
 * Get user info for chat group
 * @param userID
 */
export async function getUserInfoForChatGroupById(userID) {
  return new Promise((resolve) => {
    User.findOne({ cuid: userID },
      '_id cuid firstName lastName fullName userName avatar priceCall priceChat firstMinFree expert country online'
    ).exec(async (err, user) => {
      if (err) {
        return resolve(err);
      }
      let obj = JSON.parse(JSON.stringify(user));
      if (obj && obj.avatar) {
        let data = {
          src: obj.avatar,
          size: 150
        }
        let thumb = await cacheImage(data);
        obj.avatar = thumb;
      }
      return resolve(obj);
    });
  });
}

/**
 * Get user info by _id
 * @param _id
 */
export async function getUserInfoByObjectId(_id) {
  return new Promise((resolve, reject) => {
    User.findOne({ _id },
      '_id code cuid firstName lastName fullName userName avatar categories country priceCall priceChat rate reviews serviceRating totalRate education online'
    ).exec(async (err, user) => {
      if (err) {
        reject(err);
      }
      let obj = JSON.parse(JSON.stringify(user));
      if (obj && obj.avatar) {
        let data = {
          src: obj.avatar,
          size: 150
        }
        let thumb = await cacheImage(data);
        obj.avatar = thumb;
      }
      resolve(obj);
    });
  });
}

export async function loginUser(req, res) {
  var email = req.body.user.username.toLowerCase();
  var password = req.body.user.password;
  User.findOne({ email: email },
    '-__v -attTotalRate -attRate -idSocial').lean().exec(async (err, userLogin) => {
    if (err) {
      res.status(500).send(err);
    }
    if (userLogin) {
      if (userLogin.active != 0) {
        if (userLogin.active != -2) {
          if (userLogin.active !== -1 && validate(userLogin.password, password)) {
            // login agent
            let hasAgent = await AgentModel.findOne({ user: userLogin._id }).select({ __v: 0, user: 0, cuid: 0, updatedAt: 0, createdAt: 0 });
            if (hasAgent) {
              if (hasAgent.status === 1) {
                userLogin.role = hasAgent.role;
                hasAgent = hasAgent.toJSON();
                // bearer token
                userLogin.bearerToken = jwt.issue({ _id: hasAgent._id.toString() });
                // agent info
                if (hasAgent?.state) {
                  const state = await StateModel.findOne({ _id: hasAgent.state }).select({ _id: 1, name: 1 });
                  hasAgent.state = state;
                }
                if (hasAgent?.country) {
                  const country = await Country.findOne({ _id: hasAgent.country }).select({ _id: 1, name: 1, ISO2: 1, ISO3: 1 });
                  hasAgent.country = country;
                }
                if (hasAgent?.tags) {
                  const hasTags = hasAgent.tags.map(async (tag) => {
                    const t = await AgentTagsModel.findOne({ _id: tag }).select({ _id: 1, tagName: 1, sort: 1 });
                    if (t._id) return t;
                  });
                  hasAgent.tags = (await Promise.all(hasTags)).filter(item => item).sort((a, b) => a.sort - b.sort);
                }
                userLogin.agentInfo = hasAgent;
                return res.status(200).json({
                  userLogin
                });
              }
            }
            var token = userLogin.token ? userLogin.token : generatePassword(30);

            let usedInviteCode = await UserUseInviteCode.findOne({ user: userLogin._id });
            User.update({ cuid: userLogin.cuid }, {
                $set: { token: token }
              },
              async function (err, numberAffected, rawResponse) {
                if (err) {
                  res.status(500).send(err);
                }
                if (userLogin && userLogin.avatar) {
                  let data = {
                    src: userLogin.avatar,
                    size: 150
                  }
                  let thumb = await cacheImage(data);
                  userLogin.avatar = thumb;
                }
                // if(req.query.version && req.query.version === 'app'){
                //   await addTaskLoginApp(userLogin._id)
                // }
                // await addTaskLogin(userLogin._id)
                userLogin.token = token;
                userLogin.usedInviteCode = usedInviteCode ? usedInviteCode.code : '';
                delete userLogin.password;
                // token register agent
                userLogin.bearerToken = jwt.issue({ _id: userLogin._id.toString() })
                res.json({ userLogin });
              });
          } else {
            var userLogin = {
              status: -1,
              warning: 'warningNoMatch'
            };
            res.json({ userLogin });
          }
        } else {
          if (userLogin.deleteDate && checkTimeRedelete(userLogin)) {
            if (validate(userLogin.password, password)) {
              var token = userLogin.token ? userLogin.token : generatePassword(30);

              User.update({ cuid: userLogin.cuid }, {
                  $set: { token: token, active: 1 }
                },
                async function (err, numberAffected, rawResponse) {
                  if (err) {
                    res.status(500).send(err);
                  }
                  if (userLogin && userLogin.avatar) {
                    let data = {
                      src: userLogin.avatar,
                      size: 150
                    }
                    let thumb = await cacheImage(data);
                    user.avatar = thumb;
                  }
                  // if(req.query.version && req.query.version === 'app'){
                  //   await addTaskLoginApp(userLogin._id)
                  // }
                  // await addTaskLogin(userLogin._id)
                  userLogin.token = token;
                  delete userLogin.password;
                  userLogin.tokenAssignAgent = jwt.issue({ _id: userLogin._id.toString() })
                  res.json({ userLogin });
                });
            } else {
              var userLogin = {
                status: -1,
                warning: 'warningNoMatch'
              };
              res.json({ userLogin });
            }
          } else {
            var userLogin = {
              status: -1,
              warning: 'warningNoMatch'
            };
            res.json({ userLogin });
          }
        }
      } else {
        var userLogin = {
          status: -2,
          warning: 'warningVerify'
        };
        res.json({ userLogin });
      }
    } else {
      var userLogin = {
        status: -1,
        warning: 'warningNoMatch'
      };
      res.json({ userLogin });
    }
  });
}

export async function loginSocial(req, res) {
  try {
    if(!req.body.user || !req.body.user.email){
      return res.json({warning: 'Invalid Params.'})
    }
    req.body.user.email = sanitizeHtml(req.body.user.email.toLowerCase());
    const appLoginId = req.body.appLoginId;
      User.findOne({ idSocial: sanitizeHtml(req.body.user.idSocial) },
      '-__v -attTotalRate -attRate -idSocial').exec(async (err, userLogin) => {
      if (userLogin == null) {
        if (typeof req.body.user.email !== 'undefined' && req.body.user.email) {
          User.findOne({ email: sanitizeHtml(req.body.user.email) },
            '-__v -attTotalRate -attRate -idSocial').exec(async (err, userLogin) => {
            if (userLogin == null) {
              var token = generatePassword(30);
              const newUser = new User(req.body.user);
              newUser.cuid = cuid();
              newUser.active = 1;
              newUser.token = token;
              newUser.email = req.body.user.email.toLowerCase();
              newUser.verifyEmail = true;
              newUser.fullName = sanitizeHtml(req.body.user.firstName) + ' ' + sanitizeHtml(req.body.user.lastName);
              newUser.userName = await buildSlugUserName(newUser.fullName);
              newUser.expert = req.body.user.type && req.body.user.type === 'tutor' ? 1 : 0;
              newUser.memberShip = Date.now() + 7*24*60*60*1000;
              newUser.point = {};
              let count = await User.count({});
              newUser.code = StringHelper.generalCodeUser(count + 1);
              newUser.save(async (err, userLogin) => {
                if (err) {
                  res.status(500).send(err);
                }
                var userLogin = {
                  _id: userLogin._id,
                  cuid: userLogin.cuid,
                  firstName: userLogin.firstName,
                  lastName: userLogin.lastName,
                  fullName: userLogin.fullName,
                  userName: userLogin.fullName,
                  email: userLogin.email || '',
                  avatar: userLogin.avatar,
                  token: token,
                  socialLink: userLogin.socialLink,
                  online: userLogin.online,
                  call: userLogin.call,
                  chat: userLogin.chat,
                  active: userLogin.active,
                  expert: userLogin.expert,
                  teacherMembership: userLogin.teacherMembership,
                  memberShip: userLogin.memberShip,
                  categories: userLogin.categories,
                  firstLogin: true
                };
                if (req.body.ref) {
                  userLogin.usedInviteCode = req.body.ref;
                  await UserUseInviteCode.create({
                    user: userLogin._id,
                    code: req.body.ref
                  });
                }
                // if(req.body.refTask){
                //   await addTaskReferral(userLogin, req.body.refTask)
                // }
                // if(req.query.version && req.query.version === 'app'){
                //   await addTaskLoginApp(userLogin._id)
                // }
                // await addTaskLogin(userLogin._id);
                if (userLogin && userLogin.avatar) {
                  let data = {
                    src: userLogin.avatar,
                    size: 250
                  };
                  let thumb = await cacheImage(data);
                  userLogin.avatar = thumb;
                }
                Q.create(globalConstants.jobName.USER_SYNC_ELASTIC, userLogin).removeOnComplete(true).save();
                if ( appLoginId ) {
                  emitAppLoggedIn(appLoginId, {
                    token: userLogin.token,
                  });
                }
                return res.json({ userLogin });
              });
            } else {
              var token = userLogin.token ? userLogin.token : generatePassword(30);
              var sql = {};
              if (userLogin.token == '') {
                sql.cuid = token;
              }
              if (typeof req.body.user.idSocial !== 'undefined') {
                sql.idSocial = req.body.user.idSocial;
              }
              if (typeof req.body.user.avatar !== 'undefined') {
                sql.avatar = req.body.user.avatar;
              }
              if (typeof req.body.user.typeSocial !== 'undefined') {
                sql.typeSocial = req.body.user.typeSocial;
              }

              if (req.body.user.type && req.body.user.type === 'tutor') {
                sql.expert = 1;
              }
              if (sql) {
                let usedInviteCode = await UserUseInviteCode.findOne({ user: userLogin._id });
                User.update({ cuid: userLogin.cuid }, {
                    $set: sql
                  },
                  async function (err, numberAffected, rawResponse) {
                    if (err) {
                      res.status(500).send(err);
                    }
                    userLogin.token = token;
                    userLogin.usedInviteCode = usedInviteCode ? usedInviteCode.code : '';
                    if (userLogin && userLogin.avatar) {
                      let data = {
                        src: userLogin.avatar,
                        size: 250
                      };
                      let thumb = await cacheImage(data);
                      userLogin.avatar = thumb;
                    }
                    // if(req.query.version && req.query.version === 'app'){
                    //   await addTaskLoginApp(userLogin._id)
                    // }
                    // await addTaskLogin(userLogin._id);
                    delete userLogin.password;
                    if ( appLoginId ) {
                      emitAppLoggedIn(appLoginId, {
                        token: userLogin.token,
                      });
                    }
                    return res.json({ userLogin });
                  });
              } else {
                delete userLogin.password;
                // if(req.query.version && req.query.version === 'app'){
                //   await addTaskLoginApp(userLogin._id)
                // }
                // await addTaskLogin(userLogin._id);
                if ( appLoginId ) {
                  emitAppLoggedIn(appLoginId, {
                    token: userLogin.token,
                  });
                }
                return res.json({ userLogin });
              }
            }
          });
        } else {
          var token = generatePassword(30);
          const newUser = new User(req.body.user);
          newUser.cuid = cuid();
          newUser.active = 1;
          newUser.token = token;
          newUser.verifyEmail = true;
          newUser.fullName = sanitizeHtml(req.body.user.firstName) + ' ' + sanitizeHtml(req.body.user.lastName);
          newUser.userName = await buildSlugUserName(newUser.fullName);
          newUser.expert = req.body.user.type && req.body.user.type === 'tutor' ? 1 : 0;
          newUser.memberShip = Date.now() + 7*24*60*60*1000;
          newUser.point = {};
          let count = await User.count({});
          newUser.code = StringHelper.generalCodeUser(count + 1);
          newUser.save(async (err, userLogin) => {
            if (err) {
              res.status(500).send(err);
            }
            var userLogin = {
              _id: userLogin._id,
              cuid: userLogin.cuid,
              firstName: userLogin.firstName,
              lastName: userLogin.lastName,
              fullName: userLogin.fullName,
              userName: userLogin.fullName,
              email: userLogin.email,
              avatar: userLogin.avatar,
              token: token,
              socialLink: userLogin.socialLink,
              online: userLogin.online,
              call: userLogin.call,
              chat: userLogin.chat,
              active: userLogin.active,
              expert: userLogin.expert,
              memberShip: userLogin.memberShip,
              teacherMembership: userLogin.teacherMembership,
              categories: userLogin.categories,
              firstLogin: true
            };
            if (req.body.ref) {
              userLogin.usedInviteCode = req.body.ref;
              await UserUseInviteCode.create({
                user: userLogin._id,
                code: req.body.ref
              });
            }
            // if(req.body.refTask){
            //   await addTaskReferral(userLogin, req.body.refTask)
            // }
            // if(req.query.version && req.query.version === 'app'){
            //   await addTaskLoginApp(userLogin._id)
            // }
            // await addTaskLogin(userLogin._id);
            if (userLogin && userLogin.avatar) {
              let data = {
                src: userLogin.avatar,
                size: 250
              };
              let thumb = await cacheImage(data);
              userLogin.avatar = thumb;
            }
            if ( appLoginId ) {
              emitAppLoggedIn(appLoginId, {
                token: userLogin.token,
              });
            }
            return res.json({ userLogin });
          });
        }
      } else {
        if (userLogin.active != 0) {
          if (userLogin.active != -2) {
            if (userLogin.active != -1) {
              var token = userLogin.token ? userLogin.token : generatePassword(30);
              let usedInviteCode = await UserUseInviteCode.findOne({ user: userLogin._id });
              User.update({ cuid: userLogin.cuid }, {
                  $set: { token: token }
                },
                async function (err, numberAffected, rawResponse) {
                  if (err) {
                    res.status(500).send(err);
                  }
                  userLogin.usedInviteCode = usedInviteCode ? usedInviteCode.code : '';
                  userLogin.token = token;
                  delete userLogin.password;
                  if (userLogin && userLogin.avatar) {
                    let data = {
                      src: userLogin.avatar,
                      size: 250
                    };
                    let thumb = await cacheImage(data);
                    userLogin.avatar = thumb;
                  }
                  // if(req.query.version && req.query.version === 'app'){
                  //   await addTaskLoginApp(userLogin._id)
                  // }
                  // await addTaskLogin(userLogin._id);
                  if ( appLoginId ) {
                    emitAppLoggedIn(appLoginId, {
                      token: userLogin.token,
                    });
                  }
                  return res.json({ userLogin });
                });
            } else {
              var userLogin = { warning: 'warningNoMatch' };
              if ( appLoginId ) {
                emitAppLoginFailed(appLoginId, userLogin);
              }
              return res.json({ userLogin });
            }
          } else {
            if (userLogin.deleteDate && checkTimeRedelete(userLogin)) {
              var token = userLogin.token ? userLogin.token : generatePassword(30);
              let usedInviteCode = await UserUseInviteCode.findOne({ user: userLogin._id });
              User.update({ cuid: userLogin.cuid }, {
                $set: { token: token, active: 1 }
              }, async function (err, numberAffected, rawResponse) {
                if (err) {
                  res.status(500).send(err);
                }
                userLogin.usedInviteCode = usedInviteCode ? usedInviteCode.code : '';
                userLogin.token = token;
                delete userLogin.password;
                if (userLogin && userLogin.avatar) {
                  let data = {
                    src: userLogin.avatar,
                    size: 250
                  };
                  let thumb = await cacheImage(data);
                  userLogin.avatar = thumb;
                }
                // if(req.query.version && req.query.version === 'app'){
                //   await addTaskLoginApp(userLogin._id)
                // }
                // await addTaskLogin(userLogin._id);
                if ( appLoginId ) {
                  emitAppLoggedIn(appLoginId, {
                    token: userLogin.token,
                  });
                }
                return res.json({ userLogin });
              });
            } else {
              var userLogin = { warning: 'warningNoMatch' };
              if ( appLoginId ) {
                emitAppLoginFailed(appLoginId, userLogin);
              }
              return res.json({ userLogin });
            }
          }
        } else {
          var userLogin = { warning: 'warningVerify' };
          if ( appLoginId ) {
            emitAppLoginFailed(appLoginId, userLogin);
          }
          res.json({ userLogin });
        }
      }
    });
  } catch ( error ) {
    console.error('loginSocial have error:');
    console.log(error);
    res.status( error.status || 500 ).send({
      success: false,
      message: 'Internal server error',
    })
  }
}

export async function adminLogin(req, res) {
  let email = req.body.email.toLowerCase();
  let password = req.body.password;

  let fields = [
    'fullName', 'userName', 'avatar', 'cuid', 'password', 'permisson'
  ];
  try {
    let admin = await User.findOne({
      email: email,
      role: globalConstants.role.ADMIN
      }, fields.join(' '));
    // let admin = await User.findOne({ email: email, role:{$in :[globalConstants.role.SUPERUSER, globalConstants.role.ADMIN]} }, fields.join(' '));
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'No match for E-Mail Address and/or Password.'
      });
    }

    if (validate(admin.password, password)) {
      let adminObj = JSON.parse(JSON.stringify(admin));
      delete adminObj.password;
      return res.json({
        success: true,
        data: adminObj,
        token: jwt.issue({ _id: admin._id.toString() })
      })
    } else {
      return res.status(401).json({
        success: false,
        error: 'No match for E-Mail Address and/or Password.'
      });
    }
  } catch (err) {
    console.log('err on adminLogin:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal error.'
    });
  }
}

export function updateUserInfo(req, res) {
  req.body.user.userName = req.body.user.userName.toLowerCase();
  var newUser = new User(req.body.user);
  // Let's sanitize inputs
  newUser.token = newUser.token;
  newUser.firstName = sanitizeHtml(newUser.firstName);
  newUser.lastName = sanitizeHtml(newUser.lastName);
  newUser.userName = sanitizeHtml(newUser.userName);
  newUser.fullName = newUser.firstName + ' ' + newUser.lastName;
  newUser.gender = sanitizeHtml(newUser.gender);
  birthday: newUser.birthday1,
    newUser.birthday1 = sanitizeHtml(newUser.birthday1);
  newUser.telephone = sanitizeHtml(newUser.telephone);
  newUser.country = sanitizeHtml(newUser.country);
  newUser.zipCode = sanitizeHtml(newUser.zipCode);
  newUser.aboutUs = sanitizeHtml(newUser.aboutUs);
  newUser.socialLink = sanitizeHtml(newUser.socialLink);
  User.update({ token: newUser.token }, {
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    fullName: newUser.fullName,
    userName: newUser.userName,
    gender: newUser.gender,
    birthday1: newUser.birthday1,
    birthday: newUser.birthday1,
    telephone: newUser.telephone,
    country: newUser.country,
    zipCode: newUser.zipCode,
    aboutUs: newUser.aboutUs,
    socialLink: newUser.socialLink
  }, function (err, numberAffected, rawResponse) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ result: true });
    }
    User.findOne({ token: newUser.token }).exec((err, user) => {
      if (!err && user && user.cuid) {
        updateChatGroupUserInfo(user.cuid);
      }
    });
    // clear cached search informations.
    Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
    Q.create(globalConstants.jobName.USER_SYNC_ELASTIC, newUser).removeOnComplete(true).save();
  });
}

export function updateAvatar(cuid, avatarUrl) {
  User.update({ cuid: cuid }, {
    avatar: avatarUrl
  }, function (err, numberAffected, rawResponse) {
    if (err) {
      return false;
    }
    updateChatGroupUserInfo(cuid);
    return true;
  });
}

export function checkTokenReset(req, res) {
  if (!req.params.token) {
    res.status(403).end();
    return;
  }
  var time = new Date().getTime() - 86400000;

  User.findOne({ tokenForgot: req.params.token, dateExpired: { $gte: time } }).exec((err, user) => {
    if (err) {
      res.status(500).send(err);
      return null;
    }
    if (user) {
      res.json({ result: 1 });
    } else {
      res.json({ result: 0 });
    }
  });
}

export function forgotPassword(req, res) {
  if (!req.params.email) {
    res.status(403).end();
  }
  var tokenForgotPassword = generatePassword(45);
  var now = new Date().getTime();
  User.update({ email: req.params.email.toLowerCase() }, {
    $set: { 'tokenForgot': tokenForgotPassword, 'dateExpired': now }
  }, function (err, numberAffected, rawResponse) {
    if (err) {
      res.json({ result: 1 });
      return;
    }
    if (numberAffected.nModified > 0) {
      var dataSendMail = {
        type: 'forgotPassword',
        language: req.headers.lang,
        data: {
          email: req.params.email.toLowerCase(),
          token: tokenForgotPassword
        }
      };
      Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
      // sendMail(dataSendMail);
      res.json({ result: 2 });
    } else {
      res.json({ result: 2 });
    }
  });
}

export function resetPassword(req, res) {
  if (!req.body.password || !req.body.token) {
    res.status(403).end();

  }
  var password = hash(sanitizeHtml(req.body.password));
  var token = req.body.token;
  User.update({ tokenForgot: token }, {
    $set: { 'password': password, 'tokenForgot': '', 'dateExpired': '' }
  }, function (err, numberAffected, rawResponse) {
    if (err) {
      res.json({ result: 1 });
      return;
    }
    if (numberAffected.nModified > 0) {
      res.json({ result: 2 });
    } else {
      res.json({ result: 1 });
    }
  });
}

export async function hashPasss(req, res) {
  try {
    let data = hash(sanitizeHtml(req.query.password));
    return res.json({
      pass: data
    })
  } catch (err) {
    return res.status(500).json(err);
  }
}

export async function registryAccount(req, res) {
  const newUser = new User();
  var tokenActive = generatePassword(45);
  newUser.firstName = sanitizeHtml(req.body.user.firstName);
  newUser.lastName = sanitizeHtml(req.body.user.lastName);
  newUser.fullName = req.body.user.firstName + ' ' + req.body.user.lastName;
  newUser.userName = await buildSlugUserName(newUser.fullName);
  newUser.password = hash(sanitizeHtml(req.body.user.password));
  newUser.email = sanitizeHtml(req.body.user.email.toLowerCase());
  newUser.telephone = sanitizeHtml(req.body.user.telephone);
  newUser.expert = req.body.user.type && req.body.user.type === 'tutor' ? 1 : 0;
  newUser.tokenActive = tokenActive;
  newUser.point = {};
  newUser.cuid = cuid();
  let count = await User.count({});
  newUser.code = StringHelper.generalCodeUser(count + 1);
  let user = await User.findOne({ email: newUser.email }).lean();
  if (user) {
    return res.status(400).json({ success: false, err: "Email da ton tai!" });
  }
  newUser.save(async (err, saved) => {
    if (err) {
      res.status(500).send(err);
    }
    var dataSendMail = {
      type: 'registryAccount',
      language: req.headers.lang,
      data: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        cuid: newUser.cuid,
        token: tokenActive,
        type: req.body.user.type
      }
    };
    Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();

    if (req.body.ref) {
      await UserUseInviteCode.create({
        user: saved._id,
        code: req.body.ref
      });
    }
    // if(req.body.refTask){
    //   await addTaskReferral(saved, req.body.refTask)
    // }
    // sendMail(dataSendMail);
    res.json({ result: 1 });
  });
}
export async function testmail(req, res){
  try {
    var dataSendMail = {
      type: 'registryAccount',
      language: 'en',
      data: {
        firstName: 'Than',
        lastName: 'Pham',
        email: req.query.email,
        cuid: 'cu3423424234234',
        token: '239423nesfkj3224003',
        type: 'user'
      }
    };
    Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();

  } catch (err) {

  }
}
export function resendEmailRegistry(req, res) {
  if (!req.body.email) {
    return res.status(403).end();
  }
  var email = sanitizeHtml(req.body.email.toLowerCase());
  User.findOne({ email: email, active: 0 }).exec((err, user) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (user) {
      var dataSendMail = {
        type: 'registryAccount',
        language: req.headers.lang,
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          cuid: user.cuid,
          token: user.tokenActive
        }
      };
      Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
      return res.json({ result: true });
    } else {
      return res.json({ result: false });
    }
  });
}

export function checkPhoneNumber(req, res) {
  if (!req.params.phoneNumber) {
    res.status(403).end();
  }
  var phoneNumber = sanitizeHtml(req.params.phoneNumber);
  User.findOne({ telephone: phoneNumber }).exec((err, user) => {
    if (err) {
      res.status(500).send(err);
    } else {
      if (user) {
        res.json({ result: true });
      } else {
        res.json({ result: false });
      }
    }
  });
}

export function confirmAccount(req, res) {
  if (!req.body.data.token || !req.body.data.user) {
    res.status(403).end();
  }
  User.findOne({ tokenActive: req.body.data.token },
    '-__v -attTotalRate -attRate -idSocial -password').exec((err, userLogin) => {
    if (err) {
      res.status(403).send(err);
    } else {
      if (userLogin) {
        var tokenUser = generatePassword(30);
        User.update(
          { cuid: userLogin.cuid },
          { $set: {
            'active': 1,
              token: tokenUser,
              activeDate: new Date() ,
              memberShip: Date.now() + 7*24*60*60*1000,
              verifyEmail: true,
              point: {}
          } },
          async function (err, numberAffected, rawResponse) {
            if (err) {
              res.status(403).send(err);
            } else {
              userLogin.token = tokenUser;

              // let taskInfo = await Task.findOne({userId: userLogin._id, type: 'REGISTRATION'}).lean();
              // if(taskInfo){
              //   plusTaskToUser(taskInfo._id)
              // }
              // Q.create(globalConstants.jobName.CREATE_FEED_ONE_USER, { userId: userLogin._id }).removeOnComplete(true).save();
              // Q.create(globalConstants.jobName.USER_SYNC_ELASTIC, userLogin).removeOnComplete(true).save();
              res.json({ userLogin });
            }
          }
        );
      } else {
        var userLogin = { warning: 'warningActive' };
        res.json({ userLogin });
      }
    }
  });
}

export function checkEmail(req, res) {
  if (!req.params.email) {
    res.status(403).end();
  }
  var email = sanitizeHtml(req.params.email.toLowerCase());
  User.findOne({ email: email }).exec((err, user) => {
    if (err) {
      res.status(500).send(err);
    }
    if (user) {
      res.json({ result: true });
    } else {
      res.json({ result: false });
    }
  });
}

export function checkEmailEdit(req, res) {
  var email = sanitizeHtml(req.params.email.toLowerCase());
  var userID = sanitizeHtml(req.params.userID);
  var result = {
    key: -10,
    message: '',
    data: false
  };
  if (email != '' && userID != '') {
    User.findOne({ email: email, cuid: { '$exists': true, '$ne': userID } }).exec((err, user) => {
      if (err) {
        result.key = -2;
        result.message = 'System error. ' + err;
        return res.json({ result });
      } else {
        if (user === null) {
          //Email not exists.
          result.key = 1;
          result.message = 'Email not exists.';
          result.data = false;
          return res.json({ result });
        } else {
          result.key = -1;
          result.message = 'Email already exists.';
          result.data = true;
          return res.json({ result });
        }
      }
    });
  } else {
    result.key = -5;
    result.message = 'Data empty!';
    return res.json({ result });
  }

}

export async function sendEmailVerification(req, res) {

  var email = sanitizeHtml(req.params.email.toLowerCase());
  var userID = sanitizeHtml(req.params.userID);
  var result = {
    key: -10,
    message: '',
    data: false
  };
  if (email != '' && userID != '') {
    var userInfo = await User.findOne({ email: email, cuid: { '$exists': true, '$ne': userID } }).exec();
    if (userInfo === null) {
      var userInfo = await User.findOne({ cuid: userID }).exec();
      if (userInfo) {
        var verifyCode = Math.floor(Math.random() * 900000) + 100000;
        User.update(
          {
            cuid: userID
          },
          {
            $set: {
              code_verify_email: verifyCode,
              email_change: email
            }
          },
          function (err, numberAffected, rawResponse) {
            if (err) {
              return res.status(500).send(err);
            }
            if (numberAffected) {
              var dataSendMail = {
                type: 'sendVerifyCode',
                language: req.headers.lang,
                data: {
                  firstName: userInfo.firstName,
                  lastName: userInfo.lastName,
                  userName: userInfo.userName,
                  email: email,
                  verifyCode: verifyCode
                }
              };
              Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
              // sendMail(dataSendMail);
              result.key = 1;
              return res.json(result);
            } else {
              result.key = -5;
              result.message = 'Data empty!';
              return res.json(result);
            }
          }
        );
      } else {
        result.key = -5;
        result.message = 'Data empty!';
        return res.json(result);
      }
    } else {
      result.key = -1;
      result.message = 'Email already exists.';
      result.data = true;
      return res.json(result);
    }
  } else {
    result.key = -5;
    result.message = 'Data empty!';
    return res.json(result);
  }
}

export function sendVerificationCode(req, res) {
  var code = sanitizeHtml(req.params.code);
  var userID = sanitizeHtml(req.params.userID);
  var result = {
    key: -10,
    message: '',
    data: false
  };
  if (code != '' && userID != '') {
    User.findOne({ cuid: userID, code_verify_email: code }).exec((err, user) => {
      if (err) {
        result.key = -2;
        result.message = 'System error. ' + err;
        res.json(result);
      } else {
        if (user) {
          User.update(
            {
              cuid: userID
            },
            {
              $set: {
                code_verify_email: '',
                email: user.email_change,
                email_change: ''
              }
            },
            function (err, numberAffected, rawResponse) {
              if (err) {
                return res.status(500).send(err);
              }
              if (numberAffected) {
                result.key = 1;
                Q.create(globalConstants.jobName.USER_SYNC_ELASTIC, user).removeOnComplete(true).save();
                res.json(result);
              } else {
                result.key = -1;
                res.json(result);
              }
            }
          );
        } else {
          result.key = -1;
          res.json(result);
        }
      }
    });
  } else {
    result.key = -5;
    return res.json(result);
  }
}

export function checkUserNameEdit(req, res) {
  var username = sanitizeHtml(req.params.username.toLowerCase());
  var userID = sanitizeHtml(req.params.userID);
  var result = {
    key: -10,
    message: '',
    data: false
  };
  var inval = [
    'me',
    'home',
    'tesse',
    'profile',
    'edit-profile',
    'edit-profile-expert',
    'not-found',
    'popup',
    'chat',
    'session',
    'login',
    'forgot-password',
    'payment',
    'cancelpaypaltoken',
    'savepaypaltoken',
    'search',
    'sign-up',
    'confirm',
    'reset',
    'joincollection',
    'editexpert',
    'become-an-expert',
    'knowledge',
    'setting',
    'manage-appointment',
    'appointment-detail',
    'about-us',
    'legal',
    'admin-category',
    'expert',
    'help',
    'draw',
    'postter'
  ];
  if (inval.includes(username)) {
    result.key = -1;
    result.message = 'Username is not available.';
    result.data = true;
    res.json({ result });
  } else {
    User.findOne({ userName: username, cuid: { '$exists': true, '$ne': userID } }).exec((err, user) => {
      if (err) {
        result.key = -2;
        result.message = 'System error. ' + err;
        res.json({ result });
      } else {
        if (user === null) {
          //Email not exists.
          result.key = 1;
          result.message = 'Username is available.';
          result.data = false;
          res.json({ result });
        } else {
          result.key = -1;
          result.message = 'Username is not available.';
          result.data = true;
          res.json({ result });
        }
      }
    });
  }
}

export function checkAvatar(req, res) {
  var userID = sanitizeHtml(req.params.userID);
  var result = {
    key: -10,
    message: '',
    data: false
  }
  if (userID != '') {
    User.findOne({ cuid: userID }).exec((err, user) => {
      if (err) {
        result.key = -2;
        result.message = 'System error. ' + err;
        res.json({ result });
      } else {
        if (user.avatar) {
          //Email not exists.
          result.key = 1;
          result.message = 'Email not exists.';
          result.data = false;
          res.json({ result });
        } else {
          result.key = -5;
          result.message = 'Data empty!';
          res.json({ result });
        }
      }
    });
  } else {
    result.key = -5;
    result.message = 'Data empty!';
    res.json({ result });
  }
}

export function checkPhoneEdit(req, res) {
  var phoneNumber = sanitizeHtml(req.params.phoneNumber);
  var userID = sanitizeHtml(req.params.userID);
  var result = {
    key: -10,
    message: '',
    data: false
  };
  if (phoneNumber != '' && userID != '') {
    User.findOne({ telephone: phoneNumber, cuid: { '$exists': true, '$ne': userID } }).exec((err, user) => {
      if (err) {
        result.key = -2;
        result.message = 'System error.';
        res.json({ result });
      } else {
        if (user === null) {
          //Email not exists.
          result.key = 1;
          result.message = 'Phone number not exists.';
          result.data = false;
          res.json({ result });
        } else {
          result.key = 1;
          result.message = 'Phone number already exists.';
          result.data = true;
          res.json({ result });
        }
      }
    });
  } else {
    result.key = -5;
    result.message = 'Data empty!';
    res.json({ result });
  }

}

export function getCountries(req, res) {
  Country.find().sort({ name: 1 }).exec((err, countries) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json({ countries });
  });
}

export function updateIndustry(req, res) {
  const newUser = new User(req.body.user);

  // Let's sanitize inputs
  newUser.cuid = sanitizeHtml(newUser.cuid);
  newUser.categories = sanitizeHtml(newUser.categories);
  var category = newUser.categories[0];
  var catAction = sanitizeHtml(req.body.user.categories[0].catAction);

  User.findOne({ cuid: newUser.cuid }).exec(async (err, user) => {
    if (err) {
      res.status(500).send(err);
    } else {
      let deleteIds = req.body.delete;


      var catOld = user.categories;
      var catNew = [];
      catNew = catOld;
      var cuidResponse = '';
      if (!category.catID) {
        if (catAction != 'false') {
          var item = {
            catID: cuid(),
            industry: {
              industryID: category.industry.industryID,
              title: category.industry.title
            },
            department: {
              departmentID: category.department.departmentID,
              title: category.department.title
            },
            skills: category.skills,
            description: category.description
          };
          cuidResponse = item.catID;
          catNew.push(item);
        } else {
          catNew.pull(category);
          category.skills.forEach(skill => {
            deleteIds.push(skill._id)
          });
        }
      } else {
        catOld.map((item, index) => {
          if (item.catID == category.catID) {
            cuidResponse = item.catID;
            if (catAction == 'false') {

              catNew.pull(item);
            } else {
              catNew[index].industry = category.industry;
              catNew[index].department = category.department;
              catNew[index].skills = category.skills;
              catNew[index].description = category.description;
            }
          }
        });
      }

      if (deleteIds instanceof Array && deleteIds.length) {
        deleteIds.forEach(id => {
          let index = user.skills.indexOf(id);
          user.skills.splice(index, 1);
        });
        await Promise.all([
          User.update({ _id: user._id }, { $pull: { skills: { $in: deleteIds } } }, { multi: true }).exec(),
          Skill.update({ _id: { $in: deleteIds } }, { $pull: { owners: user._id } }, { multi: true }).exec()
        ]);
      }

      let skillIds = user.skills;
      category.skills.forEach(skill => {
        if (skillIds.indexOf(skill._id) < 0) {
          skillIds.push(skill._id);
        }
      });

      let results = await Promise.all([
        User.update({ _id: user._id }, { $set: { categories: catNew, skills: skillIds } }).exec(),
//        Skill.update({_id: {$in: skillIds}}, {$push: {owners: user._id}},  {multi: true}).exec(),
        Skill.find({ _id: { $in: skillIds } }).exec()
      ]);
      let skillPromises = results[1].map(skill => {
        if (skill.owners.indexOf(user._id) < 0) {
          skill.owners.push(user._id);
          skill.markModified('owners');
          return skill.save();
        }
      });
      await Promise.all(skillPromises);
      updateChatGroupUserInfo(newUser.cuid);
      Q.create(globalConstants.jobName.SYNC_USER_REVIEWS, { cuid: user.cuid }).removeOnComplete(true).save();
      // clear cached search informations.
      Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
      return res.json({ result: cuidResponse });
    }
  });
}

export async function removeIndustry(req, res) {
  let user = await User.findById(req.user._id);
  if (user.categories.length === 1) {
    return res.status(400).json({ success: false, error: 'You can not remove all industries.' });
  }
  let cateIndex = ArrayHelper.findItemByProp(user.categories, '_id', req.params.id);
  // console.log('cateIndex:', cateIndex);
  if (cateIndex !== false) {
    let promises = [];

    // remove skill in user.skills
    let departmentCuid = user.categories[cateIndex].department.departmentID;
    let removedSkills = await Skill.find({ categoryID: departmentCuid });
    let removedSkillIds = removedSkills.map(skill => skill._id.toString());

    user.skills = user.skills.filter(skillId => {
      skillId = skillId.toString();
      return removedSkillIds.indexOf(skillId) < 0;
    });
    user.markModified('skills');

    // remove category in user.categories
    user.categories.splice(cateIndex, 1);
    user.markModified('categories');
    promises.push(user.save());

    // remove user in skill.owners
    promises.push(Skill.update({ _id: { $in: removedSkillIds } }, { $pull: { owners: user._id } }, { multi: true }));

    await Promise.all(promises);
    Q.create(globalConstants.jobName.SYNC_USER_REVIEWS, { cuid: user.cuid }).removeOnComplete(true).save();
    // clear cached search informations.
    Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
  }

  return res.json({ success: true });
}

export function updateWorkExperience(req, res) {
  const newUser = new User(req.body.user);
  // Let's sanitize inputs
  newUser.cuid = sanitizeHtml(newUser.cuid);
  newUser.workExperience = sanitizeHtml(newUser.workExperience);
  var work = newUser.workExperience[0];
  var workAction = sanitizeHtml(req.body.user.workAction);
  var cuidResponse = '';
  User.findOne({ cuid: newUser.cuid }).exec((err, user) => {
    if (err) {
      res.status(500).send(err);
    } else {

      var workOld = user.workExperience;
      var workNew = [];
      workNew = workOld;
      if (!work.workID) {
        if (workAction != 'false') {
          var item = {
            workID: cuid(),
            companyName: sanitizeHtml(work.companyName),
            websiteUrl: sanitizeHtml(work.websiteUrl),
            location: sanitizeHtml(work.location),
            position: sanitizeHtml(work.position),
            startDate: sanitizeHtml(work.startDate),
            endDate: sanitizeHtml(work.endDate),
            workNow: sanitizeHtml(work.workNow),
            details: sanitizeHtml(work.details)
          };
          cuidResponse = item.workID;
          workNew.push(item);
        }
      } else {
        workOld.map((item, index) => {
          if (item.workID == work.workID) {
            cuidResponse = item.workID;
            if (workAction == 'false') {
              workNew.pull(item);
            } else {
              workNew[index].companyName = work.companyName;
              workNew[index].websiteUrl = work.websiteUrl;
              workNew[index].location = work.location;
              workNew[index].position = work.position;
              workNew[index].startDate = work.startDate;
              workNew[index].endDate = work.endDate;
              workNew[index].workNow = work.workNow;
              workNew[index].details = work.details;
            }
          }
        });
      }
      User.update(
        {
          cuid: newUser.cuid
        },
        {
          $set: { workExperience: workNew }
        },
        function (err, numberAffected, rawResponse) {
          if (err) {
            res.status(500).send(err);
          }
          updateChatGroupUserInfo(newUser.cuid);
          res.json({ result: cuidResponse });
        }
      );
    }
  });
}

export function updateEducation(req, res) {
  const newUser = new User(req.body.user);
  // Let's sanitize inputs
  newUser.cuid = sanitizeHtml(newUser.cuid);
  newUser.education = sanitizeHtml(newUser.education);
  var education = newUser.education[0];
  var eduAction = sanitizeHtml(req.body.user.eduAction);
  var cuidResponse = '';
  User.findOne({ cuid: newUser.cuid }).exec((err, user) => {
    if (err) {
      res.status(500).send(err);
    } else {

      var eduOld = user.education;
      var eduNew = [];
      eduNew = eduOld;
      if (!education.eduID) {
        if (eduAction != 'false') {
          var item = {
            eduID: cuid(),
            school: sanitizeHtml(education.school),
            websiteUrl: sanitizeHtml(education.websiteUrl),
            location: sanitizeHtml(education.location),
            degree: sanitizeHtml(education.degree),
            startDate: sanitizeHtml(education.startDate),
            endDate: sanitizeHtml(education.endDate),
            details: sanitizeHtml(education.details)
          };
          cuidResponse = item.eduID;
          eduNew.push(item);
        }
      } else {
        eduOld.map((item, index) => {
          if (item.eduID == education.eduID) {
            cuidResponse = item.eduID;
            if (eduAction == 'false') {
              eduNew.pull(item);
            } else {
              eduNew[index].school = education.school;
              eduNew[index].websiteUrl = education.websiteUrl;
              eduNew[index].location = education.location;
              eduNew[index].degree = education.degree;
              eduNew[index].startDate = education.startDate;
              eduNew[index].endDate = education.endDate;
              eduNew[index].details = education.details;
            }
          }
        });
      }
      User.update(
        {
          cuid: newUser.cuid
        },
        {
          $set: { education: eduNew }
        },
        function (err, numberAffected, rawResponse) {
          if (err) {
            res.status(500).send(err);
          }
          updateChatGroupUserInfo(newUser.cuid);
          res.json({ result: cuidResponse });
        }
      );
    }
  });
}

export function updateAward(req, res) {
  const newUser = new User(req.body.user);
  // Let's sanitize inputs
  newUser.cuid = sanitizeHtml(newUser.cuid);
  newUser.award = sanitizeHtml(newUser.award);
  var award = newUser.award[0];
  var awardAction = sanitizeHtml(req.body.user.awardAction);
  var cuidResponse = '';
  User.findOne({ cuid: newUser.cuid }).exec((err, user) => {
    if (err) {
      res.status(500).send(err);
    } else {

      var awardOld = user.award;
      var awardNew = [];
      awardNew = awardOld;
      if (!award.awardID) {
        if (awardAction != 'false') {
          var item = {
            awardID: cuid(),
            organization: sanitizeHtml(award.organization),
            degree: sanitizeHtml(award.degree),
            award: sanitizeHtml(award.award),
            dateReceived: sanitizeHtml(award.dateReceived),
            details: sanitizeHtml(award.details)
          };
          cuidResponse = item.awardID;
          awardNew.push(item);
        }
      } else {
        awardOld.map((item, index) => {
          if (item.awardID == award.awardID) {
            cuidResponse = item.awardID;
            if (awardAction == 'false') {
              awardNew.pull(item);
            } else {
              awardNew[index].organization = award.organization;
              awardNew[index].degree = award.degree;
              awardNew[index].award = award.award;
              awardNew[index].dateReceived = award.dateReceived;
              awardNew[index].details = award.details;
            }
          }
        });
      }
      User.update(
        {
          cuid: newUser.cuid
        },
        {
          $set: { award: awardNew }
        },
        function (err, numberAffected, rawResponse) {
          if (err) {
            res.status(500).send(err);
          }
          updateChatGroupUserInfo(newUser.cuid);
          res.json({ result: cuidResponse });
        }
      );
    }
  });
}

export function updateExpertInfo(req, res) {
  var newUser = new User(req.body.user);

  // Let's sanitize inputs
  newUser.cuid = sanitizeHtml(newUser.cuid);
  //newUser.expert = sanitizeHtml(newUser.expert);
  newUser.priceCall = newUser.priceCall < 0 ? 0 : newUser.priceCall;
  newUser.priceChat = newUser.priceChat < 0 ? 0 : newUser.priceChat;
  newUser.firstMinFree = sanitizeHtml(newUser.firstMinFree);

  User.update({ cuid: newUser.cuid }, {
    //expert: newUser.expert,
    priceCall: newUser.priceCall,
    priceChat: newUser.priceChat,
    firstMinFree: newUser.firstMinFree
  }, function (err, numberAffected, rawResponse) {
    if (err) {
      res.status(500).send(err);
    }
    // @NTN: Update userInfo of all chatGroup of this user
    updateChatGroupUserInfo(newUser.cuid);
    // clear cached search informations.
    Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
    res.json({ result: numberAffected });
  });

}

export function updateExpert(req, res) {
  var userID = req.body.userID;
  var token = req.body.token;
  var expert = req.body.expert;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  User.findOne({ cuid: userID }).exec((err, user) => {
    if (err) {
      result.key = -2;
      result.message = 'System error';
      res.json({ result });
    } else {
      if (user === null) {
        result.key = -1;
        result.message = 'User not exist.';
        res.json({ result });
      } else {
        User.update(
          { cuid: userID },
          { $set: { expert: expert } },
          (err) => {
            if (err) {
              result.key = -2;
              result.message = 'System error.';
              res.json({ result });
            } else {
              result.key = 1;
              result.message = 'Success';
              res.json({ result });
            }
          }
        )
      }
    }
  });
}

export function updateLanguageSupport(req, res) {
  const newUser = new User(req.body.user);
  // Let's sanitize inputs
  newUser.cuid = sanitizeHtml(newUser.cuid);
  newUser.languageSupport = sanitizeHtml(newUser.languageSupport);
  var languageSupport = newUser.languageSupport[0];
  var lsAction = sanitizeHtml(req.body.user.lsAction);
  var cuidResponse = '';
  User.findOne({ cuid: newUser.cuid }).exec((err, user) => {
    if (err) {
      res.status(500).send(err);
    } else {

      var lsOld = user.languageSupport;
      var lsNew = [];
      lsNew = lsOld;
      if (!languageSupport.lsID) {
        if (lsAction != 'false') {
          var item = {
            lsID: cuid(),
            langName: sanitizeHtml(languageSupport.langName),
            langCuid: sanitizeHtml(languageSupport.langCuid),
            langLevel: sanitizeHtml(languageSupport.langLevel),
            langCode: sanitizeHtml(languageSupport.langCode)
          };
          cuidResponse = item.lsID;
          lsNew.push(item);
        }
      } else {
        lsOld.map((item, index) => {
          if (item.lsID == languageSupport.lsID) {
            cuidResponse = item.lsID;
            if (lsAction == 'false') {
              lsNew.pull(item);
            } else {
              lsNew[index].langName = languageSupport.langName;
              lsNew[index].langCuid = languageSupport.langCuid;
              lsNew[index].langLevel = languageSupport.langLevel;
              lsNew[index].langCode = languageSupport.langCode;
            }
          }
        });
      }
      User.update(
        {
          cuid: newUser.cuid
        },
        {
          $set: { languageSupport: lsNew }
        },
        function (err, numberAffected, rawResponse) {
          if (err) {
            res.status(500).send(err);
          }
          updateChatGroupUserInfo(newUser.cuid);
          // clear cached search informations.
          Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
          res.json({ result: cuidResponse });
        }
      );
    }
  });
}

export function testJoinCollection(req, res) {
  User.aggregate([
    { $match: { cuid: "ciukvszeh0000dsk87u4pnx01" } },
    {
      $lookup: {
        from: "userratings",
        localField: "cuid",
        foreignField: "userID",
        as: "user_rating"
      }
    }
  ]).exec((err, usersRating) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json({ usersRating });
  });
}

export function postRating(req, res) {
  let updateUser = new User(req.body.user);
  let token = req.body.token;
  // Check token
  User.findOne({ token }).exec((err, user) => {
    // Check result of token
    if (user) {
      // Update user rating if token valid
      User.update({ 'cuid': updateUser.cuid }, {
          $set: {
            'rating': updateUser.rating,
            'categories': updateUser.categories,
            'rate': updateUser.rate,
            'totalRate': updateUser.totalRate,
            'attRate': updateUser.attRate,
            'attTotalRate': updateUser.attTotalRate,
            'serviceRating': updateUser.serviceRating,
            'serviceTotalRate': updateUser.serviceTotalRate
          }
        },
        function (err, numberAffected) {
          if (err) {
            res.status(500).send(err);
          } else {
            res.json(numberAffected);
          }
        });
      return;
    }
    if (err) {
      res.status(500).send(err);
      return;
    }
    res.status(500).send(user);
  });
}

/**
 * Update status(online/offline) of user
 * @param userID
 * @param status: online/offline
 * @constructor
 */
export async function updateUserStatus(userID, status) {
  if (status === globalConstants.userState.OFFLINE) {
    await User.update(
      { cuid: userID },
      {
        $set:
          { online: status, dateOffline: Date.now() }
      }
    )
  } else {
    User.update(
      { cuid: userID },
      { $set: { online: status } },
      (err, numAffected) => {
        if (err) {
          return false;
        } else {
          return numAffected;
        }
      }
    );
  }
}

export function changePassword(req, res) {
  var userID = sanitizeHtml(req.body.userID);
  var password = sanitizeHtml(req.body.password);
  var newPassword = sanitizeHtml(req.body.newPassword);
  var result = {
    key: -10,
    message: '',
    data: null
  };
  User.findOne({ cuid: userID }).exec((err, user) => {
    if (err) {
      result.key = -2;
      result.message = 'System error.';
      res.json({ result });
    } else {
      if (validate(user.password, password) || user.password == '') {
        User.update(
          {
            cuid: userID
          },
          {
            $set: { password: hash(newPassword) }
          },
          function (err) {
            if (err) {
              result.key = -2;
              result.message = 'System error.';
              res.json({ result });
            }
            result.message = 'Change password success!!!';
            result.key = 1;
            res.json({ result });
          }
        );
      } else {
        result.key = -1;
        result.message = 'Password not match.';
        res.json({ result });
      }
    }
  });
}

export function checkPassword(req, res) {
  var token = sanitizeHtml(req.body.token);
  var password = sanitizeHtml(req.body.password);
  var result = {
    key: -10,
    message: '',
    data: null
  };
  User.findOne({ token: token }).exec((err, user) => {
    if (err) {
      result.key = -2;
      res.json({ result });
    } else {
      if (user.password) {
        if (validate(user.password, password)) {
          result.key = 1;
          res.json({ result });
        } else {
          result.key = -1;
          res.json({ result });
        }
      } else if (!password) {
        result.key = 1;
        res.json({ result });
      } else {
        result.key = -1;
        res.json({ result });
      }
    }
  });
}

export function deactivateAccount(req, res) {
  var token = sanitizeHtml(req.params.token);
  User.update(
    { token: token },
    { $set: { expert: -1 } },
    (err, numberAffected) => {
      if (err) {
        res.json(-1);
      } else {
        // clear cached search informations.
        Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
        res.json(numberAffected);
      }
    }
  );
}

export function reactivateAccount(req, res) {
  var token = sanitizeHtml(req.params.token);
  User.update(
    { token: token },
    { $set: { expert: 1 } },
    (err, numberAffected) => {
      if (err) {
        res.json(-1);
      } else {
        // clear cached search informations.
        Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
        res.json(numberAffected);
      }
    }
  );
}

export async function deleteAccount(req, res) {
  var token = sanitizeHtml(req.params.token);
  let user = await User.findOne({ token: token }).lean();

  User.update(
    { token: token },
    { $set: { token: '', active: -2, deleteDate: new Date() } },
    (err, numberAffected) => {
      if (err) {
        res.json(-1);
      } else {
        // clear cached search informations.
        Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
        Q.create(globalConstants.jobName.USER_REMOVE, user).removeOnComplete(true).save();
        res.json(numberAffected);
      }
    }
  );
}

//
// export function forgotPassword(req, res) {
//   var email = sanitizeHtml(req.params.email);
//   var password = sanitizeHtml(req.params.password);
//   var result = {
//     code: -10,
//     value: '',
//     data: null
//   };
//   User.findOne({email: email}).exec((err, user) => {
//     if (err) {
//       result.value = 'System error.';
//       res.json({result});
//     } else {
//       if (typeof user.password === 'undefined') {
//         result.value = 'User not found.';
//         result.code = -1;
//         res.json({result});
//       } else {
//         //check old password
//         if (!validate(user.password, password)) {
//           result.code = -2;
//           result.value = 'Password not match.';
//         } else {
//           //    Generate password
//           var newPassword = hash(generatePassword(15));
//           User.update(
//             {
//               email: email
//             },
//             {
//               $set: {password: newPassword}
//             },
//             function (err) {
//               if (err) {
//                 result.code = -10;
//                 result.value = 'System error.';
//                 res.json(result);
//               } else {
//                 result.code = 1;
//                 result.value = 'Forgot password success!!!';
//                 //Send mail
//                 //sendMail('','','','');
//                 res.json({result});
//               }
//             }
//           );
//           //    Send mail
//         }
//       }
//     }
//   });
//   //res.json({value: 'success!!!!'});
//
// }

export function getSupportState(req, res) {
  let userID = req.params.userID;
  if (userID) {
    res.json(getUserSupportState(userID));
    return;
  }
  res.json(globalConstants.userState.OFFLINE);
}

export async function getIsUserSessionReady(req, res) {
  let userId = req.params.userId;
  if (userId) {
    res.json({
      success: true,
      ready: await isUserSessionReady(userId)
    });
  } else {
    res.json({
      success: false,
      ready: false
    });
  }
}

/**
 * Get User payment history
 * @param req
 * @param res
 */
export function getPaymentHistory(req, res) {
  User.findOne({ token: req.params.token }, 'cuid').exec((err, user) => {
    if (err) {
      res.status(500).send(err);
      return null;
    }
    Payment.find({ userId: user.cuid, status: 1 }).sort({ dateAdded: -1 }).exec((err, payments) => {
      if (err) {
        res.status(500).send(err);
        return null;
      }
      res.json({ payments });
    });
  });
}

/**
 * Check token user
 * @param token
 * @param userID
 */

export function checkTokenUser(token, userID) {
  return new Promise((resolve) => {
    User.findOne({ $and: [{ token: token }, { cuid: userID }] }).exec((err, user) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });

}

export function setUsersOnlineState(onlineState) {
  return User.update(null, { $set: { online: onlineState } }, { multi: true });
}

/**
 * Increase
 * @param userID
 * @param money
 * @returns {Promise}
 */
export function addMoney(userID, money) {
  return new Promise((resolve) => {
    User.update({ cuid: userID },
      { $inc: { balance: money } }
    ).exec((err) => {
      if (err) {
        resolve(err);
      }
      resolve(true);
    });
  });
}

/**
 * Decrease
 * @param userID
 * @param money
 */
export function subMoney(userID, money) {
  return new Promise((resolve) => {
    User.update({ cuid: userID },
      { $inc: { balance: -money } }
    ).exec((err) => {
      if (err) {
        resolve(err);
      }
      resolve(true);
    });
  });
}

/**
 * Get time user can call or chat with expert price has been set
 * @param req
 * @param res
 */
export function getAvailableTimeCallChat(req, res) {
  let token = req.params.token;
  let expert = req.params.expert;
  // Check data
  if (!token || !expert) {
    res.json({
      status: false,
      message: 'Not enough data!'
    }).end();
  }
  // Get user from token
  User.findOne({ token }).exec((err, user) => {
    // Had error
    if (err || !user) {
      res.json({
        status: false,
        message: err || 'User not found!'
      }).end();
    } else {
      let userBalance = user.balance || 0;
      getSimpleUserInfoById(expert).then((expertInfo) => {
        if (expertInfo === null) {
          res.json({
            status: false,
            message: 'Expert not found!'
          }).end();
        } else {
          let priceCall = expertInfo.priceCall || 0;
          let priceChat = expertInfo.priceChat || 0;
          // The time user learn can call before they out of money
          // If the price call/chat is zero, then result of operator is null - mean user will call free
          let callTimeAvailable = (userBalance / priceCall) * 60; // In second
          let chatTimeAvailable = (userBalance / priceChat) * 60; // In second
          res.json({
            status: true,
            message: {
              callTimeAvailable: callTimeAvailable,
              chatTimeAvailable: chatTimeAvailable
            }
          }).end();
        }
      });
    }
  });
}

export async function becomeExpertUpdateIndustries(req, res) {
  var token = req.body.token;
  var userID = req.body.userID;
  var categories = req.body.categories;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  var catUpdate = [], skillIds = [];
  try {
    if (categories.length > 0) {
      let deleteIds = [];
      categories.map((item, index) => {
        var catItem = {
          catID: item.catID == '' ? cuid() : item.catID,
          industry: {
            industryID: item.industry.industryID,
            title: item.industry.title
          },
          department: {
            departmentID: item.department.departmentID,
            title: item.department.title
          },
          skills: item.skills,
          description: item.description
        };
        catUpdate.push(catItem);
        item.skills.forEach(skill => {
          skillIds.push(skill._id.toString())
        });
        if (item.skillsRemove && item.skillsRemove instanceof Array) {
          Array.prototype.push.apply(deleteIds, item.skillsRemove);
        }

        //      let skillNames = item.skills.map(skill => {
        //          return skill.skill_ID;
        //      });

        //      conditions.push({
        //          'categoryID': item.department.departmentID,
        //          'description.name': {$in: skillNames}
        //      });
      });


      //    console.log('conditions:', conditions);
      let results = await Promise.all([
        User.findOne({ _id: userID }).exec(),
        Skill.find({ _id: { $in: skillIds } }, 'owners').exec()
      ]);
      let skills = results[1];
      let user = results[0];

      let removedSkillIds = user.skills.filter(skill => {
        skill = skill.toString();
        return skillIds.indexOf(skill) < 0;
      });
      Array.prototype.push.apply(deleteIds, removedSkillIds);

      if (deleteIds instanceof Array && deleteIds.length) {
        deleteIds.forEach(id => {
          let index = user.skills.indexOf(id);
          user.skills.splice(index, 1);
        });
        await Promise.all([
          User.update({ _id: user._id }, { $pull: { skills: { $in: deleteIds } } }, { multi: true }).exec(),
          Skill.update({ _id: { $in: deleteIds } }, { $pull: { owners: user._id } }, { multi: true }).exec()
        ]);
      }

      let uId = user._id.toString();
//    console.log('user:', user);
      // push user._id to skill's owners
      let promises = skills.map(skill => {
        if (skill.owners.indexOf(uId) < 0) {
          skill.owners.push(uId);
          skill.markModified('owners');
          return skill.save();
        }
      });
      // push skill._id to user's skills
      skillIds.forEach(skillId => {
        if (user.skills.indexOf(skillId) < 0) {
          user.skills.push(skillId);
        }
      });
      user.markModified('skills');

      user.categories = catUpdate;
      user.markModified('categories');

      promises.push(user.save());
      await Promise.all(promises);

      result.key = 1;
      result.message = 'Success';

      Q.create(globalConstants.jobName.SYNC_USER_REVIEWS, { cuid: user.cuid }).removeOnComplete(true).save();
      // clear cached search informations.
      Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
      return res.json({ result });
    }
  } catch (err) {
    result.key = -2;
    result.message = 'System error: ' + err;
    res.json({ result });
  }
}

export function becomeExpertUpdateWorkExperience(req, res) {
  var token = req.body.token;
  var userID = req.body.userID;
  var workExperience = req.body.workExperience;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  var workUpdate = [];
  if (workExperience.length > 0) {
    workExperience.map((item, index) => {
      if (item.companyName == '' && item.websiteUrl == '' && item.location == '' && item.position == '') {
        return true;
      }
      var workItem = {
        workID: item.workID == '' ? cuid() : item.workID,
        companyName: item.companyName,
        websiteUrl: item.websiteUrl,
        location: item.location,
        position: item.position,
        startDate: item.startDate,
        endDate: item.endDate,
        workNow: item.workNow,
        details: item.details
      };
      workUpdate.push(workItem);
    });
  }
  User.update(
    { cuid: userID, token: token },
    { $set: { workExperience: workUpdate } },
    (err, numberAffected) => {
      if (err) {
        result.key = -2;
        result.message = 'System error: ' + err;
        res.json({ result });
      } else {
        //numberAffected
        result.key = 1;
        result.message = 'Success';
        res.json({ result });
      }
    }
  );
}

export function becomeExpertUpdateEducation(req, res) {
  var token = req.body.token;
  var userID = req.body.userID;
  var educations = req.body.educations;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  var educationUpdate = [];
  if (educations.length > 0) {
    educations.map((item, index) => {
      if (item.school == '' && item.websiteUrl == '' && item.location == '' && item.degree == '') {
        return true;
      }
      var educationItem = {
        eduID: item.eduID == '' ? cuid() : item.eduID,
        school: item.school,
        websiteUrl: item.websiteUrl,
        location: item.location,
        degree: item.degree,
        startDate: item.startDate,
        endDate: item.endDate,
        details: item.details
      };
      educationUpdate.push(educationItem);
    });
  }
  User.update(
    { cuid: userID, token: token },
    { $set: { education: educationUpdate } },
    (err, numberAffected) => {
      if (err) {
        result.key = -2;
        result.message = 'System error: ' + err;
        res.json({ result });
      } else {
        //numberAffected
        result.key = 1;
        result.message = 'Success';
        res.json({ result });
      }
    }
  );
}

export function becomeExpertUpdateAwards(req, res) {
  var token = req.body.token;
  var userID = req.body.userID;
  var awards = req.body.awards;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  var awardsUpdate = [];
  if (awards.length > 0) {
    awards.map((item, index) => {
      if (item.awardID == '' && item.organization == '' && item.degree == '' && item.award == '') {
        return true;
      }
      var awardItem = {
        awardID: item.awardID == '' ? cuid() : item.awardID,
        organization: item.organization,
        degree: item.degree,
        award: item.award,
        dateReceived: item.dateReceived,
        details: item.details
      };
      awardsUpdate.push(awardItem);
    });
  }
  User.update(
    { cuid: userID, token: token },
    { $set: { award: awardsUpdate } },
    (err, numberAffected) => {
      if (err) {
        result.key = -2;
        result.message = 'System error: ' + err;
        res.json({ result });
      } else {
        //numberAffected
        result.key = 1;
        result.message = 'Success';
        res.json({ result });
      }
    }
  );
}

export function becomeExpertUpdateLanguageSupport(req, res) {
  var token = req.body.token;
  var userID = req.body.userID;
  var languageSupport = req.body.languageSupport;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  var langUpdate = [];
  if (languageSupport.length > 0) {
    languageSupport.map((item, index) => {
      var awardItem = {
        lsID: item.lsID == '' ? cuid() : item.lsID,
        langName: item.langName,
        langCuid: item.langCuid,
        langLevel: item.langLevel,
        langCode: item.langCode
      };
      langUpdate.push(awardItem);
    });
  }
  User.update(
    { cuid: userID, token: token },
    { $set: { languageSupport: langUpdate } },
    (err, numberAffected) => {
      if (err) {
        result.key = -2;
        result.message = 'System error: ' + err;
        res.json({ result });
      } else {
        //numberAffected
        result.key = 1;
        result.message = 'Success';
        // clear cached search informations.
        Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
        res.json({ result });
      }
    }
  );
}

export function becomeExpertUpdateInformation(req, res) {
  var token = req.body.token;
  var userID = req.body.userID;
  var userInfo = req.body.userInfo;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  User.update(
    { cuid: userID, token: token },
    {
      $set: {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        fullName: userInfo.lastName + ' ' + userInfo.firstName,
        gender: userInfo.gender,
        birthday1: userInfo.birthday,
        birthday: userInfo.birthday,
        telephone: userInfo.telephone,
        // email: userInfo.email,
        country: userInfo.country,
        zipCode: userInfo.zipCode,
        aboutUs: userInfo.aboutUs,
        userName: userInfo.userName.toLowerCase()
      }
    },
    (err, numberAffected) => {
      if (err) {
        result.key = -2;
        result.message = 'System error: ' + err;
        res.json({ result });
      } else {
        //numberAffected
        result.key = 1;
        result.message = 'Success';
        // clear cached search informations.
        Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
        res.json({ result });
      }
    }
  );
}

export async function updateMembership(req, res) {
  let users = await User.find({ 'memberShip':{'$exists': true}}).lean()
  if(users){
    users.map(async user => {
      let membership = await MemberShip.findOne({user: user._id}).sort({ 'created_at' : -1})
      if(membership){
        if(membership.time > user.memberShip){
          User.update(
            {_id: user._id},
            {
              $set: {
                memberShip: membership.time
              }
            }
          )
        }
      }
    })
  }
}
export async function becomeExpertUpdateExpert(req, res) {
  var token = req.body.token;
  var userID = req.body.userID;
  var expertInfo = req.body.expertInfo;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  //expert = 2 ==> waiting admin confirm.
  User.update(
    { cuid: userID, token: token },
    {
      $set: {
        priceCall: expertInfo.priceCall < 0 ? 0 : expertInfo.priceCall,
        priceChat: expertInfo.priceChat < 0 ? 0 : expertInfo.priceChat,
        firstMinFree: expertInfo.firstMinFree < 0 ? 0 : expertInfo.firstMinFree,
        expert: 2,
        becomeExpertRequest: new Date()
      }
    },
    async (err, numberAffected) => {
      if (err) {
        result.key = -2;
        result.message = 'System error: ' + err;
        res.json({ result });
      } else {
        //numberAffected
        result.key = 1;
        result.message = 'Success';
        // clear cached search informations.
        let userInfo = await User.findOne({cuid: userID}).lean();
        if(userInfo){
          let dataNotify = {
            to: userInfo._id,
            type: 'completeExpert',
            data: {}
          };
          let dataSendMail = {
            type: 'completeExpert',
            language: req.headers.lang,
            data: {
              cuid: userInfo.cuid,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              userName: userInfo.userName,
              email: userInfo.email
            }
          };
          AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
          Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        }
        Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
        res.json({ result });
      }
    }
  );
}
export async function upadteAutoWithdrawlInfo(req, res) {
  // console.log('upadteAutoWithdrawlInfo');

  let rs = await Promise.all([
    User.findById(req.user._id, 'autoWithdrawl'),
    Withdrawal.findOne({
      userId: req.user._id,
      type: 'full',
      status: 'pending'
    })
  ]);

  let user = rs[0];
  if (rs[1] && !user.autoWithdrawl) {
    return res.status(400).json({
      success: false,
      error: 'Please cancel your pending Full Withdrawal before turning on Auto Withdrawal mode.'
    })
  }
  user.autoWithdrawl = !user.autoWithdrawl;
  await user.save();
  return res.json({ success: true, autoWithdrawl: user.autoWithdrawl });
}
export async function getTotalMembership(req, res) {
  try {
    let total = await User.count({memberShip: {
      $gt: Date.now()
    }}).lean();
    return res.json({ success: true, total})
  } catch (err) {
    return {};
  }
}
export async function adminGetUsers(req, res) {
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * USER_PER_PAGE_ADMIN;
  let condition = [];
  let conditions = {};
  const textSearch = req.query.textSearch ? sanitizeHtml(req.query.textSearch) : '';
  const from = req.query.from ? new Date(req.query.from).getTime() : 0;
  const to = req.query.to ? new Date(req.query.to).getTime() : 0;
  const sort = req.query.sort ? parseInt(req.query.sort) : -1;
  if (textSearch) {
    condition.push({ 'fullName': { $regex: textSearch.trim(), $options: "$i" } });
    condition.push({ 'email': { $regex: textSearch.trim(), $options: "$i" } });
    condition.push({ 'telephone': { $regex: textSearch.trim(), $options: "$i" } });
  }
  if(from && to){
    condition.push({'dateAdded': {
          $gte: new Date(from),
          $lte: new Date(to)
        }});
  } else if(from){
    condition.push({'dateAdded':{$gte: new Date(from)}});
  }else if(to){
    condition.push({'dateAdded': {$lte: new Date(to)}});
  }
  switch (req.query.status) {
    case globalConstants.userStatus.EXPERT_NO_PROFILE:
      conditions.active = 1;
      conditions.expert = 1;
      conditions.['$or'] = [{avatar: {$exists: false}}, { aboutUs: {$in: ['', '<p></p>', '<p></p>\n', '<p></p>\\n']} }, { aboutUs: {$exists: false}}, { avatar: {$in: ['']} }];
      break;
    case globalConstants.userStatus.PENDING:
      conditions.active = 0;
      break;
    case globalConstants.userStatus.USER:
      conditions.active = 1;
      conditions.expert = 0;
      break;
    case globalConstants.userStatus.DEACTIVE:
      conditions.expert = -1;
      break;
    case globalConstants.userStatus.PENDING_DEL:
      conditions.active = -2;
      conditions.deleteDate = {
        $gt: moment().subtract(14, 'days').toDate()
      };
      break;
    case globalConstants.userStatus.DELETED:
      conditions.active = -1;
      conditions.deleteDate = {
        $lte: moment().subtract(14, 'days').toDate()
      };
      break;
    case globalConstants.userStatus.PENDING_EXPERT:
      conditions.expert = 2;
      break;
    case globalConstants.userStatus.EXPERT:
      conditions.expert = 1;
      conditions.active = 1;
      break;
    case globalConstants.userStatus.BANNED:
      conditions.active = -2;
      conditions.deleteDate = null;
      break;
    case globalConstants.userStatus.ALL:
      break;
    case globalConstants.userStatus.MEMBERSHIP:
      conditions.memberShip = { $exists: true };
      const { membershipState } = req.query;
      switch (membershipState) {
        case 'expired': {
          conditions.memberShip = {
            $lt: Date.now()
          };
          break;
        }
        case 'almostExpired': { // near expired
          const threeDays = 3600 * 24 * 3 * 1000;
          conditions.memberShip = {
            $lt: Date.now() + threeDays,
            $gt: Date.now()
          };
          break;
        }
        case 'still': {
          conditions.memberShip = {
            $gt: Date.now()
          };
          break;
        }
        default: {
        }
      }
      break;
    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid user status.'
      });
  }
  let fields = [
    '_id',
    'fullName',
    'code',
    'avatar',
    'cuid',
    'dateOffline',
    'expertReqDate',
    'dateAdded',
    'email',
    'memberShip',
    'teacherMembership',
    'telephone',
    'token',
    'aboutUs'
  ].join(' ');
  try {
    let query = [];
    if (conditions){
      query.push(conditions);
    }
    if (condition.length > 0){
      query.push({ $or: condition});
    }
    let results = await Promise.all([
      User.count({$and: query}).exec(),
      User.find({$and: query}, fields).skip(skip).limit(USER_PER_PAGE_ADMIN).sort({dateAdded: sort}).lean().exec()
    ]);
    let promises = results[1].map(async e => {
      let histories = await Membership.find({ user: e._id }).sort({ created_at: -1 });
      e.lastMemberShip = histories.length > 0 ? histories[0] : null;
      // Add tracking info to user info
      e.viewTracking = await getViewTrackingForUser(e._id);
      return e;
    });
    await Promise.all(promises);
    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(results[0] / USER_PER_PAGE_ADMIN),
      total_items: results[0],
      data: results[1]
    });
  } catch (err) {
    console.log('err on adminGetUsers:', err);
    return res.status(500).json(err);
  }
}

export async function adminGetUsersByType(userType) {
  let conditions = [];
  let searchOption = false;
    switch (userType) {
      case globalConstants.userStatus.PENDING:
        conditions.push(
          { 'active': 0 }
        );
        break;
      case globalConstants.userStatus.USER:
        conditions.push(
          {
            $and:
              [{ 'active': 1 },
                { 'expert': 0 }
              ]
          }
        );
        break;
      case globalConstants.userStatus.DEACTIVE:
        conditions.push(
          { 'expert': -1 }
        );
        break;
      case globalConstants.userStatus.PENDING_DEL:
        conditions.push(
          {
            $and:
              [{ 'active': -2 },
                {
                  'deleteDate': {
                    $gt: moment().subtract(14, 'days').toDate()
                  }
                }
              ]
          }
        );
        break;
      case globalConstants.userStatus.DELETED:
        conditions.push(
          {
            $and:
              [{ 'active': -1 },
                {
                  'deleteDate': {
                    $lte: moment().subtract(14, 'days').toDate()
                  }
                }
              ]
          }
        );
        break;
      case globalConstants.userStatus.PENDING_EXPERT:
        conditions.push(
          { 'expert': 2 }
        );
        break;
      case globalConstants.userStatus.EXPERT:
        conditions.push(
          {
            $and:
              [{ 'active': 1 },
                { 'expert': 1 }
              ]
          }
        );
        break;
      case globalConstants.userStatus.BANNED:
        conditions.push(
          {
            $and:
              [{ 'active': -2 },
                { 'deleteDate': null }
              ]
          }
        );
        break;
      case globalConstants.userStatus.MEMBERSHIP:
        conditions.push(
          { 'memberShip':{'$exists': true}}
        );
        break;
      case globalConstants.userStatus.USERVN:
        searchOption = true;
        conditions.push(
          { 'language':'vi'}
        );
        break;
      // tutor pending because not update profile
      case globalConstants.userStatus.EXPERT_NO_PROFILE:
        conditions.push(
          {
            expert: 1,
            $or: [{avatar: {$exists: false}}, { aboutUs: {$in: ['', '<p></p>', '<p></p>\n', '<p></p>\\n']} }, { aboutUs: {$exists: false}}, { avatar: {$in: ['']} }]
          }
        );
      default:
        break;
    }
  let fields = ['fullName', 'code', 'cuid', 'email', 'firstName', 'lastName', 'userName', 'dateAdded', 'becomeExpertRequest'].join(' ');
  let users = [];
  try {
    if (conditions.length > 0) {
      if(searchOption){
        let userList = await  UserOption.find({'language': 'vi'}, 'userID').exec();
        if(userList){
          let promises = userList.map(async user => {
            return await User.findOne({'cuid': user.userID}, fields).exec();
          })
          users = await Promise.all(promises);
        }
        return users;
      } else {
        return User.find({ $or: conditions }, fields).exec();
      }
    } else {
      return User.find({}, fields).exec();
    }
  } catch (err) {
    return [];
  }
}

export async function adminGetUsersByCuids(users) {
  let fields = ['fullName', 'code', 'cuid', 'email', 'firstName', 'lastName', 'userName'].join(' ');
  try {
    return User.find({ cuid: { $in: users } }, fields).exec();
  } catch (err) {
    return {};
  }
}
export async function adminResetMemberShip(req, res) {
  const _id = sanitizeHtml(req.params.id);
  if(!_id){
    return res.status(400).json({
      success: false,
      error: "Not found user"
    });
  }
  await User.update({_id: _id}, {$unset: {memberShip: 1}}).exec();
  return res.json({
    success: true
  });
}
export async function getHistoryMemberShip(req, res) {
  try {
    let _id = req.params.userId || null;
    if(!_id){
      return res.status(400).json({ success: false, error: 'User not found' });
    }
    return res.json({
      success: true,
      data: await Membership.find({user: _id}, 'memberShip time days_active created_at').sort({_id: -1}).lean()
    });
  } catch (error){
    console.log('err on getHistoryMemberShip:', error);
    return res.status(500).json(error);
  }
}
export async function adminGetUsersByTextSearch(req, res) {
  let condition = [];
  let conditions = [];
  const textSearch = req.query.textSearch ?
    sanitizeHtml(req.query.textSearch) :
    req.params.textSearch ?
      sanitizeHtml(req.params.textSearch) : '';
  const status = req.query.status;
  if (textSearch) {
    condition.push({ 'fullName': { $regex: textSearch.trim(), $options: "$i" } });
    condition.push({ 'code': { $regex: textSearch.trim(), $options: "$i" } });
    condition.push({ 'email': { $regex: textSearch.trim(), $options: "$i" } });
    condition.push({ 'telephone': { $regex: textSearch.trim(), $options: "$i" } });
  }
  if(status){
    switch (status) {
      case globalConstants.userStatus.PENDING:
        conditions.push(
          { 'active': 0 }
        );
        break;
      case globalConstants.userStatus.USER:
        conditions.push(
          {
            $and:
              [{ 'active': 1 },
                { 'expert': 0 }
              ]
          }
        );
        break;
      case globalConstants.userStatus.DEACTIVE:
        conditions.push(
          { 'expert': -1 }
        );
        break;
      case globalConstants.userStatus.PENDING_DEL:
        conditions.push(
          {
            $and:
              [{ 'active': -2 },
                {
                  'deleteDate': {
                    $gt: moment().subtract(14, 'days').toDate()
                  }
                }
              ]
          }
        );
        break;
      case globalConstants.userStatus.DELETED:
        conditions.push(
          {
            $and:
              [{ 'active': -1 },
                {
                  'deleteDate': {
                    $lte: moment().subtract(14, 'days').toDate()
                  }
                }
              ]
          }
        );
        break;
      case globalConstants.userStatus.PENDING_EXPERT:
        conditions.push(
          { 'expert': 2 }
        );
        break;
      case globalConstants.userStatus.EXPERT:
        conditions.push(
          {
            $and:
              [{ 'active': 1 },
                { 'expert': 1 }
              ]
          }
        );
        break;
      case globalConstants.userStatus.BANNED:
        conditions.push(
          {
            $and:
              [{ 'active': -2 },
                { 'deleteDate': null }
              ]
          }
        );
        break;
      case globalConstants.userStatus.MEMBERSHIP:
        conditions.push(
          { 'memberShip':{'$exists': true}}
        );
        break;
      default:
        break;
    }
  }
  let fields = ['fullName', 'code', 'avatar', 'cuid', 'email', 'telephone', 'dateOffline', 'dateAdded', 'active', 'expert', 'deleteDate', 'memberShip', 'teacherMembership'].join(' ');
  try {
    let results;
    let query = [];
    if (conditions.length > 0){
      query.push({ $or: conditions});
    }
    if (condition.length > 0){
      query.push({ $or: condition});
    }
    if (query.length > 0) {
      results = await User.find({$and: query}, fields).skip(0).limit(20).lean();
    }
    return res.json({
      success: true,
      data: results,
      current_page: 1,
      total_items: results.length,
      last_page: 1
    });
  } catch (err) {
    console.log('err on adminGetUsers:', err);
    return res.status(500).json(err);
  }
}

export async function adminApproveExpert(req, res) {
  let ids = [];
  if (req.body.ids) {
    ids = req.body.ids;
  } else if (req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide User's Id(s) to approve."
    });
  }

  let conditions = { _id: { $in: ids } };
  let updateOptions = { $set: { expert: 1, becomeExpert: new Date() } };
  try {
    await User.update(conditions, updateOptions, { multi: true }).exec();
    if (req.body.ids) {
      let users = await User.find({ _id: { $in: ids } }).exec();
      users.forEach(userInfo => {
        var dataSendMail = {
          type: 'approvedExpert',
          language: req.headers.lang,
          data: {
            cuid: userInfo.cuid,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            userName: userInfo.userName,
            email: userInfo.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
        var dataNotify = {
          to: userInfo._id,
          type: 'approvedExpert',
          data: {}
        };
        // addNotification(dataNotify);
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
      });
    } else if (req.body.id) {
      getSimpleUserInfoByIdObject(req.body.id).then((user) => {
        var dataSendMail = {
          type: 'approvedExpert',
          language: req.headers.lang,
          data: {
            cuid: user.cuid,
            firstName: user.firstName,
            lastName: user.lastName,
            userName: user.userName,
            email: user.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
        var dataNotify = {
          to: user._id,
          type: 'approvedExpert',
          data: {}
        };
        // addNotification(dataNotify);
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
        res.json({ result: 2 });
      });
    }
    // clear cached search informations.
    Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();
    return res.json({ success: true });
  } catch (err) {
    console.log('err on adminApproveExpert:', err);
    return res.status(500).json(err);
  }
}

export async function adminBanUser(req, res) {
  let ids = [];
  if (req.body.ids) {
    ids = req.body.ids;
  } else if (req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide User's Id(s) to ban."
    });
  }

  let conditions = { _id: { $in: ids } };
  let updateOptions = {
    $set: { active: -2 },
    $unset: { deleteDate: 1 }
  };
  try {
    await User.update(conditions, updateOptions, { multi: true }).exec();
    if (req.body.ids) {
      let users = await User.find({ _id: { $in: ids } }).exec();
      users.forEach(userInfo => {
        var dataSendMail = {
          type: 'banUserByAdmin',
          language: req.headers.lang,
          data: {
            cuid: userInfo.cuid,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            userName: userInfo.userName,
            email: userInfo.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
      });
    } else if (req.body.id) {
      getSimpleUserInfoByIdObject(req.body.id).then((user) => {
        var dataSendMail = {
          type: 'banUserByAdmin',
          language: req.headers.lang,
          data: {
            cuid: user.cuid,
            firstName: user.firstName,
            lastName: user.lastName,
            userName: user.userName,
            email: user.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
      });
    }
    return res.json({ success: true });
  } catch (err) {
    console.log('err on adminBanUser:', err);
    return res.status(500).json(err);
  }
}

export async function adminUnBanUser(req, res) {
  let ids = [];
  if (req.body.ids) {
    ids = req.body.ids;
  } else if (req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide User's Id(s) to unban."
    });
  }

  let conditions = { _id: { $in: ids } };
  let updateOptions = {
    $set: { active: 1 },
    $unset: { deleteDate: 1 }
  };
  try {
    await User.update(conditions, updateOptions, { multi: true }).exec();
    if (req.body.ids) {
      let users = await User.find({ _id: { $in: ids } }).exec();
      users.forEach(userInfo => {
        var dataSendMail = {
          type: 'unBanUserByAdmin',
          language: req.headers.lang,
          data: {
            cuid: userInfo.cuid,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            userName: userInfo.userName,
            email: userInfo.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
      });
    } else if (req.body.id) {
      getSimpleUserInfoByIdObject(req.body.id).then((user) => {
        var dataSendMail = {
          type: 'unBanUserByAdmin',
          language: req.headers.lang,
          data: {
            cuid: user.cuid,
            firstName: user.firstName,
            lastName: user.lastName,
            userName: user.userName,
            email: user.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
        res.json({ result: 2 });
      });
    }
    return res.json({ success: true });
  } catch (err) {
    console.log('err on adminUnBanUser:', err);
    return res.status(500).json(err);
  }
}

export async function adminDeleteUser(req, res) {
  let ids = [];
  if (req.body.ids) {
    ids = req.body.ids;
  } else if (req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide User's Id(s) to delete."
    });
  }

  let conditions = { _id: { $in: ids } };
  let updateOptions = {
    $set: { active: -1, deleteDate: moment().subtract(15, 'days') }
  };
  try {
    await User.update(conditions, updateOptions, { multi: true }).exec();
    if (req.body.ids) {
      let users = await User.find({ _id: { $in: ids } }).exec();
      users.forEach(userInfo => {
        var dataSendMail = {
          type: 'deleteUserByAdmin',
          language: req.headers.lang,
          data: {
            cuid: userInfo.cuid,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            userName: userInfo.userName,
            email: userInfo.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
      });
    } else if (req.body.id) {
      getSimpleUserInfoByIdObject(req.body.id).then((user) => {
        var dataSendMail = {
          type: 'deleteUserByAdmin',
          language: req.headers.lang,
          data: {
            cuid: user.cuid,
            firstName: user.firstName,
            lastName: user.lastName,
            userName: user.userName,
            email: user.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
        res.json({ result: 2 });
      });
    }
    return res.json({ success: true });
  } catch (err) {
    console.log('err on adminDeleteUser:', err);
    return res.status(500).json(err);
  }
}

export async function adminSwapRoleUser(req, res) {
  let ids = [];
  if (req.body.ids) {
    ids = req.body.ids;
  } else if (req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide User's Id(s) to Active."
    });
  }

  let conditions = { _id: { $in: ids } };
  let updateOptions = {
    $set: { expert: parseInt(req.query.expert)}
  };
  try {
    await User.update(conditions, updateOptions, { multi: true }).exec();
    return res.json({ success: true });
  } catch (err) {
    console.log('err on adminDeleteUser:', err);
    return res.status(500).json(err);
  }
}

export async function adminActiveUser(req, res) {
  let ids = [];
  if (req.body.ids) {
    ids = req.body.ids;
  } else if (req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide User's Id(s) to Active."
    });
  }

  let conditions = { _id: { $in: ids } };
  let updateOptions = {
    $set: { active: 1}
  };
  try {
    await User.update(conditions, updateOptions, { multi: true }).exec();
    return res.json({ success: true });
  } catch (err) {
    console.log('err on adminDeleteUser:', err);
    return res.status(500).json(err);
  }
}

export async function adminUnsetExpert(req, res) {
  let ids = [];
  if (req.body.ids) {
    ids = req.body.ids;
  } else if (req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide User's Id(s) to unset expert."
    });
  }

  let conditions = { _id: { $in: ids } };
  let updateOptions = { $set: { expert: 0 } };
  try {
    await User.update(conditions, updateOptions, { multi: true }).exec();
    // clear cached search informations.
    Q.create(globalConstants.jobName.CLEAR_CACHED, {}).removeOnComplete(true).save();

    if (req.body.ids) {
      let users = await User.find({ _id: { $in: ids } }).exec();
      users.forEach(userInfo => {
        var dataSendMail = {
          type: 'unsetExpertByAdmin',
          language: req.headers.lang,
          data: {
            cuid: userInfo.cuid,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            userName: userInfo.userName,
            email: userInfo.email
          }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
        // sendMail(dataSendMail);
        var dataNotify = {
          to: userInfo._id,
          type: 'unsetExpertByAdmin',
          data: {}
        };
        // addNotification(dataNotify);
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
      });
    }
    return res.json({ success: true });
  } catch (err) {
    console.log('err on adminUnsetExpert:', err);
    return res.status(500).json(err);
  }
}

export function adminSendNotification(user, content, link) {
  var dataNotify = {
    to: user._id,
    type: 'adminNotification',
    data: {
      content: content,
      link: link
    }
  };
  //addNotification(dataNotify);
  AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
}

export function adminSendEmail(user, subject, content, origin) {
  const dataSendMail = {
    type: 'adminNotification',
    origin: origin,
    data: {
      cuid: user.cuid,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      subject: subject,
      content: content
    }
  };
  Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
  // sendMail(dataSendMail);
}

export async function adminSendEmailOrNotify(req, res) {
  let users = {};
  if (req.body.userType && req.body.userType === 'specific') {
    if (req.body.users) {
      users = await adminGetUsersByCuids(req.body.users);
    }
  } else {
    users = await adminGetUsersByType(req.body.userType);
  }
  try {
    if (users.length > 0) {
      users.map((user) => {
        if(user){
          const { sendType } = req.body;
          if (sendType === 'notify') {
            adminSendNotification(user, req.body.content, req.body.notifyLink);
          }
          if (sendType === 'mail' && user.email) {
            adminSendEmail(user, req.body.subject, req.body.content, req.headers.origin);
          }
        }
      });
      return res.json({ success: true });
    } else {
      return res.status(400).json({
        success: false,
        error: "Don't find user to send"
      });
    }
  } catch (err) {
    console.log('err on admin send mail & noti:', err);
    return res.status(500).json(err);
  }
}

export function adminGetOwnInfo(req, res) {
  return res.json({
    success: true,
    data: req.user
  })
}

export function adminGetOwnPermission(req, res) {
  let url = req.params.url;
  if(!url){
    return res.json({
      success: true,
      permission: 'VAL_EMPTY'
    })
  }
  if(!req.user){
    return res.json({
      success: true,
      permission: 'USER_NOT_FOUND'
    })
  }
  if(!req.user.role  || !req.user.role === 'user'){
    return res.json({
      success: true,
      permission: 'PERMISSION_DENIED'
    })
  }
  let permission = globalConstants.permissionRole[req.user.role];
  return res.json({
    success: true,
    data: req.user
  })
}

//============== FEED ==============
export function addInterestSkills(userId, skillIds) {
  return User.update({ _id: userId }, { $push: { interested_skills: { $each: skillIds } } });
}

/**
 * Check user already have interested_skills ? done : does not done
 * @param req
 * @param res
 */

export async function preFeedInfo(req, res) {
  let userId = req.user._id;
  try {
    User.findOne({ _id: userId }, 'skipFeed').exec(async (err, user) => {
      if (err) {
        return res.json({ success: false, exception: err });
      }
      if (!user) {
        return res.json({ success: false, exception: 'User not found.' });
      }
      let count = await User.count({ $and: [{ _id: userId }, { interested_skills: { $gt: [] } }] });
      res.json({ success: true, donePreFeed: count > 0, skipFeed: user.skipFeed });
    });
  } catch (ex) {
    res.json({ success: false, exception: ex });
  }
}

/**
 * Mark the user had skip the pre-feed step
 * @param req
 * @param res
 */
export function skipPreFeed(req, res) {
  let userId = req.user._id;
  try {
    User.update({ _id: userId }, { $set: { skipFeed: true } }).exec();
    res.json({ success: true });
  } catch (ex) {
    res.json({ success: false, exception: ex });
  }
}

/**
 * Mark the user had skip the pre-feed step
 * @param req
 * @param res
 */
export function isDismissTour(req, res) {
  let userId = req.user._id;
  try {
    User.findOne({ _id: userId }, 'dismissTour').exec(async (err, user) => {
      if (err) {
        return res.json({ success: false, exception: err });
      }
      if (!user) {
        return res.json({ success: false, exception: 'User not found.' });
      }
      res.json({ success: true, dismissTour: user.dismissTour });
    });
  } catch (ex) {
    res.json({ success: false, exception: ex });
  }
}

/**
 * Mark the user had skip the pre-feed step
 * @param req
 * @param res
 */
export function dismissTour(req, res) {
  let userId = req.user._id;
  try {
    User.update({ _id: userId }, { $set: { dismissTour: true } }).exec();
    res.json({ success: true });
  } catch (ex) {
    res.json({ success: false, exception: ex });
  }
}

export async function getInterestedSkills(req, res) {
  let langCode = req.headers.lang;

  let user = await User.findById(req.user._id, 'interested_skills interested_departments').lean();
  let skills = await Skill.find({ _id: { $in: user.interested_skills } }).lean();
  skills = formatSkillByLanguage(skills, langCode);

  let data = {};
  skills.forEach(skill => {
    if (!data.hasOwnProperty(skill.categoryID)) {
      data[skill.categoryID] = [{ _id: skill._id, name: skill.description.name }];
    } else {
      data[skill.categoryID].push({ _id: skill._id, name: skill.description.name });
    }
  });
  let cateIds = user.interested_departments;
  let departments = await Category.find({ cuid: { $in: cateIds } }, 'cuid title slug description').lean();
  departments = formatCategoryByLanguage(departments, langCode);

  departments = JSON.parse(JSON.stringify(departments));
  departments = departments.map(department => {
    department.skills = data[department.cuid];
    return department;
  });
  return res.json({ data: departments });
}

//============== END FEED ==============

export async function resetUnreadMessages(req, res) {
  try {
    let chatGroup = await ChatGroup.findOne({ cuid: req.params.groupCuid }).lean();
    let index = ArrayHelper.findItemByProp(chatGroup.userViewInfo, 'userID', req.user.cuid);
    chatGroup.userViewInfo[index].messageUnread = 0;
    await ChatGroup.update({
      _id: chatGroup._id
    },{
      $set: {
        userViewInfo: chatGroup.userViewInfo
      }
    });
    await Notification.update({ userID: req.user.cuid }, { $pull: { messageGroup: req.params.groupCuid } })
    // chatGroup.markModified('userViewInfo');
    // await Promise.all([
    //   chatGroup.save(),
    //   Notification.update({ userID: req.user.cuid }, { $pull: { messageGroup: req.params.groupCuid } })
    // ]);
    return res.json({ success: true });
  } catch (err) {
    console.log('err on resetUnreadMessages:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

export async function updatePointGoal(req, res) {
  try {
    let { user } = req
    if(!user){
      return res.status(400).json({ success: false, error: 'User not found' });
    }
    user = await User.findById(user._id).lean()
    if(!user){
      return res.status(400).json({ success: false, error: 'User not found' });
    }
    await User.updateOne({ _id: user._id }, {
      $set: {
        pointGoal: req.body
      }
    })
    return res.json({
      success: true
    });
  } catch (err) {
    console.log('err on updatePointGoal:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

export async function updatePoint(req, res) {
  try {
    let { user } = req
    if(!user){
      return res.status(400).json({ success: false, error: 'User not found' });
    }
    user = await User.findById(user._id).lean()
    if(!user){
      return res.status(400).json({ success: false, error: 'User not found' });
    }
    await User.updateOne({ _id: user._id }, {
      $set: {
        point: req.body
      }
    })
    return res.json({
      success: true
    });
  } catch (err) {
    console.log('err on updatePoint:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

export async function addDeviceTokens(req, res) {
  try {
    let user = await User.findById(req.user._id, 'deviceTokens').lean();
    // if(!user.deviceTokens) {
    //   await User.update({_id: user._id}, {$set: {deviceTokens: [req.body.deviceToken]}});
    // } else if (user.deviceTokens.indexOf(req.body.deviceToken) < 0) {
    // user.deviceTokens.push(req.body.deviceToken);
    // user.markModified('deviceTokens');
    if (user.deviceTokens) {
      if (req.body.deviceToken && user.deviceTokens.indexOf(req.body.deviceToken) < 0) {
        await User.update({ _id: req.user._id }, { $push: { deviceTokens: req.body.deviceToken } }, { $pull: { deviceTokens: req.body.oldToken } });
      } else {
        await User.update({ _id: req.user._id }, { $pull: { deviceTokens: req.body.oldToken } });
      }
    } else {
      await User.update({ _id: req.user._id }, { $push: { deviceTokens: req.body.deviceToken } });
    }
    // }

    return res.json({ success: true });
  } catch (err) {
    console.log('err on addDeviceTokens:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

export async function addDeviceAWSTokens(req, res) {
  try {
    let user = await User.findById(req.user._id, 'deviceAWSTokens').lean();
    // if(!user.deviceTokens) {
    //   await User.update({_id: user._id}, {$set: {deviceTokens: [req.body.deviceToken]}});
    // } else if (user.deviceTokens.indexOf(req.body.deviceToken) < 0) {
    // user.deviceTokens.push(req.body.deviceToken);
    // user.markModified('deviceTokens');
    if (user.deviceAWSTokens) {
      if (req.body.deviceAWSToken && user.deviceAWSTokens.indexOf(req.body.deviceAWSToken) < 0) {
        await User.update({ deviceAWSToken: req.body.deviceAWSToken }, { $pull: { deviceAWSTokens: req.body.deviceAWSToken } });
        await User.update({ _id: req.user._id }, { $push: { deviceAWSTokens: req.body.deviceAWSToken } }, { $pull: { deviceAWSTokens: req.body.oldToken } });
      } else {
        await User.update({ _id: req.user._id }, { $pull: { deviceAWSTokens: req.body.oldToken } });
      }
    } else {
      await User.update({ _id: req.user._id }, { $push: { deviceAWSTokens: req.body.deviceAWSToken } });
    }
    // }

    return res.json({ success: true });
  } catch (err) {
    console.log('err on addDeviceAWSTokens:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

export async function sendMailInvite(req, res) {
  if (req.body.emails) {
    let user = await User.findById(req.user._id);
    let invite = await EmailInivte.findOne({ user: req.user._id }).exec();
    if (user && !invite) {
      const newEmailInivte = new EmailInivte({
        user: req.user._id,
        emails: []
      });
      await newEmailInivte.save();
    }
    if (user) {
      req.body.emails.forEach(email => {
        if (typeof email.checked === 'undefined' || email.checked) {
          if (typeof email.invite === 'undefined' || email.invite === false) {
            EmailInivte.update({ user: req.user._id }, { $push: { emails: email.email } },
              function (err, numberAffected, rawResponse) {
                if (err) {
                  console.log(err);
                }
              });
            var dataSendMail = {
              type: 'emailInvite',
              language: req.headers.lang,
              data: {
                inviteCode: user.inviteCode,
                firstName: user.firstName,
                lastName: user.lastName,
                userName: user.userName,
                email: email.email
              }
            };
            Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
          }
        }
      });
      return res.json({ success: true });
    }
  }
  return res.json({ success: true });
}

export async function editInviteCode(req, res) {
  if (req.params.code) {
    await UserUseInviteCode.create({
      user: req.user._id,
      code: req.params.code
    });
    return res.json({ success: true });
  } else {
    return res.json({ success: false });
  }
}

export async function getMetaCatBySlug(req, res) {
  try {
    let slug = req.params.slug;
    let cate = await Category.findOne({ slug: slug }, 'title slug cuid').exec();
    if (cate) {
      return res.json({
        title: cate.title,
        description: 'Gain a huge amount of knowledge related to ' + cate.title + ' from top experts and users throughout the world. Enjoy specific information and knowledge about ' + cate.title,
        tags: [],
        type: 'article',
        thumbnails: '',
      });
    } else {
      return res.json({});
    }
  } catch (err) {
    return res.json({});
  }
}


export async function buyPoints(req, res) {
  try {
    let user = await User.findOne({ _id: req.user._id });

    let quantity = Number(req.body.quantity).valueOf();
    if (isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity.'
      });
    }
    let price = quantity * serverConfig.pricePoint;

    if (user.balance < price) {
      return res.status(400).json({
        success: false,
        error: 'Your balance is not enough.'
      });
    }

    user.balance -= price;
    user.points += quantity;

    await user.save();

    return res.json({
      success: true,
      data: {
        balance: user.balance,
        points: user.points
      }
    });
  } catch (err) {
    console.log('err on buyPoints:', err);
    return res.json({
      success: false,
      error: 'Internal error.'
    });
  }
}

export async function sellPoint(req, res) {
  try {
    let amount = Number(req.body.amount).valueOf();
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ success: false, error: 'User Khong Ton Tai!' });
    }
    if (user.points < amount) {
      return res.status(400).json({ success: false, error: 'Not enough point' });
    }

    let fee = parseFloat((serverConfig.feeExchangePoint * serverConfig.pricePoint * amount).toFixed(2));
    let value = parseFloat((serverConfig.pricePoint * amount - fee).toFixed(2));
    let originPoints = parseFloat(user.points), originBalance = parseFloat(user.balance);

    try {
      user.points = (originPoints - amount).toFixed(2);
      user.balance = (originBalance + value).toFixed(2);
      await user.save();

      await ExchangePoints.create({
        user: req.user._id,
        price: serverConfig.pricePoint,
        amount: amount.toFixed(2),
        fee: fee,
        total: value
      });
    } catch (err) {
      user.points = originPoints;
      user.balance = originBalance;
      await user.save();
      throw err;
    }

    return res.json({
      success: true,
      data: {
        balance: user.balance,
        points: user.points
      }
    });
  } catch (err) {
    console.log('err on sellPoint:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

export async function checkBuyMemberShip(req, res) {
  try {
    if (!req.params.memberShip) {
      return res.status(400).json({ success: false, error: 'memberShip not found' });
    }
    let memberShips = serverConfig.memberShips;
    let memberShip = memberShips.value[req.params.memberShip];

    if (!memberShip)
      return res.status(400).json({ success: false, error: 'memberShip not found' });

    let user = await User.findById(req.user._id, 'balance');
    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }

    let rate = serverConfig.moneyExchangeRate[req.headers.lang] ? serverConfig.moneyExchangeRate[req.headers.lang] : 1;
    let currency = serverConfig.currency[req.headers.lang] ? serverConfig.currency[req.headers.lang] : 'USD';
    return res.json({
      success: true,
      data: await checkMemberShip(memberShip, user, rate, currency)
    });
  } catch (err) {
    console.log('err on checkBuyMemberShip:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

export async function joinMembership(req, res) {
  try {
    if (!req.params.memberShip) {
      return res.status(400).json({ success: false, error: 'memberShip not found' });
    }
    let code = req.query.affCode;
    let memberShip = serverConfig.memberShips.value[req.params.memberShip];


    if (!memberShip)
      return res.status(400).json({ success: false, error: 'memberShip not found' });

    let user = await User.findById(req.user._id, 'balance');
    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }
    let rate = serverConfig.moneyExchangeRate[req.headers.lang] ? serverConfig.moneyExchangeRate[req.headers.lang] : 1;
    let currency = serverConfig.currency[req.headers.lang] ? serverConfig.currency[req.headers.lang] : 'USD';

    let contactInfo = req.body.contactInfo;
    if (!contactInfo || !contactInfo.fullName || !contactInfo.email || !contactInfo.phoneNumber) {
      return res.status(400).json({ success: false, error: 'Invalid contact info.' });
    }
    let checked = await checkMemberShip(memberShip, user, rate, currency);
    if (checked && !checked.buyAble) {
      return res.json({
        success: false,
        data: checked
      });
    }
    if (contactInfo.inviteCode){
      let userInvite = await User.findOne({'inviteCode': contactInfo.inviteCode.trim(), memberShip: { '$exists': true }}).lean();
      if(userInvite && userInvite.memberShip < new Date().getTime() + 14*24*60*60*1000){
        contactInfo.inviteCode = '';
      }
    }
    let dataMemberShip = await buyMemberShip(req.user._id, req.params.memberShip, req.headers.lang, contactInfo, code);
    if (dataMemberShip.booked) {
      return res.json({
        success: true,
        data: dataMemberShip
      });
    }
    return res.json({
      success: false,
      error: 'Internal error.'
    });
  } catch (err) {
    console.log('err on checkBuyMemberShip:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

export async function trialMembership(req, res) {
  try {
    if (!req.params.memberShip) {
      return res.status(400).json({ success: false, error: 'memberShip not found' });
    }
    let memberShip = serverConfig.memberShips.value[req.params.memberShip];
    if (memberShip === null)
      return res.status(400).json({ success: false, error: 'memberShip not found' });
    let token = req.headers.token ? req.headers.token : '';
    let user = {};
    if(token) {
      user = await User.findOne({'token': token}, 'cuid');
    }
    let contactInfo = req.body.contactInfo;
    if (!contactInfo || !contactInfo.fullName || !contactInfo.email || !contactInfo.phoneNumber) {
      return res.status(400).json({ success: false, error: 'Invalid contact info.' });
    }
    let checked = await checkResTrialMembership(req.params.memberShip, contactInfo.email);
    if (!checked) {
      return res.json({
        success: false,
        code: 'EXIST'
      });
    }
    let result = await sendCodeTrialToEmail(req.params.memberShip, contactInfo, user);
    if(!result)
      return res.json({
        success: false,
        code: 'ERROR'
    });
    Sheet_Services.addSheetMemberShipTrial(contactInfo);
    return res.json({
      success: true
    });
  } catch (err) {
    console.log('err on checkBuyMemberShip:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

// Edit function get promotion for membership by value config from admin
// export async function activeCodeMemberShip(req, res) {
//   try {
//     let code = req.params.code;
//     let inviteCode = req.query.inviteCode || '';
//     if (!code) {
//       return res.status(400).json({ success: false, error: 'Code not found' });
//     }
//     if (code.trim().length !== 10)
//       return res.status(400).json({ success: false, error: 'Code invalid' });
//
//     let user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(400).json({ success: false, error: 'User not found' });
//     }
//     let dataMemberShip = await activeMembershipByCode(req.user._id, code, req.headers.lang, inviteCode);
//     return res.json({
//       success: true,
//       data: dataMemberShip
//     });
//   } catch (err) {
//     console.log('err on checkBuyMemberShip:', err);
//     return res.status(500).json({ success: false, error: 'Internal error.' });
//   }
// }

export async function activeCodeMemberShip(req, res) {
  try {
    let code = req.params.code;
    let inviteCode = req.query.inviteCode || '';
    if (!code) {
      return res.status(400).json({ success: false, error: 'Code not found' });
    }
    // if (code.trim().length !== 10)
    //   return res.status(400).json({ success: false, error: 'Code invalid' });

    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }
    let dataMemberShip = await activeMembershipByCode(req.user._id, code, req.headers.lang, inviteCode);
    return res.json({
      success: true,
      data: dataMemberShip
    });
  } catch (err) {
    console.log('err on checkBuyMemberShip:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

export async function checkPromotionMemberShip(req, res) {
  try {
    let inviteCode = req.params.inviteCode;
    if (!inviteCode) {
      return res.status(400).json({ success: false, error: 'CODE_NOT_FOUND' });
    }
    let user = await User.findOne({inviteCode:inviteCode.trim()}, 'cuid memberShip').lean();
    if (!user) {
      return res.status(400).json({ success: false, error: 'CODE_NOT_FOUND' });
    }
    if (req.user._id && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ success: false, error: 'CODE_YOURSELF' });
    }
    if(!user.memberShip){
      return res.status(400).json({ success: false, error: 'USER_NOT_MEMBERSHIP' });
    }
    if(user.memberShip < new Date().getTime() + 14*24*60*60*1000){
      return res.status(400).json({ success: false, error: 'USER_EXPIRE_MEMBERSHIP' });
    }
    return res.json({
      success: true,
      data: user.memberShip
    });
  } catch (err) {
    console.log('err on checkPromtionMemberShip:', err);
    return res.status(500).json({ success: false, error: 'SYS_ERROR' });
  }
}

export async function getUserMembership(req, res) {
  try {
    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found' });
    }
    if(user.point){
      if(user.memberShip > new Date().getTime()){
        return res.json({
          success: true,
          data: {
            memberShip: user.memberShip > new Date().getTime() || false,
            time: user.memberShip || 0,
            type: 1
          }
        });
      } else {
        return res.json({
          success: true,
          data: {
            memberShip: user.memberShip > new Date().getTime() || false,
            time: user.memberShip || 0,
            type: user.customerId ? 3 : 4
          }
        });
      }
    } else {
      return res.json({
        success: true,
        data: {
          memberShip: user.memberShip > new Date().getTime() || false,
          time: user.memberShip || 0,
          type: 2
        }
      });
    }
  } catch (err) {
    console.log('err on getUserMembership:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}


export async function adminGetMembership(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const paymentType = req.query.paymentType || null;
    const status = req.query.status !== undefined && !isNaN(Number(req.query.status)) ? req.query.status : null;
    const skip = USER_PER_PAGE_ADMIN * (page - 1);
    const limit = USER_PER_PAGE_ADMIN * page;

    const { members, totalItems } = await queryMembership(paymentType, status, { skip, limit });

    res.json({
      success: true,
      data: members,
      current_page: page,
      total_items: totalItems,
      last_page: Math.ceil(totalItems / (page * USER_PER_PAGE_ADMIN))
    })
  } catch (err) {
    console.log('err in admin get membership', err)
  }
}

export async function adminSearchMembership(req, res) {
  try {
    const searchText = decodeURIComponent(req.query.searchText);
    if (searchText === undefined || searchText === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Params'
      })
    }

    const data = await searchMembership(searchText);
    if (!data) {
      return res.json({
        success: false,
        error: 'Service error'
      })
    }
    res.json({
      data,
      success: true,
    })
  } catch (err) {
    console.log('error in search membership', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

export async function adminSearchUser(req, res) {
  try {
    const searchText = decodeURIComponent(req.query.searchText);
    if (searchText === undefined || searchText === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Params'
      })
    }

    const data = await searchUserByEmail(searchText);
    if (!data) {
      return res.json({
        success: false,
        error: 'Service error'
      })
    }

    res.json({
      data,
      success: true,
    })
  } catch (err) {
    console.log('error in adminSearchUser', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

export async function adminGeneralCodeUser(req, res) {
  try {
    await generalCodeUser();
    res.json({
      success: true,
    })
  } catch (err) {
    console.log('error in adminSearchUser', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

export async function updateProfileUser(req, res) {
  try {
    let data = req.body;
    let error = {};
    if(data.telephone){
      if(await User.count({telephone: data.telephone, _id:{'$ne':[req.user._id]}})){
        error.telephone = 1
      }
    }
    if(JSON.stringify(error) !== '{}'){
      return res.json({
        success: true,
        error
      })
    }
    if(data.telephone) {
      await User.update({
          _id: req.user._id
        },
        {
          $set: {
            telephone: data.telephone
          }
        })
    }
    return res.json({
      success: true
    })
  } catch (err) {
    console.log('error in updateProfileUser', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

export async function userLoginByPhone(req, res) {
  try{
    let idToken = req.body.idToken;
    if(!idToken){
      throw {
        success: false,
        status: 400,
        error: 'Invalid Params'
      }
    }
    let options = {
      idToken
    };
    if(req.query.version){
      options.version = req.query.version;
    }
    let data = await verifyAuthPhone(options);
    return res.json({
      userLogin: data
    });
  }catch (err) {
    return res.status(err.status).json(err);
  }
}


export async function verifyPhone(req, res) {
  try {
    let idToken = req.body.idToken;
    if(!idToken){
      throw {
        success: false,
        status: 400,
        error: 'Invalid Params'
      }
    }
    let options = {
      idToken,
      user: req.user._id
    };
    if(req.query.version){
      options.version = req.query.version;
    }
    let data = await verifyPhoneUser(options);
    return res.json(data);
  } catch (err) {
    return res.status(err.status).json(err);
  }
}

export async function trackingVideo(req, res) {
  try {
    let streamId = req.params.id;
    if(!streamId){
      throw {
        status: 400,
        success: false,
        error: 'Invalid Params.'
      }
    }
    let stream = await LiveStream.findById(streamId).lean();
    if(!stream){
      throw {
        status: 400,
        success: false,
        error: 'StreamId not found.'
      }
    }
    await UserTrackingViewStream.update({
      streamId,
      userId: req.user._id,
      courseId: stream.course
    },{
      $set: {
        beginTime: Date.now(),
        endTime: Date.now(),
        totalTime: 0
      }
    },{
      upsert: true
    });

    await HistoryActionUser.create({
      user: req.user._id,
      object: streamId,
      type: globalConstants.ACTIONS.CLICK_VIDEO,
      time: Date.now()
    });
    return res.json({
      success: true
    })
  } catch (err) {
    return res.status(err.status || 500).json(err)
  }
}

export async function createUserByPhone(req, res) {
  try {
    let idToken = req.body.idToken || null;
    let lastName = req.body.lastName || null;
    let firstName = req.body.firstName || null;
    let userName = await buildSlugUserName('');
    let email = req.body.email || null;
    if(!email || !firstName || !lastName || !idToken) {
      throw {
        success: false,
        status: 400,
        error: 'Invalid Params.'
      }
    }
    let data = await createUserByPhoneService({
      lastName,
      firstName,
      userName,
      email
    }, idToken, req.body.ref, req.body.refTask, req.query.version || null, req.query.appLoginId || null);
    return res.json({
      userLogin: data
    })
  } catch (err) {
    return res.status(err.status || 500).json(err)
  }
}

export async function sendContactUs(req, res) {
  try {
    const data = req.body;
    await addTeacherRegistration({
      name: data.name,
      email: data.email,
      phone: data.phone,
      type: data.type,
      requirement: data.requirement,
    });
    const dataSendMail = {
      type: 'userContact',
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        type: data.type,
        content: data.requirement
      }
    };
    Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
    return res.json({
      success: true
    })
  } catch (err) {
    console.log('err on sendContactUs:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}


export async function subscriptionNewsletter(req, res) {
  try {
    const data = req.body;
    await addSubscriptionNewsletter(data);
    return res.json({
      success: true
    })
  } catch (err) {
    console.log('err on subscriptionNewsletter:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function getListNewsAgentByAdmin(req, res) {
  try {
    const query = commonGetQuery(req);
    const payload = await getListNewsAgentByAdminService(query);
    return res.RH.paging(payload, query.page, query.limit);
  } catch (error) {
    console.log('err on get list news agent:', error);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function createNewsByAdmin(req, res) {
  try {
    const { body, user } = req;
    return res.RH.success(await createNewsByAdminService(user, body));
  } catch (error) {
    console.log('err on create news admin:', error);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function getDetailNewsByAdmin(req, res) {
  try {
    const { id } = req.params;
    return res.RH.success(await getDetailNewsByAdminService(id));
  } catch (error) {
    console.log('err on get details news admin:', error);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function updateNewsByAdmin(req, res) {
  try {
    const { id } = req.params;
    const { body } = req;
    return res.RH.success(await updateNewsByAdminService(id, body));
  } catch (error) {
    console.log('err on update news admin:', error);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function deleteNewsByAdmin(req, res) {
  try {
    const { id } = req.params;
    return res.RH.success(await deleteNewsByAdminService(id));
  } catch (error) {
    console.log('err on delete news admin:', error);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

/**
 * create question point test by  admin
 * @param {*} req 
 * @param {*} res 
 * @returns {*}
 */
export async function createQuestionPointTest(req, res) {
  try {
    const { body } = req;
    const payload = await createQuestionPointTestService(body);
    return res.RH.success(payload);
  } catch (error) {
    console.log('err on createquestionPointTest: ', error);
    return res.status(error.status || 500).json(error)
  }
}

export async function getListQuestionPointTest(req, res) {
  try {
    const query = commonGetQuery(req);
    const payload = await getListQuestionPointTestService(query);
    return res.RH.paging(payload, query.page, query.limit);
  } catch (error) {
    console.log('err on get list question point test: ', error);
    return res.status(error.status || 500).json(error);
  }
}

export async function deleteQuestionPointTest(req, res) {
  try {
    const { id } = req.params;
    return res.RH.success(await deleteQuestionPointTestService(id));
  } catch (error) {
    console.log('err delete question point test: ', error);
    return res.status(error.status || 500).json(error);
  }
}

/**
 * get detail question by admin
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
export async function getDetailQuestionPointTest(req, res) {
  try {
    const { id } = req.params;
    return res.RH.success(await getDetailQuestionPointTestService(id));
  } catch (error) {
    console.log('get detail question point test: ', error);
    return res.status(error.status || 500).json(error);
  }
}

/**
 * update question point test by admin
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
export async function updateQuestionPointTest(req, res) {
  try {
    const { id } = req.params;
    const { body } = req;
    const payload = await updateQuestionPointTestService(id, body);
    return res.RH.success(payload);
  } catch (error) {
    console.log('edit question point test: ', error);
    return res.status(error.status || 500).json(error);
  }
}

export async function getProfileByToken(req, res) {
  try {
    const { user } = req;
    const payload = await getProfileByTokenService(user);
    return res.RH.success(payload);
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function getListNewest(req, res) {
  try {
    const query = commonGetQuery(req);
    const payload = await getListNewestService(query);
    return res.RH.paging(payload, query.page, query.limit);
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function getDetailNews(req, res) {
  try {
    const { id } = req.params;
    return res.RH.success(await getDetailNewsService(id));
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function getListNewsCarousel(req, res) {
  try {
    const payload = await getNewsCarouselService();
    return res.RH.success(payload);
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function createTagsAgentByAdmin(req, res) {
  try {
    const { body, user } = req;
    return res.RH.success(await createTagsAgentByAdminService(user, body));
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}


export async function getListTagsAgentByAdmin(req, res) {
  try {
    const query = commonGetQuery(req);
    const payload = await getListTagsAgentByAdminService(query);
    return res.RH.paging(payload, query.page, query.limit);
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function getDetailTagsAgentByAdmin(req, res) {
  try {
    const { id } = req.params;
    return res.RH.success(await getDetailTagsAgentByAdminService(id));
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function deleteTagsAgentsByAdmin(req, res) {
  try {
    const { id } = req.params;
    return res.RH.success(await deleteTagsAgentsByAdminService(id));
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function updateTagsAgentByAdmin(req, res) {
  try {
    const { id } = req.params;
    const { body } = req;
    return res.RH.success(await updateTagsAgentByAdminService(id, body));
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function getUserManagementByAdmin(req, res) {
  try {
    const query = commonGetQuery(req);
    const payload = await getUserManagementByAdminService(query);
    return res.RH.paging(payload, query.page, query.limit);
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function getDetailUserManagementByAdmin(req, res) {
  try {
    const { id } = req.params;
    return res.RH.success(await getDetailUserManagementByAdminService(id));
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function updateStatusUserVirtualAgentByAdmin(req, res) {
  try {
    const { id, status } = req.params;
    return res.RH.success(await updateStatusUserVirtualAgentByAdminService(id, status));
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}