/* global Promise */

import mongoose from 'mongoose';
import Notification from '../models/notificationNew';
import * as KnowledgeServices from '../services/knowledge.services';
import Knowledge from '../models/knowledge';
import Category from '../models/category';
import Skill from '../models/skill';
import User from '../models/user';
import UserEngagement from '../models/userEngagements';
import UserSearch from '../models/userSearch';
import KnowledgeUpvote from '../models/knowledgeUpvote';
import KnowledgeBookmark from '../models/knowledgeBookmark';
import KnowledgeView from '../models/knowledgeView';
import {getCommentsByKnowledgeId} from './comment.controller.js';
import Elasticsearch from '../libs/Elasticsearch';
import bodybuilder from 'bodybuilder';
import ArrayHelper from '../util/ArrayHelper';
import StringHelper from '../util/StringHelper';
import moment from 'moment';
import sanitizeHtml from 'sanitize-html';
//import {addNotification} from './notification.controller.js';
import cuid from 'cuid';
//import sh from 'shorthash';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
//import KnowledgeWorker from '../libs/Workers/KnowledgeWorker';
//import FeedWorker from '../libs/Workers/FeedWorker';
import {cacheImage} from '../libs/imageCache';
import validUrl from 'valid-url';

//const demoKnowledge = require('./test_knowledge.json');
import globalConstants from '../../config/globalConstants';

const ERROR = {
  INTERNAL: {error: 'Internal server error.'},
  ID_MISSING: {error: '"id" is required field.'},
  NOT_FOUND: {error: 'No knowledge found.'},
  PERMISSION: {error: 'Permission denied.'}
};
const KNOWLEDGE_PER_PAGE = 12;
const KNOWLEDGE_PER_PAGE_ADMIN = 30;
const USERS_PER_PAGE = 10;

async function afterSaved(knowledge, action, req, res, err, saved) {
  if (err) {
    console.log('err on', action, 'knowledge: ', err);
    return res.status(500).json(ERROR.INTERNAL);
  }
  try {
    switch (action) {
      case 'censor':
        Q.create(globalConstants.jobName.KLGE_SYNC_ELASTIC, {action: action, knowledge: saved})
          .priority('high').removeOnComplete(true).save();
        break;
      case 'update':
        if(saved.state === globalConstants.knowledgeState.PUBLISHED) {
          Q.create(globalConstants.jobName.KLGE_SYNC_ELASTIC, {action: action, knowledge: saved})
            .priority('high').removeOnComplete(true).save();
        }
        break;
    }


    let knowledgeClone = JSON.parse(JSON.stringify(saved));
    let userId = req.user._id.toString();
    let knowledgeRs = await convertToKnowledgeResult(knowledgeClone, userId);
//    knowledge.on('es-indexed', function (err, res) {
//      if (err) throw err;
//      /* Document is indexed */
//      console.log('knowledge is indexed');
//    });
    return res.json(knowledgeRs);
  } catch (err) {
    return res.status(500).json(ERROR.INTERNAL);
  }
}

export async function submit(req, res) {
  if (req.body.upVotes || req.body.downVotes) {
    return res.status(403).json({error: 'Dont hack my app, fucker!'});
  }
  if (!req.body.title || !req.body.content || !req.body.state) {
    return res.status(400).json({error: 'Please provide full required fields.'});
  }
  if (req.body.state !== globalConstants.knowledgeState.DRAFT && req.body.state !== globalConstants.knowledgeState.WAITING) {
    return res.status(400).json({error: 'Please provide a valid state.'});
  }
//  console.log(JSON.stringify(demoKnowledge));
  if (req.headers.token) {
    let user = await User.findOne({token: req.headers.token}, '_id').exec();
    let userId = user._id.toString();
    let knowledge = new Knowledge({
      title: req.body.title,
      departmentId: req.body.departmentId || 'ge',
      tags: req.body.tags,
      authorId: userId,
      state: req.body.state,
    });
    let content = JSON.parse(req.body.content);
    if(!Object.keys(content.entityMap).length || !('entityMap' in content)) {
      console.log('ko co entityMap ne');
      content['entityMap'] = {
        0: {a: ''}
      };
    }
    knowledge.content = content;
    let lang = StringHelper.detectLanguage(knowledge.title);
    knowledge.language = lang;
    knowledge.slug = await buildKnowledgeSlug(knowledge.title);
    knowledge.thumbnail = Knowledge.getKnowledgeThumbnails(knowledge);
    knowledge.description = Knowledge.getKnowledgeDescription(Knowledge, knowledge);

    knowledge.save(afterSaved.bind(this, knowledge, 'submit', req, res));
  } else {
    return res.status(403).json(ERROR.PERMISSION);
  }
}

