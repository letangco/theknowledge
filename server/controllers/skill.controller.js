import Skill from '../models/skill.js';
import {getCategoriesByParentIDCallBack} from '../controllers/category.controller';
import {addInterestSkills} from '../controllers/user.controller';
import {findSkillsInQueryString} from '../controllers/expert.controller';
import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';
import cuid from 'cuid';
import Category from '../models/category.js';
import User from '../models/user';
import ArrayHelper from '../util/ArrayHelper';
import mem_cache from 'memory-cache';
import { formatCategoryByLanguage } from './category.controller';
import logger from '../util/log';

const THIRTY_MINUTES = 1800000;

export function getSkillByCategoryID(req, res) {
  var catID = sanitizeHtml(req.params.catID);
  var languageID = sanitizeHtml(req.params.languageID);
  Skill.find({categoryID: catID}).exec((err, skills) => {
    if (err) {
      res.status(500).send(err);
    }
    var listSkill = skills.map((obj) => {
      let index = ArrayHelper.findItemByProp(obj.description, 'languageID', languageID);
      console.log('catID:', catID);
      console.log('languageID:', languageID);
      console.log('index:', index);
      if (index !== false) {
        return {
          _id: obj._id.toString(),
          name: obj.description[index].name
        }
      }
//            obj.description.map((desObj) => {
//                if(desObj.languageID == languageID){
//                    listSkill.push(desObj.name);
//                }
//            });
    });
    res.json({listSkill});
  });
}

export async function getAllSkill(req, res) {
  let cached = mem_cache.get('getAllSkill');
  if (cached) {
    return res.json({listSkill: cached});
  }

  let skills = await Skill.find({view: true}).exec();
  let promises = skills.map(async skill => {
    let department = await Category.findOne({cuid: skill.categoryID});
    return {
      _id: skill._id,
      name: skill.description[0].name,
      department: department.title,
      name_view: skill.description[0].name.toUpperCase() + ' `' + department.title + '`'
    };
  });
  skills = await Promise.all(promises);
  mem_cache.put('getAllSkill', skills, THIRTY_MINUTES, (key, val) => {
    console.log('cache all skills done in 30 min');
  });
  return res.json({listSkill: skills});
//    Skill.find({}).exec(async (err, skills) => {
//        if(err){
//            res.status(500).send(err);
//        }
//        var listSkill = skills.map(async (obj) => {
//          return {
//            _id: obj._id,
//            name: obj.description[0].name
//          }
//        });
//        res.json({listSkill});
//    });
}

export async function getAllSkillKnowLedge(req, res) {
  try {
    // let promises = [];
    let skills = await Skill.find({}).sort({tagged: -1}).limit(50);
    skills = formatSkillByLanguage(skills, req.headers.lang);
    // let skills = results[0];
    let mappers = {};
    // skills = JSON.parse(JSON.stringify(skills));
    let promises2 = skills.map(async skill => {
      if (!mappers[skill.categoryID]) {
        let cate = await Category.findOne({cuid: skill.categoryID}, 'description');
        cate = formatCategoryByLanguage([cate], req.headers.lang);
        mappers[skill.categoryID] = cate[0].title;
      }
      return {
        _id: skill._id,
        name: skill.description[0].name,
        department: mappers[skill.categoryID]
      };
    });
    skills = await Promise.all(promises2);

    res.json({success: true, data: skills});
  } catch (ex) {
    console.log('err on getSkillByCatCuids:', ex);
    res.json({success: false, data: ex});
  }
}

export async function getAllSkillByTextSearch(req, res) {
  try {
    let qs = req.params.textSearch.replace(/\+/g, " ");
    let skills = await findSkillsInQueryString(qs, null, req.headers.lang);
    skills = skills.map(skill => {
      return {
        _id: skill.id,
        name: skill.name,
        department: skill.cateName,
        score: skill.name.toLowerCase() === qs.toLowerCase() ? 1 : 0
      };
    });
    skills = ArrayHelper.sortByProp(skills, 'score', 'desc');
    return res.json({success: true, data: skills});
    // let promises = [Skill.aggregate(
    //   [
    //       { $unwind : "$description" },
    //       {$match:
    //       {$and:[
    //           {'description.name': {$regex : new RegExp('\\b'+req.params.textSearch.split("+").pop().trim(), "gi") }}
    //       ]}
    //       },
    //       { $sort : { name : 1 } },
    //       {$skip: 0},
    //       {$limit: 20}
    //   ]
    // )];
    // let results = await Promise.all(promises);
    // let skills = results[0];
    // let mappers = {};
    // skills = JSON.parse(JSON.stringify(skills));
    // let promises2 = skills.map(async skill => {
    //     let cate = await Category.findOne({cuid: skill.categoryID});
    //     if(cate && cate.cuid){
    //         return{
    //             _id: skill._id,
    //             name: skill.description.name,
    //             department: cate.title
    //         }
    //     } else {
    //         return{
    //             _id: skill._id,
    //             name: skill.description.name
    //         }
    //     }
    // });
    // skills = await Promise.all(promises2);
    //
    // res.json({success: true, data: skills});
  } catch (ex) {
    console.log('err on getSkillByCatCuids:', ex);
    res.json({success: false, data: ex});
  }
}

