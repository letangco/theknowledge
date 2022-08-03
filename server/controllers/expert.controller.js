import configs from '../config';
import Expert from '../models/expert.js';
import sanitizeHtml from 'sanitize-html';
import Elasticsearch from '../libs/Elasticsearch';
import bodybuilder from 'bodybuilder';
import translate from 'google-translate-api';
import mongoose from 'mongoose';
import User from '../models/user';
import UserSearch from '../models/userSearch';
import Rating from '../models/rating';
import DetailRating from '../models/detailRating';
import ArrayHelper from '../util/ArrayHelper';
import Skill from '../models/skill';
import Category from '../models/category';
import Country from '../models/country';
import globalConstants from '../../config/globalConstants';
import {getUserSupportState} from '../routes/socket_routes/chat_socket';
import mem_cache from 'memory-cache';
import {getCategoriesByCuids} from "./category.controller";
import {formatSkillByLanguage} from "./skill.controller";
import {cacheImage} from '../libs/imageCache';
import {getExpertWithType, getExpertTotal ,getExpertInnotek, getSuggestedExpertsBySlugServiceV2} from "../services/experts.service";
import {getUserByToken} from "../services/users.service";
import config from '../config';

const TAG_SKILLS_LENGTH = 6;

export function joinExpert(req, res) {
  if (!req.params.email) {
    res.status(403).end();
  }
  var email = sanitizeHtml(req.params.email);
  var result = {};
  Expert.findOne({email: email}).exec((err, expert) => {
    if (err) {
      res.status(500).send(err);
    }
    if (expert == null) {
      const newExpert = new Expert();
      newExpert.email = email;

      newExpert.save((err, saved) => {
        if (err) {
          res.status(500).send(err);
        }
        result.complete = 1;
        res.json({result});
      });
    } else {
      result.warning = 'Your email has been registered for expert';
      res.json({result});
    }
  });
}

export function confirmExpert(req, res) {
  if (!req.params.token) {
    res.status(403).end();
  }
  var token = sanitizeHtml(req.params.token);
  var time = new Date().getTime() - 86400000;
  var result = {};
  Expert.findOne({tokenActive: token, dateAdded: {$gte: time}}).exec((err, expert) => {
    if (err) {
      res.status(500).send(err);
      return null;
    }
    if (expert) {
      res.json({result: 2});
    } else {
      res.json({result: 1});
    }
  });
}

export async function searchExpertsWithSkills(foundSkills, query, langCode) {
  let skill_ids = foundSkills.map(foundSkill => {
    return foundSkill.id;
  });

  let fields = [
    'cuid', 'fullName', 'avatar', 'rate', 'country', 'userName', 'skills', 'languageSupport',
    'serviceRating', 'serviceTotalRate', 'priceChat', 'priceCall', 'reviews'
  ].join(' ');
  //Add search user expert by name
  let searchText = query.q || '';
  let conditions = buildFindExpertConditions(langCode, skill_ids, searchText);
  // console.log('Conditions: ', conditions);
  let foundExperts = await User.find(conditions, fields).sort({rate: -1}).lean();
  // console.log(foundExperts);
  let promises = foundExperts.map(async expert => {
    if (expert && expert.avatar) {
      let data = {
        src: expert.avatar,
        size: 150
      }
      let thumb = await cacheImage(data);
      expert.avatar = thumb;
    }
    // let reviews = [];
    // expert.reviews.forEach(review => {
    //   Array.prototype.push.apply(reviews, review.details);
    // });
    // expert.reviews = reviews;
    return expert;
  });

  let expertObjects = await Promise.all(promises);
  await sortShowSkills(expertObjects, foundSkills, langCode);
  return expertObjects;
}