async function buildKnowledgeSlug (title) {
    try {
        title = StringHelper.xoa_dau(StringHelper.standardize(title));
        title = title.replace(/[^a-zA-Z0-9\s]+/g, '');
        let simpleSlug = title.split(' ').join('-').toLowerCase();
        simpleSlug = simpleSlug.replace(/\//g, '-');
        let count = await Knowledge.count({slug: simpleSlug}).exec();
        if(!count) {
            return simpleSlug;
        }
        return simpleSlug + '-' + cuid.slug();
    } catch (err) {
        console.log('err on build slug:', err);
    }
}

export async function getMyKnowledges(req, res) {
  try {
    let userId = req.user._id.toString();
    let page = ~~req.query.page || 1;
    let skip = (page - 1) * KNOWLEDGE_PER_PAGE;
    let conditions = {
      authorId: userId
    };
    if (req.query.state) {
      if (req.query.state === 'waiting' || req.query.state === 'draft' || req.query.state === 'published') {
        conditions.state = req.query.state;
      }
    }
    let promises = [
      Knowledge.count(conditions).exec(),
      Knowledge.find(conditions).skip(skip).limit(KNOWLEDGE_PER_PAGE).sort({createdDate: -1}).exec()
    ];
    let results = await Promise.all(promises);
    let reqUserId = '';
    if (req.headers.token) {
      let user = await User.findOne({token: req.headers.token}, '_id').exec();
      reqUserId = user ? user._id.toString() : '';
    }
    let arrKnowledgePm = results[1].map(async knowledge => convertToKnowledgeResult(knowledge, reqUserId));
    let arrKnowledges = await Promise.all(arrKnowledgePm);
    return res.json({
      last_page: Math.ceil(results[0] / KNOWLEDGE_PER_PAGE),
      current_page: page,
      total_items: results[0],
      data: arrKnowledges
    });
  } catch (err) {
    console.log('err on getMyKnowledges:', err);
    return res.status(500).json(ERROR.INTERNAL);
  }
}

export async function getKnowledgesByUser(req, res) {
    try {
        let userId = req.params.userId;
        let user = await User.findById(userId);
        if(!user) {
            return res.status(404).json(ERROR.NOT_FOUND);
        }
        let page = ~~req.query.page || 1;
        let skip = (page - 1) * KNOWLEDGE_PER_PAGE;

        let conditions = {authorId: userId, state: globalConstants.knowledgeState.PUBLISHED};
        let promises = [
            Knowledge.count(conditions).exec(),
            Knowledge.find(conditions).skip(skip).limit(KNOWLEDGE_PER_PAGE).sort({createdDate: -1}).exec()
        ];
        Knowledge.find({authorId: userId, state: globalConstants.knowledgeState.PUBLISHED}).exec();
        let results = await Promise.all(promises);
        let reqUserId = '';
        if (req.headers.token) {
          let user = await User.findOne({token: req.headers.token}, '_id').exec();
          reqUserId = user ? user._id.toString() : '';
        }
        let arrKnowledgePm = results[1].map(async knowledge => convertToKnowledgeResult(knowledge, reqUserId));
        let arrKnowledges = await Promise.all(arrKnowledgePm);
        return res.json({
            last_page: Math.ceil(results[0] / KNOWLEDGE_PER_PAGE),
            current_page: page,
            total_items: results[0],
            data: arrKnowledges
        });
    } catch (err) {
        console.log('err on getKnowledgesByUser:', err);
        return res.status(500).json(ERROR.INTERNAL);
    }
};

export function getKnowledgeByIdOrSlug(req, res) {
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }
  let conditions = {state: 'published'};
  if (StringHelper.isObjectId(req.params.id)) {
    // if (StringHelper.isObjectId(req.params.id)) {
      conditions['_id'] = mongoose.Types.ObjectId(req.params.id);
    // } else {
    //   conditions = {'description.slug': req.params.id.toLowerCase()};
    // }
  } else {
    conditions = {slug: req.params.id.toLowerCase()};
  }
  Knowledge.findOne(conditions, {__v: false}, async(err, knowledge) => {
    if (err && err.name !== 'CastError') {
      return res.status(500).json(ERROR.INTERNAL);
    }
    if (!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    try {
      let userId = '', userRole = globalConstants.role.USER;
      if (req.headers.token) {
        let user = await User.findOne({token: req.headers.token}, '_id role').exec();
        if(user) {
          userId = user._id.toString();
          userRole = user.role;
        }
      }

      if (req.query.view) {
        let ip = req.headers['x-forwarded-for']
          || req.connection.remoteAddress
          || req.socket.remoteAddress;
//        console.log('ip:', ip);
        var today = moment().startOf('day');
        var tomorrow = moment(today).add(1, 'days');
//        console.log('today:', today);
//        console.log('tomorrow:', tomorrow);
        let isViewed = await KnowledgeView.count({
          knowledgeId: knowledge._id,
          ip: ip,
          viewDate: {
            $gte: today.toDate(),
            $lte: tomorrow.toDate()
          }
        }).exec();
//        console.log('isViewed:', isViewed);
        if (!isViewed && userId) {
          let knowledgeView = new KnowledgeView({
            knowledgeId: knowledge._id,
            user: userId,
            ip: ip
          });
          knowledgeView.save()
            .then(() => {
//              console.log('knowledgeView saved');
              knowledge.views++;
              knowledge.save().then(()=> {
//                console.log('increased view.');
              });
            })
            .catch(err => {
              console.log('err on save view:', err);
            });
        }
      }

      if (knowledge.state !== globalConstants.knowledgeState.PUBLISHED) {
        if (userId !== knowledge.authorId.toString() && userRole === globalConstants.role.USER) {
          return res.status(404).json(ERROR.NOT_FOUND);
        }
      }
      let knowledgeRs = await convertToKnowledgeResult(knowledge, userId);
//      console.log('knowledgeRs:', knowledgeRs);
      res.json(knowledgeRs);
    } catch (err) {
      console.log('err on getKnowledgeById:', err);
      return res.status(500).json(ERROR.INTERNAL);
    }
  });
}

export function getKnowledgeMetaByIdOrSlug(req, res) {
    let conditions = {};
    if (req.params.id.length === 24 || req.params.id.length === 12) {
      if (StringHelper.isObjectId(req.params.id)) {
        conditions['_id'] = mongoose.Types.ObjectId(req.params.id);
      } else {
        conditions = {slug: req.params.id.toLowerCase()};
      }
    } else {
      conditions = {slug: req.params.id.toLowerCase()};
    }
    Knowledge.findOne(conditions, {__v: false}, async(err, knowledge) => {
      if (err && err.name !== 'CastError') {
        return res.json({});
      }
      if (!knowledge) {
        return res.json({});
      }
      try {
        let tags = [];
        if(knowledge.tags){
          knowledge.tags.map(tag => {
            tags.push(tag.text);
          });
        }
        return res.json({
          title : knowledge.title,
          description : knowledge.description,
          tags : tags,
          type : 'article',
          thumbnails : knowledge.thumbnail,
        });
      } catch (err) {
        res.json({});
      }
    });
}
export async function getKnowledgeById(req, res) {
  if (req.params.id === 'search') {
    return searchKnowledges(req, res);
  }
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }
  Knowledge.findById(req.params.id, {__v: false}, async(err, knowledge) => {
    if (err && err.name !== 'CastError') {
      return res.status(500).json(ERROR.INTERNAL);
    }
    if (!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    try {
      if (req.query.view) {
        let ip = req.headers['x-forwarded-for']
          || req.connection.remoteAddress
          || req.socket.remoteAddress;
//        console.log('ip:', ip);
        var today = moment().startOf('day');
        var tomorrow = moment(today).add(1, 'days');
//        console.log('today:', today);
//        console.log('tomorrow:', tomorrow);
        let isViewed = await KnowledgeView.count({
          knowledgeId: knowledge._id,
          ip: ip,
          viewDate: {
            $gte: today.toDate(),
            $lte: tomorrow.toDate()
          }
        }).exec();
//        console.log('isViewed:', isViewed);
        if (!isViewed) {
          let knowledgeView = new KnowledgeView({
            knowledgeId: knowledge._id,
            ip: ip
          });
          knowledgeView.save()
            .then(() => {
              knowledge.views++;
              knowledge.save().then(()=> {
//                console.log('increased view.');
              });
            })
            .catch(err => {
              console.log('err on save view:', err);
            });
        }
      }

      let userId = '';
      if (req.headers.token) {
        let user = await User.findOne({token: req.headers.token}, '_id').exec();
        userId = user ? user._id.toString() : '';
      }
      let knowledgeRs = await convertToKnowledgeResult(knowledge, userId);
//      console.log('knowledgeRs:', knowledgeRs);
      res.json(knowledgeRs);
    } catch (err) {
      console.log('err on getKnowledgeById:', err);
      return res.status(500).json(ERROR.INTERNAL);
    }
  });
}
export async function getKnowledgeToUpdate(req, res) {
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }
  Knowledge.findById(req.params.id, {__v: false}, async(err, knowledge) => {
    if (err && err.name !== 'CastError') {
      return res.status(500).json(ERROR.INTERNAL);
    }
    if (!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }
    try {
      if (knowledge.authorId.toString() !== req.user._id.toString()) {
        return res.status(403).json(ERROR.PERMISSION);
      }
      let knowledgeRs = await convertToKnowledgeResult(knowledge, req.user._id.toString());
//      console.log('knowledgeRs:', knowledgeRs);
      res.json(knowledgeRs);
    } catch (err) {
      console.log('err on getKnowledgeById:', err);
      return res.status(500).json(ERROR.INTERNAL);
    }
  });
}

