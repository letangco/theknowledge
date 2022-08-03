import User from '../models/user';
import Skill from '../models/skill';
import liveStream from '../models/liveStream';
import scriptLiveStream from '../scripts/migrate/migrate_webinar_to_elasticsearch';
import Knowledge from '../models/knowledge';
import Question from '../models/questions';
import Courses from '../models/courses';
import mongoose from 'mongoose';
import mem_cache from 'memory-cache';
import {getUserSupportState} from '../routes/socket_routes/chat_socket';
import Elasticsearch from '../libs/Elasticsearch';
import bodybuilder from 'bodybuilder';
import ServerSettings from '../models/serverSettings';
import UserSearch from '../models/userSearch';
import fs from 'fs';
import ArrayHelper from '../util/ArrayHelper';


// export function getResultsSearch(req, res) {
//     let search = (req.body.filter.search) ? decodeURIComponent(req.body.filter.search.replace(/\+/g,"%20")) : '';
//     let category = (req.body.filter.category) ? decodeURIComponent(req.body.filter.category) : '';
//     let page = (req.body.filter.page > 1) ? req.body.filter.page : 1;
//     let valueExperience = req.body.filter.valueExperience ? req.body.filter.valueExperience : 0;
//     let valueStatus = req.body.filter.valueStatus ? req.body.filter.valueStatus : 0;
//     let language = (req.body.filter.language && req.body.filter.language != 'A-L') ? req.body.filter.language : '';
//     let valueCountries = (req.body.filter.valueCountries && req.body.filter.valueCountries != 'A-C') ? req.body.filter.valueCountries : '';
//     mongoose.connection.db.eval("getTopRate('" +
//       search + "','" +
//       category + "'," +
//       page + "," +
//       valueExperience + "," +
//       valueStatus + ",'" +
//       language + "','" +
//       valueCountries + "')", function(err, users) {
//         if (err) {
//             res.status(500).send(err);
//         } else {
//             res.json({users});
//         }
//     });
// }
// export function getTestTop(req, res) {
//     //console.log('skills');
//     let temp = decodeURIComponent(req.params.skills.replace("+","%20"));
//   mongoose.connection.db.eval("getTopRate("+temp+")", function(err, result) {
//       if (err) {
//           res.status(500).send(err);
//       } else {
//         res.json({result});
//       }
//     });
// }
export function getTotalSearch(req, res) {
    let query = [];
    if(typeof req.body.filter.category !== 'undefined' && req.body.filter.category != '' && req.body.filter.category != 0){
        query.push({'categories.industry.industryID': req.body.filter.category});
    }
    query.push(
        { $or:
            [{'categories.skills.skill_ID' : {$regex:req.body.filter.search,$options:"$i"}},
                {'fullName' : {$regex:req.body.filter.search,$options:"$i"}},
                {'categories.industry.title' : {$regex:req.body.filter.search,$options:"$i"}},
                {'categories.department.title' : {$regex:req.body.filter.search,$options:"$i"}}
            ]}
    );
    User.find({
        $and: query
    }).count().exec((err, total) => {
        if (err) {
            res.status(500).send(err);
        }
        res.json({total});
    });

}
export function getKeyWord(req, res) {
  let limit = req.params.limit ? parseInt(req.params.limit) : parseInt(10);
  User.aggregate([
    { $match:{$and : [{ 'expert': 1},{ 'active': 1}]}},
    {$unwind: '$categories'}, // Split chat groups by users field
    {$replaceRoot: {newRoot: '$categories'}},
    {$unwind: '$skills'}, // Split chat groups by users field
    {$group : {
      _id : '$skills.skill_ID',
      count: { $sum: 1 }
    }
    },
    {$sort: {count: -1}},
    {$limit: limit+10}
  ]).exec((err, skills) => {
      if (err) {
          res.status(500).send(err);
      } else {
        skills = skills.filter(skill => skill._id).splice(0, limit);
        res.json({skills});
      }
  });

}
export function getTesseSupport(req, res) {
  let data = mem_cache.get('getTesseSupport');
  if(data) {
    data = data.map(support => {
      support.online = getUserSupportState(support._id.cuid);
      return support;
    });
    return res.json({users: data});
  } else {
    data = [];
    let customerSupport = {
      categories: [{title: 'Enterpreneurs & Startups'}],
      totalRate: 2,
      point: 0,
      skills: [],
      skillTags: [
        {
          average: 0,
          total_rate: 0,
          skill_ID: 'Seeding'
        }
      ],
      serviceTotalRate: null,
      rank: 0,
      _id: {
        cuid: 'cj0dl08pn0015kk7myjy7mz2y',
        country: {
          ISO3: 'USA',
          ISO2: 'US',
          name: 'United States',
          cuid: 'cizxjgdvk01u1i3gdvskfnonf'
        },
        priceCall: 0,
        priceChat: 0,
        avatar: '/uploads/avatar/cj0dl08pn0015kk7myjy7mz2y-1491402677723.jpeg',
        lastName: 'Support',
        firstName: 'Customer',
        userName: '',
        rate: 5,
        totalRateIC: 2
      }
    };

    let tesseSupport = {
      categories: [{title: 'Sharing'}],
      totalRate: 2,
      point: 0,
      skills: [],
      skillTags: [
        {
          average: 0,
          total_rate: 0,
          skill_ID: 'GRE Chemistry Test'
        },
        {
          average: 0,
          total_rate: 0,
          skill_ID: 'Analytical writing GRE'
        },
        {
          average: 0,
          total_rate: 0,
          skill_ID: 'Special teacher'
        }
      ],
      serviceTotalRate: null,
      rank: 0,
      _id: {
        cuid: 'cj0dij2y2000ekk7mxmhbhwy6',
        country: {
          ISO3: 'USA',
          ISO2: 'US',
          name: 'United States',
          cuid: 'cizxjgdvk01u1i3gdvskfnonf'
        },
        priceCall: 0,
        priceChat: 0,
        avatar: '/uploads/avatar/cj0dl08pn0015kk7myjy7mz2y-1491402677723.jpeg',
        lastName: 'Support',
        firstName: 'Tesse',
        userName: '',
        rate: 4.75,
        totalRateIC: 2
      }
    };

    data.push(customerSupport);
    data.push(tesseSupport);
    mem_cache.put('getTesseSupport', data);

    data = data.map(support => {
      support.online = getUserSupportState(support._id.cuid);
      return support;
    });

    return res.json({users: data});
  }
  // mongoose.connection.db.eval("getTesseSupport()", function(err, users) {
  //   if (err) {
  //     res.status(500).send(err);
  //   } else {
  //     res.json({users});
  //   }
  // });
}