// export function getSkillsByTextSearch(req, res) {
//   let query = [];
//
//   if (typeof req.params.catID !== 'undefined' && req.params.catID != '' && req.params.catID != 0) {
//     let str = "";
//     let temp = decodeURIComponent(req.params.textSearch.replace(/\+/g, "%20")).split(/[ ,]+/);
//     for (let i = 0; i < temp.length; i++) {
//       str += temp[i];
//       if (i != temp.length - 1) str += "|";
//     }
//     Category.findOne({_id: req.params.catID}).exec((err, catInfo) => {
//       if (err) {
//         res.status(500).send(err);
//       } else {
//         getCategory(catInfo.cuid).then((categories) => {
//           mongoose.connection.db.eval("getSuggest('" + req.params.textSearch.split("+").pop().trim() + "','" + categories + "')", function (err, result) {
//             if (err) {
//               console.log(err);
//             } else {
//               var listSkill = [];
//               if (result) {
//                 result.map((obj) => {
//                   if (typeof obj.name !== 'undefined') {
//                     listSkill.push(obj.name);
//                   }
//                   if (typeof obj.title !== 'undefined') {
//                     listSkill.push(obj.title);
//                   }
//                 });
//               }
//               res.json({listSkill});
//             }
//           });
//         });
//       }
//     });
//   } else {
//     mongoose.connection.db.eval("getSuggestForAll('" + req.params.textSearch.split("+").pop().trim() + "')", function (err, result) {
//       if (err) {
//         console.log(err);
//       } else {
//         var listSkill = [];
//         if (result) {
//           result.map((obj) => {
//             if (typeof obj.name !== 'undefined') {
//               listSkill.push(obj.name);
//             }
//             if (typeof obj.title !== 'undefined') {
//               listSkill.push(obj.title);
//             }
//           });
//         }
//         res.json({listSkill});
//       }
//     });
//   }
//
// }
//
// function getCategory(parentID) {
//   return new Promise((resolve) => {
//     getCategoriesByParentIDCallBack(parentID, (categories) => {
//       resolve(categories);
//     });
//   });
// }


/////////////////////////////////////////    PAGE ADMIN   //////////////////////////////////
export async function addSkill(req, res) {
  try {
    let skillData = req.body;
    const skillExisted = await Skill.findOne({
      categoryID: skillData.categoryID,
      'description.name': skillData.description[0].name,
      'description.languageID': skillData.description[0].languageID
    });
    if (!skillExisted) {
      //Skill not exists.
      if (!skillData.cuid) {
        // Add new
        const skill = await Skill.create({
          categoryID: skillData.categoryID,
          description: skillData.description,
          userID: skillData.userID,
        });
        return res.json({
          success: true,
          payload: skill,
        });
      } else {
        // Update
        await Skill.update({ cuid: skillData.cuid }, {
          $set: {
            categoryID: skillData.categoryID,
            description: skillData.description,
            userID: skillData.userID,
          }
        });
        return res.json({
          success: true,
          payload: skillData,
        });
      }
    } else {
      // Skill already exists
      return res.status(403).json([
        {
          msg: 'Skill already exists',
          param: 'skillExisted',
        },
      ]);
    }
  } catch (error) {
    logger.error('Admin addSkill error:', error);
    res.status(500).json('Internal server error');
  }
}

export function getSkillByCategoryIDAdmin(req, res) {
  var catID = sanitizeHtml(req.params.catID);
  var languageID = sanitizeHtml(req.params.languageID);
  var result = {
    key: -10,
    message: '',
    data: null
  };
  Skill.find({categoryID: catID}).exec((err, skills) => {
    if (err) {
      result.message = 'System error.';
      res.json({result});
      return false
    } else {
      var listSkill = {
        listName: [],
        listFull: []
      };
      skills.map((obj) => {
        obj.description.map((desObj) => {
          if (desObj.languageID == languageID) {
            listSkill.listName.push(desObj.name);
            listSkill.listFull.push({cuid: obj.cuid, name: desObj.name});
          }
        });
      });
      result.key = 1;
      result.message = 'Success';
      result.data = listSkill;
      res.json({result});
    }
  });
}