export async function getKnowledgesByCategory(req, res) {
  if(!req.query.cuid && !req.query.slug) {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }
  if(req.query.slug == 'undefined' || req.query.cuid == 'undefined') {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }
  let cateConditions = req.query.slug ? {'description.slug': req.query.slug} : {cuid: req.query.cuid};
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * KNOWLEDGE_PER_PAGE;

  try {
    let cate = await Category.findOne(cateConditions).exec();
    if(!cate) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    let cateIds = [];
    if(!cate.parent) {
      let arrCates = await Category.find({parent: cate.cuid}).exec();
      cateIds = arrCates.map(cateItem => {
        return cateItem._id.toString();
      });
    }
    cateIds.push(cate._id.toString());


    let conditions = {
      departmentId: {$in: cateIds},
      state: globalConstants.knowledgeState.PUBLISHED
    };
    let time = ~~ req.query.time || 0;
    if(time) {
      conditions.createdDate = {$gte: buildMongoDateRange(time)};
    }

    let sort = req.query.sort && req.query.sort === 'views' ? {views: -1} : {upVotes: -1, createdDate: -1};

    let promises = [
        Knowledge.count(conditions).exec(),
        Knowledge.find(conditions, {__v: false})
          .sort(sort)
          .skip(skip)
          .limit(KNOWLEDGE_PER_PAGE)
          .exec()
      ];
    let results = await Promise.all(promises);

    let total = results[0];
    let knowledges = results[1];

    let userId = '';
    if (req.headers.token) {
      let user = await User.findOne({token: req.headers.token}, '_id').exec();
      userId = user ? user._id.toString() : '';
    }

    let arrKnowledgePm = knowledges.map(async knowledge => convertToKnowledgeResult(knowledge, userId));
    let arrKnowledges = await Promise.all(arrKnowledgePm);
    if (req.query.sort && req.query.sort === 'comment') {
      arrKnowledges = ArrayHelper.sortByProp(arrKnowledges, 'commentCount', 'desc');
    }
    return res.json({
      last_page: Math.ceil(total / KNOWLEDGE_PER_PAGE),
      current_page: page,
      total_items: total,
      data: arrKnowledges
    });
  } catch (err) {
    console.log('err on getKnowledgesByCategory:', err);
    return res.status(500).json(ERROR.INTERNAL);
  }
}

function buildMongoDateRange(time) {
  let now = new Date();
  switch (time) {
    case 1:
      console.log('last hour');
      return new Date(now.setHours(now.getHours() - 1)).toISOString();
      break;
    case 2:
      console.log('last 24 hours');
      return new Date(now.setDate(now.getDate() - 1)).toISOString();
      break;
    case 3:
      console.log('last week');
      return new Date(now.setDate(now.getDate() - 7)).toISOString();
      break;
    case 4:
      console.log('last month');
      return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      break;
    case 5:
      console.log('last year');
      return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      break;
  }
}