async function getSuggestUser(input, size) {
  let body = bodybuilder().size(size).query('match_phrase_prefix', 'search_text', input).build();
  return Elasticsearch.search('users', body);
}
export async function searchExpertV2(req, res) {
  try {
    let langCode = req.headers.lang;
    let startTime = process.hrtime();
    // translate user's input to englist
    let searchString = req.query.q ? decodeURIComponent(req.query.q.toLowerCase()) : "";
    let engText = searchString;
    // if (engText !== 'nodejs') {
    //   let translateRs = await translateToEnglish(searchString);
    //   engText = translateRs.text.replace(/null/g, '');
    // }
    // console.log('engText: ', engText)
    let cached = mem_cache.get('search_' + engText + '_lang=' + langCode);
    let experts = [];
    let skill_ids = [];
    if (req.headers && req.headers.token) {
      let user = await User.findOne({token: req.headers.token}, '_id');
      if (user) {
        UserSearch.create({
          user: user._id,
          search_text: engText,
          type: 'expert'
        });
      }
    }
    if (!cached) {
      // find skills
      let foundSkills = await findSkillsInQueryString(engText, req.query.cat || null, langCode);
      skill_ids = foundSkills.map(foundSkill => {
        return foundSkill.id;
      });
      let expertObjects = await searchExpertsWithSkills(foundSkills, req.query, langCode);
      experts = ArrayHelper.cloneArray(expertObjects);
      mem_cache.put('search_' + engText + '_lang=' + langCode, {
        experts: expertObjects,
        skill_ids: skill_ids
      }, 300000, (key, val) => {
        console.log('cached', engText, 'done in 5 mins.');
      });
    } else {
      console.log('\ncache roi ne:', cached.experts.length);
      experts = ArrayHelper.cloneArray(cached.experts);
      skill_ids = ArrayHelper.cloneArray(cached.skill_ids);
    }

    experts = getExpertOnlineStatus(experts);
    experts = applyFilter(req, experts);
    req.query.sort = req.query.sort || 1;
    experts = applySort(req, experts, skill_ids);

    let formatedExperts = ArrayHelper.cloneArray(experts);
    formatedExperts = formatedExperts.map(expert => {
      let cloneExpert = Object.assign({}, expert);
      delete cloneExpert.reviews;
      delete cloneExpert.tagSkillIds;
      cloneExpert.tagSkills = cloneExpert.tagSkills.map(tagSkill => {
        return tagSkill.name
      });
      return cloneExpert;
    });
    let totalPages = Math.ceil(formatedExperts.length / configs.numExpertsPerPage);
    let page = findPage(req.query.page || 1, totalPages);
    let rs = {
      numFound: formatedExperts.length,
      data: formatedExperts.splice((page - 1) * configs.numExpertsPerPage, configs.numExpertsPerPage),
      totalPages: totalPages
    };
    let hrend = process.hrtime(startTime);
    return res.json(rs);
  } catch (err) {
    console.log('ex on search expert:', err);
    res.status(500).json({error: 'Internal error.'});
  }
}

function getExpertOnlineStatus(experts) {
  experts.map(expert => {
    expert.online = getUserSupportState(expert.cuid);
    return expert;
  });
  return experts;
}

function applyFilter(req, experts) {
  let query = req.query;
  let filteredExperts = ArrayHelper.cloneArray(experts);
  // filter by language support
  if (query.la && query.la !== 'A-L') {
    let langCode = query.la.toLocaleLowerCase();
    filteredExperts = filteredExperts.filter(expert => {
      let langSupport = expert.languageSupport.filter(lang => lang.langCode === langCode);
      return langSupport.length;
    });
  }

  // filter by country
  if (query.co && query.co !== 'A-C') {
    console.log('filter country');
    let country = query.co.toUpperCase();
    filteredExperts = filteredExperts.filter(expert => expert.country.ISO2 === country);
  }

  // filter by online status
  let status = [null, 0, 1, 2, 3];
  if ('st' in query) {
    console.log('filter status');
    switch (~~query.st) {
      case 0:
        status = [null, 0, 1, 2, 3];
        break;
      case 1:
        status = [1, 2, 3]; // 1: online, 2: busy, 3: ready
        break;
      case 2:
        status = [null, 0]; // 0: offline
        break;
    }
  }
  filteredExperts = filteredExperts.filter(expert => status.indexOf(expert.online) >= 0);
  return filteredExperts;
}

function buildFindExpertConditions(langCode, skill_ids, searchText = '') {
  let conditions = {
    expert: 1,
    active: 1,
    cuid: {$nin: ['cj0dl08pn0015kk7myjy7mz2y', 'cj0dij2y2000ekk7mxmhbhwy6']},
    // 'languageSupport.langCode': langCode
  };
  if(searchText){
    conditions["$or"] = [
      {
        skills: {
          $in: skill_ids
        },
      },
      {fullName: { $regex: searchText.trim(), $options: "$i" }}
    ]
  } else {
    conditions.skills = {
      $in: skill_ids
    }
  }
  if(langCode !== 'vi') {
    conditions['languageSupport.langCode'] = langCode;
  }
  //
  // if (query.la && query.la !== 'A-L') {
  //     conditions["languageSupport"] = {$elemMatch: {"langCode": query.la.toLowerCase()}};
  // }
  // if (query.co && query.co !== 'A-C') {
  //     conditions["country.ISO2"] = query.co.toUpperCase();
  // }
  //
  // let status = [null,0,1,2,3];
  // if('st' in query) {
  //     switch (~~ query.st){
  //         case 0:
  //             status = [null,0,1,2,3];
  //             break;
  //         case 1:
  //             status = [1,2,3]; // 1: online, 2: busy, 3: ready
  //             break;
  //         case 2:
  //             status = [null,0]; // 0: offline
  //             break;
  //     };
  // }
  //
  // conditions["online"] = {$in: status};
  return conditions;
}

async function translateToEnglish(text) {
  try {
    return await translate(text, {to: 'en'});
  } catch (e) {
    console.log('err on translate:', e);
    return {text};
  }
}

