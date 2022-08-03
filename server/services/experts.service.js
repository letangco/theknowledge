import ArrayHelper from '../util/ArrayHelper';
import User from '../models/user';
import config from '../config';
import Category from "../models/category";
import mongoose from "mongoose";
import Skill from "../models/skill";
import {cacheImage} from "../libs/imageCache";
const TAG_SKILLS_LENGTH = 6;
const TAG_CATEGORY_LENGTH = 1;

export async function getExperts(query, returnValue, option) {
  return await User.find(
    query,
    returnValue,
    option
  ).lean();
}

////// duplicate code is not good but a bit different make them cant be combined, any solution?
// why we dont need return here ? we modify the input directly

export async function appendDepartmentToExperts(selectedExperts, lang) {
  let expertPromises = selectedExperts.map(async expert => {
    expert.departments = [];
    if (Array.isArray(expert.categories)) {
      const chosenCategories = ArrayHelper.selectRandomEleNoDup(expert.categories, config.departmentLimit);
      let departmentPromises = chosenCategories.map(async cate => {
        if (cate.department) {
          const department = await Category.findOne({cuid: cate.department.departmentID}, 'description');
          if (department && Array.isArray(department.description)) {
            const index = ArrayHelper.findItemByProp(department.description, 'languageID', lang);
            if (index !== false) {
              return department.description[index].name;
            }
          }
        }
      });
      let temp = await Promise.all(departmentPromises);
      temp.map((item) => !!item);
      expert.departments = temp;
      delete expert.categories;
      return expert;
    }
  });
  return Promise.all(expertPromises);
}