export async function convertToKnowledgeResult(knowledge, userId, langCode) {
  try {
    if(knowledge) {
      let knowledgeRs = JSON.parse(JSON.stringify(knowledge));
      let metadata = await getKnowledgeMetaData(knowledge, userId, langCode);
      delete knowledgeRs.departmentId;
      knowledgeRs.department = metadata[0];
      delete knowledgeRs.authorId;
      knowledgeRs.author = metadata[1];
      knowledgeRs.commentCount = metadata[2];
      knowledgeRs.upvoted = metadata[3];
      knowledgeRs.bookMark = metadata[4];
      if(knowledgeRs.thumbnail && knowledgeRs.thumbnail[0]){
        if(!validUrl.isUri(knowledgeRs.thumbnail[0])){
          let data={
            src: knowledgeRs.thumbnail[0],
            size: 650
          }
          knowledgeRs.thumbnail[0] = await cacheImage(data);
        }
      }
      return knowledgeRs;
    }
  } catch (err) {
    throw err;
  }
}

export async function searchKnowledgesV2(req, res) {
  try {
    let page = ~~req.query.page || 1;
    let skip = (page - 1) * KNOWLEDGE_PER_PAGE;
    let esQueryBody = buildESQuery(req);
    let conditions = {
      state: globalConstants.knowledgeState.PUBLISHED
    };
    if(req.headers && req.headers.token && req.query.q) {
      let user = await User.findOne({token: req.headers.token}, '_id');
      if(user) {
        UserSearch.create({
          user: user._id,
          search_text: req.query.q,
          type: 'knowledge'
        });
      }
      let foundKnowledges = await Elasticsearch.search('knowledge', esQueryBody);
      let knowledgeIds = foundKnowledges?.hits?.hits?.map(foundKnowledge => {
        return foundKnowledge._id;
      });
      conditions._id = knowledgeIds;
    }
    if(!req.query.q) {
      let time = ~~req.query.time || 0;
      let la = req.query.la && req.query.la !== 'all' ? req.query.la : '';
      let now = new Date();
      let from = null;
      switch (time) {
        case 1:
          from = new Date(now.setHours(now.getHours() - 1));
          conditions.createdDate = {$gte: new Date(from)}
          break;
        case 2:
          from = new Date(now.setDate(now.getDate() - 1));
          conditions.createdDate = {$gte: new Date(from)}
          break;
        case 3:
          from = new Date(now.setDate(now.getDate() - 7));
          conditions.createdDate = {$gte: new Date(from)}
          break;
        case 4:
          from = new Date(now.setMonth(now.getMonth() - 1));
          conditions.createdDate = {$gte: new Date(from)}
          break;
        case 5:
          from = new Date(now.setFullYear(now.getFullYear() - 1));
          conditions.createdDate = {$gte: new Date(from)}
          break;
      }
      if(la){
        conditions.language = la;
      }
    }
    let sort = req.query.sort && req.query.sort === 'views' ? {views: -1} : {upVotes: -1, createdDate: -1};
    let promises = [
      Knowledge.count(conditions).exec(),
      Knowledge.find(conditions, {__v: false})
        .sort(sort)
        .skip(skip)
        .limit(KNOWLEDGE_PER_PAGE)
        .exec()
    ];
    let results = await Promise.all(promises);
    let total = results[0];
    let knowledges = results[1];

    let userId = '';
    if (req.headers.token) {
      let user = await User.findOne({token: req.headers.token}, '_id').exec();
      userId = user ? user._id.toString() : '';
    }

    let arrKnowledgePm = knowledges.map(async knowledge => convertToKnowledgeResult(knowledge, userId));
    let arrKnowledges = await Promise.all(arrKnowledgePm);
    if (req.query.sort && req.query.sort === 'comment') {
      arrKnowledges = ArrayHelper.sortByProp(arrKnowledges, 'commentCount', 'desc');
    }
    return res.json({
      last_page: Math.ceil(total / KNOWLEDGE_PER_PAGE),
      current_page: page,
      total_items: total,
      data: arrKnowledges
    });
  } catch (err) {
    console.log('err on getAllKnowledge:', err);
    return res.status(500).json(ERROR.INTERNAL);
  }
}

function buildESQuery(req) {
  let queryString = req.query.q || "";
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * KNOWLEDGE_PER_PAGE;
  let body = bodybuilder().from(skip).size(KNOWLEDGE_PER_PAGE);

  if (queryString) {
    if (req.query.exac && req.query.exac == true) {
      body.query('match_phrase', 'search_text', queryString);
//      body.orQuery('match_phrase', 'title', queryString);
    } else {
      queryString = StringHelper.standardize(queryString).toLowerCase();
      let strings = queryString.split(' ');
      strings.forEach(string => {
        if (string.length > 1 && globalConstants.stopWords.indexOf(string) < 0) {
          body.orQuery('match_phrase', 'search_text', string);
//          body.orQuery('prefix', 'title', string);
//          body.orQuery('prefix', 'tags', string);
        }
      });
    }
  } else {
    body.query('wildcard', 'search_text', '*');
//    body.orQuery('wildcard', 'title', '*');
  }

  let time = ~~req.query.time || 0;
  let now = new Date();
  let from = null;
  switch (time) {
    case 1:
      console.log('last hour');
      from = new Date(now.setHours(now.getHours() - 1));
      body.andQuery('range', 'createdDate', {
        "gte": from.toISOString()
      });
      break;
    case 2:
      console.log('last 24 hours');
      from = new Date(now.setDate(now.getDate() - 1));
      body.andQuery('range', 'createdDate', {
        "gte": from.toISOString()
      });
      break;
    case 3:
      console.log('last week');
      from = new Date(now.setDate(now.getDate() - 7));
      body.andQuery('range', 'createdDate', {
        "gte": from.toISOString()
      });
      break;
    case 4:
      console.log('last month');
      from = new Date(now.setMonth(now.getMonth() - 1));
      body.andQuery('range', 'createdDate', {
        "gte": from.toISOString()
      });
      break;
    case 5:
      console.log('last year');
      from = new Date(now.setFullYear(now.getFullYear() - 1));
      body.andQuery('range', 'createdDate', {
        "gte": from.toISOString()
      });
      break;
  }
  return body.build();
}