export function applySort(req, foundExperts, skill_ids) {
  let sort = Number(req.query.sort).valueOf();
  if (isNaN(sort)) sort = 1;

  let order = req.query.order || 'desc';

  foundExperts = foundExperts.map(expert => {
    // console.log('expert:', expert);
    expert.match_skills = 0;
    expert.tagSkillIds = expert.tagSkills.map(tagSkill => {
      let id = tagSkill.id;
      if (skill_ids.indexOf(id) >= 0) {
        expert.match_skills++;
      }
      return id;
    });

    let rating = expert.serviceRating;
    let sum = 0;
    for (let k in rating) {
      if (typeof rating[k] === 'number') {
        sum += rating[k];
      }
    }
    expert.serviceRating = expert.serviceTotalRate > 0 ? Math.round(sum / expert.serviceTotalRate) : 0;
    return expert;
  });

  let sortOptions = {rate: order};
  if (sort > 0) {
    sortOptions.match_skills = order;
  }
  switch (sort) {
    case 0:
      sortOptions = Object.assign({online: order}, sortOptions);
      break;
    case 2:
      sortOptions = Object.assign({online: order, serviceRating: order}, sortOptions);
      // case 3:
      //   // TO DO: sort by numberConnection
      break;
    case 4:
      sortOptions = Object.assign({online: order, priceCall: order}, sortOptions);
      break;
    case 5:
      sortOptions = Object.assign({online: order, priceChat: order}, sortOptions);
      break;
    default:
      // calculate skill rate for each expert in elasticsearch result
      foundExperts.map(expert => {
        // console.log('\nexpert:', expert.fullName);
        let skillRate = 0;
        skill_ids.forEach(skillId => {
          // console.log('skill:', skillId);
          // console.log('expert.reviews:', expert.reviews);
          let index = ArrayHelper.findItemByProp(expert.reviews, 'skillId', skillId);
          // console.log('index:', index);
          skillRate += index !== false ? expert.reviews[index].avgRate : 0;
          // console.log('skill rate:', rate);
        });
        expert.avgSkillRate = skillRate / skill_ids.length;
        return expert;
      });

      sortOptions = Object.assign({online: order, avgSkillRate: order}, sortOptions);
  }

  foundExperts = ArrayHelper.multiChainSort(foundExperts, sortOptions);
  return foundExperts;
}
async function sortShowSkills(foundExperts, foundSkills, langCode) {
  // console.log('sort skills');
  let expert = null;
  let cateCuids = [];
  foundSkills.map(foundSkill => {
    if(cateCuids.indexOf(foundSkill.cateCuid) === -1){
      cateCuids.push(foundSkill.cateCuid);
    }
  });
  let mappers = {};
  let categories = await getCategoriesByCuids(cateCuids, langCode);
  categories.forEach(cate => {
    mappers[cate.cuid] = {
      id: cate._id.toString(),
      name: cate.title,
      cuid: cate.cuid
    };
  });
  for (let i = 0, length = foundExperts.length; i < length; i++) {
    expert = foundExperts[i];
    expert.tagSkills = [];
    expert.departments = [];

    // filter found skills belong to experts
    let expertFoundSkills = foundSkills.filter(foundSkill => {
      return expert.skills.indexOf(foundSkill.id) >= 0;
    });

    expertFoundSkills.forEach(foundSkill => {
      let cate = mappers[foundSkill.cateCuid];

      let deptIndex = ArrayHelper.findItemByProp(expert.departments, 'id', cate.id);
      if (deptIndex === false) {
        expert.departments.push(cate);
      }
    });
    let numSkillPerDept = Math.ceil(TAG_SKILLS_LENGTH / expert.departments.length);
    expert.departments = expert.departments.map(dept => {
      let expertDeptSkills = expertFoundSkills.filter(skill => {
        return skill.cateId == dept.id;
      });
      expertDeptSkills = expertDeptSkills.splice(0, numSkillPerDept);
      expertDeptSkills = expertDeptSkills.map(skill => {
        return {
          id: skill.id,
          name: skill.name
        };
      });
      Array.prototype.push.apply(expert.tagSkills, expertDeptSkills);
      dept.has = expertDeptSkills.length;
      return dept;
    });

    let dept = null;
    for (let i = 0, length = expert.departments.length; i < length; i++) {
      dept = expert.departments[i];
      if (dept.has >= numSkillPerDept) {
        continue;
      }
      let deptIndexReview = ArrayHelper.findItemByProp(expert.reviews, 'cateCuid', dept.cuid);
      if (deptIndexReview !== false) {
        let otherSkillsInDept = expert.reviews[deptIndexReview].details.filter(skill => {
          let isSkillExists = ArrayHelper.findItemByProp(expert.tagSkills, 'id', skill.skillId);
          return isSkillExists === false;
        });
        let otherSkillIds = otherSkillsInDept.map(skill => skill.skillId);
        let otherSkills = await Skill.find({_id: {$in: otherSkillIds}}).lean();
        otherSkills = formatSkillByLanguage(otherSkills, langCode);
        let mapper = ArrayHelper.toObjectByKey(otherSkills, '_id');
        otherSkillsInDept = otherSkillsInDept.map(otherSkill => {
          otherSkill.skillName = mapper[otherSkill.skillId].description.name;
          return otherSkill;
        });

        while (expert.tagSkills.length < TAG_SKILLS_LENGTH) {
          if (otherSkillsInDept.length) {
            let otherSkill = otherSkillsInDept.shift();
            expert.tagSkills.push({
              id: otherSkill.skillId,
              name: otherSkill.skillName
            });
          } else {
            break;
          }
        }
      }
    }

    expert.departments = expert.departments.map(department => {
      return department.name;
    });

    let reviews = [];
    expert.reviews.forEach(review => {
      Array.prototype.push.apply(reviews, review.details);
    });
    expert.reviews = reviews;

    delete expert.skills;
  }
  return;
}