export async function appendSkillsToExperts(selectedExperts, lang) {
  let expertPromises = selectedExperts.map(async expert => {
    expert.tagSkills = [];
    if (Array.isArray(expert.skills)) {
      const skillObjectId = expert.skills.map(skill => mongoose.Types.ObjectId(skill));
      const skillDataArr = await Skill.find({_id: {$in: skillObjectId}}, 'description');
      let temp = [];
      if (skillDataArr) {
        const chosenSkills = ArrayHelper.selectRandomEleNoDup(skillDataArr, config.skillLimit);
        temp = chosenSkills.map(skillData => {
          if (skillData.description) {
            const index = ArrayHelper.findItemByProp(skillData.description, 'languageID', lang);
            if (index !== false) {
              return skillData.description[index].name;
            }
          }
        })
      }
      expert.tagSkills = temp.filter(item => !!item) || [];
      delete expert.skills;
      return expert;
    }
  });
  return Promise.all(expertPromises);
}
export async function getExpertTotal(queryParams = {}) {
  let generalQuery = {
    active: 1,
    expert: 1,
    avatar: {
      $exists: true, $nin: ['']
    },
    aboutUs: {
      $exists: true, $nin: ['', '<p></p>', '<p></p>\n', '<p></p>\\n']
    },
    // $or: [{avatar: {$exists: false}}, { aboutUs: {$in: ['']} }, { aboutUs: {$exists: false}}, { avatar: {$in: ['']} }]
  };
  if(JSON.stringify(queryParams) !== '{}') {
    // filter by language support
    if (queryParams.la && queryParams.la !== 'A-L') {
      generalQuery['languageSupport'] = {$not: {$elemMatch: {langCode: {$ne: queryParams.la}}}}
    }
    // filter by country
    if (queryParams.co && queryParams.co !== 'A-C') {
      generalQuery['country.ISO2'] = queryParams.co
    }

    // filter by online status
    if (queryParams.st) {
      if (queryParams.st == 1) {
        generalQuery['online'] = {$in: [1, 2]}
      } else {
        generalQuery['online'] = 0
      }
    }
  }
  return await User.count(generalQuery).exec();
}
export async function getExpertWithType(data, type, countryCode = '', lang, queryParams = {}) {
  const queryWhat = '_id cuid fullName avatar firstName ' +
    'lastName userName priceCall priceChat rate expert online country categories ' +
    'skills serviceTotalRate serviceRating';
  const filter = {
    limit: JSON.stringify(queryParams) !== '{}' ? config.numExpertsPerPage : config.expertLimit,
    skip: JSON.stringify(queryParams) !== '{}' ? (queryParams.page - 1) * config.numExpertsPerPage : 0,
  };
  let query;
  let generalQuery = {
    active: 1,
    expert: 1,
    _id: {
      $nin: [
        mongoose.Types.ObjectId(config.supportAccounts.tesseSupport._id),
        mongoose.Types.ObjectId(config.supportAccounts.customerSupport._id),
        mongoose.Types.ObjectId(config.chloeAccount),
      ]
    },
    email: {
      $ne: config.chloeEmail
    },
    avatar: {
      $exists: true, $nin: ['']
    },
    aboutUs: {
      $exists: true, $nin: ['', '<p></p>', '<p></p>\n', '<p></p>\\n']
    }
  };
  let order = queryParams.order || 'desc';
  let sortOptions = {rate: order};

  if (type === 'globalExperts') {

    sortOptions = Object.assign({online: order, avgSkillRate: order}, sortOptions);
    filter.sort = sortOptions;
    query = {...generalQuery,'languageSupport': {$not: {$elemMatch: {langCode: {$ne:'en'}}}}};
  } else if (type === 'expertsByCountry') {

    sortOptions = Object.assign({online: order, avgSkillRate: order}, sortOptions);
    filter.sort = sortOptions;
    query = {...generalQuery, 'country.ISO2': countryCode};
  } else if(JSON.stringify(queryParams) !== '{}'){
    // filter by language support
    if (queryParams.la && queryParams.la !== 'A-L') {
      generalQuery['languageSupport'] = {$not: {$elemMatch: {langCode: {$ne:queryParams.la}}}}
    }

    // filter by country
    if (queryParams.co && queryParams.co !== 'A-C') {
      generalQuery['country.ISO2'] = queryParams.co
    }

    // filter by online status
    if (queryParams.st) {
      if(queryParams.st == 1){
        generalQuery['online'] = {$in: [1,2]}
      } else {
        generalQuery['online'] = 0
      }
    }
    switch (parseInt(queryParams.sort)) {
      case 1:
        //sortOptions = Object.assign({online: order, serviceRating: order}, sortOptions);
        sortOptions = Object.assign({online: order, avgSkillRate: order}, sortOptions);
        filter.sort = sortOptions;
        break;
      case 2:
        sortOptions = Object.assign({online: order, priceCall: order}, sortOptions);
        filter.sort = sortOptions;
        break;
      case 3:
        sortOptions = Object.assign({online: order, priceChat: order}, sortOptions);
        filter.sort = sortOptions;
        break;
      default:
        sortOptions = Object.assign({online: order, avgSkillRate: order}, sortOptions);
        filter.sort = sortOptions;
    }
    query = {...generalQuery};
  } else {
    query = {...generalQuery};
  }
  let experts = await getExperts(
    query,
    queryWhat,
    filter
  );
  if (experts instanceof Array && experts.length > 0) {
    let selectedExperts;
    let expertsOnline = experts.filter(exp => !!exp.online); //get expert online
    let expertsOffline = experts.filter(exp => !exp.online); //get expert offline
    if (expertsOnline.length >= config.numToRandom) {
      selectedExperts = ArrayHelper.selectRandomEleNoDup(expertsOnline, config.numToRandom);
    } else {
      let randOfflineExperts = ArrayHelper.selectRandomEleNoDup(expertsOffline, config.numToRandom - expertsOnline.length);
      if (!randOfflineExperts instanceof Array) {
        randOfflineExperts = [randOfflineExperts];
      }
      selectedExperts = expertsOnline.concat(randOfflineExperts);
    }
    let appendAvatarPromises = selectedExperts.map(async exp => {
      if (exp.avatar) {
        const data = {
          src: exp.avatar,
          size: 150
        };
        exp.avatar = await cacheImage(data);
      }
      return exp;
    });
    await Promise.all([
      appendAvatarPromises,
      appendDepartmentToExperts(selectedExperts, lang),
      appendSkillsToExperts(selectedExperts, lang)
    ]);
    data = selectedExperts;
    return data;
  }
}