export function checkSlugKnowledge(req, res) {
  var result = {
    key: -10,
    message: '',
    data: false
  };
  var knowledgeId = '';
  if (req.body.knowledgeId) {
    knowledgeId = sanitizeHtml(req.body.knowledgeId);
  }
  var slug = sanitizeHtml(req.body.slug);
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
    'cancelPaypalToken',
    'savePaypalToken',
    'search',
    'sign-up',
    'confirm',
    'reset',
    'joinCollection',
    'editExpert',
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
  if (inval.includes(slug)) {
    result.key = -1;
    result.message = 'Slug is not available.';
    result.data = true;
    res.json({result});
  } else {
    if(knowledgeId){
      Knowledge.findOne({slug: slug, _id: {'$exists': true, '$ne': mongoose.Types.ObjectId(knowledgeId)}}).exec((err, knowledgeInfo) => {
        if (err && err.name !== 'CastError') {
          console.log('err on get knowledge: ', err);
          return res.status(500).json(ERROR.INTERNAL);
        }
        if (knowledgeInfo === null) {
          //Email not exists.
          result.key = 1;
          result.message = 'Slug is available.';
          result.data = false;
          return res.json({result});
        } else {
          result.key = -1;
          result.message = 'Slug is not available.';
          result.data = true;
          return res.json({result});
        }
      });
    } else {
      Knowledge.findOne({slug: slug}).exec((err, knowledgeInfo) => {
        if (err && err.name !== 'CastError') {
          console.log('err on get knowledge: ', err);
          return res.status(500).json(ERROR.INTERNAL);
        }
//        console.log('knowledgeInfo');
//        console.log(knowledgeInfo);
        if (knowledgeInfo === null) {
          //Email not exists.
          result.key = 1;
          result.message = 'Slug is available.';
          result.data = false;
          return res.json({result});
        } else {
          result.key = -1;
          result.message = 'Slug is not available.';
          result.data = true;
          return res.json({result});
        }
      });
    }

  }
}

export function publishKnowledge(req, res) {
  Knowledge.findById(req.params.id, (err, knowledge) => {
    if (err && err.name !== 'CastError') {
      console.log('err on publish knowledge: ', err);
      return res.status(500).json(ERROR.INTERNAL);
    }
    if (!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }
    if (knowledge.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json(ERROR.PERMISSION);
    }
    if (knowledge.state !== globalConstants.knowledgeState.DRAFT) {
      return res.status(400).json({error: 'This knowledge is not in draft mode.'});
    }

    knowledge.state = globalConstants.knowledgeState.WAITING;
    knowledge.save(afterSaved.bind(this, knowledge, 'publish', req, res));
  });
}

export async function censorKnowledge(req, res) {
  try {
    let ids = [];
    if(req.body.ids) {
      ids = req.body.ids;
    } else if(req.body.id) {
      ids = [req.body.id];
    } else {
      return res.status(400).json({
        success: false,
        error: "Please provide Knowledge's Id(s) to delete."
      });
  }
    let conditions = {
      _id: {$in: ids},
      state: globalConstants.knowledgeState.WAITING
    };
    let updateOptions = {
      $set: {state: globalConstants.knowledgeState.PUBLISHED}
    };
    await Knowledge.update(conditions, updateOptions, {multi: true}).exec();

    let knowledges = await Knowledge.find({_id: {$in: ids}}).exec();
    knowledges.forEach(knowledge => {
      // sync to elasticsearch
     Q.create(globalConstants.jobName.KLGE_SYNC_ELASTIC, {action: 'censor', knowledge: knowledge})
        .priority('high').removeOnComplete(true).save();
      // create feeds
      let skillIds = [];
      knowledge.tags.forEach(tag => {
        if(tag.id !== 'un') {
          skillIds.push(tag.id);
        }
      });
      let feedOptions = {
        knowledge: knowledge,
        actor: knowledge.authorId,
        action: 'published',
        type: 'knowledge',
//        skills: skillIds
      };
      Knowledge.createFeeds(Knowledge, feedOptions);

      Skill.find({_id: {$in: skillIds}}).exec()
        .then(skills => {
          let skillPromises = skills.map(skill => {
            skill.tagged++;
            skill.knowledges.push(knowledge._id);
            skill.markModified('knowledges');
            return skill.save();
          })
        });

      User.findById(knowledge.authorId).exec().then(userRec => {
        var dataNotify = {
          // userID: userRec.cuid,
          // type: 'censorKnowledge',
          // data: {
          //   knowledgeId: knowledge._id.toString()
          // }
          to:userRec._id,
          object:knowledge._id,
          data:{
            content:knowledge.title
          },
          type: "censorKnowledge"
        };
        AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
      });
    });
    return res.json({success: true});
  } catch (err) {
    console.log('err on censorKnowledge:', err);
    return res.status(500).json(err);
  }
}