export async function findSkillsInQueryString(qs, type, langCode) {
//      console.log('query skill:', qs);
  qs = qs.toLowerCase();
  let strings = qs.split(' ');
  let body = bodybuilder().size(1000);
  strings.forEach(string => {
    if (string.length > 1 && globalConstants.stopWords.indexOf(string) < 0) {
      if (string.indexOf('#') > 0 || string.indexOf('+') > 0) {
        body.orQuery('match', 'name', string);
      } else {
        body.orQuery('match_phrase_prefix', 'name', string);
      }
    }
  });
  let builtBody = body.build();
  if (!builtBody.query) {
    console.log('ko can query luon.');
    return [];
  }
  let conditions = {
    index: 'skills',
    body: builtBody
  };
  if (type) {
    conditions.type = type;
  }
  let resp = await Elasticsearch.search('skills', builtBody);
  let foundSkills = resp?.hits?.hits;
  if (!foundSkills?.length) {
    return [];
  }
  let rawData = foundSkills.map(skill => skill._source);
  let skillIds = rawData.map(rawSkill => rawSkill.id);
  let skills = await Skill.find({_id: {$in: skillIds}}).lean();
  if (langCode) {
    skills = formatSkillByLanguage(skills, langCode);
  }
  let data = [];
  rawData = rawData.forEach((rawSkill, index) => {
    if (skills[index]) {
      rawSkill.name = skills[index].description.name;
      data.push(rawSkill);
    }
  });

  return data;
}

function findPage(queryPage, totalPages) {
  if (queryPage < 1) {
    return 1;
  }
  if (queryPage > totalPages) {
    return totalPages;
  }
  return queryPage;
}

export async function getExpertsByCategory(req, res) {
  let cateCuid = req.params.cuid;
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * configs.numExpertsPerPage;
  // console.log('cateCuid:', cateCuid);
  let cate = await Category.findOne({cuid: cateCuid}).exec();
  if (!cate) {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }

  let cateIds = [];
  if (!cate.parent) {
    let arrCates = await Category.find({parent: cateCuid}).exec();
    cateIds = arrCates.map(cateItem => {
      return cateItem.cuid;
    });
  } else {
    cateIds.push(cateCuid);
  }

  let skills = await Skill.find({categoryID: {$in: cateIds}}).exec();
  let experts = {};

  let promises = skills.map(async skill => {
    let ownerPromises = skill.owners.map(async ownerId => {
      let isExpert = await User.isExpert(User, ownerId);
      if (isExpert) {
        if (!experts[ownerId]) {
          experts[ownerId] = [skill._id];
        } else {
          experts[ownerId].push(skill._id);
        }
        return;
      }
    });
    return await Promise.all(ownerPromises);
  });
  await Promise.all(promises);

  let expertIds = Object.keys(experts);

  let expertPromises = expertIds.map(expertId => {
    let options = {
      cateCuid: cateCuid,
      userId: expertId,
      skillIds: experts[expertId],
      parent: req.query.parent || null
    };
    return User.sortUserSkills(User, options);
  });
  let rs = await Promise.all(expertPromises);

  if (req.query.st) {
    let st = [1, 2, 3];
    if (req.query.st == 2) {
      st = [null, 0];
    }
    rs = rs.filter(item => {
      return st.indexOf(item.online) >= 0;
    });
  }

  if (req.query.la) {
    rs = rs.filter(item => {
      return ArrayHelper.findItemByProp(item.languageSupport, 'langCode', req.query.la) !== false;
    });
  }

  if (req.query.co) {
    rs = rs.filter(item => {
      return item.country && item.country.ISO2 == req.query.co;
    });
  }

//  rs = ArrayHelper.sortByProp(rs, 'rate', 'desc');
  rs = ArrayHelper.multiChainSort(rs, {online: 'desc', rate: 'desc'});
  res.json({
    success: true,
    totalPages: Math.ceil(rs.length / configs.numExpertsPerPage),
    numFound: rs.length,
    data: rs.splice(skip, configs.numExpertsPerPage)
  });
//
//  expertIds.map(expertId )
//  User.find({_id: {$in: expertIds}, fields)
//
}

