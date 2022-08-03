import User from '../models/user';
import Course from '../models/courses';
import JoinCourse from '../models/joinCourse';
import CourseCode from '../models/courseCode';
import UsedPassword from '../models/courseUsedPassword';
import MutipleChoice from '../models/multipleChoice';
import QuestionMultipleChoice from '../models/questionMultipleChoice';
import ReportMultipleChoice from '../models/reportMultipleChoice';
import Contact from '../models/contact';
import {createMultipleChoice,
  updateMultipleChoice,
  multipleChoices,
  addResultMultipleChoice,
  multipleChoicesReport,
  multipleChoicesReportAdmin} from '../services/multipleChoice.services';

import globalConstants from '../../config/globalConstants';
import Refund from "../models/refund";
import ArrayHelper from "../util/ArrayHelper";
export const uploadURL = 'uploads/';

var path = require('path');
export async function getMultipleChoice(req, res) {
  try {
    let mutipleChoice = await MutipleChoice.findById(req.params.id).lean();
    let questions = await QuestionMultipleChoice.find({multipleChoice: req.params.id}).sort({index: 1}).lean();
    questions = questions.map(question => {
      question.id = question._id;
      return question
    });
    mutipleChoice.questions = questions;
    return res.json({success: true, data: mutipleChoice})
  } catch(err) {
    console.log('err on getMultipleChoice:', err);
    return res.status(500).json(err);
  }
}
export async function removeMultipleChoiceCourse(req, res) {
  try {
    let id = req.params.id || ''
    if(!id){
      return res.status(500).json(err);
    }
    await MutipleChoice.update(
      {
        _id: id
      },
      {
        $unset: {
          lesson: '',
          course: ''
        }
      }
    )
    return res.json({success: true})
  } catch(err) {
    console.log('err on getMultipleChoice:', err);
    return res.status(500).json(err);
  }
}
export async function getMetaMultipleChoiceBySlug(req, res) {
  try {
    let mutipleChoice = await MutipleChoice.findOne({slug: req.params.slug}).lean();
    if(!mutipleChoice){
      return res.json({
        success: false,
        code: 'MULTIPLE_NOT_FOUND'
      });
    }
    mutipleChoice.total = await QuestionMultipleChoice.count({multipleChoice: mutipleChoice._id});
    mutipleChoice.totalJoined = await ReportMultipleChoice.count({'multipleChoice._id':mutipleChoice._id});
    let course = {}
    if(mutipleChoice.course){
      course = await Course.findById(mutipleChoice.course).lean()
    }
    return res.json({
      success: true,
      data: mutipleChoice,
      courseSlug: course ? course.slug : '',
      title: mutipleChoice.title,
      description: mutipleChoice.description
    })
  } catch(err) {
    console.log('err on getMultipleChoiceBySlug:', err);
    return res.status(500).json(err);
  }
}
export async function getMultipleChoiceQuestionBySlug(req, res) {
  try {
    let mutipleChoice = await MutipleChoice.findOne({slug: req.params.slug}).lean();
    if(!mutipleChoice){
      return res.json({
        success: false,
        code: 'MULTIPLE_NOT_FOUND'
      });
    }
    let data = await QuestionMultipleChoice.find({multipleChoice: mutipleChoice._id}).sort({index: 1}).lean();
    if(data){
      data = data.map(question => {
        let answers = []
        if(question.answers){
          answers = question.answers.map(answer => {
            return {
              _id: answer._id,
              title: answer.title,
              fileUrl: answer.fileUrl,
            }
          })
        }
        return {
          _id: question._id,
          title: question.title,
          fileUrl: question.fileUrl,
          multipleChoice: question.multipleChoice,
          desMore: question.desMore,
          fileUrlMore: question.fileUrlMore,
          onMore: question.onMore,
          answers: answers
        }
      })
    }
    return res.json({
      success: true,
      data
    })
  } catch(err) {
    console.log('err on getMultipleChoiceBySlug:', err);
    return res.status(500).json(err);
  }
}
export async function getMultipleChoiceQuestionCoursenBySlug(req, res) {
  try {
    let user = req.user._id || '';
    let userInfo = await User.findById(user)
    if(!user || !userInfo){
      return res.json({
        success: false,
        code: 'USER_NOT_FOUND'
      });
    }
    let mutipleChoice = await MutipleChoice.findOne({slug: req.params.slug}).lean();
    if(!mutipleChoice){
      return res.json({
        success: false,
        code: 'MULTIPLE_NOT_FOUND'
      });
    }
    let courseInfo = await Course.findById(mutipleChoice.course).lean()
    if(!courseInfo){
      return res.json({
        success: false,
        code: 'COURSE_NOT_FOUND'
      });
    }
    if(courseInfo.lectures.indexOf(user.toString()) < 0 && courseInfo.creator.toString() !== user.toString()) {
      if (courseInfo.isMembership) {
        if (userInfo.memberShip < new Date().getTime()) {
          if (!actions[0] || !actions[1] || !actions[2]) {
            return res.json({
              success: false,
              code: 'MEMBERSHIP_EXPIRED'
            });
          }
        }
      } else {
        let actions = await Promise.all([
          JoinCourse.findOne({user: user, course: courseInfo._id}).lean(),
          CourseCode.findOne({courseId: courseInfo._id, userUsedId: user}).lean(),
          UsedPassword.findOne({courseId: courseInfo._id, userId: user}).lean()
        ]);
        if (!actions[0] && !actions[1] && !actions[2]) {
          return res.json({
            success: false,
            code: 'USER_NOT_JOIN_COURSE'
          });
        }
      }
    }
    let data = await QuestionMultipleChoice.find({multipleChoice: mutipleChoice._id}).sort({index: 1}).lean();
    if(data){
      data = data.map(question => {
        let answers = []
        if(question.answers){
          answers = question.answers.map(answer => {
            return {
              _id: answer._id,
              title: answer.title,
              fileUrl: answer.fileUrl,
            }
          })
        }
        return {
          _id: question._id,
          title: question.title,
          fileUrl: question.fileUrl,
          multipleChoice: question.multipleChoice,
          desMore: question.desMore,
          fileUrlMore: question.fileUrlMore,
          onMore: question.onMore,
          answers: answers
        }
      })
    }
    return res.json({
      success: true,
      data
    })
  } catch(err) {
    console.log('err on getMultipleChoiceBySlug:', err);
    return res.status(500).json(err);
  }
}
export async function uploadImageShare(req, res) {
  try {
    var base64Data = req.body.data;
    var base64_attachement = base64Data.replace(/^data:image\/\w+;base64,/, '');
    let filepath = path.resolve(__dirname, '../../' + uploadURL + 'shareFB/' + req.params.id + '.png');
    require("fs").writeFile(filepath, base64_attachement, {encoding: 'base64'}, function (err) {
      res.json({success: true})
    });
  } catch(err) {
    console.log('err on getMultipleChoiceBySlug:', err);
    return res.status(500).json(err);
  }
}
export async function getMultipleChoicesReport(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let _id = req.params.id || '';
    let mutipleChoice = await MutipleChoice.findById(_id).lean();
    if(!mutipleChoice){
      return res.json({
        success: false,
        code: 'MULTIPLE_NOT_FOUND'
      });
    }
    let results = await multipleChoicesReportAdmin(mutipleChoice._id, page);
    results.success = true;
    results.current_page = page;
    results.last_page = Math.ceil(results.total_items / 10);
    return res.status(200).json(results);
  } catch(err) {
    console.log('err on getMultipleChoicesReport:', err);
    return res.status(500).json(err);
  }
}
export async function getReportsMultipleChoice(req, res) {
  try {

    let user = req.user._id || '';
    let mutipleChoice = await MutipleChoice.findOne({slug: req.params.slug}).lean();
    if(!mutipleChoice){
      return res.json({
        success: false,
        code: 'MULTIPLE_NOT_FOUND'
      });
    }
    let lecturer = false
    if(user.toString() === mutipleChoice.user.toString()){
      lecturer = true
    }
    let page = Number(req.query.page || 1).valueOf();
    let _id = req.params.id || '';
    let results = await multipleChoicesReport(mutipleChoice._id, page, lecturer, user, 1000);
    if(mutipleChoice.course){
      let course = await Course.findById(mutipleChoice.course).lean()
      if(course){
        results.courseSlug = course.slug
      }
    }

    mutipleChoice.total = await QuestionMultipleChoice.count({multipleChoice: mutipleChoice._id});
    mutipleChoice.totalJoined = await ReportMultipleChoice.count({'multipleChoice._id':mutipleChoice._id});
    results.success = true;
    results.multipleChoice = mutipleChoice;
    results.current_page = page;
    results.last_page = Math.ceil(results.total_items / 10);
    return res.status(200).json(results);
  } catch(err) {
    console.log('err on getMultipleChoicesReport:', err);
    return res.status(500).json(err);
  }
}
export async function getReportMultipleChoice(req, res) {
  try {
    let data = await ReportMultipleChoice.findById(req.params.id).lean();
    if(!data){
      return res.json({
        success: false,
        code: 'MULTIPLE_NOT_FOUND'
      });
    }
    data.totalQuestions = data.questions.length;
    let title = data.contact.name + ' đã trả lời đúng ' + data.corrected + '/' + data.totalQuestions
      + ' bài trắc nghiệm ' + data.multipleChoice.title;
    data.description = data.multipleChoice.description;
    data.contact = data.contact.name;
    data.totalJoined = await ReportMultipleChoice.count({'multipleChoice._id': data.multipleChoice._id});
    if(data.multipleChoice.course){
      let courseInfo = await Course.findById(data.multipleChoice.course).lean()
      if(courseInfo){
        data.courseSlug = courseInfo.slug
      }
    }
    let view = false
    if((data.multipleChoice &&
      data.multipleChoice.course &&
      req.user._id &&
      data.contact.user &&
      req.user._id.toString() === data.contact.user.toString()) ||
      (data.multipleChoice &&
        data.multipleChoice.user &&
        data.multipleChoice.course &&
        req.user._id &&
        req.user._id.toString() ===  data.multipleChoice.user.toString())){
        view = true
    }
    if(!view){
      delete data.questions;
    }
    return res.json({
      success: true,
      title,
      description: data.multipleChoice.description,
      thumbnails : [`uploads/shareFB/${data._id}.png`] || [''],
      data
    })
  } catch(err) {
    console.log('err on getReporttMultipleChoice:', err);
    return res.status(500).json(err);
  }
}
export async function sendMultipleChoice(req, res) {
  try {
    let mutipleChoice = await MutipleChoice.findById(req.body._id).lean();
    if(!mutipleChoice){
      return res.json({
        success: false,
        code: 'MULTIPLE_NOT_FOUND'
      });
    }
    let data = await addResultMultipleChoice(req.body,req.user ? req.user._id : '');
    data = JSON.parse(JSON.stringify(data));
    data.totalQuestions = data.questions.length;
    delete data.questions;
    return res.json({success: true, data})
  } catch(err) {
    console.log('err on sendMultipleChoice:', err);
    return res.status(500).json(err);
  }
}
export async function sendInfoEbook(req, res) {
  try {
    let data = req.body, key = req.params.key, ebooks = globalConstants.ebooks, ebookDown = {};
    if(!key){
      return res.json({
        success: false,
        code: 'EBOOK_NOT_FOUND'
      });
    }
    ebooks.map(ebook => {
      if(ebook.key === key){
        ebookDown = ebook;
      }
    })
    data.ebook = ebookDown;
    await Contact.create({information: data});
    return res.json({success: true, link: uploadURL + ebookDown.link})
  } catch(err) {
    console.log('err on sendMultipleChoice:', err);
    return res.status(500).json(err);
  }
}
export async function userGetMultipleChoices(req, res) {
  try {
    let data = await MutipleChoice.find({$or: [{lesson: ''}, {lesson: {$exists: false}}]}, 'title slug description time').lean();
    return res.status(200).json({success: true, data});
  } catch(err) {
    console.log('err on userGetMultipleChoices:', err);
    return res.status(500).json(err);
  }
}