export async function rejectKnowledge(req, res) {
  try {
    let ids = [];
    if(req.body.ids) {
      ids = req.body.ids;
    } else if(req.body.id) {
      ids = [req.body.id];
    } else {
      return res.status(400).json({
        success: false,
        error: "Please provide Knowledge's Id(s) to reject."
      });
    }
    let conditions = {
      _id: {$in: ids},
      state: globalConstants.knowledgeState.WAITING
    };
    let updateOptions = {
      $set: {state: globalConstants.knowledgeState.REJECTED}
    };
    await Knowledge.update(conditions, updateOptions, {multi: true}).exec();
    if(req.body.ids) {
      let knowledges = await Knowledge.find({_id: {$in: ids}}).exec();
      knowledges.forEach(knowledge => {
        User.findById(knowledge.authorId).exec().then(userRec => {
          var dataNotify = {
            to: knowledge.authorId,
            type: 'adminRejectKnowledge',
            data: {
              knowledgeId: knowledge._id.toString()
            }
          };
          // addNotification(dataNotify);
          AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
        });
      });
    } else if(req.body.id) {
      Knowledge.findById(req.body.id, (err, knowledge) => {
        if (err && err.name !== 'CastError') {
          console.log('err on delete knowledge: ', err);
        }
        let authorId = knowledge.authorId;
        let id = knowledge._id.toString();
        User.findById(authorId).exec((err, userRec) => {
          if (err) {
            console.log('Don\'t find user to send notification: ', err);
          }
          if (userRec.cuid ) {
            var dataNotify = {
              // userID: userRec.cuid,
              // type: 'adminRejectKnowledge',
              // data: {
              //   knowledgeId: id
              // }
              to: knowledge.authorId,
              object:knowledge._id,
              data:{
                content:knowledge.title
              },
              type: "adminRejectKnowledge"
            };
            // addNotification(dataNotify);
            AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
          }
        });
      });
    }
    return res.json({success: true});
  } catch (err) {
    console.log('err on rejectKnowledge:', err);
    return res.status(500).json(err);
  }
}

export async function updateKnowledge(req, res) {
  console.log('updateKnowledge:', req.params.id);
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }
  if (req.headers.token) {
    let user = await User.findOne({token: req.headers.token}, '_id').exec();
    var userId = user._id.toString();
  } else {
    return res.status(403).json(ERROR.PERMISSION);
  }
  Knowledge.findById(req.params.id, async (err, knowledge) => {
    if (err && err.name !== 'CastError') {
      console.log('err on update knowledge: ', err);
      return res.status(500).json(ERROR.INTERNAL);
    }
    if (!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    if ('upVotes' in req.body || 'downVotes' in req.body) {
      return res.status(403).json({error: 'Dont hack my app, fucker!'});
    }

    knowledge.departmentId = req.body.departmentId ? req.body.departmentId : knowledge.departmentId;
//    knowledge.content = req.body.content ? JSON.parse(req.body.content) : knowledge.content;
    knowledge.authorId = userId ? userId : knowledge.userId;
    if(req.body.content) {
      let content = JSON.parse(req.body.content);
      if(!Object.keys(content.entityMap).length || !('entityMap' in content)) {
        console.log('ko co entityMap ne');
        content['entityMap'] = {
          0: {a: ''}
        };
      }
      knowledge.content = content;
      knowledge.markModified('content');
    }
    if (req.body.tags) {
      knowledge.tags = req.body.tags;
      knowledge.markModified('tags');
    }
    if (req.body.state) {
      if(req.body.state == 'draft'){
        knowledge.state = req.body.state;
        knowledge.markModified('state');
      } else if(knowledge.state != 'published'){
        knowledge.state = req.body.state;
        knowledge.markModified('state');
      }
    }
    knowledge.thumbnail = Knowledge.getKnowledgeThumbnails(knowledge);
    knowledge.description = Knowledge.getKnowledgeDescription(Knowledge, knowledge);
    if(req.body.title && req.body.title !== knowledge.title) {
      knowledge.title = req.body.title;
      knowledge.slug = await buildKnowledgeSlug(knowledge.title);
    }

    knowledge.save(afterSaved.bind(this, knowledge, 'update', req, res));
  });
}

export function deleteKnowledge(req, res) {
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }
  Knowledge.findById(req.params.id, (err, knowledge) => {
    if (err && err.name !== 'CastError') {
      console.log('err on delete knowledge: ', err);
      return res.status(500).json(ERROR.INTERNAL);
    }

    if (!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    if (req.user.role === globalConstants.role.USER) {
      if (knowledge.authorId.toString() !== req.user._id.toString()) {
        return res.status(403).json(ERROR.PERMISSION);
      }
    }
    knowledge.remove(err => {
      if (err) {
        console.log('err on delete knowledge: ', err);
        return res.status(500).json(ERROR.INTERNAL);
      }
      Q.create(globalConstants.jobName.KLGE_SYNC_ELASTIC, {action: 'remove', knowledge: knowledge}).removeOnComplete(true).save();
      Q.create(globalConstants.jobName.KLGE_REMOVE, {knowledgeId: knowledge._id}).removeOnComplete(true).save();
      return res.json({success: true});
    });
  });
}

