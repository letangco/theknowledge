import User from '../models/user';
import Setting from '../models/setting';
import Knowledge from '../models/knowledge';
import globalConstants from '../../config/globalConstants';
import Payment from '../models/payment';
import Withdrawal from '../models/withdrawal';
import * as ChartLibs from '../libs/Charts';
import ArrayHelper from '../util/ArrayHelper';
import Skill from '../models/skill';
import SuggestSkill from '../models/suggestSkill';
import Contact from '../models/contact';
import ReportGameMini from '../models/reportGameMini';
import config from '../config';
import * as CourseServices from "../services/course.services";
import {STATUS_MAPPER} from "./course.controller";
import HistoryMiniGame from "../models/historyMiniGame";
import compareVersions from 'compare-versions';
import execa from 'execa';
import { destPopupUpload } from "../routes/upload.routes";

export async function adminGetDashboard(req, res) {
  try {
    let promises = [
      User.count({expert: 1}).exec(),
      User.count({expert: 2}).exec(),
      User.find({active: 1}, 'cuid').exec(),
      Knowledge.count({state: globalConstants.knowledgeState.WAITING}).exec(),
      Knowledge.find({}, 'authorId title slug').sort({createdDate: -1}).limit(5).exec(),
      Knowledge.count({state: globalConstants.knowledgeState.PUBLISHED}).exec(),
      SuggestSkill.count(),
      Skill.count()
    ];

    let results = await Promise.all(promises);
    let knowledgePromise = results[4].map(knowledge => adminGetKnowledgeMetadata(knowledge));
    let recent_knowledges = await Promise.all(knowledgePromise);

    let userIds = [];
    let userCuids = results[2].map(user => {
      userIds.push(user._id);
      return user.cuid;
    });

    let aggregates = [
      Payment.aggregate([
        {
          $match: {
            userId: {$in: userCuids}
          }
        },
        {
          $group: {
            _id: null,
            sum_amount: {$sum: "$amount"}
          }
        }
      ]),
      Withdrawal.aggregate([
        {
          $match: {
            userId: {$in: userIds},
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            sum_amount: {$sum: "$amount"}
          }
        }
      ]),
      User.aggregate([
        {
          $group: {
            _id: null,
            sum_balance: {$sum: "$balance"}
          }
        }
      ])
    ];
    let money = await Promise.all(aggregates);

    let data = {
      total_experts: results[0],
      pending_experts: results[1],
      total_users: results[2].length,
      pending_knowledges: results[3],
      recent_knowledges: recent_knowledges,
      published_knowledges: results[5],
      suggest_skills: results[6],
      skills: results[7],
      total_deposit: money[0].length ? money[0][0].sum_amount : 0,
      total_withdrawal: money[1].length ? money[1][0].sum_amount : 0,
      total_balance: money[2].length ? money[2][0].sum_balance : 0
    };

    return res.json({
      success: true,
      data: data
    });
  } catch(err) {
    console.log('err on adminGetDashboard:', err);
    return res.status(500).json(err);
  }
}
export async function saveSettingApp(req, res) {
  try {
    await Setting.update({'type': 'application'}, {$set: {data: req.body}}, {upsert: true});
    return res.status(200).json({success: true});
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

export async function saveSettingAdd(req, res) {
  try {
    await Setting.update({'type': 'add'}, {$set: {data: req.body}}, {upsert: true});
    return res.status(200).json({success: true});
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

function cleanPopupImage(availableFiles) {
  const getImageList = `cd ${destPopupUpload} && ls -t | awk '{printf("%s ",$0)}'`;
  const result = execa.commandSync(getImageList);
  const fileList = result.stdout ? result.stdout.split(' ') : [];
  fileList.splice(fileList.length - 1, 1); // Remove empty file name at the end
  const removableFiles = [];
  fileList.map( fileName => {
    if ( availableFiles.indexOf(fileName) < 0 ) {
      removableFiles.push(fileName);
    }
  });
  if ( removableFiles.length > 0 ) {
    execa.commandSync(`cd ${destPopupUpload} && rm -rf ${removableFiles.join(' ')}`);
  }
}

export async function saveSettingPopup(req, res) {
  try {
    const reqBody = req.body;
    const setValue = {popupItems: reqBody.popupItems};
    const popupSetting = await Setting.findOne({'type': 'popup'}, 'data').lean();
    if ( ! setValue.popupItems ) {
      if ( popupSetting && popupSetting.data ) {
        setValue.popupItems = popupSetting.data.popupItems;
      }
    }
    if ( typeof reqBody.popupOn === 'boolean' ) {
      setValue.popupOn = reqBody.popupOn;
    } else {
      if ( popupSetting && popupSetting.data ) {
        setValue.popupOn = popupSetting.data.popupOn;
      }
    }
    if ( typeof reqBody.popupOnApp === 'boolean' ) {
      setValue.popupOnApp = reqBody.popupOnApp;
    } else {
      if ( popupSetting && popupSetting.data ) {
        setValue.popupOnApp = popupSetting.data.popupOnApp;
      }
    }
    await Setting.update({'type': 'popup'}, {$set: {data: setValue}}, {upsert: true});
    if ( setValue.popupItems ) {
      const availableFiles = [];
      setValue.popupItems.map(item => {
        if ( item.fileName ) {
          availableFiles.push(item.fileName);
        }
      });
      //cleanPopupImage(availableFiles);
    }
    return res.status(200).json({success: true});
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
export async function saveSettingGame(req, res) {
  try {
    const reqBody = req.body;
    await Setting.update({'type': 'miniGame'}, {$set: {data: reqBody.game}}, {upsert: true});
    return res.status(200).json({success: true});
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
export async function saveSettingPromotion(req, res) {
  try {
    const reqBody = req.body;
    await Setting.update({'type': 'promotion'}, {$set: {data: reqBody}}, {upsert: true});
    return res.status(200).json({success: true});
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
export async function editSettingGame(req, res) {
  try {
    let info = await Setting.findOne({'type': 'miniGame'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Game not found.'});
    }
    if(!info.data.status){
      return res.status(404).json({success: false, error: 'Game not found.'});
    }
    return res.status(200).json({
      success: true,
      data: info.data
    });
  } catch (err) {
    console.log('err editSettingGame: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}
export async function getSettingAdd(req, res) {
  try {
    let info = await Setting.findOne({'type': 'add'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Promotion not found.'});
    }
    if(!info.data.status){
      return res.status(404).json({success: false, error: 'Promotion not found.'});
    }
    return res.status(200).json({
      success: true,
      data: info.data
    });
  } catch (err) {
    console.log('err getSettingAdd: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}
export async function saveSettingCareer(req, res) {
  try {
    const reqBody = req.body;
    const setValue = {careerItems: reqBody.careerItems};
    const careerSetting = await Setting.findOne({'type': 'career'}, 'data').lean();
    if ( ! setValue.careerItems ) {
      if ( careerSetting && careerSetting.data ) {
        setValue.careerItems = careerSetting.data.careerItems;
      }
    }
    await Setting.update({'type': 'career'}, {$set: {data: setValue}}, {upsert: true});
    return res.status(200).json({success: true});
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
export async function saveSettingEbooks(req, res) {
  try {
    const reqBody = req.body;
    const setValue = {ebbokItems: reqBody.ebbokItems};
    const ebookSetting = await Setting.findOne({'type': 'ebook'}, 'data').lean();
    if ( ! setValue.ebbokItems ) {
      if ( ebookSetting && ebookSetting.data ) {
        setValue.ebookItems = ebookSetting.data.ebookItems;
      }
    }
    await Setting.update({'type': 'ebook'}, {$set: {data: setValue}}, {upsert: true});
    return res.status(200).json({success: true});
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

export async function getPopupSetting(req, res) {
  try {
    let info = await Setting.findOne({'type': 'popup'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Setting not found.'});
    }
    return res.status(200).json({
      success: true,
      data: info.data,
    });
  } catch (err) {
    console.log('err getPopupSetting: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}
export async function getMiniGameSetting(req, res) {
  try {
    let info = await Setting.findOne({'type': 'miniGame'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Game not found 01.'});
    }
    if(!info.data.status){
      return res.status(404).json({success: false, error: 'Game not found 02.'});
    }
    return res.status(200).json({
      success: true,
      data: {
        code: info.data.code,
        question: info.data.question,
        image: info.data.fileUrlQuestion,
        answer1: info.data.answer1,
        answer2: info.data.answer2,
        candy: info.data.candy,
      }
    });
  } catch (err) {
    console.log('err getPopupSetting: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}
export async function sendMiniGame(req, res) {
  try {
    if(!req.user && !req.user._id){
      return res.status(404).json({success: false, error: 'Authentication fail.'});
    }
    if(!req.body.answer){
      return res.status(404).json({success: false, error: 'Answer empty.'});
    }
    let info = await Setting.findOne({'type': 'miniGame'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Game not found.'});
    }
    if(!info.data.status){
      return res.status(404).json({success: false, error: 'Game not found.'});
    }
    let userReport = await ReportGameMini.findOne({user: req.user._id, code: info.data.code}).lean();
    if(userReport) {
      return res.status(404).json({success: false, error: 'User joined.'});
    }
    if(req.body.answer == info.data.correctAnswer){
      await ReportGameMini.create({
        user: req.user._id,
        code: info.data.code,
        correct: true,
        candy: parseInt(info.data.candy),
      });
      let user = await User.findById(req.user._id);
      user.candy.total += parseInt(info.data.candy) || 0;
      user.candy.current += parseInt(info.data.candy) || 0;
      await user.save();
      return res.status(200).json({
        success: true,
        data: {
          correct: true,
          info: info.data
        },
      });
    } else {
      await ReportGameMini.create({
        user: req.user._id,
        code: info.data.code,
        correct: false,
        candy: parseInt(info.data.candy),
      })
      return res.status(200).json({
        success: true,
        data: {
          correct: false,
          info: info.data
        },
      });
    }
  } catch (err) {
    console.log('err sendMiniGame: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function resetCandyUser(req, res) {
  try {
    await User.update({},{
      $set: {
        "candy.current": 0
      }
    },{
      multi: true
    });
    return res.json({
      success: true
    })
  } catch (err) {
    console.log('err resetCandyUser: ', err);
    return res.status(err.status || 500).json(err);
  }
}

export async function getReportCandy(req, res) {
  try {
    let text = req.query.text || '';
    let page = req.query.page || 1;
    let limit = req.query.limit || 10;
    let skip = (page - 1) * limit;
    let conditions = {
      "candy.current": {
        $gt: 0
      }
    };
    if (text) {
      conditions["$or"] = [
        {
          fullName: {$regex: options.text.trim(), $options: "$i"}
        },
        {
          telephone: {$regex: options.text.trim(), $options: "$i"}
        },
        {
          email: {$regex: options.text.trim(), $options: "$i"}
        }
      ]
    }
    let data = await User.find(conditions, '_id fullName telephone email candy cuid').sort({"candy.current": -1}).limit(limit).skip(skip).lean();
    let count = await User.count(conditions);
    return res.json({
      success: true,
      total_page: Math.ceil(count/limit),
      total_item: count,
      page,
      item: data.length,
      data: data
    })
  } catch (err) {
    console.log('err getReportCandy: ', err);
    return res.status(err.status || 500).json(err);
  }
}

export async function getPopupCareer(req, res) {
  try {
    let info = await Setting.findOne({'type': 'career'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Setting not found.'});
    }
    return res.status(200).json({
      success: true,
      data: info.data,
    });
  } catch (err) {
    console.log('err getPopupCareer: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getPopupEbooks(req, res) {
  try {
    let info = await Setting.findOne({'type': 'ebook'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Setting not found.'});
    }
    return res.status(200).json({
      success: true,
      data: info.data,
    });
  } catch (err) {
    console.log('err getPopupEbook: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getPromotionSetting(req, res) {
  try {
    let info = await Setting.findOne({'type': 'promotion'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Setting not found.'});
    }
    return res.status(200).json({
      success: true,
      data: info.data,
    });
  } catch (err) {
    console.log('err getPopupSetting: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getMemberShipSetting(req, res) {
  try {
    let info = await Setting.findOne({'type': 'promotion'}, 'data').lean();
    if (!info || !info.data.status) {
      return res.status(404).json({success: false, error: 'NOTE_FOUND'});
    }
    if (new Date(info.data.expireDate).getTime() < new Date().getTime()) {
      return res.status(404).json({success: false, error: 'EXPIRED'});
    }
    return res.status(200).json({
      success: true,
      data: info.data,
    });
  } catch (err) {
    console.log('err getMemberShipSetting: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}
export async function getContactEbook(req, res) {
  try {
    return res.json({
      success: true,
      data: await Contact.find({}).lean()
    })
  } catch (err){
    console.log('err getContactEbook: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getPopupSettingApplication(req, res) {
  try {
    let info = await Setting.findOne({'type': 'popup'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Setting not found.'});
    }
    if (!info.data.popupOnApp) {
      return res.status(404).json({success: false, error: 'Popup disabled.'});
    }
    let data = [];
    if(info && info.data.popupItems.length){
      info.data.popupItems.map( item => {
        if(item.application && item.popupTypeIndex === 0)
          data.push(item)
      })
    }
    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.log('err getPopupSettingApplication: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}
export async function getPopupSettingWebsite(req, res) {
  try {
    let info = await Setting.findOne({'type': 'popup'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Setting not found.'});
    }
    if (!info.data.popupOn) {
      return res.status(404).json({success: false, error: 'Popup disabled.'});
    }
    let data = [];
    let onlyVideo = true;
    if(info && info.data.popupItems && info.data.popupItems.length){
      info.data.popupItems.map( item => {
        if(!item.application){
          data.push(item);
          if(onlyVideo && item.popupTypeIndex === 0){
            onlyVideo = false
          }
        }
      })
    }
    return res.status(200).json({
      success: true,
      data: data,
      onlyVideo
    });
  } catch (err) {
    console.log('err getPopupSettingWebsite: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getAppVersion(req, res) {
  try {
    let info = await Setting.findOne({'type': 'application'}, 'data').lean();
    if (!info) {
      return res.status(404).json({success: false, error: 'Setting not found.'});
    }
    return res.status(200).json({
      success: true,
      data: info.data
    });
  } catch (err) {
    console.log('err getAppVersion: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

const appOS = [ 'android', 'ios' ];
const appStatus = [ 'required', 'normal', 'none' ];
/**
 * Check app compatibility
 * @param req
 * @param res
 * @returns {Promise.<void>}
 * App info:
 * {
 *   android: {
 *     version: '1.2.3',
 *     status: 'normal'
 *   },
 *   ios: {
 *     version: '1.2.4',
 *     status: 'required'
 *   }
 * }
 */
export async function checkAppVersion(req, res) {
  try {
    const version = req.query.ver; // Current app version on client, required
    const os = req.query.os; // App OS on client, required

    // Required version and OS platform
    if ( ! version || appOS.indexOf(os) < 0 ) {
      return res.status(400).json({
        success: false,
        error: 'You must provide app version and app OS platform.'
      });
    }

    const skipVersion = req.query.skip; // Version that user skip update on client

    const appInfo = await Setting.findOne({'type': 'application'}, 'data').lean();
    if ( ! appInfo ) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found.'
      });
    }
    const appInfoData = appInfo.data;
    if ( ! appInfoData ) {
      return res.status(404).json({
        success: false,
        error: 'Setting data is not found.'
      });
    }
    // Check app compatibility
    let latestAppVersion = null;
    let latestAppStatus = null;

    switch ( os ) {
      case 'android':
        const androidInfo = appInfoData.android;
        if ( androidInfo ) {
          latestAppVersion = androidInfo.version;
          latestAppStatus = androidInfo.status;
        }
        break;
      case 'ios':
        const iosInfo = appInfoData.ios;
        if ( iosInfo ) {
          latestAppVersion = iosInfo.version;
          latestAppStatus = iosInfo.status;
        }
        break;
    }

    // Required fields
    if ( ! latestAppVersion || ! latestAppStatus ) {
      return res.status(404).json({
        success: false,
        error: 'App setting is not available.'
      });
    }

    const versionCompare = compareVersions( version, latestAppVersion );
    let status = 'none';
    if ( versionCompare === -1 ) {
      if ( skipVersion ) {
        const skipCompare = compareVersions( skipVersion, latestAppVersion );
        switch ( skipCompare ) {
          case -1:
          case 1:
            status = latestAppStatus;
            break;
          case 0:
            status = latestAppStatus === 'required' ? 'required' : 'none';
            break;
        }
      } else {
        status = latestAppStatus;
      }
    }
    return res.status(200).json({
      success: true,
      status: status,
      version: latestAppVersion
    });
  } catch (err) {
    console.error('err getAppVersion: ', err);
    console.error('err.status:', err.status);
    err.success = false;
    return res.status(500).json(err.message);
  }
}

async function adminGetKnowledgeMetadata(knowledge) {
  let obj = JSON.parse(JSON.stringify(knowledge));
  delete obj.authorId;
  obj.author = await User.findById(knowledge.authorId, 'cuid userName fullName avatar').exec();
  return obj;
}

const allowActions = {
  dateAdded: 'dateAdded',
  activeDate: 'activeDate',
  becomeExpertRequest: 'becomeExpertRequest',
  becomeExpert: 'becomeExpert'
};
const allowTotal = {
  total_users: 'total_users',
  total_experts: 'total_experts'
};

export async function adminGetUserLineChart(req, res) {
  let from = new Date(Number(req.query.from).valueOf());
  // from = new Date(from.setHours(0));
  let to = new Date(Number(req.query.to).valueOf());
  // to = new Date(to.setHours(0));
  let fields = req.query.fields;
  fields = fields.split(',');
  let action_fields = [], total_fields = [];
  fields.forEach(field => {
    if(allowActions[field]) action_fields.push(field);
    else if(allowTotal[field]) total_fields.push(field);
  });
  // console.log('action_fields:', action_fields);
  // console.log('total_fields:', total_fields);

  let promises = [];
  if(action_fields.length) {
    promises.push(ChartLibs.getUserActionsLineChart(action_fields, from, to));
  }
  if(total_fields.length) {
    promises.push(ChartLibs.getTotalCharts(total_fields, from, to));
  }

  let rs  = await Promise.all(promises);
  rs = ArrayHelper.mergeArrayOfArrays(rs);
  rs = rs.map(data => {
    data.date = undefined;
    return data;
  });

  return res.json(rs);
}
export async function getMemberShips(req, res) {
  let memberShips = config.memberShips;
  let currencyDefault = memberShips.currency;
  let dataMemberShips = memberShips.value;
  let langDefault = memberShips.lang;
  let currency = '';
  if(req.user && req.user.role === 'admin'){
    currency = 'VND'
  } else {
    currency = config.currency[req.headers.lang] ? config.currency[req.headers.lang] : 'USD';
  }
  let priceDefault = memberShips.value.DATE;
  let data = [];
  Object.keys(dataMemberShips).map(key => {
    if(key === 'THREEDATE') {
      if(req.user && req.user.role === 'admin'){
        let dates = memberShips.time[key];
        let valueText = currencyDefault === currency ?
          dataMemberShips[key] :
          parseFloat(dataMemberShips[key] / config.moneyExchangeRate[langDefault]).toFixed(2);

        let valueTextDefault = currencyDefault === currency ?
          priceDefault * dates :
          parseFloat(priceDefault / config.moneyExchangeRate[langDefault] * dates).toFixed(2)
        data.push({
          key: key,
          value: dataMemberShips[key],
          valueDefault: currencyDefault * dates,
          valueText: valueText,
          valueTextDefault: valueTextDefault,
          currency: currency
        })
      }
    } else if(key === 'DATE') {
      if(req.user && req.user.role === 'admin'){
        if(!req.query.type){
          data.push({
            key: key,
            value: 0,
            valueDefault: 0,
            valueText: 0,
            valueTextDefault: 0,
            currency: currency
          })
        }
      } else {
        let valueText = currencyDefault === currency ?
          dataMemberShips[key] :
          parseFloat(dataMemberShips[key] / config.moneyExchangeRate[langDefault]).toFixed(2);

        let valueTextDefault = currencyDefault === currency ?
          memberShips.valueDefault[key] :
          parseFloat(memberShips.valueDefault[key] / config.moneyExchangeRate[langDefault]).toFixed(2)
        data.push({
          key: key,
          value: dataMemberShips[key],
          valueText: valueText,
          valueDefault: memberShips.valueDefault[key],
          valueTextDefault: valueTextDefault,
          currency: currency
        })
      }
    } else {
      let valueText = currencyDefault === currency ?
        dataMemberShips[key] :
        parseFloat(dataMemberShips[key] / config.moneyExchangeRate[langDefault]).toFixed(2);

      let valueTextDefault = currencyDefault === currency ?
        memberShips.valueDefault[key] :
        parseFloat(memberShips.valueDefault[key] / config.moneyExchangeRate[langDefault]).toFixed(2)
      data.push({
        key: key,
        value: dataMemberShips[key],
        valueText: valueText,
        valueTextDefault: valueTextDefault,
        valueDefault: memberShips.valueDefault[key],
        currency: currency
      })
    }
  });
  return res.json({success: true, data: data})
}

/**
 * Get turn server config from database, this value is set manually to database
 * Contact Turn config man to set this value to database
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function getTurnConfig(req, res) {
  try {
    let info = await Setting.findOne({'type': 'turn-config'}, 'data').lean();
    if ( ! info ) {
      return res.status(404).json({success: false, error: 'Setting not found.'});
    }
    return res.status(200).json({
      success: true,
      data: info.data,
    });
  } catch (err) {
    console.log('err getTurnConfig: ', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
