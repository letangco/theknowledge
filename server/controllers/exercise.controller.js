var fs = require('fs').promises;
import {
  addExercise,
  updateExercise,
  removeExercise,
  getExercise,
  getExerciseByTest,
  getExerciseToUpdateService,
  getExercisesService,
  getExerciseQuestionService,
  getExerciseResultService,
  addResultExercise,
  addResultExerciseTeacher,
  getExerciseReport,
  getExercisesReportById,
  getExerciseVOAQuestionService,
  getExerciseByLesson,
  getReportCourseByUser,
  getExerciseReportServiceByUser,
  getExerciseReportStudyByUser,
  addReportExerciseStudent,
  getStudentReportExercise,
  getReportExerciseCourse,
  changeStatusReportExercise,
  countExerciseQuestions,
  getExercisesServiceStudy,
  getListReportTrialTestService,
  getReportTrialTestService,
  updatePointTestService,
  sendMailResultTestService,
  getResultTrialTestService,
  userGetListReportTrialTestService
} from '../services/exercise.services';
import {checkJoinedStream} from '../services/liveStream.services'
import User from "../models/user";
import {Q} from '../libs/Queue';
import {convertPDFLibs} from '../libs/libreoffice';
import { convertOgaToMP3 } from "../libs/video/convertToMp3";
import globalConstants from "../../config/globalConstants";
import FirstTest from '../models/firstTest';
import AMPQ from "../../rabbitmq/ampq";
export async function convertPDF(req, res) {
  let file = req.body.file
  if(!file){
    res.status(403).end('File incorrect format!');
    return;
  }
  let data = await convertPDFLibs(file)
  return res.json({success: true, data})
}
export async function getExerciseById(req, res) {
  if(!req.user && req.user._id){
    res.status(403).end('Access denied!');
    return;
  }
  try {
    let lesson = req.query && req.query.lesson ? req.query.lesson : '';
    let id = req.query && req.query.id ? req.query.id : '';
    let data = {
      id: req.params.id,
      type: parseInt(req.params.type),
    }
    let exercise = await getExercise(data)
    let joined = lesson ? await checkJoinedStream(lesson, req.user._id.toString() || '') : false
    let tested = await getExerciseReportServiceByUser({
      id: req.params.id,
      type: parseInt(req.params.type),
      lesson,
      user: req.user._id || ''
    })
    exercise.tested = tested && tested._id ? tested._id : ''
    if(!lesson && (req.user._id.toString() === exercise.user.toString()
      || req.user.role === 'admin' || exercise.role === 'admin')){
      return res.json({success: true, data: exercise})
    }
    if(joined || req.user._id.toString() === exercise.user.toString() || req.user.role === 'admin'){
      if(exercise && lesson){
        if(id){
          let lessonExer= await getExerciseByLesson(id)
          if(lessonExer){
            exercise.title = lessonExer.title
            exercise.slug = lessonExer.slug
          }
        }
        exercise.joined = !!joined
      }
      return res.json({success: true, data: exercise})
    } else {
      return res.status(403).end('Access denied!');
    }

  } catch(err) {
    console.log('err on getExerciseById:', err);
    return res.status(500).json(err);
  }
}
export async function getExerciseTest(req, res){
  try {
    if(!req.user && req.user._id){
      res.status(403).end('Access denied!');
      return;
    }
    let exercise = await getExerciseByTest(req.user._id);
    let listExercise = exercise.filter(item => !!item);
    if (listExercise.length < 4) {

      return res.json({status:404, success:false, error:'Test not found'})
    }
    listExercise = exercise.map(item => item._id);
    const init = {
      sectionExercise: listExercise,
      user: req.user._id,
      parent: true
    }
    const firstTest = await FirstTest.create(init);
    return res.json({success: true, data: exercise, id: firstTest._id})
  } catch(err) {
    console.log('err on getExerciseTest:', err);
    return res.status(500).json(err);
  }
}
export async function audioToBase64(audioFile) {
  return await fs.readFile(audioFile, {encoding: 'base64'});
}
export async function uploadSpeakingAnswer(req, res){
  try {
    let { files, body } = req;
    let promise = files.map(async e => {
      let filename = e.filename
      let convert = await convertOgaToMP3(e.path, filename, e.destination)
      if (convert !== "") {
        filename = convert
      }
      let base64 = await audioToBase64(`uploads/exercise/${convert}`)
      return {
        filename,
        base64: base64,
        _id: e.fieldname
      }
    })
    let data = {
      _id: req.params.id,
      type: body.type,
      questions: await Promise.all(promise)
    }
    let result = await addResultExercise(req.params.id, data)
    if(result && result.tracking){
      if ([5,6].indexOf(data.type) !== -1) {
        let exerciseInfo = await getExercise({
          type: data.type,
          id: _id
        });
        if(exerciseInfo && exerciseInfo.user){
          var dataNotify = {
            to: exerciseInfo.user,
            type: 'notificationExercise',
            data: {
              id: result._id,
              type: data.type,
              url: `exercise-report-detail/${result._id}?type=${data.type}`
            }
          };
          AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
        }
      }
    }
    if(result.data){
      return res.json({success: true, data: result.data, tracking: result.tracking })
    } else {
      return res.json({success: true, data: result })
    }
  } catch(err) {
    console.log('err on getExerciseTest:', err);
    return res.status(500).json(err);
  }
}
export async function getExerciseToUpdate(req, res) {
  try {
    let data = {
      id: req.params.id,
      type: parseInt(req.params.type)
    }
    return res.json({success: true, data: await getExerciseToUpdateService(data)})
  } catch(err) {
    console.log('err on getExerciseById:', err);
    return res.status(500).json(err);
  }
}
export async function getExerciseQuestion(req, res) {
  try {
    let data = {
      id: req.params.id,
      type: parseInt(req.params.type)
    }
    return res.json({success: true, data: await getExerciseQuestionService(data)})
  } catch(err) {
    console.log('err on getExerciseQuestion:', err);
    return res.status(500).json(err);
  }
}
export async function getExerciseVOAQuestion(req, res) {
  try {
    let data = {
      id: req.params.id,
      type: parseInt(req.params.type)
    }
    return res.json({success: true, data: await getExerciseVOAQuestionService(data)})
  } catch(err) {
    console.log('err on getExerciseQuestion:', err);
    return res.status(500).json(err);
  }
}
export async function getExerciseResult(req, res) {
  try {
    let data = {
      id: req.params.id,
      type: parseInt(req.params.type)
    }
    return res.json({success: true, data: await getExerciseResultService(data)})
  } catch(err) {
    console.log('err on getExerciseResult:', err);
    return res.status(500).json(err);
  }
}
export async function getExerciseReportByid(req, res) {
  try {
    let userId = req.user._id.toString() || '';
    if(!userId){
      res.status(403).end('Access denied!');
      return;
    }
    let data = {
      id: req.params.id,
      type: parseInt(req.params.type)
    }
    let result = await getExerciseReport(data)
    if (!result) {
      return res.json({status:400, success:false, error:'Report not found'})
    }
    if(result.user){
      let userInfo = await User.formatBasicInfoById(User, result.user);
      let exercise = await getExercise({
        id: result.exercise,
        type: parseInt(req.params.type)
      })
      if(exercise && exercise.user && (exercise.user.toString() === userId || req.user.role === 'admin')){
        result.teacher = true
      } else {
        result.teacher = false
      }
      result.user = userInfo
    }
    return res.json({success: true, data: result})
  } catch(err) {
    console.log('err on getExerciseResult:', err);
    return res.status(500).json(err);
  }
}
export async function getExercises(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let type = parseInt(req.query.type) || 0
    let text = req.query.text || ''
    let limit = parseInt(req.query.limit) || 20
    let user = req.user._id || '';
    let results = await getExercisesService({
      page, type, text, user, limit
    })
    results.current_page = page;
    results.last_page = page;
    results.last_page = Math.ceil(results.total_items/limit);
    return res.json({
      success: true,
      data: results
    })
  } catch(err) {
    console.log('err on getExercises:', err);
    return res.status(500).json(err);
  }
}
export async function getExercisesStudy(req, res) {
  try {
    if(!req.user && req.user._id){
      res.status(403).end('Access denied!');
      return;
    }
    let page = Number(req.query.page || 1).valueOf();
    let type = parseInt(req.query.type) || 0
    let study = req.query.study || ''
    let limit = parseInt(req.query.limit) || 20
    let user = req.user._id || null
    let results = await getExercisesServiceStudy({
      user, page, type, study, limit
    })
    let promises
    if(results && results.data) {
      promises = results.data.map(async data => {
        let point = await getExerciseReportStudyByUser({
          id: data._id,
          type: data.type,
          user: req.user._id
        })
        data.point = point ? point.point : 'N/A'
        return data
      })
    }
    results.data = await Promise.all(promises)
    results.current_page = page;
    results.last_page = page;
    results.last_page = Math.ceil(results.total_items/limit);
    return res.json({
      success: true,
      data: results
    })
  } catch(err) {
    console.log('err on getExercises:', err);
    return res.status(500).json(err);
  }
}

