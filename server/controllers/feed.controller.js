import Feed from '../models/feeds';
import Skill from '../models/skill';
import KnowledgeBookmark from '../models/knowledgeBookmark';
import {getUserByToken} from "../services/users.service";
import {getRecentKnowledge, appendMoreInfo} from "../services/knowledges.service";
import {getUserFeed} from "../services/feeds.service";
import Knowledge from '../models/knowledge';
import Question from '../models/questions';
import LiveStream from '../models/liveStream';
import Course from '../models/courses';
import config from '../config';
import {convertToKnowledgeResult} from "./knowledge.controller";
import ArrayHelper from "../util/ArrayHelper";

const FEED_LIMIT = 10;
const ALLOWED_TYPES = ['knowledge', 'question'];

export async function getFeeds(req, res) {
  let page = ~~req.query.page || 1;
  let type = req.query.type;
  if (ALLOWED_TYPES.indexOf(type) < 0) {
    type = {$ne: null};
  }
  let skip = (page - 1) * FEED_LIMIT;
  let limit = FEED_LIMIT;
  if (req.query.skip0) {
    skip = 0;
    limit = page * FEED_LIMIT;
  }
  try {
    let conditions = {owner: req.user._id, type: type};
    if (req.from == 2) {
      conditions.action = {$in: ['published', 'ask']};
    }
    if (req.query.cat) {
      let skills = await Skill.find({categoryID: req.query.cat});
      let knowledgeIds = [], questionIds = [];
      skills.forEach(skill => {
        Array.prototype.push.apply(knowledgeIds, skill.knowledges);
        Array.prototype.push.apply(questionIds, skill.questions);
      });
      let objectIds = knowledgeIds.concat(questionIds);
      conditions.object = {$in: objectIds};
    } else if (req.query.tag) {
      let skill = await Skill.findById(req.query.tag);
      let knowledgeIds = skill.knowledges.slice(0);
      let questionIds = skill.questions.slice(0);
      let objectIds = knowledgeIds.concat(questionIds);
      conditions.object = {$in: objectIds};
    }
    let results = await Promise.all([
      Feed.count(conditions),
      Feed.find(conditions).sort({updatedDate: -1, priority: -1}).skip(skip).limit(limit).exec()
    ]);

    let total = results[0];
    let feedArray = results[1].map(async feed =>{
      let check='';
      switch (feed.type){
        case "knowledge":
          check = await Knowledge.findById(feed.object).lean();
          break;
        case "question":
          check = await Question.findById(feed.object).lean();
          break;
        case "live_stream":
          check = await LiveStream.findById(feed.object).lean();
          break;
        case "schedule":
          check = await LiveStream.findById(feed.object).lean();
          break;
        case "course":
          check = await Course.findById(feed.object).lean();
          break;
        default:
          break;
      }
      if(check){
        return feed;
      }else {
        await Feed.remove({object:feed.object});
        return {};
      }
    });
    feedArray = await Promise.all(feedArray);
    let promises = feedArray.filter(feed =>
      Object.keys(feed).length > 0
      // if(feed){
      //   console.log('aaaaaaaa');
      //   Feed.getMetadata(feed, req.user._id, req.headers.lang);
      // }
    );
    promises = promises.map(async feed =>{
      return await Feed.getMetadata(feed, req.user._id, req.headers.lang);
    });
    let feeds = await Promise.all(promises);
    feeds = feeds.filter(feed => feed.object);
    feeds = feeds.map(feed => {
      if (feed.type === 'knowledge' || feed.type === 'question') {
        // console.log('feed.object:', feed.object);
        delete feed.object.content;
      }
      return feed;
    });

    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(total / FEED_LIMIT),
      total_items: total,
      data: feeds
    });
  } catch (err) {
    console.log('err on getFeeds:', err);
    return res.status(500).json(err);
  }
}

//
//export async function getBookMarkedKnowledges(req, res) {
//  let page = ~~req.query.page || 1;
//  try {
//    let bookmarked = await KnowledgeBookmark.find({userId: req.user._id});
//    let knowledgeIds = bookmarked.map(bm => {return bm.knowledgeId});
//    let conditions = {owner: req.user._id, object: {$in: knowledgeIds}};
//    let results = await Promise.all([
//      Feeds.count(conditions),
//      Feeds.find(conditions).sort({createdDate: -1}).limit(page * FEED_LIMIT).exec()
//    ]);
//
//    let feedPromises = results[1].map(feed => Feeds.getMetadata(feed));
//    let feeds = await Promise.all(feedPromises);
//
//    return res.json({
//      success: true,
//      current_page: page,
//      last_page: Math.ceil(total / FEED_LIMIT),
//      total_items: total,
//      data: feeds
//    });
//  } catch(err) {
//    console.log('err on getFeeds:', err);
//    return res.status(500).json(err);
//  }
//}

export async function getHomeFeeds(req, res) {
  try {
    let data = [];
    let type = 'feeds';
    const token = req.headers.token;
    let userRequest;
    if (token) {
      userRequest = await getUserByToken(token);
    }
    if (userRequest) {
      let feeds = await getUserFeed(userRequest._id, config.knowledgeLimit);
      if (feeds && feeds.length > 0) {
        let feedPromises = feeds.map((feed) => {
          return Feed.getMetadata(feed, userRequest._id, req.headers.lang)
        });
        let feedsData = await Promise.all(feedPromises);
        feedsData = feedsData.map((feed) => {

          if (feed.object) {
            delete feed.object.content;
            return feed;
          }
        });
        data = feedsData;
        data = data.filter((feed) => !!feed);
        return res.json({
          success: true,
          data,
          type
        });
      }
    }
    //if not login, get recent knowledge
    let knowledges = await getRecentKnowledge(config.knowledgeLimit,req.headers.lang);
    if (knowledges) {
      data = await appendMoreInfo(knowledges,userRequest);
      type = 'knowledges';
    }
    data = data.filter((feed) => !!feed);
    return res.json({
      success: true,
      data,
      type
    });
  } catch (err) {
    console.log('err on get home Feeds:', err);
    return res.status(500).json({success: false});
  }
}
