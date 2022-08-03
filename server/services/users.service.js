import User from '../models/user';
import PointTest from '../models/pointTest';
import StringHelper from '../util/StringHelper';
import {verifyPhone} from "../verifyAuthPhone";
import {checkTimeRedelete, generatePassword, hash} from "../models/functions";
import {cacheImage} from "../libs/imageCache";
// import {addTaskLogin, addTaskLoginApp, addTaskReferral} from "./tasks.service";
import sanitizeHtml from "sanitize-html";
import cuid from "cuid";
import {Q} from "../libs/Queue";
import globalConstants, { ERR_CODE, TYPE_SELECT_POINT_TEST } from "../../config/globalConstants";
import UserUseInviteCode from "../models/userUseInviteCode";
import Subscription from "../models/subscription";
import {emitAppLoggedIn} from "../routes/socket_routes/appLogin";
import slug from 'slug';
import { getUrlImage, updateUrlImage } from '../virtual_agent/file';
import NewsModel from '../models/newsAgent';
import configs from '../config';
import { v4 as uuidv4 } from 'uuid';
import TagAgent from '../models/agentTags';
import AgentModel from '../models/agentInfo';
import StateModel from '../models/state';
import CountryModel from '../models/country';
import { agent } from 'supertest';

export async function getUserByToken(token) {
  return await User.findOne({ token });
}

export async function getUserById(id) {
  return await User.findOne({ _id: id });
}

export async function searchUserByEmail(email) {
  return await User.find({
    email: { $regex: email, $options: 'gi' }
  },'_id code fullName email cuid avatar').limit(12).lean();
}


export async function generalCodeUser() {
  let users = await User.find({}, 'cuid').lean();
  if(users){
    users.map(async (user, index) => {
      let code = StringHelper.generalCodeUser(index + 1);
      await User.update({_id: user._id}, {$set: {code: code}}, {upsert: true});
    })
  }
}

export async function verifyAuthPhone(options) {
  try{
    let decodeToken = await verifyPhone(options.idToken);
    if(decodeToken){
      let phoneNumber = decodeToken.phone_number.replace('+84', '0');
      let user = await User.findOne({telephone: {$in:[phoneNumber, decodeToken.phone_number]}, verifyPhone: true});
      if(!user){
        let users = await User.find({telephone: {$in:[phoneNumber, decodeToken.phone_number]}, verifyPhone: {$in:[null, false]}}, '_id fullName avatar loginType').lean();
        if (users.length === 0) {
          return Promise.reject({status: 400, success: false, error:'USER_NOT_FOUND'})
        } else {
          return Promise.reject({
            status: 400,
            success: false,
            error: 'PHONE_REGISTERED',
            data: users
          })
        }
      } else {
        switch (user.active) {
          case 0:
            return {
              status: -2,
              warning: 'warningVerify'
            };
          case -2:
            if (!checkTimeRedelete(user)){
              return {
                status: -1,
                warning: 'warningNoMatch'
              }
            } else {
              break;
            }
          case -1:
            return {
              status: -1,
              warning: 'warningNoMatch'
            };
          default:
            break;
        }
        user.online = 1;
        user.token = user.token ? user.token : generatePassword(30);
        await user.save();
        if (user.avatar) {
          let data = {
            src: user.avatar,
            size: 150
          };
          user.avatar = await cacheImage(data);
        }
        // if(options.version && options.version === 'app'){
        //   await addTaskLoginApp(user._id)
        // }
        // await addTaskLogin(user._id);
        return user;
      }
    } else {
      return Promise.reject({status: 400, success: false, error: 'Decode token fail.'})
    }
  }catch (err) {
    console.log('error verifyAuthPhone : ', err);
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'})
  }
}

export async function verifyPhoneUser(options) {
  try {
    let decodeToken = await verifyPhone(options.idToken);
    if(decodeToken){
      let phoneNumber = decodeToken.phone_number.replace('+84', '0');
      let user = await User.findById(options.user);
      if( [phoneNumber, decodeToken.phone_number].indexOf(user.telephone) !== -1 ){
        user.telephone = decodeToken.phone_number;
        user.verifyPhone = true;
        user.status = 1;
        user.active = 1;
        await user.save();
        await User.update({
          telephone: {
            $in:[phoneNumber, decodeToken.phone_number]
          },
          verifyPhone: {
            $in: [null, false]
          }
        }, {
          $set:{
            telephone: ''
          }
        }, {
          multi: true
        });
        return {
          success: true,
          msg: "VERIFY_SUCCESS"
        };
      } else {
        let users = await User.find({telephone: {$in:[phoneNumber, decodeToken.phone_number]}, verifyPhone: true}).lean();
        if (users.length === 0 ) {
          await User.update({
            _id: options.user
          }, {
            $set: {
              telephone: decodeToken.phone_number,
              verifyPhone: true
            }
          });
          await User.update({
            telephone: {
              $in:[phoneNumber, decodeToken.phone_number]
            },
            verifyPhone: {
              $in: [null, false]
            }
          }, {
            $set:{
              telephone: ''
            }
          }, {
            multi: true
          });
          return {
            success: true,
            msg: "UPDATE_SUCCESS"
          }
        } else {
          return {
            success: false,
            error: "PHONE_USED"
          }
        }
      }
    } else {
      return {
        success: false,
        error: 'VERIFY_FALSE'
      };
    }
  } catch (err) {
    console.log('error verifyPhone : ', err);
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'})
  }
}