export async function getExercisesReport(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let type = parseInt(req.query.type) || 0
    let id = req.query.id || 0
    let course = req.query.course || ''
    let lesson = req.query.lesson || ''
    let user = req.user._id || '';
    let results = await getExercisesReportById({
      id, page, type, user, course, lesson
    })
    console.log('results: ', results)
    return res.json({
      success: true,
      data: results.data,
      total: results.total_items,
      curent_page: results.curent_page,
      total_page: results.total_page
    })
  } catch(err) {
    console.log('err on getExercises:', err);
    return res.status(500).json(err);
  }
}

export async function getListReportTrialTest(req, res) {
  try {
    const options = req.query;
    options.page = Number(req.query.page) || 1;
    options.limit = Number(req.query.limit) || 10;
    options.skip = (options.page - 1) * options.limit;
    options.user = req.user;
    const data = await getListReportTrialTestService(options);
    return res.json({
      success: true,
      data: {
        current_page: options.page,
        data: data[1],
        last_page: Math.ceil(data[0]/options.limit),
        total_items: data[0]
      }
    })
  } catch (err) {
    console.log('err on getExercises:', err);
    return res.status(500).json(err);
  }
}

export async function getReportTrialTest(req, res) {
  try {
    const options = req.params;
    options.user = req.user;
    const data = await getReportTrialTestService(options);
    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    console.log('err on getReportTrialTest:', error);
    return res.status(500).json(error);
  }
}