export async function getExpertInnotek(limit, lang) {
  const queryWhat = '_id cuid fullName avatar firstName ' +
    'lastName userName priceCall priceChat rate expert online country categories ' +
    'skills serviceTotalRate serviceRating';
  const filter = {
    limit: limit ? limit : 500,
    skip: 0,
  };
  let query;
  let generalQuery = {
    active: 1,
    expert: 1,
    _id: {
      $in: config.innotek
    },
  };
  let order = 'desc';
  let sortOptions = {rate: order};

  sortOptions = Object.assign({online: order, avgSkillRate: order}, sortOptions);
  filter.sort = sortOptions;
  query = generalQuery;
  let experts = await getExperts(
    query,
    queryWhat,
    filter
  );
  if (experts instanceof Array && experts.length > 0) {
    let selectedExperts;
    let expertsOnline = experts.filter(exp => !!exp.online); //get expert online
    let expertsOffline = experts.filter(exp => !exp.online); //get expert offline
    selectedExperts =  expertsOnline.concat(expertsOffline);
    let appendAvatarPromises = selectedExperts.map(async exp => {
      if (exp.avatar) {
        const data = {
          src: exp.avatar,
          size: 150
        };
        exp.avatar = await cacheImage(data);
      }
      return exp;
    });
    await Promise.all([
      appendAvatarPromises,
      appendDepartmentToExperts(selectedExperts, lang),
      appendSkillsToExperts(selectedExperts, lang)
    ]);
    return selectedExperts;
  }
}


export async function getSuggestedExpertsBySlugServiceV2(options) {
  try {
    /**
     * Find Skill By Category
     * */
    let category = await Category.findOne({"description.slug": options.slug.trim()}).lean();
    if (!category) {
      return Promise.reject({status: 400, success: false, error: "Category Not Found."})
    }
    let cateIds = [];
    if (!category.parent) {
      let Categorys = await Category.find({parent: category.cuid}).exec();
      cateIds = Categorys.map(cateItem => {
        return cateItem.cuid;
      });
    } else {
      cateIds.push(category.cuid);
    }
    let skills = await Skill.find({categoryID: {$in: cateIds}}).lean();
    let listSkill = skills.map(skill => {
      let lang = options.langCode === 'vi' ? 'vi' : 'en';
      let name = skill.description.filter(des => {
        return des.languageID === lang;
      });
      return {
        categoryID: skill.categoryID,
        _id: skill._id,
        name: name.length ? name[0].name : skill.description[0].name
      }
    });
    let data = await getUserBySkills(listSkill, options);
    let count = data[0];
    data = await getMetaDataExpert(data[1], options.langCode, listSkill, cateIds,  category.cuid);
    return [count, data]
  } catch (err) {
    console.log('error getSuggestedExpertsBySlugServiceV2 : ', err);
    return Promise.reject({status: 500, success: false, error:'Internal Server Error.'})
  }
}

