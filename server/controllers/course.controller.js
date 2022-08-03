import * as CourseServices from '../services/course.services';
import StringHelper from '../util/StringHelper';
import Category from '../models/category';
import User from '../models/user';
import Course from '../models/courses';
import CourseCode from '../models/courseCode';
import CourseUsedPassword from '../models/courseUsedPassword';
import LiveStream from '../models/liveStream';
import UserToCourse from '../models/userToCourse';
import JoinCourse from '../models/joinCourse';
import UserViewStreamTracking from '../models/userViewStreamTracking';
import UserViewCourseTracking from '../models/userViewCourseTracking';
import configs from '../config';
import {mathTime} from "../services/liveStream.services";
import {generateInviteCode, hash, validate} from '../models/functions';
import {Q} from '../libs/Queue';
import globalConstants from "../../config/globalConstants";
import sanitizeHtml from "sanitize-html";
import {exportCourseStudent} from "../scripts/exports_data/export_course";
import path from "path";
import Feed from "../models/feeds";
import ArrayHelper from "../util/ArrayHelper";
import UserViewTracking from "../models/userViewTracking";
import BookingWebinar from "../models/bookingWebinar";
import {serviceGetCurrentTime,
  serviceUpdateCurrentTime,
  serviceGetCompleteCourse,
  serviceGetTotalUser,
  serviceGetCompleteProcess } from '../services/video.services'
import mongoose from "mongoose";
import fs from 'fs';

export const STATUS_MAPPER = {
  living: 1,
  on_going: 2,
  up_coming: 3,
  finish: 4,
  waiting: 5,
  rejected: 6,
  waiting_delete: 7,
  deleted: 8,
  expired: 9
};