export function importSkill(req, res) {
  var listSkill = req.body.listSkill;
  var userID = req.body.userID;
  var industry = req.body.industry;
  var languageID = req.body.languageID;
  var result = {
    key: -10,
    message: '',
    data: []
  };
  var errorLines = [];

  if (typeof listSkill !== 'undefined' && listSkill.length > 0) {
    var allLog = [];
    var length = listSkill.length;
    Promise.all(listSkill.map((item, index) => {
      //insert skill by department.
      //check department exist?
      return new Promise((resolve) => {
        Category.findOne({parent: industry, title: item.department}).exec((err, dept) => {
          //var arrayLog = [];
          if (err) {
            resolve(`Find department[${item.department}] error.`);
          } else {
            if (dept === null) {
              resolve(`Department[${item.department}] not found.`);
            } else {
              //Check & Insert skill
              //var department = index;
              Promise.all(item.skills.map((skill, index) => {
                //Insert skill.
                return (insertSkill(dept.cuid, skill, userID, languageID, index));
              })).then((data) => {
                //arrayLog.push(data);
                resolve(data);
              });
            }
          }
          //console.log('All promise: ', arrayLog);
          //resolve(arrayLog);
          length--;
        })
      });
    })).then((data) => {
      //allLog = allLog.concat(data);
      if (length == 0) {
        result.key = 1;
        result.message = 'Success';
        result.data = data;
        res.json({result});
      }
    });

  } else {
    result.key = -5;
    result.message = 'Data empty.';
    res.json({result});
  }
}

function insertSkill(categoryID, skill, userID, languageID, index) {
  return new Promise((resolve) => {
    if (skill == '') {
      resolve(`Skill[${index}] in department[${categoryID}] is empty.`);
    } else {
      Skill.findOne({
        categoryID: categoryID,
        'description.name': skill,
        'description.languageID': languageID
      }).exec((err, skillDB) => {
        if (err) {
          resolve(`Find skill[${skill}] in department[${categoryID}] error`);
        } else {
          if (skillDB === null) {
            //insert
            var skillInsert = new Skill({
              categoryID: categoryID,
              description: [{languageID: languageID, name: skill}],
              cuid: cuid(),
              userID: userID
            });
            skillInsert.save((err) => {
              if (err) {
                resolve(`Insert skill[${skill}] in department[${categoryID}] error.`);
              } else {
                resolve(`Insert skill[${skill}] in department [${categoryID}] success.`);
              }
            });
          } else {
            resolve(`Skill[${index}] in department[${skillDB.categoryID}] already exist.`);
            //console.log(`Skill[${index}] in department[${department}] already exist.`);
          }
        }
      });
    }

  });
}

export function deleteSkill(req, res) {
  var skillID = req.body.skillID;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  Skill.remove({cuid: skillID}).exec((err) => {
    if (err) {
      result.key = -2;
      result.message = 'System error.';
      res.json({result});
    } else {
      result.key = 1;
      result.message = 'Success.';
      res.json({result});
    }
  });
}

export function removeSkillByCategoryID(categoryID) {
  return new Promise((resolve) => {
    Skill.remove({categoryID: categoryID}).exec((err) => {
      if (err) {
        resolve(`Remove skill by category[${categoryID}] error.`);
      } else {
        resolve(`Remove skill by category [${categoryID}] success.`);
      }
    });
  });
}

//////////////////////////////////////////////////////// END PAGE ADMIN ////////////////////////////////////

//========== FEED ==============
export async function getSkillByCatCuids(req, res) {
  let langCode = req.headers.lang || req.params.lang || 'en';
  let catCuids = req.body.catCuids || [];
  try {
    let promises = [Skill.find({categoryID: {$in: catCuids}}, '-interester -owners -knowledges -questions').sort({'description.name': 1}).lean()];
    if (req.headers && req.headers.token) {
      promises.push(User.findOne({token: req.headers.token}, 'skills interested_departments'));
    }
    let results = await Promise.all(promises);

    let skills = results[0], user = results[1];
    let existSkills = [];
    if (user) {
      existSkills = JSON.parse(JSON.stringify(user.skills));
      user.interested_departments = catCuids;
      user.markModified('interested_departments');
      await user.save();
    }

    skills = formatSkillByLanguage(skills, langCode);
    // let existSkills = results[1] ? JSON.parse(JSON.stringify(results[1].skills)) : [];

    let mappers = {};
    // skills = JSON.parse(JSON.stringify(skills));
    let promises2 = skills.map(async skill => {
      if (!mappers.hasOwnProperty(skill.categoryID)) {
        let cate = await Category.findOne({cuid: skill.categoryID}, 'title');
        mappers[skill.categoryID] = cate.title;
      }
      skill.department = mappers[skill.categoryID];
      skill.isExist = existSkills.indexOf(skill._id) >= 0;
      return skill;
    });
    skills = await Promise.all(promises2);

    res.json({success: true, data: skills});
  } catch (ex) {
    console.log('err on getSkillByCatCuids:', ex);
    res.json({success: false, data: ex});
  }
}