export async function getSuggestV2(req, res) {
  let page = parseInt(req.query.page) || 1;
  let searchString = req.query.q ? decodeURIComponent(req.query.q.toLowerCase()) : "";
  let department = req.query.cat; // tam thoi chua dung
  let langCode = req.headers.lang || req.params.lang;
  if(!langCode || langCode === 'null') {
    langCode = 'en';
  }
  let skip = (page - 1) * 10;
  let rs = null;
  switch (req.params.type) {
    case 'skills':
      rs = await getSuggestSkill(searchString, 10);
      if (rs){
        let skills = await formatSkills(rs, langCode);
        return res.json({
          success:true,
          skills
        });
      }
      return res.json({
        success:false,
        msg:'skills empty!',
        skills:[]
      });
    case 'users':
      rs = await getSuggestUser(searchString, 10);
      if (rs){
        let users = await formatUsers(rs);
        return res.json({
          success:true,
          users
        });
      }
      return res.json({
        success:false,
        msg:'users empty!',
        users:[]
      });
    case 'knowledge':
      rs = await getSuggestKnowledge(searchString, 10);
      if (rs){
        let knowledge = await formatKnowledge(rs);
        return res.json({
          success:true,
          knowledge
        });
      }
      return res.json({
        success:false,
        msg:'knowledge empty!',
        knowledge:[]
      });
    case 'questions':
      rs = await getSuggestQuestion(searchString, 10);
      if (rs){
        let questions = await formatQuestions(rs);
        return res.json({
          success:true,
          questions
        });
      }
      return res.json({
        success:false,
        msg:'questions empty!',
        questions:[]
      });
    case 'courses':
      rs = await getSuggestCourse(searchString,10,'',skip);
      if (rs){
        let courses = await formatCourses(rs);
        return res.json({
          totalPage:Math.ceil(rs.hits.total/10),
          pageCurrent:page,
          success:true,
          courses
        });
      }
      return res.json({
        success:false,
        msg:'courses empty!',
        courses:[]
      });
    case 'webinars':
      rs = await getSuggestWebinar(searchString,10,'',skip);
      if (rs){
        let webinars = await formatWebinars(rs , langCode);
        return res.json({
          totalPage:Math.ceil(rs.hits.total/10),
          pageCurrent:page,
          success:true,
          webinars
        });
      }
      return res.json({
        success:false,
        msg:'webinars empty!',
        webinars:[]
      });
    default:
      rs = await Promise.all([
        getSuggestSkill(searchString, 5),
        getSuggestUser(searchString, 5),
        getSuggestKnowledge(searchString, 5),
        getSuggestQuestion(searchString, 5),
        getSuggestCourse(searchString,5),
        getSuggestWebinar(searchString,5),
      ]);

      return res.json({
        skills: rs[0] ? await formatSkills(rs[0], langCode) : [],
        users: rs[1] ? await formatUsers(rs[1]) : [],
        knowledge: rs[2] ? await formatKnowledge(rs[2]) : [],
        questions: rs[3] ? await formatQuestions(rs[3]) : [],
        courses: rs[4] ? await formatCourses(rs[4]) : [],
        webinars: rs[5] ? await formatWebinars(rs[5]) : []
      });
  }
}