export async function getMetaDataExpert(data, langCode = 'vi', listSkill = null, listCategory = null, categoryMain = null) {
  try {
    let lang = langCode === 'vi' ? 'vi' : 'en';
    let promise = data.map(async e => {
      let skills;
      /***
       * return skill of user
       */
      if(listSkill){
        let skills_user = e.skills;
        skills_user = skills_user.map(sklu => sklu.toString());
        skills = listSkill.filter(skill => {
          return skills_user.indexOf(skill._id.toString()) !== -1;
        });
        let skills_length = skills.length;
        if(skills_length < TAG_SKILLS_LENGTH){
          if(e.skills.length < TAG_SKILLS_LENGTH){
            skills = await Skill.find({_id:{$in: e.skills}}).lean();
            skills = skills.map(skill => {
              let name = skill.description.filter(des => {
                return des.languageID === lang
              });
              return {
                categoryID: skill.categoryID,
                _id: skill._id,
                name: name.length ? name[0].name : skill.description[0].name
              }
            })
          } else {
            let listSkillOther = e.skills.filter(skill => {
              return skills.indexOf(skill) === -1
            });
            if(listSkillOther.length > TAG_SKILLS_LENGTH - skills_length){
              listSkillOther = listSkillOther.splice(0, TAG_SKILLS_LENGTH - skills_length);
            }
            listSkillOther = await Skill.find({_id: {$in: listSkillOther}}).lean();
            listSkillOther.map(skill => {
              let name = skill.description.filter(des => {
                return des.languageID === lang;
              });
              skills.push({
                categoryID: skill.categoryID,
                _id: skill._id,
                name: name.length ? name[0].name : skill.description[0].name
              })
            })
          }
        } else {
          skills = skills.splice(0, 6)
        }
        e.tagSkills = skills.map(skill => skill.name);
        e.match_skills = skills.length;
      }
      /**
       * return category of user
       * */
      if(listCategory){
        let categories;
        if(listCategory.length ===  1){
          categories = await Category.findOne({cuid: listCategory[0]  }).lean();
        } else {
          let index = ArrayHelper.findItemByProp(skills, 'categoryID', categoryMain);
          if(index !== false){
            categories = await Category.findOne({cuid: categoryMain}).lean();
          } else {
            for(let i = 0; i < skills.length; i++){
              if(listCategory.indexOf(skills[i].categoryID) !== -1){
                categories = await Category.findOne({cuid: skills[i].categoryID}).lean();
                break;
              }
            }
          }
        }
        let name = categories.description.filter(des => {
          return des.languageID === lang;
        });
        name = name.length ? name[0].name : categories.description[0].name;
        e.departments = [name];
      }
      return e;
    });
    return await Promise.all(promise);
  } catch (err) {
    console.log('error getMetaDataExpert : ', err);
    throw {
      success: false,
      status: 500,
      error: 'Internal Server Error.'
    }
  }
}
export async function getUserBySkills(skills, options) {
  try {
    let skillIds = skills.map(e => e._id);
    let fields = [
      'cuid', 'fullName', 'avatar', 'rate', 'country', 'userName', 'skills', 'languageSupport',
      'serviceRating', 'serviceTotalRate', 'priceChat', 'priceCall', 'reviews'
    ].join(' ');
    let conditions = {
        expert: 1,
        active: 1,
        cuid: {
          $nin: ['cj0dl08pn0015kk7myjy7mz2y', 'cj0dij2y2000ekk7mxmhbhwy6']
        }
    };
    if(options.text) {
      conditions["$or"] = [
        {
          skills: {
            $in: skillIds
          },
        },
        {fullName: { $regex: options.text.trim(), $options: "$i" }}
      ]
    } else {
      conditions.skills = {
        $in: skillIds
      }
    }
    if(options.langCode !== 'vi'){
      conditions['languageSupport.langCode'] = options.langCode
    }
    if(options.supportLanguage) {
      conditions['languageSupport.langCode'] = options.supportLanguage
    }
    if(options.country) {
      conditions['country.ISO2'] = options.country.toUpperCase();
    }
    let data, count;
    if(options.status){
      conditions.online = parseInt(options.status);
      data = await User.find(conditions, fields).skip(options.skip).limit(options.limit).sort({rate: -1}).lean();
      count = await User.count(conditions);
    } else {
      data = await User.find(conditions, fields).skip(options.skip).limit(options.limit).sort({online: -1, rate: -1}).lean();
      count = await User.count(conditions);
    }
    return [count, data]
  }catch (err) {
    console.log('error getUserBySkills : ', err);
    throw {
      status: 500, success: false, error: 'Internal Server Error'
    }
  }
}