export async function updatePointSectionTest(req, res) {
  try {
    const options = req.body;
    options.id = req.params.id;
    options.user = req.user;
    await updatePointTestService(options);
    return res.json({
      success: true,
    })
  } catch (error) {
    console.log('err on getReportTrialTest:', error);
    return res.status(500).json(error);
  }
}

export async function sendMailResultTest(req, res) {
  try {
    const options = req.params;
    options.user = req.user;
    await sendMailResultTestService(options);
    return res.json({
      success: true
    })
  } catch (error) {
    console.log('err on sendMailResultTest:', error);
    return res.status(500).json(error);
  }
}

export async function getResultTrialTest(req, res) {
  try {
    const options = {
      user: req.user._id,
    }
    const data = await getResultTrialTestService(options);
    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    console.log('err on getResultTrialTest:', error);
    return res.status(500).json(error);
  }
}


export async function userGetResultTrialTest(req, res) {
  try {
    const options = req.query;
    options.page = Number(req.query.page) || 1;
    options.limit = Number(req.query.limit) || 10;
    options.skip = (options.page - 1) * options.limit;
    options.user = req.user;
    const data = await userGetListReportTrialTestService(options);
    return res.json({
      success: true,
      data: {
        current_page: options.page,
        data: data[1],
        last_page: Math.ceil(data[0]/options.limit),
        total_items: data[0]
      }
    })
  } catch (err) {
    console.log('err on getExercises:', err);
    return res.status(500).json(err);
  }
}

export async function createExercise(req, res) {
  try {
    let data  = req.body;
    data.user = req.user || {};
    await addExercise(data)
    return res.json({success: true,})
  } catch(err) {
    console.log('err on addExercise:', err);
    return res.status(500).json(err);
  }
}