export async function getExpertsByCategorySlug(req, res) {
  let slug = req.params.slug;
  let langCode = req.headers.lang;
  req.query.sort = req.query.sort || 0;
  let query = req.query;
  // let page = ~~req.query.page || 1;
  // let skip = (page - 1) * configs.numExpertsPerPage;
  let experts = [];
  let skill_ids = [];
  let cached = mem_cache.get('search_' + slug + '_lang=' + langCode);
  if (!cached) {
    let cate = await Category.findOne({'description.slug': slug}).exec();
    if (!cate) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    let cateIds = [];
    if (!cate.parent) {
      let arrCates = await Category.find({parent: cate.cuid}).exec();
      cateIds = arrCates.map(cateItem => {
        return cateItem.cuid;
      });
    } else {
      cateIds.push(cate.cuid);
    }

    let skills = await Skill.find({categoryID: {$in: cateIds}}).exec();

    let foundSkills = skills.map(skill => {
      let skillId = skill._id.toString();
      skill_ids.push(skillId);
      return {id: skillId, cateCuid: skill.categoryID};
    });

    let expertObjects = await searchExpertsWithSkills(foundSkills, query, langCode);
    experts = ArrayHelper.cloneArray(expertObjects);

    mem_cache.put('search_' + slug + '_lang=' + langCode, {
      experts: expertObjects,
      skill_ids: skill_ids
    }, 300000, (key, val) => {
      console.log('cached', slug, ' timeout after 5 mins.');
    });
  } else {
    console.log('\ncache roi ne:', cached.experts.length);
    experts = ArrayHelper.cloneArray(cached.experts);
    skill_ids = ArrayHelper.cloneArray(cached.skill_ids);
  }

  experts = getExpertOnlineStatus(experts);
  experts = applyFilter(req, experts);
  experts = applySort(req, experts, skill_ids);

  let formatedExperts = ArrayHelper.cloneArray(experts);
  formatedExperts = formatedExperts.map(expert => {
    let cloneExpert = Object.assign({}, expert);
    delete cloneExpert.reviews;
    delete cloneExpert.tagSkillIds;
    cloneExpert.tagSkills = cloneExpert.tagSkills.map(tagSkill => {
      return tagSkill.name
    });
    return cloneExpert;
  });

  let totalPages = Math.ceil(formatedExperts.length / configs.numExpertsPerPage);
  let page = findPage(req.query.page || 1, totalPages);
  let rs = {
    numFound: formatedExperts.length,
    data: formatedExperts.splice((page - 1) * configs.numExpertsPerPage, configs.numExpertsPerPage),
    totalPages: totalPages
  };

  return res.json(rs);
}

//
// export async function getAllExperts(req, res) {
//   let langCode = req.headers.lang;
//   req.query.sort = req.query.sort || 0;
//   let query = req.query;
//   // let page = ~~req.query.page || 1;
//   // let skip = (page - 1) * configs.numExpertsPerPage;
//   let experts = [];
//
//   let expertObjects = await searchAllExperts(query, langCode);
//   experts = ArrayHelper.cloneArray(expertObjects);
//
//   experts = getExpertOnlineStatus(experts);
//   experts = applyFilter(req, experts);
//   experts = applySortNotSkill(req, experts);
//   let formatedExperts = ArrayHelper.cloneArray(experts);
//   formatedExperts = formatedExperts.map(expert => {
//     let cloneExpert = Object.assign({}, expert);
//     delete cloneExpert.reviews;
//     cloneExpert.tagSkills = cloneExpert.skills.map(async skill => {
//       const skillData = await Skill.findOne({_id: skill}, 'description');
//       return skillData.description
//     });
//     return cloneExpert;
//   });
//
//   let totalPages = Math.ceil(formatedExperts.length / configs.numExpertsPerPage);
//   let page = findPage(req.query.page || 1, totalPages);
//   let rs = {
//     numFound: formatedExperts.length,
//     data: formatedExperts.splice((page - 1) * configs.numExpertsPerPage, configs.numExpertsPerPage),
//     totalPages: totalPages
//   };
//
//   return res.json(rs);
// }

//======== FEED ========
const defaultExpertNeeded = 50;
const projectFields = {
  _id: 1,
  cuid: 1,
  priceChat: 1,
  priceCall: 1,
  education: 1,
  reviews: 1,
  categories: 1,
  serviceRating: 1,
  rate: 1,
  totalRate: 1,
  online: 1,
  country: 1,
  avatar: 1,
  fullName: 1,
  lastName: 1,
  firstName: 1,
  userName: 1,
  numPublishedKnowledge: 1
};