export async function upVote(req, res) {
  try{
    let knowledgeID = await StringHelper.isObjectId(req.params.id);
    if(!knowledgeID){
      throw {
        status:400,
        success:false,
        err:"Knowledge Not Format !!"
      }
    }
    let options = {
      knowledgeId:req.params.id,
      userId:req.user._id
    };
    let data = await KnowledgeServices.upVoteKnowledge(options);
    return res.json(data);
  }catch (err){
    return res.status(err.status).json(err);
  }
//   console.log('upVote:', req.params.id);
//   if (!req.params.id) {
//     return res.status(400).json(ERROR.ID_MISSING);
//   }
//
//   try {
//     let knowledge = await Knowledge.findOne({
//       _id: req.params.id,
//       state: globalConstants.knowledgeState.PUBLISHED
//     }).exec();
//     if (!knowledge) {
//       return res.status(404).json(ERROR.NOT_FOUND);
//     }
//
//     let conditions = {
//       knowledgeId: req.params.id,
//       userId: req.user._id.toString()
//     };
//
//     let count = await KnowledgeUpvote.count(conditions).exec();
//     if (count > 0) {
//       return res.status(400).json({error: 'You already up voted this knowledge before.'});
//     }
//
//     let knowledgeUpvote = new KnowledgeUpvote(conditions);
//     await knowledgeUpvote.save();
//
// //    let feedOptions = {
// //      knowledge: knowledge,
// //      actor: req.user._id,
// //      action: 'voted',
// //      type: 'knowledge'
// //    };
// //    Knowledge.createFeeds(Knowledge, feedOptions);
//
//     knowledge.upVotes++;
//     let saved = await knowledge.save();
//     let savedObject = JSON.parse(JSON.stringify(knowledge));
//     savedObject.upvoted = true;
//     let userRec = await User.findById(knowledge.authorId).exec();
//     let userSend = await User.findById(req.user._id).exec();
//     if (userRec.cuid != userSend.cuid) {
//       var dataNotify = {
//         userID: userRec.cuid,
//         userSendID: userSend.cuid,
//         type: 'upVoteKnowledge',
//         data: {
//           knowledgeId: req.params.id
//         }
//       };
//       // addNotification(dataNotify);
//       AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
//     }
//     return res.json(savedObject);
//   } catch (err) {
//     if (err.name !== 'CastError') {
//       console.log('err on upVote knowledge: ', err);
//       return res.status(500).json(ERROR.INTERNAL);
//     }
//   }
}

export async function downVote(req, res) {

  try {
    let knowledge = await Knowledge.findById(req.params.id).exec();
    if (!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    let conditions = {
      knowledgeId: req.params.id,
      userId: req.user._id.toString()
    };

    let count = await KnowledgeUpvote.count(conditions).exec();
    if (count <= 0) {
      return res.status(400).json({error: 'You have not voted this knowledge before.'});
    }

    await KnowledgeUpvote.findOneAndRemove(conditions).exec();

    knowledge.upVotes--;
    let saved = await knowledge.save();
    let savedObject = JSON.parse(JSON.stringify(saved));
    savedObject.upvoted = false;
    return res.json(savedObject);
  } catch (err) {
    if (err.name !== 'CastError') {
      console.log('err on upVote knowledge: ', err);
      return res.status(500).json(ERROR.INTERNAL);
    }
  }
}

export async function bookmark(req, res) {
  try {
    let knowledge = await Knowledge.findById(req.params.id).exec();
    if(!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    let conditions = {
      knowledgeId: req.params.id,
      userId: req.user._id.toString()
    };

    let count = await KnowledgeBookmark.count(conditions).exec();
    if(count) {
      return res.status(400).json({error: 'You have bookmarked this Knowledge before.'});
    }

    let knowledgeBookmark = new KnowledgeBookmark(conditions);
    knowledgeBookmark.save();
    return res.json({success: true});
  } catch (err) {
    console.log('err on bookmark knowledge:', err);
    return res.status(500).json(ERROR.INTERNAL);
  }
}

export async function removeBookmark(req, res) {
  try {
    let knowledge = await Knowledge.findById(req.params.id).exec();
    if(!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    let conditions = {
      knowledgeId: req.params.id,
      userId: req.user._id.toString()
    };

    let count = await KnowledgeBookmark.count(conditions).exec();
    if(!count) {
      return res.status(400).json({error: 'You have not bookmarked this Knowledge before.'});
    }

    KnowledgeBookmark.findOneAndRemove(conditions).exec();
    return res.json({success: true});
  } catch (err) {
    console.log('err on remove bookmark knowledge:', err);
    return res.status(500).json(ERROR.INTERNAL);
  }
}

export async function getBookmarkedKnowledge(req, res) {
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * KNOWLEDGE_PER_PAGE;
  let limit = KNOWLEDGE_PER_PAGE;
  if(req.query.skip) {
    skip = 0;
    limit = page * KNOWLEDGE_PER_PAGE;
  }
  try {
    let bookmarks = await KnowledgeBookmark.find({userId: req.user._id});
    let knowledgeIds = bookmarks.map(bm => {return bm.knowledgeId});
    let conditions = {
      _id: {$in: knowledgeIds},
      state: globalConstants.knowledgeState.PUBLISHED
    };
    let results = await Promise.all([
      Knowledge.count(conditions),
      Knowledge.find(conditions).sort({createdDate: -1}).skip(skip).limit(limit)
    ]);
    let knowledgePromises = results[1].map(knowledge => convertToKnowledgeResult(knowledge, req.user._id));
    let knowledges = await Promise.all(knowledgePromises);
    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(results[0] / KNOWLEDGE_PER_PAGE),
      total_items: results[0],
      data: knowledges
    });
  } catch(err) {
    console.log('err on getBookmarkedKnowledge:', err);
    return res.json({success: false, error: 'Internal error.'});
  }
}

export async function isKnowledgeVotedByUser(knowledgeId, userId) {
  if (!userId) return false;

  let count = await KnowledgeUpvote.count({
    knowledgeId: knowledgeId,
    userId: userId
  }).exec();
  return count > 0;
}

async function isKnowledgeBookMarkByUser(knowledgeId, userId) {
  if (!userId) return false;

  let count = await KnowledgeBookmark.count({
    knowledgeId: knowledgeId,
    userId: userId
  }).exec();
  return count > 0;
}

export async function getCommentsByKnowledge(req, res) {
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }

  try {
    let knowledge = await Knowledge.findById(req.params.id).exec();

    if (!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    let comments = await getCommentsByKnowledgeId(req);

    return res.json(comments);
  } catch (err) {
    console.log('err on getCommentsByKnowledge:', err);
    return res.status(500).json(ERROR.INTERNAL);
  }
}

export async function getUsersUpvoted(req, res) {
  try {
    let knowledge = await Knowledge.findById(req.params.id).exec();

    if (!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    let page = req.query.page || 1;
    let skip = (page - 1) * USERS_PER_PAGE;

    let countPromise = KnowledgeUpvote.count({knowledgeId: knowledge._id}).exec();
    let knowledgeUpvotePromise = KnowledgeUpvote.find({knowledgeId: knowledge._id}, 'userId')
      .skip(skip)
      .limit(USERS_PER_PAGE)
      .exec();
    let results = await Promise.all([countPromise, knowledgeUpvotePromise]);

    let total = results[0];
    let knowledgeUpvotes = results[1];

    let arr_user_id = knowledgeUpvotes.map(knowledgeUpvote => {
      return knowledgeUpvote.userId;
    });

    let users = await User.find({_id: {$in: arr_user_id}}, 'fullName avatar cuid userName').exec();

    return res.json({
      last_page: Math.ceil(total / USERS_PER_PAGE),
      current_page: page,
      total_items: total,
      data: users
    });
  } catch (err) {
    console.log('err on getUsersUpvoted:', err);
    return res.status(500).json(ERROR.INTERNAL);
  }
}

export async function adminGetKnowledge (req, res) {
  try{
    let page = ~~req.query.page || 1;
    let skip = (page - 1) * KNOWLEDGE_PER_PAGE_ADMIN;

    let conditions = {};
    let fields = ['title', 'state', 'authorId', 'createdDate', 'slug', 'views'].join(' ');
    if(req.query.state) {
      conditions.state = req.query.state;
    }
    let results = await Promise.all([
      Knowledge.count(conditions).exec(),
      Knowledge.find(conditions, fields).skip(skip).limit(KNOWLEDGE_PER_PAGE_ADMIN).sort({createdDate: -1}).exec()
    ]);

    let total = results[0];
    let knowledgePromise = results[1].map(async knowledge => {
      let knowledgeObj = JSON.parse(JSON.stringify(knowledge));
      knowledgeObj.author = await getAuthor(knowledge);
      delete knowledgeObj.authorId;
      return knowledgeObj;
    });

    let rs = await Promise.all(knowledgePromise);

    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(total / KNOWLEDGE_PER_PAGE_ADMIN),
      total_items: total,
      data: rs
    });
  } catch(err) {
    console.log('err on adminGetKnowledge:', err);
    return res.status(500).json(err);
  }
}