function pushUserToSkillOwner(skillId, userId) {
  return Skill.update({_id: skillId}, {$push: {interester: userId}});
}

function addInteresterForSkill(skillIds, userId) {
  let promise = [];
  skillIds.map(function (skillId) {
    promise.push(pushUserToSkillOwner(skillId, userId));
  });
  return Promise.all(promise);
}

export async function saveSkillForFeed(req, res) {
  let userId = req.user._id;
  let skillIds = req.body.skillIds || [];
  try {
    let skillResult = await addInteresterForSkill(skillIds, userId);
    let userResult = await addInterestSkills(userId, skillIds);

    let feedOptions = {
      skillIds: skillIds,
      owner: req.user._id
    };
    Skill.createFeeds(Skill, feedOptions);

    res.json({success: true, data: {skillResult, userResult}});
  } catch (ex) {
    res.json({success: false, data: ex});
  }
}

//========== END FEED ==============

export function formatSkillByLanguage(skills, langCode) {
  return skills.map(skill => {
    let langIndex = ArrayHelper.findItemByProp(skill.description, 'languageID', langCode);
    skill.description = skill.description[langIndex || 0];

    // console.log('skill:', skill);
    return skill;
  });
}

//////////////////////////// New admin ///////////////

const SKILLS_PER_PAGE = 30;
const field = 'cuid description dateAdded categoryID';

async function appendDepartment(skills) {
  const realSkill = skills.slice(0);
  let promises = realSkill.map(async skill => {
    let department = await Category.findOne({cuid: skill.categoryID}, 'title cuid');
    if (department) {
      skill.department = department;
    }
    return skill;
  });
  return Promise.all(promises);
}

export async function getAllSkillAdmin(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * SKILLS_PER_PAGE;
    const limit = skip + SKILLS_PER_PAGE;
    let bigPromises = [
      Skill.count(),
      Skill.find({}, field).skip(skip).limit(limit).sort({dateAdded: -1}).lean()
    ];
    let [total_items, skills] = await Promise.all(bigPromises);
    if (!skills) {
      skills = [];
    }
    let appendedSkills = await appendDepartment(skills);
    res.json({
      total_items,
      success: true,
      current_page: page,
      last_page: Math.ceil(total_items / SKILLS_PER_PAGE),
      data: appendedSkills
    });
  } catch (err) {
    console.log('err in get all skill admin', err);
    res.status(500).json({
      success: false,
      error: 'Internal error'
    });
  }
}

export async function updateSkill(req, res) {
  try {
    const {body} = req;
    const _id = sanitizeHtml(body._id).trim();
    const enTitle = sanitizeHtml(body.enTitle).trim();
    const viTitle = sanitizeHtml(body.viTitle).trim();
    const idValid = mongoose.Types.ObjectId.isValid(_id);
    const admin = req.user;
    if (idValid && enTitle && viTitle) {
      const updatedSkill = await Skill.findOneAndUpdate(
        {_id: mongoose.Types.ObjectId(_id)},
        {
          $set: {
            modifiedBy: mongoose.Types.ObjectId(admin._id),
            dateModified: Date.now(),
            'description.0': {
              name: enTitle,
              languageID: 'en'
            },
            'description.1': {
              name: viTitle,
              languageID: 'vi'
            }
          }
        },
        {
          new: true
        }
      ).lean();
      if (updatedSkill) {
        delete updatedSkill.interester;
        delete updatedSkill.owners;
        const appendedUpdatedSkills = await appendDepartment([updatedSkill]);
        res.json({
          success: true,
          data: appendedUpdatedSkills[0]
        });
      } else {
        res.json({
          success: false,
          error: 'Error updating skills'
        });
      }
    } else {
      return res.json({
        success: false,
        error: 'Missing property'
      });
    }
  } catch (err) {
    console.log('err in update skills', err);
    res.status(500).json({
      success: false,
      error: 'Internal error'
    })
  }
}

export async function searchSkills(req, res) {
  try {
    const text = decodeURIComponent(sanitizeHtml(req.params.text));
    //const uppercasedText = upperCaseFirstLetter(text);
    const condition = {
      'description.name': {$regex: `${text}`, $options: 'i'}
    };

    let skills = await Skill.find(
      condition,
      field
    ).limit(SKILLS_PER_PAGE).sort({dateAdded: -1}).lean();

    if (!skills) {
      skills = [];
    }

    const appendedSkills = await appendDepartment(skills);

    return res.json({
      success: true,
      data: appendedSkills,
      current_page: 1,
      last_page: 1,
      total_items: appendedSkills.length
    })
  } catch (err) {
    console.log('err in search skill', err);
    res.status(500).json({success: false})
  }
}