function getExpertIds(experts) {
  let result = [];
  experts.map(function (expert) {
    result.push(expert._id);
  });
  return result;
}

async function getExpertLeft(userId, experts, numExpertNeeded) {
  // Get top experts not base on skills selected
  let numExpertLeft = numExpertNeeded - experts.length;
  if (numExpertLeft < 1) {
    // No need more expert
    return;
  }
  let expertIds = getExpertIds(experts);
  let users = await User.aggregate([
    // Ignore experts found
    {
      $match: {
        _id: {
          $nin: [
            mongoose.Types.ObjectId(config.supportAccounts.tesseSupport._id),
            mongoose.Types.ObjectId(config.supportAccounts.customerSupport._id),
            userId,
            ...expertIds
          ]
        },
        expert: 1,
        active: 1
      }
    },
    // Join collections to get count num follow by user
    {
      $lookup: {
        from: 'follows',
        localField: '_id',
        foreignField: 'to', // Of table follows
        as: 'follows'
      }
    },
    // Get only user is not followed by userId
    {$match: {'follows.from': {$ne: userId}}},
    {$addFields: {numFollow: {$size: "$follows"}}},
    {$sort: {numFollow: -1}},
    {$limit: numExpertLeft},
    {$project: projectFields}
  ]);
  let obj = JSON.parse(JSON.stringify(users));
  let promises = obj.map(async user => {
    if (user && user.avatar) {
      let data = {
        src: user.avatar,
        size: 50
      }
      let thumb = await cacheImage(data);
      user.avatar = thumb;
    }
    return user;
  });
  obj = await Promise.all(promises);
  return obj;
}

/**
 * Get expert have skills and supported language code
 * @param userId, the user _id
 * @param skillObjectIds, that objectID of skills user follow
 * @param limit, num expert want to load
 * @param langCode, language code want to load
 * @returns Array experts
 */
async function getExpertOnLang(userId, skillObjectIds, limit, langCode) {
  limit = isNaN(limit) ? defaultExpertNeeded : parseInt(limit);
  try {
    let supportAccounts = config.supportAccounts;
    /*
     * Array of: {
     *   _id: user object id
     *   numFollow: 1
     *   follows: redundant data
     * }
     */
    let experts = await Skill.aggregate([
      {$match: {_id: {$in: skillObjectIds}}},
      {$unwind: '$owners'},
      {$group: {_id: '$owners'}},
      // Join collections to get count num follow by user
      {
        $lookup: {
          from: 'follows',
          localField: '_id',
          foreignField: 'to', // Of table follows
          as: 'follows'
        }
      },
      // Check user found had been follow by userId
      {$match: {'follows.from': {$ne: userId}}},
      {$addFields: {numFollow: {$size: "$follows"}}},
      {$sort: {numFollow: -1}},
      {$group: {_id: '$_id'}},
      // Join collections to get user info
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id', // Of table users
          as: 'user'
        }
      },
      {$unwind: '$user'},
      {$replaceRoot: {newRoot: '$user'}},
      // Get only expert approved, not is your self and map with langCode
      {
        $match: {
          _id: {
            $nin: [
              mongoose.Types.ObjectId(supportAccounts.tesseSupport._id),
              mongoose.Types.ObjectId(supportAccounts.customerSupport._id)
            ]
          },
          expert: 1,
          active: 1,
          'languageSupport.langCode': langCode
        }
      },
      {$sort: {numPublishedKnowledge: -1}},
      {$limit: limit},
      {$project: projectFields}
    ]);
    if (experts instanceof Array) {
      let obj = JSON.parse(JSON.stringify(experts));
      let promises = obj.map(async user => {
        if (user && user.avatar) {
          let data = {
            src: user.avatar,
            size: 50
          }
          let thumb = await cacheImage(data);
          user.avatar = thumb;
        }
        return user;
      });
      obj = await Promise.all(promises);
      return obj;
    }
    return [];
  } catch (ex) {
    return [];
  }
}

/**
 * Get expert have skills
 * @param userId, the user _id
 * @param experts, the experts found when call getExpertOnLang()
 * @param skillObjectIds, that objectID of skills user follow
 * @param numExpertNeeded, num expert want to load
 * @returns Array experts
 */