export async function adminDeleteKnowledge (req, res) {
  try {
    let ids = [];
    if(req.body.ids) {
      ids = req.body.ids;
    } else if(req.body.id) {
      ids = [req.body.id];
    } else {
      return res.status(400).json({
        success: false,
        error: "Please provide Knowledge's Id(s) to delete."
      });
    }
    let data = ids.map(async id => {
      let know = await Knowledge.findById(id).lean();
      var dataNotify = {
        to: know.authorId,
        type: 'adminDeleteKnowledge',
        data: {
          content: know.title
        }
      };
      await Notification.remove({object:id});
      // addNotification(dataNotify);
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
      Q.create(globalConstants.jobName.KLGE_SYNC_ELASTIC, {action: 'remove', id: id}).removeOnComplete(true).save();
    });
    await Promise.all(data);
    await Knowledge.remove({_id: {$in: ids}}).exec();
    return res.json({success: true});
  } catch (err) {
    console.log('err on adminDeleteKnowledge:', err);
    return res.status(500).json(err);
  }
}

function getDepartment(knowledge) {
  return new Promise((resolve) => {
    if (knowledge.departmentId === 'ge') {
      return resolve({
        _id: 'ge',
        title: 'General'
      });
    }
    Category.findById(knowledge.departmentId, 'title', (err, department) => {
      if (err) {
        throw err;
      }
      return resolve(department);
    });
  });
}

function getTags(knowledge) {
  return new Promise((resolve) => {
    var arrSkills = [];
    for (var i = 0; i < knowledge.tags.length; i++) {
      arrSkills.push(mongoose.Types.ObjectId(knowledge.tags[i]));
    }
    var option = {_id: {$in: arrSkills}};

    Skill.find(option, 'description', (err, skills) => {
      if (err) {
        throw err;
      }
      var arrTags = [];
      for (var i = 0; i < skills.length; i++) {
        var tag = {
          _id: skills[i]._id.toString(),
          name: skills[i].description[0].name
        };
        arrTags.push(tag);
      }
      return resolve(arrTags);
    });
  });
}

async function getAuthor(knowledge, langCode) {
  let users = await User.formatFeedInfo(User, knowledge.authorId, langCode, knowledge.departmentId);
  let obj = users.pop();
  if(obj && obj.avatar){
    let data={
      src: obj.avatar,
      size: 50
    }
    let thumb = await cacheImage(data);
    obj.avatar = thumb;
  }
  return obj;
}

async function getKnowledgeMetaData(knowledge, userId, langCode) {
  try {

      delete knowledge.__v;
    //   console.log(knowledge ? knowledge.title : 'null cmnr');
      if ('downVotes' in knowledge) {
        delete knowledge.downVotes;
      }

      return await Promise.all([
        getDepartment(knowledge),
        getAuthor(knowledge, langCode),
        Knowledge.getCommentCount(knowledge._id.toString()),
        isKnowledgeVotedByUser(knowledge._id, userId),
        isKnowledgeBookMarkByUser(knowledge._id, userId),
      ]);

  } catch (err) {
    throw err;
  }
}

export async function hardSyncToElastic (req, res) {
  try {
    let knowledge = await Knowledge.findById(req.params.id).lean();
    let esDoc = await Knowledge.toESDoc(Knowledge, knowledge);
    let type = esDoc.type;
    delete esDoc.type;
    await Elasticsearch.index('knowledge', esDoc, type);
    return res.status(200).json({success: true});
  } catch (err) {
    console.log('err on hardSyncToElastic:', err);
    return res.status(500).json(err);
  }
}