export async function getUserByName(req, res) {
  let searchString = req.query.q ? decodeURIComponent(req.query.q.toLowerCase()) : "";
  const limit = req.query.limit < 51 ? req.query.limit : 20;
  let type = req.query.type; //All, expert, user
  let rs = await getSuggestUser(searchString, limit || 10);
  let users = await formatUsers(rs);

  switch (type) {
    case 'expert':
      users = users.filter(user => user.expert === 1);
      break;
    case 'user':
      users = users.filter(user => user.expert !== 1);
      break;
    default:
      break;
  }

  return res.json({success: true, data:users});
}

function buildArrayKeys(input) {

}

function formatSkills(rs, langCode) {
  let skillIds = rs?.hits?.hits?.map(skill => skill._source.id);
  return Skill.formatSuggestData(Skill, skillIds, langCode);
}

function formatUsers(rs) {
  let userIds = rs?.hits?.hits?.map(user => user._source.id);
  return User.formatBasicInfo(User, userIds);
}

function formatKnowledge(rs) {
  let knowledgeIds = rs?.hits?.hits?.map(knowledge => knowledge._source.id);
  return Knowledge.formatSuggestData(Knowledge, knowledgeIds);
}

function formatQuestions(rs) {
  let questionIds = rs?.hits?.hits?.map(question => question._source.id);
  return Question.formatSuggestData(Question, questionIds);
}
function formatCourses(rs) {
  let courses = rs?.hits?.hits?.map(course => course._source.id);
  return Courses.formatSuggestData(Courses, courses);
}
async function formatWebinars(rs, langCode) {
  let webinars = rs?.hits?.hits?.map(webinar => webinar._source.id);
  webinars = await liveStream.formatSuggestData(liveStream, webinars);
  return await liveStream.getMetadata(webinars, langCode)
}
async function getSuggestSkill(input, size, department) {
  let body = bodybuilder().size(size).query('match_phrase_prefix', 'name', input).build();
  return Elasticsearch.search('skills', body, department);
}

async function getSuggestUser(input, size) {
  let body = bodybuilder().size(size).query('match_phrase_prefix', 'search_text', input).build();
  return Elasticsearch.search('users', body);
}

async function getSuggestKnowledge(input, size, department) {
  let body = bodybuilder().size(size).query('match_phrase_prefix', 'search_text', input).build();
  return Elasticsearch.search('knowledge', body, department);
}

async function getSuggestQuestion(input, size, department) {
  let body = bodybuilder().size(size).query('match_phrase_prefix', 'search_text', input).build();
  return Elasticsearch.search('questions', body, department);
}
async function getSuggestCourse(input, size, department) {
  let body = bodybuilder()
    .size(size)
    .query('match_phrase_prefix', 'search_text', input)
    .andQuery('terms','status',['1','2','3','4'])
    .build();
  return Elasticsearch.search('courses', body, department);
}
async function getSuggestWebinar(input, size, department) {
  let body = bodybuilder()
                .size(size)
                .sort('dateLiveStream','asc')
                .query('match_phrase_prefix', 'search_text', input)
                .andQuery('range','dateLiveStream',{'gt':Date.now()})
                .build();
  return Elasticsearch.search('webinars', body, department);
}

export async function getReport(req, res) {
  try {
    let conditions = {};
    let lastSerchReportSetting = await ServerSettings.findOne({key: 'last_search_report'}).lean();
    if(lastSerchReportSetting) {
      conditions['_id'] = {$gt: lastSerchReportSetting.value};
    } else {
      let toDay = new Date();
      // console.log('toDay:', toDay);
      let thatDay = new Date(toDay.setDate(toDay.getDate() - 7));
      // console.log('thatDay:', thatDay);
      conditions['createdDate'] = {$gte: thatDay};
    }

    let data = await UserSearch.find(conditions).lean();
    if(!data || !data.length) {
      return res.end('No more data');
    }

    res.writeHead(200, {
      'Content-Type': 'text/json',
      'Content-Disposition': 'attachment; filename=data.json'
    });
    let lastSearchId = data[data.length - 1]._id;
    // console.log('lastSearchId:', lastSearchId);
    await ServerSettings.update({key: 'last_search_report'}, {$set: {value: lastSearchId}}, {upsert: true});

    data = JSON.parse(JSON.stringify(data));

    let userIds = data.map(search => search.user);
    let users = await User.find({_id: {$in: userIds}}).lean();
    let userMapper = ArrayHelper.toObjectByKey(users, '_id');
    data = data.map(search => {
      search.email = userMapper[search.user].email;
      search.fullName = userMapper[search.user].fullName;
      return search;
    });

    data = JSON.stringify(data);
    // console.log('data:', data.length);
    return res.end(data);

  } catch (err) {
    console.log('err cmnr');
  }
}