async function getExpertOnSkill(userId, experts, skillObjectIds, numExpertNeeded) {
  let numExpertLeft = numExpertNeeded - experts.length;
  if (numExpertLeft < 1) {
    // No need more expert
    return [];
  }
  let expertIds = getExpertIds(experts);
  try {
    /*
     * Array of: {
     *   _id: user object id
     *   numFollow: 1
     *   follows: redundant data
     * }
     */
    let experts = await Skill.aggregate([
      {$match: {_id: {$in: skillObjectIds}}},
      {$unwind: '$owners'},
      {$group: {_id: '$owners'}},
      // Join collections to get count num follow by user
      {
        $lookup: {
          from: 'follows',
          localField: '_id',
          foreignField: 'to', // Of table follows
          as: 'follows'
        }
      },
      // Check user found had been follow by userId
      {$match: {'follows.from': {$ne: userId}}},
      {$addFields: {numFollow: {$size: "$follows"}}},
      {$sort: {numFollow: -1}},
      {$group: {_id: '$_id'}},
      // Join collections to get user info
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id', // Of table users
          as: 'user'
        }
      },
      {$unwind: '$user'},
      {$replaceRoot: {newRoot: '$user'}},
      // Get only expert approved, not is your self and map with langCode
      {
        $match: {
          _id: {
            $nin: [
              mongoose.Types.ObjectId(config.supportAccounts.tesseSupport._id),
              mongoose.Types.ObjectId(config.supportAccounts.customerSupport._id),
              userId,
              ...expertIds
            ]
          },
          expert: 1,
          active: 1
        }
      },
      {$sort: {numPublishedKnowledge: -1}},
      {$limit: numExpertLeft},
      {$project: projectFields}
    ]);
    if (experts instanceof Array) {
      let obj = JSON.parse(JSON.stringify(experts));
      let promises = obj.map(async user => {
        if (user && user.avatar) {
          let data = {
            src: user.avatar,
            size: 50
          }
          let thumb = await cacheImage(data);
          user.avatar = thumb;
        }
        return user;
      });
      obj = await Promise.all(promises);
      return obj;
    }
    return [];
  } catch (ex) {
    return [];
  }
}

export async function getBySkills(req, res) {
  let userId = req.user._id;
  let skillIds = req.body.skillIds || []; // Array of skills _id
  let skillObjectIds = [];
  let limit = isNaN(req.query.limit) ? defaultExpertNeeded : parseInt(req.query.limit);
  let langCode = req.headers.lang || 'en';
  // Convert to ObjectId
  skillIds.map(function (skillId) {
    skillObjectIds.push(mongoose.Types.ObjectId(skillId));
  });
  try {
    /*
     * Array of: {
     *   _id: user object id
     *   numFollow: 1
     *   follows: redundant data
     * }
     */
    let finalExperts = [];
    let expertsOnLang = await getExpertOnLang(userId, skillObjectIds, limit, langCode);
    // If not enough, load more expert not base on lang support
    if (expertsOnLang.length < limit) {
      let expertsOnSkill = await getExpertOnSkill(userId, expertsOnLang, skillObjectIds, limit);
      finalExperts = [...expertsOnLang, ...expertsOnSkill];
      // If not enough, load more expert base on the number of followers
      if (finalExperts.length < limit) {
        let expertOnFollower = await getExpertLeft(userId, finalExperts, limit);
        if (expertOnFollower instanceof Array) {
          finalExperts = [...finalExperts, ...expertOnFollower];
        }
      }
    } else {
      finalExperts = expertsOnLang;
    }
    res.json({success: true, numExpert: finalExperts.length, data: finalExperts});
  } catch (ex) {
    res.json({success: false, data: ex});
  }
}


export async function getExpertHomePage(req, res) {
  try {
    const token = req.headers.token;
    const lang = req.headers.lang;
    let user;
    if (!req.params.country && token) {
      user = await getUserByToken(token);
    }
    const countryCode = req.query.country || (user && user.country ? user.country.ISO2 : null);
    let data = {
      expertsByCountry: [],
      expertsGlobal: []
    };
    let globalPromise;
    let globalExperts = [];
    let localPromise;
    let expertsByCountry = [];

    globalPromise = getExpertWithType(
      globalExperts,
      'globalExperts',
      countryCode,
      lang
    );

    if (countryCode !== null) {
      localPromise = getExpertWithType(
        expertsByCountry,
        'expertsByCountry',
        countryCode,
        lang
      );
    }
    Promise.all([globalPromise, localPromise]).then((results) => {
      data.expertsGlobal = results[0] || [];
      data.expertsByCountry = results[1] || [];
      return res.json({success: true, data});
    }).catch((err) => {
      res.status(500).json({success: false});
      console.log('err in promise expert home:', err);
    });
  } catch (err) {
    console.log('err in get expert home:', err);
    res.status(500).json({success: false});
  }
}

/**
 * Get all experts with filter
 * @param limit, num expert want to load
 * @param langCode, language code want to load
 * @returns Array experts
 */

