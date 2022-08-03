import SuggestSkill from '../models/suggestSkill.js';
import Skill from '../models/skill.js';
import User from '../models/user.js';
import StringHelper from '../util/StringHelper';
import ArrayHelper from '../util/ArrayHelper';
import sanitizeHtml from 'sanitize-html';
import {addNotification} from './notification.controller.js';
import cuid from 'cuid';
import mongoose from 'mongoose';
import globalConstants from '../../config/globalConstants';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import mem_cache from 'memory-cache';

const NEW_SKILL_PER_PAGE = 30;

export function addNew(req, res){
    const newSuggestSkill = new SuggestSkill(req.body.suggestSkill);

    // Let's sanitize inputs
    //newSuggestSkill.industryID = sanitizeHtml(newSuggestSkill.industryID);
    //newSuggestSkill.departmentID = sanitizeHtml(newSuggestSkill.departmentID);
    //newSuggestSkill.skill = sanitizeHtml(newSuggestSkill.skill);
    //newSuggestSkill.description = sanitizeHtml(newSuggestSkill.description);
    //newSuggestSkill.link = sanitizeHtml(newSuggestSkill.link);
    //newSuggestSkill.userID = sanitizeHtml(newSuggestSkill.userID);
    newSuggestSkill.cuid = cuid();

    newSuggestSkill.save((err, saved) => {
        if (err) {
            res.status(500).send(err);
        }
        res.json({suggestSkill: saved});
    });
}

// export async function getList(req, res){
//     var skip = req.params.skip || 10;
//     var limit = req.params.limit || 10;
//
//     var result = {
//         key: -10,
//         message: '',
//         data: null
//     };
//     var query = `getSuggestSkill(${skip}, ${limit})`;
//     mongoose.connection.db.eval(query, (err, list) => {
//         if(err){
//             result.key = -2;
//             result.message = 'System error.';
//             console.log(err);
//             res.json({result});
//         }else{
//             result.key = 1;
//             result.message = 'Success';
//             result.data = list;
//             res.json({result});
//         }
//     });
// }

export async function adminGetList(req, res) {
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * NEW_SKILL_PER_PAGE;
  let fields = [
    'skill', 'departmentID', 'description', 'userID', 'dateAdded'
  ].join(' ');

  try{
    let results = await Promise.all([
      SuggestSkill.count().exec(),
      SuggestSkill.find({}, fields).skip(skip).limit(NEW_SKILL_PER_PAGE).exec()
    ]);

    let suggestSkillPromise = results[1].map(suggestSkill => SuggestSkill.getMetadata(suggestSkill));
    let suggeseSkills = await Promise.all(suggestSkillPromise);

    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(results[0] / NEW_SKILL_PER_PAGE),
      total_items: results[0],
      data: suggeseSkills
    });
  } catch (err) {
    console.log('err on adminGetListSuggestSkills:', err);
    return res.status(500).json(err);
  }
}

export async function adminRejectSuggestSkill(req, res) {
  let ids = [];
  if(req.body.ids) {
    ids = req.body.ids;
  } else if(req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide Suggest Skill's Id(s) to reject."
    });
  }

  let conditions = { _id: {$in: ids} };

  try {
    if(req.body.ids) {
      //ids = req.body.ids;
    } else if(req.body.id) {
      SuggestSkill.findById(req.body.id, (err, skill) => {
        let authorId = skill.userID;
        let content = skill.skill;
        User.findOne({'_id' : mongoose.Types.ObjectId(authorId)}).exec((err, userRec) => {
          if (err) {
            console.log('Don\'t find user to send notification: ', err);
          }
          if (userRec && userRec.cuid ) {
            var dataNotify = {
              to: userRec._id,
              type: 'adminRejectSuggestSkill',
              data: {
                content: content
              }
            };
            // addNotification(dataNotify);
            AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
          }
        });
      });
    }
    await SuggestSkill.remove(conditions).exec();
    return res.json({success: true});
  } catch (err) {
    console.log('err on adminRejectSuggestSkill:', err);
    return res.status(500).json(err);
  }
}

export async function adminApproveSuggestSkill(req, res) {
  let ids = [];
  if(req.body.ids) {
    ids = req.body.ids;
  } else if(req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide Suggest Skill's Id(s) to reject."
    });
  }

  try{
    let suggestSkills = await SuggestSkill.find({_id: {$in: ids}}).exec();
    let suggestSkillPromises = suggestSkills.map(async suggestSkill => {
      let authorId = suggestSkill.userID;
      let content = suggestSkill.skill;
      let promise = [];
      let skill = new Skill({
        categoryID: suggestSkill.departmentID,
        description: [{languageID: 'en', name: suggestSkill.skill}],
        cuid: suggestSkill.cuid
      });
      if (StringHelper.isObjectId(suggestSkill.userID)) {
        skill.owners = [suggestSkill.userID];
        promise.push(User.findById(suggestSkill.userID));
      }
      promise.push(skill.save());
      let results = await Promise.all(promise);

      let saved = null, user = null;
      if(results.length === 2) {
        user = results[0];
        saved = results[1];
      } else {
        saved = results[0];
      }

      let finalPromise = [SuggestSkill.remove({_id: suggestSkill._id})];
      if (user) {
        if (!user.skills) {
          user.skills = [saved._id];
        } else {
          user.skills.push(saved._id);
        }
        user.markModified('skills');

        let reviewIndex = ArrayHelper.findItemByProp(user.reviews, 'cateCuid', saved.categoryID);
        if(reviewIndex !== false) {
          user.reviews[reviewIndex].details.push({
            skillId: saved._id,
            skillName: saved.description[0].name,
            avgRate: 0
          });
        }
        user.markModified('reviews');

        finalPromise.push(user.save());


        let dataNotify = {
          to: user._id,
          type: 'adminApproveSuggestSkill',
          data: {
            content: content
          }
        };
        // addNotification(dataNotify);
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
      }
      // User.findOne({'_id' : mongoose.Types.ObjectId(authorId)}).exec((err, userRec) => {
      //   if (err) {
      //     console.log('Don\'t find user to send notification: ', err);
      //   }
      //   if (userRec && userRec.cuid ) {
      //     var dataNotify = {
      //       userID: userRec.cuid,
      //       type: 'adminApproveSuggestSkill',
      //       data: {
      //         content: content
      //       }
      //     };
      //     // addNotification(dataNotify);
      //     AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
      //   }
      // });
      return Promise.all(finalPromise);
    });
    await Promise.all(suggestSkillPromises);
    mem_cache.clear();
    return res.json({success: true});
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json(err);
  }
}

export async function getMySuggestSkills(req, res) {
  try {
    let departmentId = req.query.departmentId;
    let suggestions = await SuggestSkill.find({departmentID: departmentId, userID: req.user._id}, 'skill');
    return res.json({
      success: true,
      data: suggestions
    });
  } catch (err) {
    console.log('err on getMySuggestSkills');
    return res.json({success: false, error: 'Internal error.'});
  }
}