export async function getMultipleChoices(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let results = await multipleChoices(page);
    results.success = true;
    results.current_page = page;
    results.last_page = Math.ceil(results.total_items / 10);

    return res.status(200).json(results);
  } catch(err) {
    console.log('err on getMultipleChoice:', err);
    return res.status(500).json(err);
  }
}

export async function getMultipleChoiceByUser(req, res) {
  try {
    let user = req.user._id || '';
    let results = await MutipleChoice.find({user: user}).lean()
    return res.status(200).json({success: true, data: results});
  } catch(err) {
    console.log('err on getMultipleChoiceByUser:', err);
    return res.status(500).json(err);
  }
}

export async function addMultipleChoice(req, res) {
  try {
    let data  = req.body;
    data.user = req.user._id || '';
    return res.json({success: true, data: await createMultipleChoice(data)})
  } catch(err) {
    console.log('err on addMultipleChoice:', err);
    return res.status(500).json(err);
  }
}

export async function editMultipleChoice(req, res) {
  try {
    let data  = req.body;
    let _id  = req.params.id;
    data.user = req.user._id || '';
    return res.json({success: true, data: await updateMultipleChoice(_id, data)})
  } catch(err) {
    console.log('err on addMultipleChoice:', err);
    return res.status(500).json(err);
  }
}
export async function deleteMultipleChoice(req, res) {
  try {
    let _id  = req.body._id;
    await MutipleChoice.remove({_id: _id});
    await QuestionMultipleChoice.remove({multipleChoice: _id});
    return res.json({success: true,})
  } catch(err) {
    console.log('err on deleteMultipleChoice:', err);
    return res.status(500).json(err);
  }
}