export async function getAllExperts(req, res) {
  try {
    const lang = req.headers.lang;
    const countryCode = req.query.country || null;
    req.query.page
    let localPromise;
    let experts = [];
    localPromise = getExpertWithType(
      experts,
      'allExperts',
      countryCode,
      lang,
      req.query
    );
    let numFound = await getExpertTotal(req.query);
    return res.json({
      success: true,
      data: await Promise.resolve(localPromise),
      numFound: numFound,
      totalPages: Math.ceil(numFound / config.numExpertsPerPage)
    });
  } catch (err) {
    console.log('err in get expert home:', err);
    res.status(500).json({success: false});
  }
}

/**
 * Get all experts for innotek
 * @param limit, num expert want to load
 * @param langCode, language code want to load
 * @returns Array experts
 */

export async function getUserInnotek(req, res) {
  try {
    const lang = req.headers.lang;
    let limit = parseInt(req.query.limit)
    let data =  await getExpertInnotek(limit, lang)
    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.log('err in get expert home:', err);
    res.status(500).json({success: false});
  }
}

//======== END FEED ========

async function getSuggestedExpertsBySlug(slug, page) {
  try {
    let skip = (page - 1) * 10;
    let experts = [], count = 0;
    let industry = await Category.findOne({slug: slug}, 'cuid').lean();
    let categories = await Category.find({parent: industry.cuid}, 'cuid').lean();
    let cateIds = categories.map(cate => cate.cuid);
    let skills = await Skill.find({categoryID: {$in: cateIds}}, '_id').lean();
    let skillIds = skills.map(skill => skill._id);
    let conditions = buildFindExpertConditions({$ne: null}, skillIds);
    let resources = await Promise.all([
      User.count(conditions),
      User.find(conditions, 'userName cuid avatar firstName lastName').sort({online: -1}).limit(10).skip(skip).lean()
    ]);
    let users = resources[1];
    let avatarPromises = users.map(async expert => {
      if (expert.avatar) {
        let data = {
          src: expert.avatar,
          size: 50
        };
        expert.avatar = await cacheImage(data);
      }
      return expert;
    });
    let rs = await Promise.all(avatarPromises);
    experts = ArrayHelper.cloneArray(rs);
    count = resources[0];


    // experts = getExpertOnlineStatus(experts);
    // experts = ArrayHelper.sortByProp(experts, 'online', 'desc');
    // experts = experts.splice(skip, 10);

    return {experts, count};
  } catch (err) {
    throw err;
  }
}

export async function mobileGetSuggestedExperts(req, res) {
  try {
    let industries = await Category.find({parent: ''}, 'title slug cuid').lean();
    let promises = industries.map(async industry => {
      let obj = {name: industry.title, slug: industry.slug};
      let data = await getSuggestedExpertsBySlug(obj.slug, 1, 10);
      obj.experts = data.experts;
      obj.last_page = Math.ceil(data.count / 10);
      return obj;
    });
    return res.json({
      success: true,
      data: await Promise.all(promises)
    });
  } catch (err) {
    console.log('err on mobileGetSuggestedExperts:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function countriesGlobal(req, res) {
  try {
    let countries = await User.aggregate(
      [ { $match: { 'expert': 1, 'active': 1,'skills': {'$ne': []} } },
        { $group: { _id: "$country.ISO2", users: { $push: "$country.ISO2" } } },
        {$addFields: {count: {$size: "$users"}}},
        {$match: {'count': {$gt: 3}}},
        {$sort: {'count': -1}},
        {$project: {'_id' : 1}}
      ]
    ).exec();
    if (countries){
      let promises = countries.map(async country => {
        return await  Country.findOne({'ISO2': country._id}, 'name ISO2 ISO3').lean()
      })
      return res.json({
        success: true,
        data: await Promise.all(promises)
      });
    } else {
      return res.json({
        success: true,
        data: []
      });
    }
  } catch (err) {
    console.log('err on countriesGlobal:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function mobileGetSuggestedExpertsBySlug(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let resources = await getSuggestedExpertsBySlug(req.params.slug, page);
    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(resources.count / 10),
      total_items: resources.count,
      data: resources.experts
    });
  } catch (err) {
    console.log('err on mobileGetSuggestedExpertsBySlug:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}


export async function getSuggestedExpertsBySlugV2(req, res) {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    let options = {
      skip,
      limit,
      sort: req.query.sort || 0,
      langCode: req.headers.lang || 'vi'
    };
    let slug = req.params.slug || '';
    if(!slug){
      throw {
        status: 400,
        success: false,
        error: 'Invalid Params.'
      }
    }
    options.slug = slug;
    if(req.query.st) {
      options.status = req.query.st
    }
    if(req.query.la) {
      options.supportLanguage = req.query.la;
    }
    if(req.query.co) {
      options.country = req.query.co;
    }
    if(req.query.text) {
      options.text = req.query.text;
    }
    let data = await getSuggestedExpertsBySlugServiceV2(options);
    return res.json({
      data: data[1],
      numFound: data[0],
      totalPages: Math.ceil(data[0]/limit)
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}