export async function addStudentReport(req, res) {
  try {
    let id = req.params.id;
    let data = req.body;
    data.user = req.user._id || '';
    let respond = await addReportExerciseStudent(data, id);
    if (respond && respond.course) {
      var dataNotify = {
        to: respond.course.creator,
        from: respond.userInfo,
        type: 'notificationStudentReport',
        data: {
          id: id,
          titleExercise: respond.resultExercise.title,
          titleCourse: respond.course.title,
          url: `exercise-report-detail/${respond.resultExercise._id}?type=${data.type}&reportStudent=${respond.newReport._id}`
        }
      };
      AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
      let dataSendMail = {
        type: 'reportExercise',
        language: 'vi',
        data: {
          teacherInfo: respond.teacherInfo,
          userInfo: respond.userInfo,
          titleExercise: respond.resultExercise.title,
          titleCourse: respond.course.title,
          url: `exercise-report-detail/${respond.resultExercise._id}?type=${data.type}&reportStudent=${respond.newReport._id}`
        }
      };
      Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
      return res.json({
        success: true,
        data: respond.newReport
      })
    }
  } catch (error) {
    console.log('err on addStudentReport:', error);
    return res.status(500).json(error);
  }
}

export async function getStudentReport(req, res) {
  try {
    let options = req.params;
    let report = await getStudentReportExercise(options);
    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.log('err on getStudentReport:', error);
    return res.status(500).json(error);
  }
}

export async function getReportExerciseByCourse(req, res) {
  try {
    let options = req.params;
    options.user = req.user;
    let listReport = await getReportExerciseCourse(options);
    return res.json({
      success: true,
      data: listReport,
    });
  } catch(error) {
    console.log('error on getReportExerciseByCourse: ', error);
    return res.status(500).json(error);
  }
}

export async function changeStatusStudentReport(req, res) {
  try {
    let options = req.body;
    options.user = req.user;
    let report = await changeStatusReportExercise(options);
    return report;
  } catch (error) {
    console.log('error on changeStatusStudentReport:', error);
    return res.status(500).json(error);
  }
}

export async function addTeacherReport(req, res) {
  try {
    let id = req.params.id;
    let data  = req.body;
    let exercise = await addResultExerciseTeacher(data, id)
    var dataNotify = {
      to: exercise.user,
      type: 'notificationStudent',
      data: {
        id: id,
        type: exercise.type,
        url: `exercise-report-detail/${id}?type=${exercise.type}`
      }
    };
    AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
    return res.json({success: true})
  } catch(err) {
    console.log('err on addTeacherReport:', err);
    return res.status(500).json(err);
  }
}

export async function editExercise(req, res) {
  try {
    let data  = req.body;
    let _id  = req.params.id;
    data.user = req.user._id || '';
    await updateExercise(_id, data)
    return res.json({success: true,})
  } catch(err) {
    console.log('err on editExercise:', err);
    return res.status(500).json(err);
  }
}
export async function sendExercise(req, res) {
  try {
    let data  = req.body;
    let _id  = req.params.id;
    data.user = req.user._id || '';
    let result = await addResultExercise(_id, data)
    if(result && result.tracking){
      if ([5,6].indexOf(data.type) !== -1) {
        let exerciseInfo = await getExercise({
          type: data.type,
          id: _id
        });
        if(exerciseInfo && exerciseInfo.user){
          var dataNotify = {
            to: exerciseInfo.user,
            type: 'notificationExercise',
            data: {
              id: result._id,
              type: data.type,
              url: `exercise-report-detail/${result._id}?type=${data.type}`
            }
          };
          AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
        }
      }
    }
    if(result.data){
      return res.json({success: true, data: result.data, tracking: result.tracking })
    } else {
      return res.json({success: true, data: result })
    }
  } catch(err) {
    console.log('err on sendExercise:', err);
    return res.status(500).json(err);
  }
}


export async function deleteExercise(req, res) {
  try {
    let _id  = req.params.id;
    let user = req.user._id || '';
    let type = parseInt(req.params.type);
    await removeExercise(_id, {type, user})
    return res.json({success: true,})
  } catch(err) {
    console.log('err on deleteExercise:', err);
    return res.status(500).json(err);
  }
}