export async function createUserByPhoneService(options, idToken, ref, refTask, version, appLoginId) {
  try {
    let decodeToken = await verifyPhone(idToken);
    if (decodeToken) {
      let phoneNumber = decodeToken.phone_number.replace('+84', '0');
      let user = await User.findOne({$or:[{telephone: {$in:[phoneNumber, decodeToken.phone_number]}, verifyPhone: true}, {email: options.email.toLowerCase()}]}).lean();
      if(user){
        return Promise.reject({status: 400, success: false, error: 'USER_EXITS'})
      }
      if(user && user.email.toLowerCase() === options.email.toLowerCase() ) {
        return Promise.reject({status: 400, success: false, error: 'EMAIL_EXIST'})
      }
      let tokenActive = generatePassword(45);
      options.fullName = options.firstName + ' ' + options.lastName;
      options.email = sanitizeHtml(options.email.toLowerCase());
      options.telephone = decodeToken.phone_number;
      options.verifyPhone = true;
      options.active = 1;
      options.token = generatePassword(30);
      options.status = 1;
      options.tokenActive = tokenActive;
      options.cuid = cuid();
      let count = await User.count({});
      options.code = StringHelper.generalCodeUser(count + 1);
      options.telephone =  decodeToken.phone_number;
      let data = await User.create(options);
      data = JSON.parse(JSON.stringify(data));
      delete data.password;
      await User.update({
        telephone: {
          $in:[phoneNumber, decodeToken.phone_number]
        },
        verifyPhone: {
          $in: [
            null,
            false
          ]
        }
      }, {
        $set:{
          telephone: ''
        }
      }, {
        multi: true
      });
      Q.create(globalConstants.jobName.SEND_MAIL, data).removeOnComplete(true).save();
      if (ref) {
        await UserUseInviteCode.create({
          user: data._id,
          code: req.body.ref
        });
      }
      // if(refTask){
      //   await addTaskReferral(data, refTask)
      // }
      // if(version && version === 'app') {
      //   await addTaskLoginApp(data._id)
      // }
      // await addTaskLogin(data._id);
      Q.create(globalConstants.jobName.USER_SYNC_ELASTIC, data).removeOnComplete(true).save();
      if ( appLoginId ) {
        emitAppLoggedIn(appLoginId, {
          token: data.token,
        });
      }
      return data;
    } else {
      return Promise.reject({status: 400, success: false, error: 'DECODE_TOKEN_FAIL.'})
    }
  } catch (err) {
    console.log('error createUserByPhone : ', err);
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'})
  }
}

export async function addSubscriptionNewsletter(data){
  try {
    return await Subscription.create(data)
  } catch (err) {
    console.log('error addSubscriptionNewsletter : ', err);
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'})
  }
}

export async function createUser(options, ref, refTask) {
  try {
    let check_user = await User.findOne({email: options.email.toLowerCase()}).lean();
    if (check_user) {
      return Promise.reject({success: false, status: 400, error: 'EMAIL_IS_EXIST'})
    }
    let tokenActive = generatePassword(45);
    options.password = hash(sanitizeHtml(options.password));
    options.tokenActive = tokenActive;
    options.cuid = cuid();
    let count = await User.count({});
    options.code = StringHelper.generalCodeUser(count + 1);
    let newUser = await User.create(options);
    let dataSendMail = {
      type: 'registryAccount',
      language: 'vi',
      data: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        cuid: newUser.cuid,
        token: tokenActive,
        type: 'registry'
      }
    };
    Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();

    if (ref) {
      await UserUseInviteCode.create({
        user: newUser._id,
        code: ref
      });
    }
    // if(refTask){
    //   await addTaskReferral(newUser, refTask)
    // }
    return newUser;
  } catch (err) {
    console.log('error createUser : ', err);
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'})
  }
}