export async function createCourse(req, res) {
  try {
    let data = req.data;
    let courseOptions = {
      title: data.title,
      lectures: data.lectures || [req.user._id.toString()],
      creator: req.user._id,
      description: data.description,
      category: data.category,
      tags: data.tags,
      slug: req.courseSlug,
      maxStudents: Number(data.maxStudents).valueOf(),
      language: data.language || 'en',
      duration: Number(data.duration).valueOf(),
      regularPrice: Number(data.regularPrice || 0).valueOf(),
      price: Number(data.price || 0).valueOf(),
      password: data.password ? hash(sanitizeHtml(data.password)) : '',
      buyAble: data.buyAble,
      hideCourse: data.hideCourse,
      videoEmbed: data.videoEmbed,
      thumbnail: req.lessonFiles && req.lessonFiles.thumbnail ? req.lessonFiles.thumbnail.shift()['address'] : undefined
    };

    if(!courseOptions.title) {
      return res.status(400).json({success: false, error: 'Title is required.'});
    }

    if(! (courseOptions.lectures instanceof Array)) {
      return res.status(400).json({success: false, error: 'Invalid lectures.'});
    }

    if(courseOptions.lectures.indexOf(req.user._id.toString()) < 0) {
      courseOptions.lectures.push(req.user._id.toString());
    }
    courseOptions.lectures = courseOptions.lectures.filter(lecture => StringHelper.isObjectId(lecture));
    if(courseOptions.category) {
      if (!StringHelper.isObjectId(courseOptions.category)) {
        return res.status(404).json({success: false, error: 'Category not found.'});
      }
      let cate = await Category.findById(courseOptions.category, '_id').lean();
      if (!cate) {
        return res.status(404).json({success: false, error: 'Category not found.'});
      }
    }

    if(isNaN(courseOptions.maxStudents)) {
      return res.status(400).json({success: false, error: 'Invalid max students.'});
    }

    if(isNaN(courseOptions.duration)) {
      return res.status(400).json({success: false, error: 'Invalid duration.'});
    }

    if(isNaN(courseOptions.regularPrice)) {
      return res.status(400).json({success: false, error: 'Invalid price.'});
    }

    if(isNaN(courseOptions.price)) {
      return res.status(400).json({success: false, error: 'Invalid price.'});
    }
    let code = await CourseServices.getCodeCourse();
    courseOptions.code = code + 1;
    let dataSuccess = await CourseServices.createCourse(courseOptions);
    return res.status(200).json({success: true, data: dataSuccess});
  } catch (err) {
    console.log('err:', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function joinCourse(req, res) {
  try {
    let courseId = req.params.id || '';
    let codeCoupon = req.query.code || '';
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    let data = await CourseServices.joinCourse(req.user._id, courseId, req.headers.lang, req.query.aff || '', codeCoupon, '');

    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getCourses(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let request =  req.query.admin === 'true';
    let home = req.query.home === 'true';
    let type = req.query.type || 'all';
    let userName = req.query.userName || '';

    let userInfo  = {};
      if(userName){
        userInfo = await User.findOne({userName: userName}).lean();
        if(!userInfo || userInfo.expert !== 1){
          return res.status(200).json({});
        }
      }
    let options = {
      page,
      request,
      home,
      type,
      userName,
      status: STATUS_MAPPER[req.query.status],
      langCode: req.headers.lang,
      user: userInfo._id || ''
    };
    if (req?.query?.keyword) {
      options.keyword = req.query.keyword
    }
    if (req?.query?.category) {
      options.category = req.query.category;
    }
    if(req.headers && req.headers.token) {
      let user = await User.findOne({token: req.headers.token}, '_id role').lean();
      if(user) {
        options.requester = user;
      }
    }

    let results = await CourseServices.getCourses(options);
    results.success = true;
    results.current_page = page;
    results.last_page = Math.ceil(results.total_items / CourseServices.COURSE_LIMIT);

    return res.status(200).json(results);
  } catch (err) {
    console.log('err:', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getScheduledByUser(req, res) {
  try{
    let dates = req.body.dates || [];
    let id = req.user._id;
    if(dates.length){
      let promises = dates.map(async date => {
        return await CourseServices.getCourseBydate(date, id);
      });
      let data = await Promise.all(promises);
      let lessons = [[], [], []];
      data.map((item) => {
        item.map((i, index) => {
          switch (index) {
            case 0:
              lessons[0].push(i)
              break
            case 1:
              lessons[1].push(i)
              break
            case 2:
              lessons[2].push(i)
              break
          }
        })
      })
      return res.status(200).json({success: true,data: lessons});
    } else {
      return res.json({
        success: true,
        data: []
      })
    }
  }catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

export async function getScheduledMembership(req, res) {
  try {
    let dates = req.body.dates || [];
    if(dates){
      let promises = dates.map(async date => {
        return await CourseServices.getCourseBydate(date);
      })
      let data = await Promise.all(promises);
      let lessons = [[], [], []];
      data.map((item) => {
        item.map((i, index) => {
          switch (index) {
            case 0:
              lessons[0].push(i)
              break
            case 1:
              lessons[1].push(i)
              break
            case 2:
              lessons[2].push(i)
              break
          }
        })
      })
      return res.status(200).json({success: true,data: lessons});
    }
  } catch (err) {
    console.log('err getScheduledMembership: ', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function searchCourses(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let search = req.query.q || '';
    let options = {
      search,
      page,
      status: STATUS_MAPPER[req.query.status],
      langCode: req.headers.lang
    };
    if(req.headers && req.headers.token) {
      let user = await User.findOne({token: req.headers.token}, '_id role').lean();
      if(user) {
        options.requester = user;
      }
    }

    let results = await CourseServices.getCourses(options);
    results.success = true;
    results.current_page = page;
    results.last_page = Math.ceil(results.total_items / CourseServices.COURSE_LIMIT);

    return res.status(200).json(results);
  } catch (err) {
    console.log('err:', err);
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getCourseToUpdate(req, res) {
  try {
    let requesterId = '', role = '';
    if(req.headers && req.headers.token) {
      let user = await User.findOne({token: req.headers.token}, '_id role memberShip').lean();
      if(user) {
        requesterId = user._id.toString();
        role = user.role;
      }
    }

    let data;

    if(req.query.id) {
      if(!StringHelper.isObjectId(req.query.id)) {
        return res.status(404).json({success: false, error: 'Course not found.'});
      }
      data = await CourseServices.getCourseToUpdate(req.query.id, null, requesterId, role, req.headers.lang);
    } else if (req.query.slug) {
      data = await CourseServices.getCourseToUpdate(null, req.query.slug, requesterId, role, req.headers.lang);
    } else {
      return res.status(400).json({success: false, error: 'Please provide id or slug.'});
    }
    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getCourse(req, res) {
  try {
    let requesterId = '', role = '', memberShip = false;
    if(req.headers && req.headers.token) {
      let user = await User.findOne({token: req.headers.token}, '_id role memberShip').lean();
      if(user) {
        requesterId = user._id.toString();
        role = user.role;
        if(user && user.memberShip > new Date().getTime()){
          memberShip = true;
        }
      }
    }

    let data;

    if(req.query.id) {
      if(!StringHelper.isObjectId(req.query.id)) {
        return res.status(404).json({success: false, error: 'Course not found.'});
      }
      data = await CourseServices.getCourse(req.query.id, null, requesterId, role, req.headers.lang, memberShip);
    } else if (req.query.slug) {
      data = await CourseServices.getCourse(null, req.query.slug, requesterId, role, req.headers.lang, memberShip);
    } else {
      return res.status(400).json({success: false, error: 'Please provide id or slug.'});
    }
    if(data.isMembership){
      data.memberShip = memberShip;
    } else {
      data.memberShip = false;
    }
    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status).json(err);
  }
}

export async function getMetaCourse(req, res) {
  try {
    let data = await CourseServices.getCourse(null, req.params.slug, '', req.headers.lang);
    // console.log('dât: ', data);
    if(data){
      let tags = [];
      if(data.tags){
        data.tags.map(tag => {
          tags.push(tag.name);
        });
      }
      return res.json({
        title : data.title,
        description: data.description.general,
        tags : tags,
        type : 'article',
        thumbnails : [data.thumbnail] || [''],
      });
    } else {
      return res.json({});
    }
  } catch (err) {
    console.log('err: ', err)
    return res.json({});
  }
}

export async function deleteCourse(req, res) {
  try {
    let courseId = req.params.id;
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    let data = await CourseServices.deleteCourse(courseId, req.user._id, req.user.role);

    return res.status(200).json({success: true, data});
  } catch (err) {
    if(!err.status) {
      return res.status(500).json(err);
    }
    err.success = false;
    return res.status(err.status).json(err);
  }
}
export async function adminDeleteCourse(req, res) {
  try {
    let courseIds = req.body.ids;
    if(courseIds.length === 0) {
      throw {
        status: 400,
        success: false,
        error: 'Invalid Params'
      }
    }
    let promise = courseIds.map(async e => {
      await CourseServices.deleteCourse(e, req.user._id, req.user.role);
    });
    await Promise.all(promise);
    return res.json({
      success: true
    })
  } catch (err) {
    return res.status(err.status).json(err);
  }
}

export async function getMyCourses(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();

    let results = await CourseServices.getMyCourses(req.user._id, page, req.query, req.headers.lang, req.query.type);
    results.success = true;
    results.current_page = page;
    results.last_page = Math.ceil(results.total_items / CourseServices.COURSE_LIMIT);

    return res.status(200).json(results);
  } catch (err) {
    err.success = false;
    console.log('error getMyCourses: ', err)
    return res.status(err.status || 500).json(err);
  }
}

export async function getAllMyCourses(req, res) {
  try {
    let results = await Course.find({creator: req.user._id}, 'title');
    return res.status(200).json({
      success: true,
      data: results
      });
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getLessonsCourse(req, res) {
  try {
    let results = await LiveStream.find({course: req.query.course}, 'title');
    return res.status(200).json({
      success: true,
      data: results
      });
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getJoinedCourses(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let results = await CourseServices.getJoinedCourses(page, req.query.status, req.user._id, req.headers.lang);
    results.success = true;
    results.current_page = page;
    results.last_page = Math.ceil(results.total_items / CourseServices.COURSE_LIMIT);

    return res.status(200).json(results);
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function requestRefund(req, res) {
  try {
    let courseId = req.params.id;
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    await CourseServices.requestRefund(req.user._id, courseId, req.body.reason);

    return res.status(200).json({success: true});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function deleteCourseVideo(req, res) {
  try {
    let videoId = req.params.videoId;
    let lessonId = req.params.lessonId;
    if(!videoId) {
      return res.status(404).json({success: false, error: 'Video not found.'});
    }
    if(!StringHelper.isObjectId(lessonId)) {
      return res.status(404).json({success: false, error: 'Lesson not found.'});
    }
    let lessonInfo = await LiveStream.findById(lessonId, 'streamFiles').lean();
    if(lessonInfo && lessonInfo.streamFiles){
      lessonInfo.streamFiles = lessonInfo.streamFiles.map(file => {
        if(file.fileId === videoId){
          file.status = false
        }
        return file
      })
    }
    LiveStream.update({_id: lessonId}, {$set: {streamFiles: lessonInfo.streamFiles}}).exec();
    return res.status(200).json({success: true});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function updateCourse(req, res) {
  try {
    let data = JSON.parse(req.body.data);
    let courseId = data.courseId;
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    let course = await CourseServices.getCourseModelById(courseId);

    if(!course) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    if(req.user._id.toString() !== course.creator.toString()) {
      return res.status(403).json({success: false, error: 'Permission denied.'});
    }

    data.thumbnail = req.lessonFiles && req.lessonFiles.thumbnail ? req.lessonFiles.thumbnail[0]['address'] : undefined;
    if(!data.lectures) {
      data.lectures = [];
    }
    if(data.lectures.indexOf(req.user._id.toString()) < 0) {
      data.lectures.push(req.user._id.toString());
    }

    if(data.lessons && data.lessons.length && req.lessonFiles) {
      // courseOptions.start_date = Number(req.data.lessons[0].dateLiveStream).valueOf();
      data.start_date = mathTime(data.lessons[0]);
      data.lessons = data.lessons.map(lesson => {
        if(lesson.type !== 'multiple'){
          lesson.slug = req.cuidMapper[lesson.cuid];
        }
        if(lesson.type === 'schedule'){
          data.next_lesson_date = mathTime(lesson);
        }
        return lesson;
      });
    }
    // if(data.deleted_files && data.deleted_files.length) {
    //   // courseOptions.start_date = Number(req.data.lessons[0].dateLiveStream).valueOf();
    //   data.start_date = mathTime(data.lessons[0]);
    //   data.lessons = data.lessons.map(lesson => {
    //     lesson.deleted_files = data.deleted_files[lesson.cuid];
    //     return lesson;
    //   });
    // }
    course = await CourseServices.updateCourse(course, data, req.headers.lang);

    return res.status(200).json({success: true, data: course});
  } catch (err) {
    console.log('err:', err);
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}


export async function adminUpdateMembership(req, res) {
  try {
    let courseId = req.query.courseId;
    let status = req.query.status && req.query.status === 'true' ? true : false;
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    await Course.update({_id: courseId}, {$set: {isMembership: status}}).exec();
    return res.status(200).json({success: true});
  } catch (err) {
    console.log('err:', err);
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function updateBrokenLesson(req, res) {
  try {
    let courseId = req.params.courseId;
    let lessonId = req.params.lessonId;
    if(!StringHelper.isObjectId(courseId) || !StringHelper.isObjectId(lessonId)) {
      return res.status(404).json({success: false, error: 'Course or lesson not found.'});
    }
    return res.status(200).json({
      success: true,
      data: await CourseServices.updateCourseBrokenLesson(courseId, lessonId)});
  } catch (err) {
    console.log('err:', err);
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function adminConsiderCourse(req, res) {
  try {
    let courseId = req.params.id;
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    await CourseServices.adminConsiderCourse(courseId, req.body.status, req.user._id, req.body.notes, req.body.commission);
    await CourseServices.PushNotificationCourse(courseId, req.body.status);
    return res.status(200).json({success: true});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function checkBuyAble(req, res) {
  try {
    let courseId = req.params.id;
    let code = req.query.code;
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    let data = await CourseServices.checkBuyAble(req.user._id, courseId, req.headers.lang, code);

    return res.status(200).json({success: true, data});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function adminApproveDeleteCourse(req, res) {
  try {
    let courseId = req.params.id;
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    await CourseServices.adminApproveDeleteCourse(req.user._id, courseId, req.body.notes);

    return res.status(200).json({success: true});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function checkCanStartLesson(req, res) {
  try {
    let lessonId = req.query.lesson;
    if(!StringHelper.isObjectId(lessonId)) {
      return res.status(404).json({success: false, error: 'Lesson not found.'});
    }
    let canStart = await CourseServices.checkCanStartLesson(lessonId);
    return res.status(200).json({success: true, data: {canStart: canStart}});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function adminGetCourse(req, res) {
  try {
    let id = req.params.id || ''
    if(!id){
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    return res.status(200).json({
      success: true,
      data: await Course.findById(id).lean(),
      lessons: await LiveStream.find({course: id, type:{$ne: 'video'}}).sort({'time.dateLiveStream': 1}).lean(),
      video: await LiveStream.find({course: id, type: 'video'}).sort({'time.dateLiveStream': 1}).lean()
    });
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
export async function addUsersToCourse(req, res) {
  try {
    let id = req.params.id || '', users = req.body.users || []
    if (!id) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    if (!users.length) {
      return res.status(404).json({success: false, error: 'Users empty.'});
    }
    let promise = users.map(async user => {
      let check_user_to_course = await UserToCourse.findOne({
        user: user._id,
        course: id
      }).lean();
      if(!check_user_to_course){
        await UserToCourse.create({
          user: user._id,
          course: id
        });
        let check_user_code = await CourseCode.findOne({
          userUsedId: user._id,
          courseId: id
        }).lean();
        if(!check_user_code){
          let info = await User.findById(user._id).lean();
          let code = generateInviteCode();
          await CourseCode.create({
            userUsedId: user._id,
            courseId: id,
            code,
            usedDate: Date.now(),
            userCreate: req.user._id,
            info_contact:{
              numberPhone: info.telephone || '',
              email: info.email || ''
            }
          });
          Q.create(globalConstants.jobName.AFTER_JOIN_COURSE, {
            course: id,
            user: user._id
          }).removeOnComplete(true).save();
        }
      }
    });
    await Promise.all(promise);
    return res.status(200).json({success: true});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
export async function removeUserToCourse(req, res) {
  try {
    let id = req.params.id || '', user = req.body.user || ''
    if (!id) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    if (!user) {
      return res.status(404).json({success: false, error: 'User not found.'});
    }
    await UserToCourse.remove({
      user: user,
      course: id
    });
    await CourseServices.clearUserToCourse(user, id);
    return res.status(200).json({success: true});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
export async function getUsersByCourse(req, res) {
  try {
    let id = req.params.id || ''
    if(!id){
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    let users = await UserToCourse.find({course: id}).lean()
    if(!users.length){
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    let usersPromises = users.map(async (user) => {
      return user.user
    });
    let data = await Promise.all(usersPromises);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
export async function getTrackingByCourse(req, res) {
  let userId = req.user ? req.user._id : null;
  let id = typeof req.params.id  === 'string' ? mongoose.Types.ObjectId(req.params.id) : '';
  let all = parseInt(req.query.all);
  let time = parseInt(req.query.time);
  let sort_join = req.query.sort || '';
  let text = req.query.text || '';
  if(!id){
    return res.status(404).json({success: false, error: 'Invalid Params.'});
  }
  let courseInfo = await Course.findById(id);
  if(!courseInfo){
    return res.status(404).json({success: false, error: 'Course not found.'});
  }
  if(userId){
    let userLogin = await User.findById(userId);
    if(userLogin.role !== 'admin'){
      if(userLogin._id.toString() !== courseInfo.creator.toString()) {
        return res.status(404).json({success: false, error: 'Permission denied.'});
      }
    }
  }
  let conditions = {
    course: id
  };
  if(text){
    let search_user = await User.find({
      $or: [
        {
          fullName: { $regex: text.trim(), $options: "$i" }
        },
        {
          telephone: { $regex: text.trim(), $options: "$i" }
        },
        {
          email: { $regex: text.trim(), $options: "$i" }
        }
      ]
    }).lean();
    search_user = search_user.map(e => e._id);
    conditions.user = {
      $in: search_user
    }
  }
  let users = await UserToCourse.find(conditions).lean();
  if(!users.length){
    return res.status(200).json({
      success: true,
      data: []
    });
  }
  let usersId = [];
  let usersPromises = users.map(async (user) => {
    usersId.push(user.user);
    let userInfo = await User.findById(user.user, '_id cuid fullName avatar userName email telephone').lean();
    let trackingUser = await UserViewStreamTracking.aggregate([
      { $match:{
        $and: [
            {'courseId': id},
            {'userId': user.user}
          ]
      }},
      {
        $group: {
          _id: '$streamId',
          totalTime: {$sum: '$totalTime'}
        }
      }
    ]).exec();
    let joined = 0;
    if(trackingUser) {
      trackingUser.map(tracking => {
        if (tracking.totalTime >= time*60) {
          joined++;
          tracking.joined = true
        } else {
          tracking.joined = false
        }
      })
    }
    userInfo.joined = joined;
    userInfo.dateJoin = user.createdAt;
    let codeCourse = await CourseCode.findOne({userUsedId: user.user, courseId: id}).lean();
    let tracking = trackingUser.length ? ArrayHelper.toObjectByKey(trackingUser, '_id') : {};
    let reviewLessons = await CourseServices.getReviewLessons(id, user.user);
    let note = await CourseServices.getNoteByUser({user: userInfo._id, course: id});
    return {
      userInfo: userInfo,
      tracking: tracking,
      note: note,
      status: user.result,
      step: user.step,
      nextDateSupport: user.nextDateSupport || Date.now(),
      reviewLessons: reviewLessons,
      code: codeCourse ? codeCourse.code : null,
    }
  });
  let data = await Promise.all(usersPromises);
  if(sort_join){
    if (sort_join === 'asc') {
      data = ArrayHelper.sortByBelongProp(data, "userInfo", "joined", "asc")
    } else {
      data = ArrayHelper.sortByBelongProp(data, "userInfo", "joined", "desc")
    }
  }
  let data1 = [];
  if(all || courseInfo.type === 'video'){
    let trackings = await UserViewStreamTracking.aggregate([
      { $match:{
          $and: [
            {'courseId': id},
            {'userId': { $nin: usersId}}
          ]
        }},
      {
        $group: {
          _id: '$userId',
        }
      }
    ]).exec();
    if(trackings){
      usersPromises = trackings.map(async (user) => {
        usersId.push(user.user);
        let userInfo = await User.findById(user._id, '_id cuid fullName avatar userName email telephone').lean();
        let trackingUser = await UserViewStreamTracking.aggregate([
          { $match:{
              $and: [
                {'courseId': id},
                {'userId': user._id}
              ]
            }},
          {
            $group: {
              _id: '$streamId',
              totalTime: {$sum: '$totalTime'}
            }
          }
        ]).exec();
        let joined = 0;
        if(trackingUser) {
          trackingUser.map(tracking => {
            if (tracking.totalTime >= time*60) {
              joined++;
              tracking.joined = true
            } else {
              tracking.joined = false
            }
          })
        }
        userInfo.joined = joined;
        userInfo.dateJoin = user.createdAt;
        let tracking = trackingUser.length ? ArrayHelper.toObjectByKey(trackingUser, '_id') : {};
        return {userInfo: userInfo, tracking: tracking}
      });
      data1 = await Promise.all(usersPromises);
      if(sort_join){
        if (sort_join === 'asc') {
          data1 = ArrayHelper.sortByBelongProp(data1, "userInfo", "joined", "asc")
        } else {
          data1 = ArrayHelper.sortByBelongProp(data1, "userInfo", "joined", "desc")
        }
      }
    }
  }
  return res.status(200).json({
    success: true,
    data:{
     joined: data,
     view: data1
    },
  });
}
export async function adminGetCourses(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let options = {
      page,
      search: req.query.text,
      request: true,
      status: STATUS_MAPPER[req.query.status],
      langCode: req.headers.lang,
      requester: req.user
    };

    let results = await CourseServices.getCourses(options);
    results.success = true;
    results.current_page = page;
    results.course_fee = configs.course_fee;
    results.last_page = Math.ceil(results.total_items / CourseServices.COURSE_LIMIT);

    return res.status(200).json(results);
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function adminAddHocApproveCourse(req, res) {
  try {
    let slug = req.params.slug;
    let course = await Course.findOne({slug: slug}, '_id').lean();
    if(!course) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    await CourseServices.adminConsiderCourse(course._id, 3, '58cb83c6af26811724e555dd', 'ad-hoc');

    return res.status(200).json({success: true});
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}

export async function getCourseStudents(req, res) {
  try {
    let courseId = req.params.id;
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    let course = await Course.findById(courseId).lean();
    if(!course) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    let page = Number(req.query.page || 1).valueOf();
    if(isNaN(page)) {
      return res.status(400).json({success: false, error: 'Invalid page.'});
    }

    let data = await CourseServices.getCourseStudents(courseId, page, req.headers.lang);

    return res.status(200).json(data);
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
export async function exportCourseStudents(req, res) {
  try {
    let courseId = req.query.id;
    let userId = req.user._id || null;
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    let course = await Course.findOne({_id: courseId, creator: userId}).lean();
    if(!course) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    let title = await exportCourseStudent(courseId, userId);
    let spath = path.join(__dirname,'..','..','exports',title);
    return res.download(spath, title, () => {
      fs.unlinkSync(spath);
    });
    return res.status(200).json(data);
  } catch (err) {
    err.success = false;
    return res.status(err.status || 500).json(err);
  }
}
/**
 * Get list code of this course
 * User logged in must be owner to get this list
 * If the code used, let get user info and put it to result
 * Return array of object if success:
 * [
 *   {
 *     code: 'ABFDDDF',
 *     user: {
 *        userName: 'abeff',
 *        linkProfile: '/profile/23ry283rnj2k3brjh23jhr23' || '/profile/username'
 *     }
 *   },
 *   {
 *     code: 'AIHIEFE'
 *   }
 * ]
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function getCourseCode(req, res) {
  try {
    const userId = req.user._id; // _id
    const courseId = req.params.id;

    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    let course = await Course.findById(courseId).lean();
    if(!course) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    if(req.user.role === 'user'){
      if(course.creator.toString() !== userId.toString()) {
        return res.status(403).json({success: false, error: 'Permission denied.'});
      }
    }

    let page = Number(req.query.page || 1).valueOf();
    if(isNaN(page) || page < 1) {
      return res.status(400).json({success: false, error: 'Invalid page.'});
    }

    let data = await CourseServices.getCourseCode(courseId, page, req.user.role);

    return res.status(200).json(data);
  } catch ( error ) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Generate new code for course
 * Only owner of this course can generate new code
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function generateCourseCode(req, res) {
  try {
    const code = generateInviteCode();
    const userId = req.user._id; // _id
    const courseId = req.params.id;

    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    let course = await Course.findById(courseId).lean();
    if(!course) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    if(req.user.role === 'user'){
      if(course.creator.toString() !== userId.toString()) {
        return res.status(403).json({success: false, error: 'Permission denied.'});
      }
    }
    let data;
    data = await CourseCode.create({
      code: code,
      courseId: courseId,
      userCreate: userId
    });
    return res.json({
      success: true,
      code: code,
      data
    });
  } catch ( error ) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Delete code of this course
 * Only owner of this course can generate new code
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function deleteCourseCode(req, res) {
  try {
    const userId = req.user._id; // _id
    const code = req.params.code;

    let codeInfo = await CourseCode.findOne({code: code}).lean();
    if(!codeInfo){
      return res.status(404).json({success: false, error: 'Code not found.'});
    }
    let course = await Course.findById(codeInfo.courseId).lean();
    if(!course) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    if(req.user.role === 'user'){
      if(course.creator.toString() !== userId.toString()) {
        return res.status(403).json({success: false, error: 'Permission denied.'});
      }
    }
    await CourseCode.deleteOne({
      _id: codeInfo._id
    });
    if(codeInfo.userUsedId){
      await UserToCourse.remove({
        user: codeInfo.userUsedId,
        course: codeInfo.courseId
      });
    }
    if(code && codeInfo.userUsedId){
      Q.create(globalConstants.jobName.AFTER_REMOVE_COURSE_CODE, {
        course: course._id,
        user: codeInfo.userUsedId
      }).removeOnComplete(true).save();
      return res.json({
        success: true,
        valid: true
      });
    } else {
      return res.json({
        success: true,
        code: code
      });
    }
  } catch ( error ) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message
    })
  }
}

export async function editCodeCourse(req, res) {
  try {
    let options = req.body;
    options.code = req.params.code;
    if(!options.code){
      throw {
        success: false, status: 400, error: 'Invalid Params.'
      }
    }
    let data = await CourseServices.editCodeCourse(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}
/**
 * Validation password of this course
 * User can use this password to access course stream
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function validationCoursePassword(req, res) {
  try {
    const userId = req.user._id; // _id
    const password = req.query.password;
    const lessionId = req.params.id;
    if(!userId) {
      return res.status(404).json({success: false, error: 'USER_NOT_FOUND.'});
    }
    if(!password) {
      return res.status(404).json({success: false, error: 'PASSWORD_EMPTY'});
    }
    if(!StringHelper.isObjectId(lessionId)) {
      return res.status(404).json({success: false, error: 'LESSON_NOT_FOUND'});
    }
    let lesson = await LiveStream.findById(lessionId);
    if(!lesson) {
      return res.status(404).json({success: false, error: 'LESSON_NOT_FOUND'});
    }
    if(!lesson.course) {
      return res.status(404).json({success: false, error: 'LESSON_NOT_FOUND'});
    }
    let course = await Course.findById(lesson.course).lean();
    if(!course) {
      return res.status(404).json({success: false, error: 'COURSE_NOT_FOUND'});
    }
    if(!validate(course.password,sanitizeHtml(password))) {
      return res.status(404).json({success: false, error: 'PASSWORD_NOT_CORRECT'});
    }
    await CourseUsedPassword.create({
      userId: userId,
      courseId: course._id,
      password: sanitizeHtml(password),
    });
    Q.create(globalConstants.jobName.AFTER_JOIN_COURSE, {
      course: course._id,
      user: userId
    }).removeOnComplete(true).save();
    return res.json({
      success: true,
      valid: true
    });
    return res.json({
      success: true
    });
  } catch ( error ) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message
    })
  }
}
/**
 * Validation password of this course
 * User can use this password to access course stream
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function validationCoursePasswordById(req, res) {
  try {
    const userId = req.user._id; // _id
    const password = req.query.password;
    const courseId = req.params.id;
    if(!userId) {
      return res.status(404).json({success: false, error: 'USER_NOT_FOUND.'});
    }
    let usePass = await CourseUsedPassword.count({userId: userId, courseId: courseId}).lean();
    if(usePass){
      return res.json({
        success: true,
        valid: true
      });
    }
    if(!password) {
      return res.status(404).json({success: false, error: 'PASSWORD_EMPTY'});
    }
    if(!StringHelper.isObjectId(courseId)) {
      return res.status(404).json({success: false, error: 'COURSE_NOT_FOUND'});
    }
    let course = await Course.findById(courseId).lean();
    if(!course) {
      return res.status(404).json({success: false, error: 'COURSE_NOT_FOUND'});
    }
    if(!validate(course.password, sanitizeHtml(password))) {
      return res.status(404).json({success: false, error: 'PASSWORD_NOT_CORRECT'});
    }
    await CourseUsedPassword.create({
      userId: userId,
      courseId: course._id,
      password: sanitizeHtml(password),
    });
    Q.create(globalConstants.jobName.AFTER_JOIN_COURSE, {
      course: course._id,
      user: userId
    }).removeOnComplete(true).save();
    return res.json({
      success: true,
      valid: true
    });
    return res.json({
      success: true
    });
  } catch ( error ) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Validate code of this course are existed and not used
 * Only owner of this course can generate new code
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function validationCourseCode(req, res) {
  try {
    const userId = req.user._id; // _id
    const code = req.query.code;
    const courseId = req.params.id;

    if(!code) {
      return res.json({
        success: true,
        valid: false,
        message: 'CODE_EMPTY'
      })
    }
    if(!StringHelper.isObjectId(courseId)) {
      return res.json({
        success: true,
        valid: false,
        message: 'COURSE_NOT_FOUND'
      })
    }
    let course = await Course.findById(courseId).lean();
    if(!course) {
      return res.json({
        success: true,
        valid: false,
        message: 'COURSE_NOT_FOUND'
      })
    }

    // Check this user had used code
    const usedCourseCode = await CourseCode.findOne({
      courseId: courseId,
      userUsedId: userId
    });

    if ( usedCourseCode ) {
      return res.json({
        success: true,
        valid: true,
        message: 'YOU_USED'
      })
    }

    const courseCode = await CourseCode.findOne({
      code: code,
      courseId: courseId,
      userUsedId: {$exists: false}
    });
    if ( courseCode ) {
      await CourseCode.update({
        code: code,
        courseId: courseId,
      }, {
        $set: {
          userUsedId: userId,
          usedDate: Date.now()
        }
      });
      let check_user = await UserToCourse.findOne({
        user: userId,
        course: courseId
      });
      if(!check_user){
        await UserToCourse.create({
          user: userId,
          course: courseId
        });
      }
      Q.create(globalConstants.jobName.AFTER_JOIN_COURSE, {
        course: courseId,
        user: userId
      }).removeOnComplete(true).save();
      return res.json({
        success: true,
        valid: true
      });
    }
    return res.json({
      success: true,
      valid: false,
      message: 'CODE_COURSE_NOT_FOUND'
    });
  } catch ( error ) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Validate code of this course are existed and not used
 * Only owner of this course can generate new code
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function validationCourseCodeByStream(req, res) {
  try {
    const userId = req.user._id; // _id
    const code = req.query.code;
    const lessonId = req.params.id;

    if(!code) {
      return res.status(404).json({success: false, error: 'Code not found.'});
    }
    if(!StringHelper.isObjectId(lessonId)) {
      return res.status(404).json({success: false, error: 'Lesson not found.'});
    }
    let lesson = await LiveStream.findById(lessonId).lean();
    if(!lesson || !lesson.course) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }

    let course = await Course.findById(lesson.course).lean();
    if(!course) {
      return res.status(404).json({success: false, error: 'Course not found.'});
    }
    // Check this user had used code
    const usedCourseCode = await CourseCode.findOne({
      courseId: lesson.course,
      userUsedId: userId
    });

    if ( usedCourseCode ) {
      return res.json({
        success: true,
        valid: false,
        message: 'YOU_USED'
      })
    }

    const courseCode = await CourseCode.findOne({
      code: code,
      courseId: lesson.course,
      userUsedId: {$exists: false}
    });
    if ( courseCode ) {
      await CourseCode.update({
        code: code,
        courseId: lesson.course,
      }, {
        $set: {
          userUsedId: userId,
          usedDate: Date.now()
        }
      });
      Q.create(globalConstants.jobName.AFTER_JOIN_COURSE, {
        course: lesson.course,
        user: userId
      }).removeOnComplete(true).save();
      return res.json({
        success: true,
        valid: true
      });
    }
    return res.json({
      success: true,
      valid: false,
      message: 'CODE_USED'
    });
  } catch ( error ) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Get course have status: [living, on_going, finish]
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
export async function getAvailableCourses(req, res) {
  try {
    const page = Number(req.query.page || 1).valueOf();
    const queryConditions = {status: {$in: [1, 2, 4]}};
    const limit = 10;
    const skip = (page - 1) * limit;
    const total_items = await Course.count(queryConditions);
    const coursesFound = await Course.find(queryConditions, 'title status slug creator').sort({_id: -1}).skip(skip).limit(limit).lean();
    const userIds = coursesFound.map(course => course.creator);
    const users = await User.formatBasicInfo(User, userIds);
    const promises = coursesFound.map(async course => {
      course.user = users.find(user => user._id.toString() === course.creator.toString());
      return course;
    });
    const coursesFoundFormatted = await Promise.all(promises);
    const results = {
      courses: coursesFoundFormatted,
      success: true,
      current_page: page,
      last_page: Math.ceil(total_items / limit),
    };
    return res.status(200).json(results);
  } catch (err) {
    console.log('err:', err);
    err.success = false;
    return res.status(err.status || 500).json(err.message);
  }
}

export async function editUserToCourse(req, res) {
  try {
    let options = req.body;
    options.evaluater = req.user._id;
    options.course = req.params.id;
    let data = await CourseServices.editUserToCourse(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

/**
 * Param:
 * {
 *   streamId
 *   courseId
 *   userId
 *   note
 * }
 * */
export async function editUserViewToCourse(req, res) {
  try {
    let options = req.body;
    options.evaluater = req.user._id;
    let data = await CourseServices.editUserViewToCourse(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

/**
 * Send SMS
 * */

export async function sendSMSToUser(req, res) {
  try{
    let options = req.body;
    await CourseServices.sendSMSToUser(options);
    return res.json({
      success: true
    })
  }catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

/**
 * Support Course
 * */

export async function addNoteCourse(req, res) {
  try {
    let options = req.body;
    if(!options.content || !options.user) {
      throw {
        status: 400,
        success: false,
        error: 'Invalid Params'
      }
    }
    options.course = req.params.id;
    options.date = Date.now();
    options.creator = req.user._id;
    let data = await CourseServices.addNoteCourse(options);
    return res.json({
      success:true,
      data
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

/**
 * Tracking Video
 * */

export async function trackingVideoCourse(req, res) {
  try {
    let options = req.body;
    options.courseId = req.params.id;
    options.userId = req.user._id;
    if(!options.courseId || !options.streamId || !options.beginTime || !options.endTime || !options.totalTime){
      throw {
        status: 400,
        success: false,
        error: 'Invalid Params.'
      }
    }
    let data = await CourseServices.trackingVideoCourse(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

export async function getGeneralCourse(req, res) {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    let text = req.query.text || '';
    let status = req.query.status || 0;
    let skip = (page - 1) * limit;
    let options = {
      limit,
      skip
    };
    if(text){
      options.text = text;
    }
    if(status){
      options.status = status;
    }
    let data = await CourseServices.getGeneralCourse(options);
    return res.json({
      success: true,
      total_page: Math.ceil(data[0]/limit),
      total_item: data[0],
      page,
      item: data[1].length,
      data: data[1]
    })
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

export async function generalLessonLive(req, res) {
  try {
    let data = req.body;
    data.courseId = req.params.id;
    console.log(data);
    data.user = req.user._id;
    data = await CourseServices.generateLessonLive(data);
    return res.json({
      success: true,
      data
    })
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function cloneCourse(req, res) {
  try {
    let options = {
      id: req.params.id,
      user: req.user._id
    };
    let data = await CourseServices.cloneCourse(options);
    return res.json({
      success: true,
      data
    })
  } catch (error) {
    return res.status(error.status || 500).json(error);
  }
}

export async function getCurrentTime(req, res){
  let videoId = req.params.id
  let type = req.query.type
  if(!videoId){
    return res.status(404).json({success: false, error: 'Video not found'});
  }
  return res.json({
    success: true,
    data: await serviceGetCurrentTime(videoId, type, req.user._id)
  })
}
export async function getCompleteCourse(req, res){
  let id = req.params.id
  if(!id){
    return res.status(404).json({success: false, error: 'Course not found'});
  }
  return res.json({
    success: true,
    data: await serviceGetCompleteCourse(id, req.user._id)
  })
}
export async function getTotalUser(req, res){
  let id = req.params.id
  if(!id){
    return res.status(404).json({success: false, error: 'Course not found'});
  }
  return res.json({
    success: true,
    data: await serviceGetTotalUser(id)
  })
}
export async function getCompleteProcess(req, res){
  let id = req.params.id
  if(!id){
    return res.status(404).json({success: false, error: 'Course not found'});
  }
  return res.json({
    success: true,
    data: await serviceGetCompleteProcess(id, req.user._id)
  })
}
export async function updateCurrentTime(req, res){
  let videoId = req.params.id
  let type = req.query.type
  if(!videoId){
    return res.status(404).json({success: false, error: 'Video not found'});
  }
  return res.json({
    success: true,
    data: await serviceUpdateCurrentTime({
      videoId,
      type,
      userId: req.user._id,
      time: req.body.time,
      courseId: req.body.courseId,
      complete: req.body.complete,
    })
  })
}