export async function getListNewsAgentByAdminService(options) {
  try {
    const conditionAll = {};
    // sort
    let sort;
    if (!options.sort) {
        sort = { sort: 'asc' };
    } else {
        switch (options.sort.toString()) {
            case 'index_asc':
                sort = { sort: 'asc' };
                break;
            case 'index_desc':
                sort = { sort: 'desc' };
                break;
            case 'name_asc': 
                sort = { title: 'asc' };
                break;
            case 'name_desc':
                sort = { title: 'desc' };
                break;
            case 'created_asc':
                sort = { createdAt: 'asc' };
                break;
            case 'created_desc':
                sort = { createdAt: 'desc' };
                break;
            default:
                return Promise.reject({ status: 400, success: false, error: ERR_CODE.TYPE_SORT_INVALID });
        }
    }
    // search keyword
    let keyword;
    if (options?.keyword) {
        keyword = slug(options?.keyword, ' ');
    } else keyword = '';
    const conditionSearchs = [];
    // search
    if (keyword) {
        conditionSearchs.push(
            { searchString: { $regex: keyword, $options: 'i' } },
        );
    } else {
        conditionSearchs.push(
            { searchString: { $regex: '', $options: 'i' } },
        );
    }
    conditionAll['$or'] = conditionSearchs;
    // filter deactive/active
    switch (options.status) {
        case 'true':
        case 'false':
            conditionAll.status = options.status;
            break;
        case '':
        case undefined:
            break;
        default:
            return Promise.reject({ status: 400, success: false, error: ERR_CODE.STATUS_INVALID });
    }
    // filter new by role author
    switch (options.role) {
      case globalConstants.role.AGENT:
        conditionAll.authorRole = globalConstants.role.AGENT;
        break;
      case globalConstants.role.UNIVERSITY:
        conditionAll.authorRole = globalConstants.role.UNIVERSITY;
        break;
      case globalConstants.role.ADMIN:
        conditionAll.authorRole = globalConstants.role.ADMIN;
        break;
      case '':
      case undefined:
        break;
      default:
        return Promise.reject({ status: 400, success: false, error: ERR_CODE.ROLE_INVALID });
    }
    const news = await Promise.all([
        NewsModel
        .find(conditionAll, '-__v -userAgent -authorRole')
        .sort(sort)
        .skip(options.skip)
        .limit(options.limit),
        NewsModel.count(conditionAll)
    ]);
    const payload = news[0].map((item) => {
        item?.banner ? item.banner = getUrlImage(configs.domainHttpHost, item.banner) : '';
        return item;
    })
    return [news[1], payload];
  } catch (error) {
    console.log('error createUser : ', error);
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

/**
 * create news by admin service on collection newsAgent
 * @param {*} user 
 * @param {*} body 
 * @returns 
 */
export async function createNewsByAdminService(user, body) {
  try {
     const admin = await User.findOne({ _id: user?._id, role: 'admin' });
     if (!admin) return Promise.reject({ status: 404, success: false, error: ERR_CODE.USER_NOT_FOUND });
     let textSlug = slug(body?.title, '-');
     const hasSlug = await NewsModel.findOne({ slug: textSlug });
     if (hasSlug) textSlug = textSlug + '-' + uuidv4();
     let data = {
      userAgent: admin._id,
      title: body.title,
      priority: body.priority || false,
      sort: body?.sort || 1,
      banner: body?.banner ? updateUrlImage(body?.banner, configs.domainHttpHost) : '',
      slug: textSlug,
      content: body.content,
      authorName: body.authorName || admin.fullName,
      authorRole: admin.role,
      status: body?.status || true,
      shortDescription: body.shortDescription
  };
  return await NewsModel.create(data);
  } catch (error) {
    console.log('error createUser : ', error);
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

/**
 * get detail new by admin
 * @param {*} id 
 * @returns 
 */
export async function getDetailNewsByAdminService(id) {
  try {
    const news = await NewsModel.findOne({ _id: id }, '-__v -userAgent');
    if (!news) return Promise.reject({ status: 404, success: false, error: ERR_CODE.ERR_NOT_FOUND });
    const result = news.toJSON();
    result?.banner ? result.banner = getUrlImage(configs.domainHttpHost, news?.banner) : result.banner = '';
    return result;
  } catch (error) {
    console.log('error detail news : ', error);
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

export async function updateNewsByAdminService(id, data) {
  try {
    const newsAgent = await NewsModel.findOne({ _id: id });
    if (!newsAgent) return Promise.reject({ status: 404, success: false, error: ERR_CODE.ERR_NOT_FOUND });
    delete data?.authorRole;
    delete data?.userAgent;
    let txtSlug;
    if (data.title === newsAgent.title) {
      delete data.slug;
      delete data.title;
    } else {
      txtSlug = slug(data.title, '-');
      data.searchString = txtSlug;
      const hasSlug = await NewsModel.findOne({ slug: txtSlug });
      if (hasSlug) {
          data.slug = txtSlug + '-' + uuidv4();
      } else {
          data.slug = txtSlug;
      }
    }
    if (data?.priority && data.priority === true) {
      await NewsModel.update({ _id: { $nin: [newsAgent._id] } }, {$set: {priority: false}}, {multi: true}).exec();
      data.priority = true;
    }
    if (data?.banner) {
        data.banner = updateUrlImage(data.banner, configs.domainHttpHost);
    }
    Object.keys(data)
            .forEach((key) => {
                newsAgent[key] = data[key];
            });
    await newsAgent.save();
    return true;
  } catch (error) {
    console.log('error update news admin : ', error);
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

export async function deleteNewsByAdminService(id) {
  try {
    const newsAgent = await NewsModel.findOne({ _id: id });
    if (!newsAgent) return Promise.reject({ status: 404, success: false, error: ERR_CODE.ERR_NOT_FOUND });
    await newsAgent.remove();
    return true;
  } catch (error) {
    console.log('error delete news admin : ', error);
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

/**
 * admin create question for point test
 * @param {*} body 
 * @returns 
 */
export async function createQuestionPointTestService(body) {
  try {
    if (body?.typeSelect && !Object.values(TYPE_SELECT_POINT_TEST).includes(Number(body?.typeSelect))) {
      return Promise.reject({ status: 400, success: false, error: 'Type select question invalid.' });
    }
    const dataQuestion = {
      subject: body.subject,
      question: body.question,
      status: body?.status || true,
      indexQuestion: body?.indexQuestion || 0,
      special: body?.special || false,
      typeSelect: body?.typeSelect
    };
    const question = await PointTest.create(dataQuestion);
    body?.answers.forEach(async (item) => {
      item.parentQuestion = question._id;
      const dataAnswer = {
        score: item?.score || 0,
        content: item?.content || '',
        notEligible: item?.notEligible || false,
        indexAnswer: item?.indexAnswer || 0,
        parentQuestion: question._id,
      };
      await PointTest.create(dataAnswer);
    });
    return question;
  } catch (error) {
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

/**
 * get list question point test
 * @param {*} options 
 * @returns 
 */
export async function getListQuestionPointTestService(options) {
  try {
    const sortQuestion = [['indexQuestion', 1], ['searchString', 'asc']];
    // search keyword
    let keyword, statusOpt;
    if (options?.keyword) {
        keyword = slug(options?.keyword, ' ');
    } else keyword = '';
    // filter deactive/active
    switch (options.status) {
      case 'true':
      case true:
        statusOpt = [true, 'true'];
        break;
      case 'false':
      case false:
        statusOpt = [false, 'false'];
        break;
      case '':
      case undefined:
        statusOpt = [true, false, 'true', 'false'];
        break;
      default:
        return Promise.reject({ status: 400, success: false, error: ERR_CODE.STATUS_INVALID });
    }
    const promisePoint = await Promise.all([
      PointTest.count({
        parentQuestion: { $exists: false },
        $or: [{ searchString: { $regex: keyword, $options: 'i' } }],
        status: {
          $in: statusOpt
        }
      }),
      PointTest.find({
        parentQuestion: { $exists: false },
        $or: [{ searchString: { $regex: keyword, $options: 'i' } }],
        status: {
          $in: statusOpt
        }
      }, '-__v -searchString -indexAnswer -notEligible -content -score').sort(sortQuestion)
      .skip(options.skip)
      .limit(options.limit)
    ]);
    let payload;
    if (promisePoint[1].length > 0) {
      const sortAnswer = [['indexAnswer', 1], ['content', 'asc']];
      payload = promisePoint[1].map(async (item) => {
        item = item.toObject();
        const answer = await PointTest.find({
          parentQuestion: { $exists: true, $in: [item._id] }
        }, '-__v -status -subject -question -indexQuestion -special -typeSelect -searchString').sort(sortAnswer);
        item.answers = answer;
        return item;
      });
    } else payload = [];
    return [promisePoint[0], await Promise.all(payload)];
  } catch (error) {
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

export async function deleteQuestionPointTestService(id) {
  try {
    const hasPoint = await PointTest.findOne({ _id: id });
    if (!hasPoint) return Promise.reject({ status: 404, success: false, error: 'Question not found.' });
    if (!hasPoint?.parentQuestion) {
      // has question
      await PointTest.deleteMany({
        parentQuestion: { $exists: true, $in: [id] }
      });
    }
    // has answer
    hasPoint.remove();
    return true;
  } catch (error) {
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

export async function getDetailQuestionPointTestService(id) {
  try {
    const hasPoint = await PointTest.findOne({ parentQuestion: { $exists: false }, _id: id },
    '-__v -searchString -indexAnswer -notEligible -content -score');
    if (!hasPoint) return Promise.reject({ status: 404, success: false, error: 'Question not found.' });
    const hasAnswer = await PointTest.find({ parentQuestion: { $exists: true, $in: [id] } },
    '-__v -status -subject -question -indexQuestion -special -typeSelect -searchString').sort([['indexAnswer', 1], ['content', 'asc']]);
    const payload = hasPoint.toObject();
    payload.answers = hasAnswer;
    return payload;
  } catch (error) {
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

/**
 * update question and answer
 * @param {*} id 
 * @param {*} body 
 * @returns 
 */
export async function updateQuestionPointTestService(id, body) {
  try {
    const hasPoint = await PointTest.findOne({ parentQuestion: { $exists: false }, _id: id });
    if (!hasPoint) return Promise.reject({ status: 404, success: false, error: 'Question not found.' });
    let data, dataQuestion;
    if (body?.typeSelect && !Object.values(TYPE_SELECT_POINT_TEST).includes(Number(body?.typeSelect))) {
      return Promise.reject({ status: 400, success: false, error: 'Type select question invalid.' });
    }
    // is question
    dataQuestion = {
      status: body?.status,
      subject: body?.subject || hasPoint?.subject,
      question: body?.question || hasPoint?.question,
      indexQuestion: body?.indexQuestion || hasPoint?.indexQuestion,
      special: body?.special,
      typeSelect: body?.typeSelect || hasPoint?.typeSelect
    };
    console.log(dataQuestion);
    Object.keys(dataQuestion)
            .forEach((key) => {
              hasPoint[key] = dataQuestion[key];
            });
    await hasPoint.save();
    // answer
    const arrUptAnswer = [];
    if (body?.answers && body?.answers.length > 0) {
      for (let i = 0; i < body?.answers.length; i++) {
        if (body?.answers[i]?._id) {
          const hasAnswer = await PointTest.findOne({ _id: body?.answers[i]._id });
          data = {
            score: body?.answers[i]?.score || hasAnswer?.score,
            content: body?.answers[i]?.content || hasAnswer?.content,
            notEligible: body?.answers[i]?.notEligible,
            indexAnswer: body?.answers[i]?.indexAnswer || hasAnswer?.indexAnswer,
          };
          Object.keys(data)
                .forEach((key) => {
                  hasAnswer[key] = data[key];
                });
          await hasAnswer.save();
          arrUptAnswer.push(body?.answers[i]._id);
        } else {
          data = {
            score: body?.answers[i]?.score || 0,
            content: body?.answers[i]?.content || '',
            notEligible: body?.answers[i]?.notEligible,
            indexAnswer: body?.answers[i]?.indexAnswer || 0,
            parentQuestion: hasPoint._id,
          };
          const newAns = await PointTest.create(data);
          arrUptAnswer.push(newAns._id);
        }
      }
      // delete non update
      if (arrUptAnswer.length) {
        await PointTest.deleteMany({
          parentQuestion: { $exists: true, $in: [id] },
          _id: { $nin: arrUptAnswer }
        });
      }
    } else {
      await PointTest.deleteMany({
        parentQuestion: { $exists: true, $in: [id] }
      });
    }
    return true;
  } catch (error) {
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

export async function getProfileByTokenService(user) {
  try {
    const hasUser = await User.findOne({ _id: user._id }, '-__v -password');
    const payload = hasUser.toObject();
    payload.role = user.role;
    payload.avatar = getUrlImage(configs.domainHttpHost, payload?.avatar);
    let hasAgent = await AgentModel.findOne({ user: hasUser._id }).select({ __v: 0, user: 0, cuid: 0, updatedAt: 0, createdAt: 0 });;
    if (hasAgent) {
      hasAgent = hasAgent.toJSON();
      if (hasAgent?.state) {
        const state = await StateModel.findOne({ _id: hasAgent.state }).select({ _id: 1, name: 1 });
        hasAgent.state = state;
      }
      if (hasAgent?.country) {
        const country = await CountryModel.findOne({ _id: hasAgent.country }).select({ _id: 1, name: 1, ISO2: 1, ISO3: 1 });
        hasAgent.country = country;
      }
      if (hasAgent?.tags) {
        const hasTags = hasAgent.tags.map(async (tag) => {
          const t = await TagAgent.findOne({ _id: tag }).select({ _id: 1, tagName: 1, sort: 1 });
          if (t._id) return t;
        });
        hasAgent.tags = (await Promise.all(hasTags)).filter(item => item).sort((a, b) => a.sort - b.sort);
      }
      payload.agentInfo = hasAgent;
    }
    return payload;
  } catch (error) {
    return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
  }
}

export async function getListNewestService(options) {
  try {
    const conditionAll = {};
    // filter role
    if (options?.role) {
      let role = '';
      switch (options.role) {
        case globalConstants.role.AGENT:
          role = globalConstants.role.AGENT;
          conditionAll.authorRole = role;
          break;
        case globalConstants.role.UNIVERSITY:
          role = globalConstants.role.UNIVERSITY;
          conditionAll.authorRole = role;
          break;
        case 'agent-university':
          const roTemp = [globalConstants.role.AGENT, globalConstants.role.UNIVERSITY];
          conditionAll.authorRole = { $in: roTemp };
          break;
        default:
          return Promise.reject({ status: 400, success: false, error: ERR_CODE.ROLE_INVALID });;
      }
    } else {
      const role = [globalConstants.role.AGENT, globalConstants.role.UNIVERSITY, globalConstants.role.ADMIN];
      conditionAll.authorRole = { $in: role };
    };
    // search keyword
    let keyword;
    if (options?.keyword) {
        keyword = slug(options?.keyword, ' ');
    } else keyword = '';
    const conditionSearchs = [];
    // search
    if (keyword) {
        conditionSearchs.push(
            { searchString: { $regex: keyword, $options: 'i' } },
        );
    } else {
        conditionSearchs.push(
            { searchString: { $regex: '', $options: 'i' } },
        );
    }
    conditionAll['$or'] = conditionSearchs;
    // sort
    let sort;
    if (!options.sort) {
        sort = { createdAt: 'desc' };
    } else {
        switch (options.sort.toString()) {
            case 'new':
                sort = { createdAt: 'desc' };
                break;
            case 'old':
                sort = { createdAt: 'asc' };
                break;
            default:
                return Promise.reject({ status: 400, success: false, error: ERR_CODE.TYPE_SORT_INVALID });
        }
    }
    conditionAll['$or'] = conditionSearchs;
    conditionAll.status = true;
    const payload = await Promise.all([
      NewsModel.count(conditionAll),
      NewsModel.find(conditionAll)
      .skip(options.skip)
      .limit(options.limit)
      .sort(sort)
      .select({ banner: 1, title: 1, createdAt: 1, authorName: 1, shortDescription: 1 })
    ]);
    const result = payload[1].map((item) => {
      item = item.toObject();
      if (item?.banner) {
        item.banner = getUrlImage(configs.domainHttpHost, item.banner);
      } else item.banner = '';
      return item;
    });
    return [payload[0], await Promise.all(result)];
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}

export async function getDetailNewsService(id) {
  try {
    const news = await NewsModel.findOne({ _id: id })
    .select({ breadcrumb: 1, title: 1, content: 1, authorName: 1, createdAt: 1, comment: 1, status: 1, banner: 1 });
    if (!news) {
      return Promise.reject({
        status: 404,
        success: false,
        error: ERR_CODE.ERR_NOT_FOUND
      });
    }
    if (news.status !== true) {
      return Promise.reject({
        status: 401,
        success: false,
        error: ERR_CODE.UNAUTHORIZE
      });
    }
    let payload = news.toObject();
    if (payload?.banner) payload.banner = getUrlImage(configs.domainHttpHost, payload.banner);
    return payload;
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}

export async function getNewsCarouselService() {
  try {
    const payload = await NewsModel.find({ status: true }, '-__v -status -breadcrumb -status -userAgent -authorRole')
    .limit(9)
    .sort({ createdAt: 'desc' });
    const result = payload.map((item) => {
      item = item.toObject();
      item.banner = getUrlImage(configs.domainHttpHost, item?.banner);
      return item;
    });
    return result;
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}

export async function createTagsAgentByAdminService(user, body) {
  try {
    const arrRole = [globalConstants.role.AGENT, globalConstants.role.UNIVERSITY];
    if (!arrRole.includes(body?.type)) {
      return Promise.reject({
        status: 400,
        success: false,
        error: ERR_CODE.TYPE_TAG_INVALID
      });
    }
    const hasTag = await TagAgent.findOne({ tagName: body.tagName, type: body.type });
    if (hasTag) {
      return Promise.reject({
        status: 400,
        success: false,
        error: ERR_CODE.TAG_IS_EXIST
      });
    }
    const data = {
      tagName: body.tagName,
      sort: body?.sort || 0,
      type: body.type
    };
    return await TagAgent.create(data);
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}

export async function getListTagsAgentByAdminService(options) {
  try {
    const conditionAll = {};
    // Search Tagname
    if (options?.keyword) {
      conditionAll.tagName = { $regex: slug(options.keyword, ' '), $options: 'i' };
    }
    // sort list
    let sortType = { sort: 1, tagName: 'asc' };
    if (options?.sort) {
      switch (options.sort) {
        case 'tag-asc':
          sortType = { tagName: 'asc', sort: 1 };
          break;
        case 'tag-desc':
          sortType = { tagName: 'desc', sort: 1 };
          break;
        case 'index-desc':
        case '':
        case undefined:
          sortType = { sort: 1, tagName: 'asc' };
          break;
        case 'index-asc':
          sortType = { sort: -1, tagName: 'asc' };
          break;
        default:
          return Promise.reject({
            status: 400,
            success: false,
            error: ERR_CODE.TYPE_SORT_INVALID
          });
      }
    }
    // filter role tag
    if (options?.role) {
      switch (options.role) {
        case '':
        case undefined:
          break;
        case globalConstants.role.AGENT:
          conditionAll.type = globalConstants.role.AGENT;
          break;
        case globalConstants.role.UNIVERSITY:
          conditionAll.type = globalConstants.role.UNIVERSITY;
          break;
        default:
          return Promise.reject({
            status: 400,
            success: false,
            error: ERR_CODE.ROLE_INVALID
          });
      }
    }
    const payload = await Promise.all([
      TagAgent.count(conditionAll),
      TagAgent.find(conditionAll, '-__v -updatedAt')
      .skip(options.skip)
      .limit(options.limit)
      .sort(sortType)
    ]);
    return [payload[0], payload[1]];
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}

export async function getDetailTagsAgentByAdminService(id) {
  try {
    const hasTag = await TagAgent.findOne({ _id: id }).select({ __v: 0, updatedAt: 0 });
    if (!hasTag) {
      return Promise.reject({
        status: 404,
        success: false,
        error: ERR_CODE.ERR_NOT_FOUND
      });
    }
    return hasTag;
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}

export async function deleteTagsAgentsByAdminService(id) {
  try {
    const hasTag = await TagAgent.findOne({ _id: id }).select({ __v: 0, updatedAt: 0 });
    if (!hasTag) {
      return Promise.reject({
        status: 404,
        success: false,
        error: ERR_CODE.ERR_NOT_FOUND
      });
    }
    await hasTag.remove();
    return true;
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}

export async function updateTagsAgentByAdminService(id, body) {
  try {
    const hasTag = await TagAgent.findOne({ _id: id }).select({ __v: 0, updatedAt: 0 });
    if (!hasTag) {
      return Promise.reject({
        status: 404,
        success: false,
        error: ERR_CODE.ERR_NOT_FOUND
      });
    }
    const dupTag = await TagAgent.findOne({ tagName: body.tagName, _id: { $nin: [id] } });
    if (dupTag) {
      return Promise.reject({
        status: 400,
        success: false,
        error: ERR_CODE.TAG_IS_EXIST
      });
    }
    await hasTag.update({
      $set: {
        tagName: body.tagName,
        type: body.type,
        sort: body.sort
      }
    });
    return true;
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}

export async function getUserManagementByAdminService(options) {
  try {
    const query = [];
    const conditionAll = {};
    // search keyword
    const condition = [];
    if (options?.keyword) {
      condition.push({ 'fullName': { $regex: slug(options.keyword, ' '), $options: "$i" } });
      condition.push({ 'email': { $regex: slug(options.keyword, ' '), $options: "$i" } });
      condition.push({ 'telephone': { $regex: slug(options.keyword, ' '), $options: "$i" } });
    }
    // sort options
    let sortOpt = options?.sort ? options.sort : -1;
    // filter role + status user
    const fieldUser = [
      '_id', 'email', 'telephone', 'active', 'code', 'fullName', 'role', 'userName', 'dateAdded'
    ].join(' ');
    const fieldAgent = ['_id', 'user', 'createdAt', 'email', 'role', 'telephone', 'organization', 'ABNNumber', 'CIRCONumber', 'MARANumber', 'status'].join(' ');
    const expId = [];
    const promiseAgent = await Promise.all([
      AgentModel.find({ role: globalConstants.role.AGENT }, fieldAgent).sort({ createdAt: sortOpt }), // 0
      AgentModel.find({ role: globalConstants.role.AGENT, status: 0 }, fieldAgent).sort({ createdAt: sortOpt }), // 1
      AgentModel.find({ role: globalConstants.role.AGENT, status: 1 }, fieldAgent).sort({ createdAt: sortOpt }), // 2
      AgentModel.find({ role: globalConstants.role.AGENT, status: -1 }, fieldAgent).sort({ createdAt: sortOpt }), // 3
      AgentModel.find({ role: globalConstants.role.UNIVERSITY }, fieldAgent).sort({ createdAt: sortOpt }), // 4
      AgentModel.find({ role: globalConstants.role.UNIVERSITY, status: 0 }, fieldAgent).sort({ createdAt: sortOpt }), // 5
      AgentModel.find({ role: globalConstants.role.UNIVERSITY, status: 1 }, fieldAgent).sort({ createdAt: sortOpt }), // 6
      AgentModel.find({ role: globalConstants.role.UNIVERSITY, status: -1 }, fieldAgent).sort({ createdAt: sortOpt }), //7
      AgentModel.find({}, ['_id', 'user'], fieldAgent).sort({ createdAt: sortOpt }).exec((err, res) => {
        if (err) return Promise.reject(err);
        res.forEach(element => {
          expId.push(element.user);
        });
      })
    ]);
    if (condition.length > 0){
      query.push({ $or: condition});
    }
    if (options?.role && options?.status) {
      switch (options.role) {
        case 'user':
          if (options?.status === 'all') {
            conditionAll._id = { $nin: expId };
          } else if (options?.status === 'active') {
            conditionAll._id = { $nin: expId };
            conditionAll.active = 1;
          } else if (options?.status === 'pending') {
            conditionAll._id = { $nin: expId };
            conditionAll.active = 0;
          } else if (options?.status === 'ban') {
            conditionAll._id = { $nin: expId };
            conditionAll.active = { $in: [-1, -2] };
          } else return Promise.reject({ status: 400, success: false, error: ERR_CODE.STATUS_INVALID });
          conditionAll._id = { $nin: expId };
          query.push(conditionAll);
          let results = await Promise.all([
            User.count({$and: query}),
            User.find({$and: query}, fieldUser).skip(options.skip).limit(options.limit)
            .sort({ dateAdded: sortOpt })
          ]);
          return [results[0], results[1]]
        case 'agent':
          switch (options?.status) {
            case 'all':
              const arr = [];
              promiseAgent[0].map((item) => arr.push(item.user));
              conditionAll._id = { $in: arr };
              query.push(conditionAll);
              const payloadAgent = [];
              let rsAgent = await Promise.all([
                User.count({$and: query}),
                User.find({$and: query}, fieldUser).skip(options.skip).limit(options.limit).sort({ dateAdded: sortOpt }).exec((err, res) => {
                  if (err) return Promise.reject(err);
                  return promiseAgent[0].map(async (item) => {
                    res.forEach(element => {
                      if (element._id.toString() === item.user.toString()) {
                        element.dateAdded = item.createdAt;
                        element = element.toObject();
                        element.role = item.role;
                        element.agentInfo = item;
                        payloadAgent.push(element);
                      }
                      return true;
                    })
                  });
                })
              ]);
              return [rsAgent[0], payloadAgent];
            case 'active':
              const arrAct = [];
              promiseAgent[2].map((item) => arrAct.push(item.user));
              conditionAll._id = { $in: arrAct };
              query.push(conditionAll);
              const payloadAgentAct = [];
              let rsAgentAct = await Promise.all([
                User.count({$and: query}),
                User.find({$and: query}, fieldUser).skip(options.skip).limit(options.limit).sort({ dateAdded: sortOpt }).exec((err, res) => {
                  if (err) return Promise.reject(err);
                  return promiseAgent[2].map(async (item) => {
                    res.forEach(element => {
                      if (element._id.toString() === item.user.toString()) {
                        element.dateAdded = item.createdAt;
                        element = element.toObject();
                        element.role = item.role;
                        element.agentInfo = item;
                        payloadAgentAct.push(element);
                      }
                      return true;
                    })
                  });
                })
              ]);
              return [rsAgentAct[0], payloadAgentAct];
            case 'ban':
              const arrBan = [];
              promiseAgent[3].map((item) => arrBan.push(item.user));
              conditionAll._id = { $in: arrBan };
              query.push(conditionAll);
              const payloadAgentBan = [];
              let rsAgentBan = await Promise.all([
                User.count({$and: query}),
                User.find({$and: query}, fieldUser).skip(options.skip).limit(options.limit).sort({ dateAdded: sortOpt }).exec((err, res) => {
                  if (err) return Promise.reject(err);
                  return promiseAgent[3].map(async (item) => {
                    res.forEach(element => {
                      if (element._id.toString() === item.user.toString()) {
                        element.dateAdded = item.createdAt;
                        element = element.toObject();
                        element.role = item.role;
                        element.agentInfo = item;
                        payloadAgentBan.push(element);
                      }
                      return true;
                    })
                  });
                })
              ]);
              return [rsAgentBan[0], payloadAgentBan];
            case 'pending':
              const arrPending = [];
              promiseAgent[1].map((item) => arrPending.push(item.user));
              conditionAll._id = { $in: arrPending };
              query.push(conditionAll);
              const payloadAgentPen = [];
              let rsAgentPen = await Promise.all([
                User.count({$and: query}),
                User.find({$and: query}, fieldUser).skip(options.skip).limit(options.limit).sort({ dateAdded: sortOpt }).exec((err, res) => {
                  if (err) return Promise.reject(err);
                  return promiseAgent[1].map(async (item) => {
                    res.forEach(element => {
                      if (element._id.toString() === item.user.toString()) {
                        element.dateAdded = item.createdAt;
                        element = element.toObject();
                        element.role = item.role;
                        element.agentInfo = item;
                        payloadAgentPen.push(element);
                      }
                      return true;
                    })
                  });
                })
              ]);
              return [rsAgentPen[0], payloadAgentPen];
            default:
              break;
          }
        case 'university':
          switch (options?.status) {
            case 'all':
              const arrUni = [];
              promiseAgent[4].map((item) => arrUni.push(item.user));
              conditionAll._id = { $in: arrUni };
              query.push(conditionAll);
              const payloadUni = [];
              let rsUniversity = await Promise.all([
                User.count({$and: query}),
                User.find({$and: query}, fieldUser).skip(options.skip).limit(options.limit).sort({ dateAdded: sortOpt }).exec((err, res) => {
                    if (err) return Promise.reject(err);
                    return promiseAgent[4].map(async (item) => {
                      res.forEach(element => {
                        if (element._id.toString() === item.user.toString()) {
                          element.dateAdded = item.createdAt;
                          element = element.toObject();
                          element.role = item.role;
                          element.agentInfo = item;
                          payloadUni.push(element);
                        }
                        return true;
                      })
                    });
                  })
              ]);
              return [rsUniversity[0], payloadUni];
            case 'active':
              const arrUniAc = [];
              promiseAgent[6].map((item) => arrUniAc.push(item.user));
              conditionAll._id = { $in: arrUniAc };
              query.push(conditionAll);
              const payloadUniAc = [];
              let rsUniversityAc = await Promise.all([
                User.count({$and: query}),
                User.find({$and: query}, fieldUser).skip(options.skip).limit(options.limit).sort({ dateAdded: sortOpt }).exec((err, res) => {
                    if (err) return Promise.reject(err);
                    return promiseAgent[6].map(async (item) => {
                      res.forEach(element => {
                        if (element._id.toString() === item.user.toString()) {
                          element.dateAdded = item.createdAt;
                          element = element.toObject();
                          element.role = item.role;
                          element.agentInfo = item;
                          payloadUniAc.push(element);
                        }
                        return true;
                      })
                    });
                  })
              ]);
              return [rsUniversityAc[0], payloadUniAc];
            case 'ban':
              const arrUniBan = [];
              promiseAgent[7].map((item) => arrUniBan.push(item.user));
              conditionAll._id = { $in: arrUniBan };
              query.push(conditionAll);
              const payloadUniBan = [];
              let rsUniversityBan = await Promise.all([
                User.count({$and: query}),
                User.find({$and: query}, fieldUser).skip(options.skip).limit(options.limit).sort({ dateAdded: sortOpt }).exec((err, res) => {
                    if (err) return Promise.reject(err);
                    return promiseAgent[7].map(async (item) => {
                      res.forEach(element => {
                        if (element._id.toString() === item.user.toString()) {
                          element.dateAdded = item.createdAt;
                          element = element.toObject();
                          element.role = item.role;
                          element.agentInfo = item;
                          payloadUniBan.push(element);
                        }
                        return true;
                      })
                    });
                  })
              ]);
              return [rsUniversityBan[0], payloadUniBan];
            case 'pending':
              const arrUniPen = [];
              promiseAgent[5].map((item) => arrUniPen.push(item.user));
              conditionAll._id = { $in: arrUniPen };
              query.push(conditionAll);
              const payloadUniPen = [];
              let rsUniversityPen = await Promise.all([
                User.count({$and: query}),
                User.find({$and: query}, fieldUser).skip(options.skip).limit(options.limit).sort({ dateAdded: sortOpt }).exec((err, res) => {
                    if (err) return Promise.reject(err);
                    return promiseAgent[5].map(async (item) => {
                      res.forEach(element => {
                        if (element._id.toString() === item.user.toString()) {
                          element.dateAdded = item.createdAt;
                          element = element.toObject();
                          element.role = item.role;
                          element.agentInfo = item;
                          payloadUniPen.push(element);
                        }
                        return true;
                      })
                    });
                  })
              ]);
              return [rsUniversityPen[0], payloadUniPen]
            default:
              break;
          }
        default:
          return Promise.reject({ status: 400, success: false, error: ERR_CODE.ROLE_INVALID });
      }
    }
    return true;
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}

export async function getDetailUserManagementByAdminService(id) {
  try {
    const fieldUser = [
      '_id', 'email', 'telephone', 'active', 'code', 'fullName', 'role', 'userName', 'dateAdded', 'avatar', 'birthday', 'address', 'country'
    ].join(' ');
    const fieldAgent = ['_id', 'createdAt', 'email', 'role', 'telephone', 'tags', 'address',
    'organization', 'ABNNumber', 'CIRCONumber', 'MARANumber', 'status', 'state', 'country'].join(' ');
    const promiseUser = await Promise.all([
      User.findById(id, fieldUser),
      AgentModel.findOne({ user: id }, fieldAgent)
    ]);
    let user, agent;
    if (!promiseUser[0] && !promiseUser[1]) {
      return Promise.reject({ status: 404, success: false, error: ERR_CODE.USER_NOT_FOUND });
    } else if (promiseUser[0] && promiseUser[1]) {
      user = promiseUser[0].toObject();
      agent = promiseUser[1].toObject();
      if (promiseUser[1]?.tags) {
        const tags = await Promise.all(promiseUser[1].tags.map(async (item) => {
          return await TagAgent.findOne({ _id: item }).select({ _id: 1, tagName: 1, sort: 1 });
        }));
        agent.tags = tags.filter(item => item).sort((a, b) => a.sort - b.sort);
      }
      if (promiseUser[1]?.country) {
        const country = await CountryModel.findOne({ _id: promiseUser[1]?.country })
        .select({ _id: 1, name: 1, ISO3: 1 });
        agent.country = country ? country : {};
      }
      if (promiseUser[1]?.state) {
        const state = await StateModel.findOne({ _id: promiseUser[1]?.state })
        .select({ _id: 1, name: 1 });
        agent.state = state ? state : {};
      }
      user.role = agent.role;
      user.agentInfo = agent;
      return user;
    }
    user = promiseUser[0].toObject();
    user.avatar = getUrlImage(configs.domainHttpHost, user?.avatar);
    return user;
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}

export async function updateStatusUserVirtualAgentByAdminService(id, status) {
  try {
    const promiseUser = await Promise.all([
      User.findById(id),
      AgentModel.findOne({ user: id })
    ]);
    if (!promiseUser[0] && !promiseUser[1]) {
      return Promise.reject({ status: 404, success: false, error: ERR_CODE.USER_NOT_FOUND });
    } else if (promiseUser[0] && promiseUser[1]) {
      // agent
      promiseUser[1].status = status;
      await promiseUser[1].save();
      return true;
    } else if (!promiseUser[1]) {
      // user
      switch (Number(status)) {
        case 1:
          promiseUser[0].active = 1;
          await promiseUser[0].save();
          break;
        case -1:
          promiseUser[0].active = -2;
          await promiseUser[0].save();
          break;
        default:
          return false;
      }
    }
    return true;
  } catch (error) {
    return Promise.reject({
      status: 500,
      success: false,
      error: 'Internal Server Error.'
    });
  }
}