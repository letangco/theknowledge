import ExerciseBBC from '../models/exerciseBBC';
import ExerciseBBCReport from '../models/exerciseBBCReport';
import ExerciseBBCQuestion from '../models/exerciseBBCQuestion';
import ExerciseVOA from '../models/exerciseVOA';
import ExerciseVOAReport from '../models/exerciseVOAReport';
import ExerciseReadingKeyWord from '../models/exerciseReadingKeyWord';
import ExerciseReadingKeyWordReport from '../models/exerciseReadingKeyWordReport';
import ExerciseReadingKeywordQuestion from '../models/exerciseReadingKeywordQuestion';
import ExerciseMatching from '../models/exerciseMatching';
import ExerciseMatchingReport from '../models/exerciseMatchingReport';
import ExerciseMatchingQuestion from '../models/exerciseMatchingQuestion';
import ExerciseWriting from '../models/exerciseWriting';
import ExerciseWritingReport from '../models/exerciseWritingReport';
import ExerciseSpeakingReport from '../models/exerciseSpeakingReport';
import ExerciseWritingQuestion from '../models/exerciseWritingQuestion';
import ExerciseSpeaking from '../models/exerciseSpeaking';
// import ExerciseWritingReport from '../models/exerciseWritingReport';
import ExerciseSpeakingQuestion from '../models/exerciseSpeakingQuestion';
import ExerciseWritingIELTS from '../models/exerciseWritingIELTS';
import ExerciseWritingIELTSReport from '../models/exerciseWritingIELTSReport';
import ExerciseWritingIELTSQuestion from '../models/exerciseWritingIELTSQuestion';
import ExerciseMultipleChoice from '../models/exerciseMultipleChoice';
import ExerciseMultipleChoiceQuestion from '../models/exerciseMultipleChoiceQuestion';
import ExerciseMultipleChoiceReport from '../models/exerciseMultipleChoiceReport';
import FirstTestReport from '../models/firstTestReport';
import ExerciseToCourse from '../models/exerciseToCourse';
import FirstTest from '../models/firstTest';
import ExerciseReport from '../models/exerciseReport';
import Course from '../models/courses';
import LiveStream from '../models/liveStream';
import User from '../models/user';
import ArrayHelper from "../util/ArrayHelper";
import QuestionMultipleChoice from "../models/questionMultipleChoice";
import ExerciseMultipleChoiceUpload from '../models/exerciseMultipleChoiceUpload';
import ExerciseMultipleChoiceUploadReport from '../models/exerciseMultipleChoiceUploadReport';
import moment from 'moment';
import UserViewStreamTracking from "../models/userViewStreamTracking";
import {Q} from "../libs/Queue";
import { fetchResultLanguageConfidence } from "../libs/languageConfidence";
import globalConstants from "../../config/globalConstants";
import * as UploadController from "../controllers/upload.controller";
const EXERCISE_LIMIT = 500
const testType = [1, 3, 4, 2]
export const uploadURL = 'uploads/';
export async function addExercise(data) {
  try {
    switch (data.type) {
      case 1:
        return await addExerciseBBC(data)
      case 2:
        return await addExerciseVOA(data)
      case 3:
        return await addExerciseReadingKeyword(data)
      case 4:
        return await addExerciseMatching(data)
      case 5:
        return await addExerciseWriting(data)
      case 6:
        return await addExerciseWritingIELTS(data)
      case 7:
        return await addExerciseMultiple(data)
      case 8:
        return await addExerciseMultipleUpload(data)
      case 9:
        return await addExerciseTest(data)
      case 10:
        return await addExerciseSpeaking(data)
      default:
        return null
    }
  } catch (err) {
    console.log('err on addExercise:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseUserUsed(user){
  try {
    let results = await FirstTestReport.find({
      user,
      parent: false
    }).lean()
    if(!results) return []
    let data = []
    results.map(result => {
      data = data.concat(result.exercise)
    })
    return data
  } catch (err) {
    console.log('err on getExerciseUserUsed:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseByTest(user){
  try {
    let used = await getExerciseUserUsed(user)
    let promises = testType.map(async type =>  {
      const count = await FirstTest.count({
        _id: { $nin: used },
        typeTest: type,
      }) - 1;
      const random = Math.floor(Math.random() * (count + 1));
      const data = await FirstTest.find({ _id: { $nin: used }, typeTest: type }).limit(1).skip(random).lean()
      if(data.length){
        let exercise;
        exercise = data[0]
        if (Array.isArray(exercise.sectionExercise)) {
          let promise = exercise.sectionExercise.map(async section => {
            let data = {};
            switch (section.type) {
              case 1:
                data =  await getExerciseBBC({id: section._id});
                data.type = section.type;
                return data;
              case 2:
                data = await getExerciseVOATestQuestionService({id: section._id});
                data.type = section.type;
                return data;
              case 3:
                data = await getExerciseReadingKeyword({id: section._id});
                data.type = section.type;
                return data;
              case 4:
                data = await getExerciseMatching({id: section._id});
                data.type = section.type;
                return data;
              case 5:
                data = await getExerciseWriting({id: section._id});
                data.type = section.type;
                return data;
              case 6:
                data = await getExerciseWritingIELTS({id: section._id});
                data.type = section.type;
                return data;
              case 7:
                data = await getExerciseMultiple({id: section._id});
                data.type = section.type;
                return data;
              case 10:
                data = await getExerciseSpeaking({id: section._id});
                data.type = section.type;
                return data;
              default:
                return null
            }
          })
          exercise.typeTest = type;
          exercise.dataSection = await Promise.all(promise);
          return exercise;
        }
      } else {
        return null
      }
    })
    let resutls = await Promise.all(promises);
    resutls = resutls.filter(result => result);
    return resutls
  } catch (err) {
    console.log('err on getExerciseMultiple:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExercise(data) {
  try {
    switch (data.type) {
      case 1:
        return await getExerciseBBC(data)
      case 2:
        return await getExerciseVOA(data)
      case 3:
        return await getExerciseReadingKeyword(data)
      case 4:
        return await getExerciseMatching(data)
      case 5:
        return await getExerciseWriting(data)
      case 6:
        return await getExerciseWritingIELTS(data)
      case 7:
        return await getExerciseMultiple(data)
      case 8:
        return await getExerciseMultipleUpload(data)
      case 9:
        return await getExerciseTest(data)
      case 10:
        return await getExerciseSpeaking(data)
      default:
        return null
    }
  } catch (err) {
    console.log('err on getExercise:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getReportCourseByUser(data) {
  try {
    switch (parseInt(data.type)) {
      case 1:
        return await ExerciseBBCReport.findOne({
          exercise: data.exercise,
          user: data.user,
          lesson: data.lesson
        })
      case 2:
        return await ExerciseVOAReport.findOne({
          exercise: data.exercise,
          user: data.user,
          lesson: data.lesson
        })
      case 3:
        let report = await ExerciseReadingKeyWordReport.findOne({
          exercise: data.exercise,
          user: data.user,
          lesson: data.lesson
        })
        return report
      case 4:
        return await ExerciseMatchingReport.findOne({
          exercise: data.exercise,
          user: data.user,
          lesson: data.lesson
        })
      case 5:
        return await ExerciseWritingReport.findOne({
          exercise: data.exercise,
          user: data.user,
          lesson: data.lesson
        })
      case 6:
        return await ExerciseWritingIELTSReport.findOne({
          exercise: data.exercise,
          user: data.user,
          lesson: data.lesson
        })
      case 7:
        return await ExerciseMultipleChoiceReport.findOne({
          exercise: data.exercise,
          user: data.user,
          lesson: data.lesson
        })
      case 8:
        return await ExerciseMultipleChoiceUploadReport.findOne({
          exercise: data.exercise,
          user: data.user,
          lesson: data.lesson
        })
      case 9:
        return await FirstTestReport.findOne({
          exercise: data.exercise,
          user: data.user,
          lesson: data.lesson,
          final: true
        })
      case 10:
        return await ExerciseSpeakingReport.findOne({
          exercise: data.exercise,
          user: data.user,
          lesson: data.lesson,
          final: true
        })
      default:
        return null
    }
  } catch (err) {
    console.log('err on getExercise:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseToUpdateService(data) {
  try {
    switch (data.type) {
      case 1:
        return await getExerciseBBCToUpdate(data)
      case 2:
        return await getExerciseVOAToUpdate(data)
      case 3:
        return await getExerciseReadingKeywordToUpdate(data)
      case 4:
        return await getExerciseMatchingToUpdate(data)
      case 5:
        return await getExerciseWritingToUpdate(data)
      case 6:
        return await getExerciseWritingIELTS(data)
      case 7:
        return await getExerciseMultipleToUpdate(data)
      case 8:
        return await getExerciseMultipleUploadToUpdate(data)
      case 9:
        return await getExerciseTestToUpdate(data)
      case 10:
        return await getExerciseSpeakingToUpdate(data)
      default:
        return null
    }
  } catch (err) {
    console.log('err on getExerciseToUpdateService:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseQuestionService(data) {
  try {
    switch (data.type) {
      case 1:
        return await getExerciseBBCQuestion(data)
      case 2:
        return await getExerciseVOAQuestion(data)
      default:
        return null
    }
  } catch (err) {
    console.log('err on getExercise:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseResultService(data) {
  try {
    switch (data.type) {
      case 1:
        return await getExerciseBBCResult(data)
      case 2:
        return await getExerciseVOAResult(data)
      case 3:
      return await getExerciseReadingKeywordResult(data)
      case 4:
        return await getExerciseMatchingResult(data)
      case 7:
        return await getExerciseMultipleResult(data)
      case 8:
        return await getExerciseMultipleUploadResult(data)
      default:
        return null
    }
  } catch (err) {
    console.log('err on getExerciseResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseReportServiceByUser(data) {
  try {
    switch (data.type) {
      case 1:
        return await ExerciseBBCReport.findOne({
          exercise: data.id,
          lesson: data.lesson,
          user: data.user
        })
      case 2:
        return await ExerciseVOAReport.findOne({
          exercise: data.id,
          lesson: data.lesson,
          user: data.user
        })
      case 3:
      return await ExerciseReadingKeyWordReport.findOne({
        exercise: data.id,
        lesson: data.lesson,
        user: data.user
      })
      case 4:
        return await ExerciseMatchingReport.findOne({
          exercise: data.id,
          lesson: data.lesson,
          user: data.user
        })
      case 5:
        return await ExerciseWritingReport.findOne({
          exercise: data.id,
          lesson: data.lesson,
          user: data.user
        })
      case 6:
        return await ExerciseWritingIELTSReport.findOne({
          exercise: data.id,
          lesson: data.lesson,
          user: data.user
        })
      case 7:
        return await ExerciseMultipleChoiceReport.findOne({
          exercise: data.id,
          lesson: data.lesson,
          user: data.user
        })
      case 8:
        return await ExerciseMultipleChoiceUploadReport.findOne({
          exercise: data.id,
          lesson: data.lesson,
          user: data.user
        })
      default:
        return null
    }
  } catch (err) {
    console.log('err on getExerciseResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseReportStudyByUser(data) {
  try {
    switch (data.type) {
      case 1:
        return await ExerciseBBCReport.findOne({
          exercise: data.id,
          user: data.user
        })
      case 2:
        return await ExerciseVOAReport.findOne({
          exercise: data.id,
          user: data.user
        })
      case 3:
      return await ExerciseReadingKeyWordReport.findOne({
        exercise: data.id,
        user: data.user
      })
      case 4:
        return await ExerciseMatchingReport.findOne({
          exercise: data.id,
          user: data.user
        })
      case 5:
        return await ExerciseWritingReport.findOne({
          exercise: data.id,
          user: data.user
        })
      case 6:
        return await ExerciseWritingIELTSReport.findOne({
          exercise: data.id,
          user: data.user
        })
      case 7:
        return await ExerciseMultipleChoiceReport.findOne({
          exercise: data.id,
          user: data.user
        })
      case 8:
        return await ExerciseMultipleChoiceUploadReport.findOne({
          exercise: data.id,
          user: data.user
        })
      default:
        return null
    }
  } catch (err) {
    console.log('err on getExerciseResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseReport(data) {
  try {
    let result
    switch (data.type) {
      case 1:
        return await ExerciseBBCReport.findById(data.id).lean()
      case 2:
        return await ExerciseVOAReport.findById(data.id).lean()
      case 3:
      return await ExerciseReadingKeyWordReport.findById(data.id).lean()
      case 4:
        return await ExerciseMatchingReport.findById(data.id).lean()
      case 5:
        result = await ExerciseWritingReport.findById(data.id).lean()
        if(result.view === 1){
          return result
        } else {
          delete result.descriptionAnswer
          delete result.urlAnswer
          return result
        }
      case 6:
        return await ExerciseWritingIELTSReport.findById(data.id).lean()
      case 7:
        return await ExerciseMultipleChoiceReport.findById(data.id).lean()
      case 8:
        return await ExerciseMultipleChoiceUploadReport.findById(data.id).lean()
      case 10:
        result = await ExerciseSpeakingReport.findById(data.id).lean()
        if(result && result.result){
          result.result.map(item => {
            if(item.answer && item.answer.filename){
              item.answer.fileUrl = `${uploadURL}exercise/${item.answer.filename}`
            }
            return item
          })
        }
        return result
      default:
        return {}
    }
  } catch (err) {
    console.log('err on getExerciseResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getExerciseTestReport(id) {
  try {
    let reportTest = await FirstTestReport.findById(id).lean();
    if (!reportTest) {
      return Promise.reject({status: 400, error: 'Not found'});
    }
    if (Array.isArray(reportTest.result)) {
      let countQuestion = [];
      const promise = reportTest.result.map(async (exerciseReport, index) => {
        let report = {};
        switch (exerciseReport.type) {
          case 1:
            report = await ExerciseBBCReport.findById(exerciseReport.id).lean();
            if (report && Array.isArray(report.result)) {
              countQuestion[index] = report.result.length;
            } else {
              countQuestion[index] = 0;
            }
            report.type = exerciseReport.type;
            return report;
          case 2:
            report = await ExerciseVOAReport.findById(exerciseReport.id).lean();
            if (report && Array.isArray(report.result)) {
              countQuestion[index] = parseInt(report.result.length * 2 / 5);
            } else {
              countQuestion[index] = 0;
            }
            report.type = exerciseReport.type;
            return report;
          case 3:
            report = await ExerciseReadingKeyWordReport.findById(exerciseReport.id).lean();
            if (report && Array.isArray(report.result)) {
              countQuestion[index] = report.result.length;
            } else {
              countQuestion[index] = 0;
            }
            report.type = exerciseReport.type;
            return report;
          case 4:
            report = await ExerciseMatchingReport.findById(exerciseReport.id).lean();
            if (report && Array.isArray(report.result)) {
              countQuestion[index] = report.result.length;
            } else {
              countQuestion[index] = 0;
            }
            report.type = exerciseReport.type;
            return report;
          case 7:
            report = await ExerciseMultipleChoiceReport.findById(exerciseReport.id).lean();
            if (report && Array.isArray(report.result)) {
              countQuestion[index] = report.result.length;
            } else {
              countQuestion[index] = 0;
            }
            report.type = exerciseReport.type;
            return report;
          default:
            return
        }
      });
      reportTest.result = await Promise.all(promise);
      let countNumber = [1];
      let count = 1;
      countQuestion.map((item, index) => {
        if (index !== 0) {
          count += countQuestion[index-1];
          countNumber.push(count);
        }
      })
      reportTest.countQuestion = countNumber;
      return reportTest;
    }
  } catch (err) {
    console.log('err on getExerciseResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getExercisesService(options) {
  try {
    let page = options.page;
    let skip = (page - 1) * (options.limit || EXERCISE_LIMIT);
    let conditions = {};
    if(options.text){
      conditions['$or'] = [
        {'title': { $regex: options.text.trim(), $options: "$i" }},
      ];
    }
    if(options.user){
      conditions.user = options.user
    }
    let resources
    switch (options.type) {
      case 1:
        resources = await Promise.all([
          ExerciseBBC.count(conditions),
          ExerciseBBC.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
        ]);
        resources[1].map(function(entry) {
          entry.type = 1;
          return entry;
        });
        return {
          total_items: resources[0],
          data: resources[1]
        }
      case 2:
        resources = await Promise.all([
          ExerciseVOA.count(conditions),
          ExerciseVOA.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
        ]);
        resources[1].map(function(entry) {
          entry.type = 2;
          return entry;
        });
        return {
          total_items: resources[0],
          data: resources[1]
        }
      case 3:
        resources = await Promise.all([
          ExerciseReadingKeyWord.count(conditions),
          ExerciseReadingKeyWord.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
        ]);
        resources[1].map(function(entry) {
          entry.type = 3;
          return entry;
        });
        return {
          total_items: resources[0],
          data: resources[1]
        }
      case 4:
        resources = await Promise.all([
          ExerciseMatching.count(conditions),
          ExerciseMatching.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
        ]);
        resources[1].map(function(entry) {
          entry.type = 4;
          return entry;
        });
        return {
          total_items: resources[0],
          data: resources[1]
        }
      case 5:
        resources = await Promise.all([
          ExerciseWriting.count(conditions),
          ExerciseWriting.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
        ]);
        resources[1].map(function(entry) {
          entry.type = 5;
          return entry;
        });
        return {
          total_items: resources[0],
          data: resources[1]
        }
      case 6:
        resources = await Promise.all([
          ExerciseWritingIELTS.count(conditions),
          ExerciseWritingIELTS.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
        ]);
        resources[1].map(function(entry) {
          entry.type = 6;
          return entry;
        });
        return {
          total_items: resources[0],
          data: resources[1]
        }
      case 7:
        resources = await Promise.all([
          ExerciseMultipleChoice.count(conditions),
          ExerciseMultipleChoice.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
        ]);
        resources[1].map(function(entry) {
          entry.type = 7;
          return entry;
        });
        return {
          total_items: resources[0],
          data: resources[1]
        }
      case 8:
        resources = await Promise.all([
          ExerciseMultipleChoiceUpload.count(conditions),
          ExerciseMultipleChoiceUpload.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
        ]);
        resources[1].map(function(entry) {
          entry.type = 8;
          return entry;
        });
        return {
          total_items: resources[0],
          data: resources[1]
        }

      case 9:
        conditions.parent = { $ne: true };
        resources = await Promise.all([
          FirstTest.count(conditions),
          FirstTest.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
        ]);
        resources[1].map(function(entry) {
          entry.type = 9;
          return entry;
        });
        return {
          total_items: resources[0],
          data: resources[1]
        }
      case 10:
        resources = await Promise.all([
          ExerciseSpeaking.count(conditions),
          ExerciseSpeaking.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
        ]);
        resources[1].map(function(entry) {
          entry.type = 10;
          return entry;
        });
        return {
          total_items: resources[0],
          data: resources[1]
        }
      default:
        resources = await Promise.all([
          ExerciseBBC.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
          ExerciseVOA.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
          ExerciseReadingKeyWord.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
          ExerciseMatching.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
          ExerciseWriting.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
          ExerciseWritingIELTS.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
          ExerciseMultipleChoice.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
          ExerciseMultipleChoiceUpload.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
          FirstTest.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
          ExerciseSpeaking.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
          ExerciseBBC.count(conditions).lean(),
          ExerciseVOA.count(conditions).lean(),
          ExerciseReadingKeyWord.count(conditions).lean(),
          ExerciseMatching.count(conditions).lean(),
          ExerciseWriting.count(conditions).lean(),
          ExerciseWritingIELTS.count(conditions).lean(),
          ExerciseMultipleChoice.count(conditions).lean(),
          ExerciseMultipleChoiceUpload.count(conditions).lean(),
          FirstTest.count(conditions).lean(),
          ExerciseSpeaking.count(conditions).lean(),
        ]);

        resources[0].map(function(entry) {
          entry.type = 1;
          return entry;
        });

        resources[1].map(function(entry) {
          entry.type = 2;
          return entry;
        });
        resources[2].map(function(entry) {
          entry.type = 3;
          return entry;
        });
        resources[3].map(function(entry) {
          entry.type = 4;
          return entry;
        });
        resources[4].map(function(entry) {
          entry.type = 5;
          return entry;
        });
        resources[5].map(function(entry) {
          entry.type = 6;
          return entry;
        });
        resources[6].map(function(entry) {
          entry.type = 7;
          return entry;
        });
        resources[7].map(function(entry) {
          entry.type = 8;
          return entry;
        });
        resources[8].map(function(entry) {
          entry.type = 9;
          return entry;
        });
        resources[9].map(function(entry) {
          entry.type = 10;
          return entry;
        });
        return {
          total_items: resources[10] + resources[11] + resources[12] + resources[13] + resources[14] + resources[15] + resources[16]  + resources[17]  + resources[18],
          data: resources[0].concat(resources[1]).concat(resources[2]).concat(resources[3]).concat(resources[4]).concat(resources[5]).concat(resources[6]).concat(resources[7]).concat(resources[8]).concat(resources[9])
        }
    }

  } catch (err) {
    console.log('err on getExercises:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
function getLevelByPoint(point){
  if(point >= 7.5) return 6
  if(point >= 7) return 5
  if(point >= 6.5) return 4
  if(point >= 6) return 3
  if(point >= 5.5) return 2
  if(point >= 5) return 1
  return 0
}
export async function getExercisesServiceStudy(options) {
  try {
    let page = options.page;
    let skip = (page - 1) * (options.limit || EXERCISE_LIMIT);
    let conditions = {
      role: 'admin',
      type: 1
    };
    if(options.user){
      let user = await User.findById(options.user)
      if(user){
        let point = user.point ? user.point[options.study] : 0
        if(!point || point < 5) {
          return {
            total_items: 0,
            data: []
          }
        }
        let level = getLevelByPoint(point)
        if(level) {
          conditions.level = level.toString()
        }
      }
    }
    if(options.study){
      switch (options.study) {
        case 'listening':
          conditions.typeTest = 1
          break
        case 'speaking':
          conditions.typeTest = 2
          break
        case 'reading':
          conditions.typeTest = 3
          break
        case 'writing':
          conditions.typeTest = 4
          break
        default:
          break
      }
    }
    let resources
    if(options.type) {

      switch (options.type) {
        case 1:
          resources = await Promise.all([
            ExerciseBBC.count(conditions),
            ExerciseBBC.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
          ]);
          resources[1].map(function(entry) {
            entry.type = 1;
            return entry;
          });
          return {
            total_items: resources[0],
            data: resources[1]
          }
        case 2:
          resources = await Promise.all([
            ExerciseVOA.count(conditions),
            ExerciseVOA.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
          ]);
          resources[1].map(function(entry) {
            entry.type = 2;
            return entry;
          });
          return {
            total_items: resources[0],
            data: resources[1]
          }
        case 3:
          resources = await Promise.all([
            ExerciseReadingKeyWord.count(conditions),
            ExerciseReadingKeyWord.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
          ]);
          resources[1].map(function(entry) {
            entry.type = 3;
            return entry;
          });
          return {
            total_items: resources[0],
            data: resources[1]
          }
        case 4:
          resources = await Promise.all([
            ExerciseMatching.count(conditions),
            ExerciseMatching.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
          ]);
          resources[1].map(function(entry) {
            entry.type = 4;
            return entry;
          });
          return {
            total_items: resources[0],
            data: resources[1]
          }
        case 5:
          resources = await Promise.all([
            ExerciseWriting.count(conditions),
            ExerciseWriting.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
          ]);
          resources[1].map(function(entry) {
            entry.type = 5;
            return entry;
          });
          return {
            total_items: resources[0],
            data: resources[1]
          }
        case 6:
          resources = await Promise.all([
            ExerciseWritingIELTS.count(conditions),
            ExerciseWritingIELTS.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
          ]);
          resources[1].map(function(entry) {
            entry.type = 6;
            return entry;
          });
          return {
            total_items: resources[0],
            data: resources[1]
          }
        case 7:
          resources = await Promise.all([
            ExerciseMultipleChoice.count(conditions),
            ExerciseMultipleChoice.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
          ]);
          resources[1].map(function(entry) {
            entry.type = 7;
            return entry;
          });
          return {
            total_items: resources[0],
            data: resources[1]
          }
        case 8:
          resources = await Promise.all([
            ExerciseMultipleChoiceUpload.count(conditions),
            ExerciseMultipleChoiceUpload.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
          ]);
          resources[1].map(function(entry) {
            entry.type = 8;
            return entry;
          });
          return {
            total_items: resources[0],
            data: resources[1]
          }
        case 10:
          resources = await Promise.all([
            ExerciseSpeaking.count(conditions),
            ExerciseSpeaking.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean()
          ]);
          resources[1].map(function(entry) {
            entry.type = 10;
            return entry;
          });
          return {
            total_items: resources[0],
            data: resources[1]
          }
        default:
          break
      }
    }
    resources = await Promise.all([
      ExerciseBBC.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
      ExerciseVOA.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
      ExerciseReadingKeyWord.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
      ExerciseMatching.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
      ExerciseWriting.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
      ExerciseWritingIELTS.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
      ExerciseMultipleChoice.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
      ExerciseMultipleChoiceUpload.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
      FirstTest.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
      ExerciseSpeaking.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(options.limit || EXERCISE_LIMIT).lean(),
      ExerciseBBC.count(conditions).lean(),
      ExerciseVOA.count(conditions).lean(),
      ExerciseReadingKeyWord.count(conditions).lean(),
      ExerciseMatching.count(conditions).lean(),
      ExerciseWriting.count(conditions).lean(),
      ExerciseWritingIELTS.count(conditions).lean(),
      ExerciseMultipleChoice.count(conditions).lean(),
      ExerciseMultipleChoiceUpload.count(conditions).lean(),
      FirstTest.count(conditions).lean(),
      ExerciseSpeaking.count(conditions).lean(),
    ]);

    resources[0].map(function(entry) {
      entry.type = 1;
      return entry;
    });

    resources[1].map(function(entry) {
      entry.type = 2;
      return entry;
    });
    resources[2].map(function(entry) {
      entry.type = 3;
      return entry;
    });
    resources[3].map(function(entry) {
      entry.type = 4;
      return entry;
    });
    resources[4].map(function(entry) {
      entry.type = 5;
      return entry;
    });
    resources[5].map(function(entry) {
      entry.type = 6;
      return entry;
    });
    resources[6].map(function(entry) {
      entry.type = 7;
      return entry;
    });
    resources[7].map(function(entry) {
      entry.type = 8;
      return entry;
    });
    resources[8].map(function(entry) {
      entry.type = 9;
      return entry;
    });
    resources[9].map(function(entry) {
      entry.type = 10;
      return entry;
    });
    return {
      total_items: resources[10] + resources[11] + resources[12] + resources[13] + resources[14] + resources[15] + resources[16]  + resources[17]  + resources[18],
      data: resources[0].concat(resources[1]).concat(resources[2]).concat(resources[3]).concat(resources[4]).concat(resources[5]).concat(resources[6]).concat(resources[7]).concat(resources[8]).concat(resources[9])
    }

  } catch (err) {
    console.log('err on getExercises:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExercisesReportById(options) {
  try {
    const EXERCISE_LIMIT = 200
    let page = options.page;
    let skip = (page - 1) * EXERCISE_LIMIT;
    let conditions = {};
    if(options.id){
      conditions.exercise = options.id
    }
    if(options.course){
      conditions.course = options.course
    }
    if(options.lesson){
      conditions.lesson = options.lesson
    }
    // if(options.user){
    //   conditions.user = options.user
    // }
    let resources
    switch (options.type) {
      case 1:
        resources = await Promise.all([
          ExerciseBBCReport.count(conditions),
          ExerciseBBCReport.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(EXERCISE_LIMIT).lean()
        ]);
        break
      case 2:
        resources = await Promise.all([
          ExerciseVOAReport.count(conditions),
          ExerciseVOAReport.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(EXERCISE_LIMIT).lean()
        ]);
        break
      case 3:
        resources = await Promise.all([
          ExerciseReadingKeyWordReport.count(conditions),
          ExerciseReadingKeyWordReport.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(EXERCISE_LIMIT).lean()
        ]);
        break
      case 4:
        resources = await Promise.all([
          ExerciseMatchingReport.count(conditions),
          ExerciseMatchingReport.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(EXERCISE_LIMIT).lean()
        ]);
        break
      case 5:
        resources = await Promise.all([
          ExerciseWritingReport.count(conditions),
          ExerciseWritingReport.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(EXERCISE_LIMIT).lean()
        ]);
        break
      case 6:
        resources = await Promise.all([
          ExerciseWritingIELTSReport.count(conditions),
          ExerciseWritingIELTSReport.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(EXERCISE_LIMIT).lean()
        ]);
        break
      case 7:
        resources = await Promise.all([
          ExerciseMultipleChoiceReport.count(conditions),
          ExerciseMultipleChoiceReport.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(EXERCISE_LIMIT).lean()
        ]);
        break
      case 8:
        resources = await Promise.all([
          ExerciseMultipleChoiceUploadReport.count(conditions),
          ExerciseMultipleChoiceUploadReport.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(EXERCISE_LIMIT).lean()
        ]);
        break
      case 9:
        conditions.final = true
        resources = await Promise.all([
          FirstTestReport.count(conditions),
          FirstTestReport.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(EXERCISE_LIMIT).lean()
        ]);
        break
      case 10:
        resources = await Promise.all([
          ExerciseSpeakingReport.count(conditions),
          ExerciseSpeakingReport.find(conditions).sort({dateAdded: -1} ).skip(skip).limit(EXERCISE_LIMIT).lean()
        ]);
        break
        break
      default:
        return null
    }
    let promises = []
    if(resources[1]){
      promises = resources[1].map(async item => {
        if(item.user){
          let userInfo = await User.findById(item.user)
          if(userInfo){
            item.user = {
              cuid: userInfo.cuid,
              fullName: userInfo.fullName
            }
          }
        }
        if(item.course){
          let courseInfo = await Course.findById(item.course)
          if(courseInfo){
            item.course = {
              title: courseInfo.title,
              slug: courseInfo.slug,
            }
          }
        }
        if(item.lesson){
          let lessonInfo = await LiveStream.findById(item.lesson)
          if(lessonInfo){
            item.lesson = lessonInfo.title
          } else {
            item.lesson = ''
          }
        }
        return item
      })
    }
    return {
      total_items: resources[0],
      data: await Promise.all(promises),
      total_page: Math.ceil(resources[0]/EXERCISE_LIMIT),
      current_page: page
    }
  } catch (err) {
    console.log('err on getExercises:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseBBC(data) {
  try {
    let exercise =  await ExerciseBBC.findById(data.id)
    if(exercise){
      exercise.questions = await ExerciseBBCQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    return {
      _id: exercise._id,
      user: exercise.user,
      title: exercise.title,
      description: exercise.description,
      url: exercise.url,
      total: exercise.total,
      questions: exercise.questions,
      view: exercise.view,
      role: exercise.role,
      type: exercise.type,
      level: exercise.level,
      typeTest: exercise.typeTest,
    }
  } catch (err) {
    console.log('err on getExerciseBBC:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseBBCToUpdate(data) {
  try {
    let exercise = await ExerciseBBC.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseBBCQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseBBC:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseBBCQuestion(data) {
  try {
    return await ExerciseBBCQuestion.find({exercise: data.id}, 'question index onMore desMore').sort({index: 1})
  } catch (err) {
    console.log('err on getExerciseBBCQuestion:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseBBCResult(data) {
  try{
  return await ExerciseBBCQuestion.find({exercise: data.id}).sort({index: 1}).lean()
  } catch (err) {
    console.log('err on getExerciseBBCResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}


export async function getExerciseReadingKeyword(data) {
  try {
    let exercise = await ExerciseReadingKeyWord.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseReadingKeywordQuestion.find({exercise: data.id}, 'question index onMore desMore').sort({index: 1}).lean()
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseReadingKeyword:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseReadingKeywordToUpdate(data) {
  try {
    let exercise = await ExerciseReadingKeyWord.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseReadingKeywordQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseReadingKeyword:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseReadingKeywordResult(data) {
  try {
    let exercise = await ExerciseReadingKeyWord.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseReadingKeywordQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseReadingKeywordResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getExerciseMultiple(data) {
  try {
    let exercise = await ExerciseMultipleChoice.findById(data.id).lean()
    if(exercise){
      let questions = await ExerciseMultipleChoiceQuestion.find({exercise: data.id}).sort({index: 1}).lean()
      if(questions){
        questions = questions.map(question => {
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
      exercise.questions = questions
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseMultiple:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseMultipleUpload(data) {
  try {
    let exercise = await ExerciseMultipleChoiceUpload.findById(data.id).lean()
    if(exercise && exercise.questions){
      exercise.questions.map(question => {
        return question.number
      })
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseMultipleUpload:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}


export async function getExerciseTest(data){
  try {
    let exercise = await FirstTest.findById(data.id).lean();
    let report = '';
    if(!exercise) {
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    if (data.lesson) {
      let lesson = await LiveStream.findById(data.lesson);
      if(lesson){
        let condition = {
          user: data.user,
          exercise: data.id,
          lesson: data.lesson,
          course: lesson.course
        };
        let exerciseReport = await FirstTestReport.findOne(condition).lean();
        if (exerciseReport && exerciseReport.numberSubmit) {
          exercise.numberSubmit -= exerciseReport.numberSubmit;
          if (exercise.numberSubmit < 0) {
            exercise.numberSubmit = 0;
          }
          if (exerciseReport.final) {
            exercise.numberSubmit = 0;
            report = exerciseReport._id;
          }
        }
      }
    }
    if (Array.isArray(exercise.sectionExercise)) {
      let promise = exercise.sectionExercise.map(async section => {
        let data = {};
        switch (section.type) {
          case 1:
            data =  await getExerciseBBC({id: section._id});
            data.type = section.type;
            return data;
          case 2:
            data = await getExerciseVOATestQuestionService({id: section._id});
            data.type = section.type;
            return data;
          case 3:
            data = await getExerciseReadingKeyword({id: section._id});
            data.type = section.type;
            return data;
          case 4:
            data = await getExerciseMatching({id: section._id});
            data.type = section.type;
            return data;
          case 5:
            data = await getExerciseWriting({id: section._id});
            data.type = section.type;
            return data;
          case 6:
            data = await getExerciseWritingIELTS({id: section._id});
            data.type = section.type;
            return data;
          case 7:
            data = await getExerciseMultiple({id: section._id});
            data.type = section.type;
            return data;
          default:
            return null
        }
      })
      exercise.type = data.type;
      if (report) {
        exercise.report = report;
      }
      exercise.dataSection = await Promise.all(promise);
      return exercise;
    }
  } catch (err) {
    console.log('err on getExerciseMultiple:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function countExerciseQuestions(data) {
  try {
    let exercise = await FirstTest.findById(data.id).lean();
    if(!exercise) {
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    if (Array.isArray(exercise.sectionExercise)) {
      let promise = exercise.sectionExercise.map(async section => {
        const dataSection = {
          _id: section._id,
          type: section.type
        }
        let questions = [];
        switch (section.type) {
          case 1:
            questions =  await ExerciseBBCQuestion.count({exercise: section._id});
            return questions;
          case 2:
            const exerciseVOA = await ExerciseVOA.findById(section._id).lean();
            const text = exerciseVOA.text
            const scr = text.split(" ");
            const numberWords = scr.length;
            return parseInt(numberWords * 2 / 5);
          case 3:
            questions = await ExerciseReadingKeywordQuestion.count({exercise: section._id});
            return questions;
          case 4:
            questions = await ExerciseMatchingQuestion.count({exercise: section._id});
            return questions;
          case 7:
            questions = await ExerciseMultipleChoiceQuestion.count({exercise: section._id});
            return questions;
          default:
            return null
        }
      })
      let numberQuestions = await Promise.all(promise);
      return numberQuestions;
    }
  } catch (error) {
    console.log('err on countExerciseQuestions:', error);
    return Promise.reject({status: error.status || 500, error: error.err || 'Internal error.'});
  }
}
export async function getExerciseMultipleToUpdate(data) {
  try {
    let exercise = await ExerciseMultipleChoice.findById(data.id).lean()
    if(exercise){
      let questions = await ExerciseMultipleChoiceQuestion.find({exercise: data.id}).sort({index: 1}).lean()
      questions = questions.map(question => {
        question.id = question._id;
        return question
      });
      exercise.questions = questions;
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseMultipleToUpdate:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}


export async function getExerciseTestToUpdate(data) {
  try {
    let exercise = await FirstTest.findById(data.id).lean();
    if(!exercise) {
      return Promise.reject({ status: 400, error: 'Exercise not found'});
    }

    let promise = exercise.sectionExercise.map(async item => {
      let data = {};
      switch (item.type) {
        case 1:
          data =  await ExerciseBBC.findById(item._id).lean();
          if(!data) return null;
          data.type = item.type;
          return data;
        case 2:
          data = await ExerciseVOA.findById(item._id).lean();
          if(!data) return null;
          data.type = item.type;
          return data;
        case 3:
          data = await ExerciseReadingKeyWord.findById(item._id).lean();
          if(!data) return null;
          data.type = item.type;
          return data;
        case 4:
          data = await ExerciseMatching.findById(item._id).lean();
          if(!data) return null;
          data.type = item.type;
          return data;
        case 5:
          data = await ExerciseWriting.findById(item._id).lean();
          data.type = item.type;
          return data;
        case 6:
          data = await ExerciseWritingIELTS.findById(item._id).lean();
          if(!data) return null;
          data.type = item.type;
          return data;
        case 7:
          data = await ExerciseMultipleChoice.findById(item._id).lean();
          if(!data) return null;
          data.type = item.type;
          return data;
        case 10:
          data = await ExerciseSpeaking.findById(item._id).lean();
          if(!data) return null;
          data.type = item.type;
          return data;
        default:
          return null
      }
    })
    let initSection = await Promise.all(promise);
    initSection = initSection.filter(section => section);
    exercise.initSection = initSection;
    return exercise;
  } catch (err) {
    console.log('err on getExerciseTestToUpdate:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}


export async function getExerciseMultipleUploadToUpdate(data) {
  try {
    let exercise = await ExerciseMultipleChoiceUpload.findById(data.id).lean()
    return exercise
  } catch (err) {
    console.log('err on getExerciseMultipleToUpdate:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseMultipleResult(data) {
  try {
    let exercise = await ExerciseMultipleChoice.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseMultipleChoiceQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseReadingKeywordResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseMultipleUploadResult(data) {
  try {
    let exercise = await ExerciseMultipleChoiceUpload.findById(data.id).lean()
    return exercise
  } catch (err) {
    console.log('err on getExerciseReadingKeywordResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseMatching(data) {
  try {
    let exercise = await ExerciseMatching.findById(data.id).lean()
    if(exercise){
      let results = await ExerciseMatchingQuestion.find({exercise: data.id}).sort({index: 1}).lean()
      if(results){
        let questions = [], answers = []
          results.map(question => {
            questions.push({
              _id: question._id,
              question: question.question,

            })
            answers.push(question.answer)
        })
        exercise.questions = questions
        exercise.answers = answers.sort(function() {
          return Math.random() - 0.5
        })
      }
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseMatching:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseSpeaking(data) {
  try {
    let exercise = await ExerciseSpeaking.findById(data.id).lean()
    if(exercise){
      let results = await ExerciseSpeakingQuestion.find({exercise: data.id}).sort({index: 1}).lean()
      if(results){
        let questions = [], answers = []
          results.map(question => {
            questions.push({
              _id: question._id,
              question: question.question,
              onMore: question.onMore,
              desMore: question.onMore ? question.desMore : '',

            })
        })
        exercise.questions = questions
      }
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseMatching:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseMatchingToUpdate(data) {
  try {
    let exercise = await ExerciseMatching.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseMatchingQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseMatching:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseMatchingResult(data) {
  try {
    let exercise = await ExerciseMatching.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseMatchingQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseMatchingResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseWriting(data) {
  try {
    let exercise = await ExerciseWriting.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseWritingQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    if(exercise && exercise.view !== 1){
      delete exercise.urlAnswer;
      delete exercise.descriptionAnswer;
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseWriting:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseWritingToUpdate(data) {
  try {
    let exercise = await ExerciseWriting.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseWritingQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseWriting:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseSpeakingToUpdate(data) {
  try {
    let exercise = await ExerciseSpeaking.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseSpeakingQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseWriting:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseWritingIELTS(data) {
  try {
    let exercise = await ExerciseWritingIELTS.findById(data.id).lean()
    if(exercise){
      exercise.questions = await ExerciseWritingIELTSQuestion.find({exercise: data.id}).sort({index: 1}).lean()
    }
    return exercise
  } catch (err) {
    console.log('err on getExerciseWritingIELTS:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addExerciseBBC(data, id = '') {
  try {
    if(!id){
      let initData = {
        title: data.title,
        description: data.description,
        total: data.total,
        view: data.view,
        text: data.text,
        user: data.user?._id,
        role: data.user?.role,
        url: data.url,
        type: data.typeExercise || 1,
        typeTest: data.typeTest || 1,
        level: parseInt(data.level) || 0,
        transcript: data.transcript
      };
      let exercise = await ExerciseBBC.create(initData);
      exercise = JSON.parse(JSON.stringify(exercise));
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            delete question.id;
            question.index = index;
            await ExerciseBBCQuestion.create(question);
          })
        }
      }
      return exercise;
    } else {
      let exercise = await ExerciseBBC.findOne({_id: id, user: data.user})
      if(!exercise){
        return Promise.reject({status: 400, error: 'Exercise not found'});
      }
      exercise.title = data.title
      exercise.description = data.description
      exercise.total = data.total
      exercise.view = data.view
      exercise.user = data.user
      exercise.type = data.typeExercise || 1
      exercise.typeTest = data.typeTest || 1
      exercise.level = parseInt(data.level) || 0
      exercise.url = data.url
      await exercise.save();
      await ExerciseBBCQuestion.remove({exercise: exercise._id})
      if (data.questions) {
        if (data.questions) {
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            delete question.id;
            question.index = index;
            await ExerciseBBCQuestion.create(question);
          })
        }
      }
      return exercise;
    }
  } catch (err) {
    console.log('err on addExerciseBBC:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function removeExerciseBBC(id = '', user) {
  try {
    let exercise = await ExerciseBBC.findOne({_id: id, user: user})
    if(!exercise){
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    await ExerciseBBC.remove({_id: id})
    await ExerciseBBCQuestion.remove({exercise: id})
  } catch (err) {
    console.log('err on removeExerciseBBC:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function removeExerciseMultiple(id = '', user) {
  try {
    let exercise = await ExerciseMultipleChoice.findOne({_id: id, user: user})
    if(!exercise){
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    await ExerciseMultipleChoice.remove({_id: id})
    await ExerciseMultipleChoiceQuestion.remove({exercise: id})
    await ExerciseToCourse.remove({
      exercise: id,
      type: 7
    })
  } catch (err) {
    console.log('err on removeExerciseMultiple:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}


export async function removeExerciseMultipleUpload(id = '', user) {
  try {
    let exercise = await ExerciseMultipleChoiceUpload.findOne({_id: id, user: user})
    if(!exercise){
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    await ExerciseMultipleChoiceUpload.remove({_id: id})
    await ExerciseToCourse.remove({
      exercise: id,
      type: 8
    })
  } catch (err) {
    console.log('err on removeExerciseMultiple:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function addExerciseMultiple(data, id = '') {
  try {
    if(!id){
      let initData = {
        title: data.title,
        description: data.description,
        total: data.total,
        view: data.view,
        user: data.user?._id,
        role: data.user?.role,
        time: data.time,
        type: data.typeExercise || 1,
        typeTest: data.typeTest || 1,
        level: parseInt(data.level) || 0,
        joinAgain: data.joinAgain,
      }
      let exercise = await ExerciseMultipleChoice.create(initData);
      exercise = JSON.parse(JSON.stringify(exercise));
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            delete question.id;
            question.index = index;
            await ExerciseMultipleChoiceQuestion.create(question);
          })
        }
      }
      return exercise;
    } else {
      let exercise = await ExerciseMultipleChoice.findOne({_id: id, user: data.user})
      if(!exercise){
        return Promise.reject({status: 400, error: 'Exercise not found'});
      }
      exercise.title = data.title
      exercise.description = data.description
      exercise.total = data.total
      exercise.view = data.view
      exercise.user = data.user
      exercise.time = data.time
      exercise.type = data.typeExercise || 1
      exercise.typeTest = data.typeTest || 1
      exercise.level = parseInt(data.level) || 0
      exercise.joinAgain = data.joinAgain
      exercise.save()
      await ExerciseMultipleChoiceQuestion.remove({exercise: exercise._id})
      if (data.questions) {
        data.questions.map(async (question, index) => {
          question.exercise = exercise._id;
          delete question.id;
          question.index = index;
          await ExerciseMultipleChoiceQuestion.create(question);
        })
      }
      return exercise;
    }
  } catch (err) {
    console.log('err on addExerciseMultiple:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function addExerciseTest(data, id = '') {
  try {
    if(!id){
      let initData = {
        title: data.title,
        description: data.description,
        user: data.user,
        time: data.time,
        sectionExercise: data.sectionExercise,
        total: data.total,
        typeTest: data.typeTest,
        numberSubmit: data.numberSubmit,
      }
      let exercise = await FirstTest.create(initData);
      return exercise;
    } else {
      let exercise = await FirstTest.findOne({_id: id, user: data.user });
      if(!exercise){
        return Promise.reject({status: 400, error: 'Exercise not found'});
      }
      exercise.title = data.title;
      exercise.description = data.description;
      exercise.user = data.user;
      exercise.time = data.time;
      exercise.sectionExercise = data.sectionExercise;
      exercise.total = data.total;
      exercise.typeTest = data.typeTest;
      exercise.numberSubmit = data.numberSubmit;
      let respond = await exercise.save();
      return respond;
    }
  } catch (err) {
    console.log('err on addExerciseTest:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addExerciseMultipleUpload(data, id = '') {
  try {
    if(!id){
      let initData = {
        title: data.title,
        description: data.description,
        total: data.total,
        view: data.view,
        user: data.user?._id,
        role: data.user?.role,
        time: data.time,
        url: data.url,
        number: data.number,
        joinAgain: data.joinAgain,
        type: data.typeExercise || 1,
        typeTest: data.typeTest || 1,
        level: parseInt(data.level) || 0,
        questions: data.questions
      }
      let exercise = await ExerciseMultipleChoiceUpload.create(initData);
      exercise = JSON.parse(JSON.stringify(exercise));
      return exercise;
    } else {
      let exercise = await ExerciseMultipleChoiceUpload.findOne({_id: id, user: data.user})
      if(!exercise){
        return Promise.reject({status: 400, error: 'Exercise not found'});
      }
      exercise.title = data.title
      exercise.description = data.description
      exercise.total = data.total
      exercise.view = data.view
      exercise.user = data.user
      exercise.time = data.time
      exercise.url = data.url
      exercise.number = data.number
      exercise.joinAgain = data.joinAgain
      exercise.questions = data.questions
      exercise.type = data.typeExercise || 1
      exercise.typeTest = data.typeTest || 1
      exercise.level = parseInt(data.level) || 0
      exercise.save()
      return exercise;
    }
  } catch (err) {
    console.log('err on addExerciseMultiple:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function addExerciseVOA(data, id = '') {
  try {
    if(!id){
      let initData = {
        title: data.title,
        description: data.description,
        text: data.text,
        user: data.user?._id,
        role: data.user?.role,
        url: data.url,
        total: data.total,
        view: data.view,
        type: data.typeExercise || 1,
        typeTest: data.typeTest || 1,
        level: parseInt(data.level) || 0,
        transcript: data.transcript
      }
      return await ExerciseVOA.create(initData);
    } else {
      let exercise = await ExerciseVOA.findOne({_id: id, user: data.user})
      if(!exercise){
        return Promise.reject({status: 400, error: 'Exercise not found'});
      }
      exercise.title = data.title
      exercise.description = data.description
      exercise.text = data.text
      exercise.user = data.user
      exercise.url = data.url
      exercise.total = data.total
      exercise.type = data.typeExercise || 1
      exercise.typeTest = data.typeTest || 1
      exercise.level = parseInt(data.level) || 0
      exercise.view = data.view
      return await exercise.save();
    }
  } catch (err) {
    console.log('err on addExerciseVOA:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getExerciseVOA(data) {
  try {
    let exercise = await ExerciseVOA.findById(data.id)
    return {
      _id: exercise._id,
      user: exercise.user,
      title: exercise.title,
      description: exercise.description,
      role: exercise.role,
      type: exercise.type,
      level: exercise.level,
      typeTest: exercise.typeTest,
    }
  } catch (err) {
    console.log('err on getExerciseVOA:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseVOAToUpdate(data) {
  try {
    return await ExerciseVOA.findById(data.id).lean()
  } catch (err) {
    console.log('err on getExerciseVOA:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseVOAQuestionService(data) {
  try {
    let exercise = await ExerciseVOA.findById(data.id).lean()
    let text = exercise.text
    let scr = text.split(" ");
    let scrOrigin = text.split(" ");
    let scrLength = scr.length;
    for (let i = 0; i < parseInt(scrLength*2/3); i++) {
      var x = Math.floor((Math.random() * (scrLength-1)) + 1);
        scr[x] = "xxx";
    }

    for (let i = 0; i < scrLength; i++) {
      if (scr[i]=="xxx") {
        let result = scrOrigin[i].replace(/[^A-Za-z0-9]/g, '');
        scr[i] = {length: result.length};
      }
    }
    return {
      _id: exercise._id,
      url: exercise.url,
      text: scr
    }
  } catch (err) {
    console.log('err on getExerciseVOAQuestionService:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getExerciseVOATestQuestionService(data) {
  try {
    let exercise = await ExerciseVOA.findById(data.id).lean();
    let text = exercise.text
    let scr = text.split(" ");
    let scrOrigin = text.split(" ");
    let scrLength = scr.length; //length
    const numberEmpty = parseInt(scrLength * 2 / 5); // number
    let emptyPlace = [];
    while(emptyPlace.length < numberEmpty) {
      const place = Math.floor(Math.random() * scrLength);
      if (emptyPlace.indexOf(place) === -1) {
        emptyPlace.push(place);
      }
    }
    for (let i = 0; i < scrLength; i++) {
      if (emptyPlace.indexOf(i) !== -1) {
        let result = scrOrigin[i].replace(/[^A-Za-z0-9]/g, '');
        scr[i] = {length: result.length};
      }
    }
    exercise.text = scr;
    return exercise
  } catch (err) {
    console.log('err on getExerciseVOATestQuestionService:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export function checkUppercase (strings) {
  let check = false;
  let character = strings.charAt(0);
  if (!isNaN(character * 1)) {
    ;
  } else {
    if (character == character.toUpperCase())
      return true;
  }
  return check;
}
export async function getExerciseVOAResult(data) {
  try {
    return await ExerciseBBCQuestion.find({exercise: data.id})
  } catch (err) {
    console.log('err on getExerciseVOAResult:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function removeExerciseVOA(id = '', user) {
  try {
    let exercise = await ExerciseVOA.findOne({_id: id, user: user})
    if(!exercise){
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    await ExerciseVOA.remove({_id: id})
    return true
  } catch (err) {
    console.log('err on removeExerciseVOA:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addExerciseReadingKeyword(data, id = '') {
  try {
    if(!id){
      let initData = {
        title: data.title,
        description: data.description,
        url: data.url,
        total: data.total,
        view: data.view,
        type: data.typeExercise || 1,
        typeTest: data.typeTest || 1,
        level: parseInt(data.level) || 0,
        user: data.user?._id,
        role: data.user?.role,
      }
      let exercise = await ExerciseReadingKeyWord.create(initData);
      exercise = JSON.parse(JSON.stringify(exercise));
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            delete question.id;
            question.index = index;
            await ExerciseReadingKeywordQuestion.create(question);
          })
        }
      }
      return exercise;
    } else {
      let exercise = await ExerciseReadingKeyWord.findOne({_id: id, user: data.user})
      if(!exercise){
        return Promise.reject({status: 400, error: 'Exercise not found'});
      }
      exercise.title = data.title
      exercise.description = data.description
      exercise.url = data.url
      exercise.total = data.total
      exercise.view = data.view
      exercise.type = data.typeExercise || 1
      exercise.typeTest = data.typeTest || 1
      exercise.level = parseInt(data.level) || 0
      exercise.user = data.user
      await exercise.save();
      await ExerciseReadingKeywordQuestion.remove({exercise: exercise._id})
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            delete question.id;
            question.index = index;
            await ExerciseReadingKeywordQuestion.create(question);
          })
        }
      }
      return exercise;
    }
  } catch (err) {
    console.log('err on addExerciseReadingKeyword:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function removeExerciseReadingKeyword(id = '', user) {
  try {
    let exercise = await ExerciseReadingKeyWord.findOne({_id: id, user: user})
    if(!exercise){
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    await ExerciseReadingKeyWord.remove({_id: id})
    await ExerciseReadingKeywordQuestion.remove({exercise: id})
  } catch (err) {
    console.log('err on removeExerciseReadingKeyword:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addExerciseWriting(data, id = '') {
  try {
    if(!id){
      let initData = {
        title: data.title,
        description: data.description,
        url: data.url,
        total: data.total,
        view: data.view,
        viewBefore: data.viewBefore,
        joinAgain: data.joinAgain,
        type: data.typeExercise || 1,
        typeTest: data.typeTest || 1,
        level: parseInt(data.level) || 0,
        user: data.user?._id,
        role: data.user?.role,
      }
      let exercise = await ExerciseWriting.create(initData);
      exercise = JSON.parse(JSON.stringify(exercise));
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            question.index = index;
            delete question.id;
            await ExerciseWritingQuestion.create(question);
          })
        }
      }
      return exercise;
    } else {
      let exercise = await ExerciseWriting.findOne({_id: id, user: data.user})
      if(!exercise){
        return Promise.reject({status: 400, error: 'Exercise not found'});
      }
      exercise.title = data.title
      exercise.description = data.description
      exercise.url = data.url
      exercise.total = data.total
      exercise.view = data.view
      exercise.viewBefore = data.viewBefore
      exercise.joinAgain = data.joinAgain
      exercise.urlAnswer = data.urlAnswer
      exercise.type = data.typeExercise || 1
      exercise.typeTest = data.typeTest || 1
      exercise.level = parseInt(data.level) || 0
      exercise.descriptionAnswer = data.descriptionAnswer
      exercise.user = data.user
     await exercise.save();
      await ExerciseWritingQuestion.remove({exercise: id})
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            delete question.id;
            question.index = index;
            await ExerciseWritingQuestion.create(question);
          })
        }
      }
      return exercise;
    }
  } catch (err) {
    console.log('err on addExerciseWriting:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addExerciseSpeaking(data, id = '') {
  try {
    if(!id){
      let initData = {
        title: data.title,
        description: data.description,
        url: data.url,
        total: data.total,
        view: data.view,
        viewBefore: data.viewBefore,
        joinAgain: data.joinAgain,
        urlAnswer: data.urlAnswer,
        type: data.typeExercise || 1,
        typeTest: data.typeTest || 1,
        typeSpeaking: parseInt(data.typeSpeaking) || 1,
        level: parseInt(data.level) || 0,
        descriptionAnswer: data.descriptionAnswer,
        user: data.user?._id,
        role: data.user?.role,
      }
      let exercise = await ExerciseSpeaking.create(initData);
      exercise = JSON.parse(JSON.stringify(exercise));
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            question.index = index;
            delete question.id;
            await ExerciseSpeakingQuestion.create(question);
          })
        }
      }
      return exercise;
    } else {
      let exercise = await ExerciseSpeaking.findOne({_id: id, user: data.user})
      if(!exercise){
        return Promise.reject({status: 400, error: 'Exercise not found'});
      }
      exercise.title = data.title
      exercise.description = data.description
      exercise.url = data.url
      exercise.total = data.total
      exercise.view = data.view
      exercise.viewBefore = data.viewBefore
      exercise.joinAgain = data.joinAgain
      exercise.type = parseInt(data.typeExercise) || 1
      exercise.typeSpeaking = parseInt(data.typeSpeaking) || 1
      exercise.level = parseInt(data.level) || 0
      exercise.typeTest = data.typeTest || 1
      exercise.user = data.user
     await exercise.save();
      await ExerciseSpeakingQuestion.remove({exercise: id})
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            delete question.id;
            question.index = index;
            await ExerciseSpeakingQuestion.create(question);
          })
        }
      }
      return exercise;
    }
  } catch (err) {
    console.log('err on addExerciseWriting:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function removeExerciseWriting(id = '', user) {
  try {
    let exercise = await ExerciseWriting.findOne({_id: id, user: user})
    if(!exercise){
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    await ExerciseWriting.remove({_id: id})
    await ExerciseWritingQuestion.remove({exercise: id})
    await ExerciseToCourse.remove({
      exercise: id,
      type: 5
    })
  } catch (err) {
    console.log('err on removeExerciseWriting:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addExerciseWritingIELTS(data, id = '') {
  try {
    if(!id){
      let initData = {
        title: data.title,
        description: data.description,
        total: data.total,
        view: data.view,
        type: data.typeExercise || 1,
        typeTest: data.typeTest || 1,
        level: parseInt(data.level) || 0,
        user: data.user?._id,
        role: data.user?.role,
      }
      let exercise = await ExerciseWritingIELTS.create(initData);
      exercise = JSON.parse(JSON.stringify(exercise));
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            question.index = index;
            delete question.id;
            await ExerciseWritingIELTSQuestion.create(question);
          })
        }
      }
      return exercise;
    } else {
      let exercise = await ExerciseWritingIELTS.findOne({_id: id, user: data.user})
      if(!exercise){
        return Promise.reject({status: 400, error: 'Exercise not found'});
      }
      exercise.title = data.title
      exercise.description = data.description
      exercise.total = data.total
      exercise.view = data.view
      exercise.type = data.typeExercise || 1
      exercise.typeTest = data.typeTest || 1
      exercise.level = parseInt(data.level) || 0
      exercise.user = data.user
      await exercise.save()
      await ExerciseWritingIELTSQuestion.remove({exercise: id})
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            delete question.id;
            question.index = index;
            await ExerciseWritingIELTSQuestion.create(question);
          })
        }
      }
      return exercise;
    }
  } catch (err) {
    console.log('err on addExerciseWritingIELTS:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function removeExerciseSpeaking(id = '', user) {
  try {
    let exercise = await ExerciseSpeaking.findOne({_id: id, user: user})
    if(!exercise){
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    await ExerciseSpeaking.remove({_id: id})
    await ExerciseSpeakingQuestion.remove({exercise: id})
    await ExerciseToCourse.remove({
      exercise: id,
      type: 10
    })
  } catch (err) {
    console.log('err on removeExerciseWriting:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function removeExerciseTest(id = '', user) {
  try {
    let exercise = await FirstTest.findOne({_id: id, user: user})
    if(!exercise){
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    await FirstTest.remove({_id: id})
    await ExerciseToCourse.remove({
      exercise: id,
      type: 9
    })
  } catch (err) {
    console.log('err on removeExerciseWriting:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function removeExerciseWritingIELTS(id = '', user) {
  try {
    let exercise = await ExerciseWritingIELTS.findOne({_id: id, user: user})
    if(!exercise){
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    await ExerciseWritingIELTS.remove({_id: id})
    await ExerciseWritingIELTSQuestion.remove({exercise: id})
  } catch (err) {
    console.log('err on removeExerciseWritingIELTS:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addExerciseMatching(data, id = '') {
  try {
    if(!id){
      let initData = {
        title: data.title,
        description: data.description,
        total: data.total,
        view: data.view,
        type: data.typeExercise || 1,
        typeTest: data.typeTest || 1,
        level: parseInt(data.level) || 0,
        user: data.user?._id,
        role: data.user?.role,
      }
      let exercise = await ExerciseMatching.create(initData);
      exercise = JSON.parse(JSON.stringify(exercise));
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            question.index = index;
            delete question.id;
            await ExerciseMatchingQuestion.create(question);
          })
        }
      }
      return exercise;
    } else {
      let exercise = await ExerciseMatching.findOne({_id: id, user: data.user})
      if(!exercise){
        return Promise.reject({status: 400, error: 'Exercise not found'});
      }
      exercise.title = data.title
      exercise.description = data.description
      exercise.total = data.total
      exercise.view = data.view
      exercise.type = data.typeExercise || 1
      exercise.typeTest = data.typeTest || 1
      exercise.level = parseInt(data.level) || 0
      exercise.user = data.user
      await exercise.save()
      await ExerciseMatchingQuestion.remove({exercise: id})
      if(exercise && data.questions){
        if(data.questions){
          data.questions.map(async (question, index) => {
            question.exercise = exercise._id;
            delete question.id;
            question.index = index;
            await ExerciseMatchingQuestion.create(question);
          })
        }
      }
      return exercise;
    }
  } catch (err) {
    console.log('err on addExerciseMatching:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function removeExerciseMatching(id = '', user) {
  try {
    let exercise = await ExerciseMatching.findOne({_id: id, user: user})
    if(!exercise){
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    await ExerciseMatching.remove({_id: id})
    await ExerciseMatchingQuestion.remove({exercise: id})
    return true
  } catch (err) {
    console.log('err on removeExerciseMatching:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function updateExercise(id, data) {
  try {
    switch (data.type) {
      case 1:
        return await addExerciseBBC(data, id)
      case 2:
        return await addExerciseVOA(data, id)
      case 3:
        return await addExerciseReadingKeyword(data, id)
      case 4:
        return await addExerciseMatching(data, id)
      case 5:
        return await addExerciseWriting(data, id)
      case 6:
        return await addExerciseWritingIELTS(data, id)
      case 7:
        return await addExerciseMultiple(data, id)
      case 8:
        return await addExerciseMultipleUpload(data, id)
      case 9:
        return await addExerciseTest(data, id)
      case 10:
        return await addExerciseSpeaking(data, id)
      default:
        return null
    }
  } catch (err) {
    console.log('err on updateExercise service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function teacherReviewExerciseService(data, type, id, user) {
  try {
    let object = Object.assign({}, data);
    object.type = type;
    object.id = id;
    let result = await getExerciseReport(object);
    if (!result) {
      return Promise.reject({status: 404, success: false, error: 'Not found.'})
    }
    let exercise = null;
    switch (type) {
      case 1:
        exercise = await ExerciseBBC.findById(id).lean();
        break;
      case 2:
        exercise = await ExerciseVOA.findById(id).lean();
        break;
      case 3:
        exercise = await ExerciseReadingKeyWord.findById(id).lean();
        break;
      case 4:
        exercise = await ExerciseMatching.findById(id).lean();
        break;
      case 5:
        exercise = await ExerciseWriting.findById(id).lean();
        break;
      case 6:
        exercise = await ExerciseWritingIELTS.findById(id).lean();
        break;
      case 7:
        exercise = await ExerciseMultipleChoice.findById(id).lean();
      case 8:
        exercise = await ExerciseMultipleChoiceUpload.findById(id).lean();
        break;
      default:
        break;
    }
    if (!exercise) {
      return Promise.reject({status: 404, success: false, error: 'Not found Exercise'})
    }
    if (exercise.user.toString() !== user.toString()) {
      return Promise.reject({status: 404, success: false, error: 'Not Permission'})
    }
    let fields = Object.keys(data);
    fields.map(e => {
      if (e in data) {
        if (e === 'note') {
          result.note = data[e];
        } else {
          result[e] = data[e];
        }
      }
    });
    await result.save();
    return result;
  } catch (error) {
    console.log('err on updateExercise service:', error);
    return Promise.reject({status: error.status || 500, error: error.err || 'Internal error.'});
  }
}
export async function addResultExercise(id, data) {
  try {
    if(data.lesson){
      let lesson = await LiveStream.findById(data.lesson)
      if(lesson){
        data.course = lesson.course
      }
    }
    let result = {}
    switch (parseInt(data.type)) {
      case 1:
        result = await addResultExerciseBBC(data, id)
        if(result.data.view == 1) {
          return result
        } else {
          return {
            tracking: result.tracking,
            data: {
              correct: result.data.correct,
              inCorrect: result.data.inCorrect,
              view: result.data.view,
              _id: result.data._id
            }
          }
        }
      case 2:
        result = await addResultExerciseVOA(data, id)
        if(result.data.view == 1) {
          return result
        } else {
          return {
            tracking: result.tracking,
            data: {
              correct: result.data.correct,
              inCorrect: result.data.inCorrect,
              view: result.data.view,
              _id: result.data._id
            }
          }
        }
      case 3:
        result = await addResultExerciseReadingKeyword(data, id)
        if(result.data.view == 1) {
          return result
        } else {
          return {
            tracking: result.tracking,
            data: {
              correct: result.data.correct,
              inCorrect: result.data.inCorrect,
              view: result.data.view,
              _id: result.data._id
            }
          }
        }
      case 4:
        result = await addResultExerciseMatching(data, id)
        if(result.data.view == 1) {
          return result
        } else {
          return {
            tracking: result.tracking,
            data: {
              correct: result.data.correct,
              inCorrect: result.data.inCorrect,
              view: result.data.view,
              _id: result.data._id
            }
          }
        }
      case 5:
        result = await addResultExerciseWriting(data, id)
        if(result.data.view == 1) {
          return result
        } else {
          return {
            tracking: result.tracking,
            data: {
              correct: result.data.correct,
              inCorrect: result.data.inCorrect,
              view: result.data.view,
              _id: result.data._id
            }
          }
        }
      case 6:
        result = await addResultExerciseWritingIELTS(data, id)
        if(result.data.view == 1) {
          return result
        } else {
          return {
            tracking: result.tracking,
            data: {
              correct: result.data.correct,
              inCorrect: result.data.inCorrect,
              view: result.data.view,
              _id: result.data._id
            }
          }
        }
      case 7:
        result = await addResultExerciseMultiple(data, id)
        if(result.data.view == 1) {
          return result
        } else {
          return {
            tracking: result.tracking,
            data: {
              correct: result.data.correct,
              inCorrect: result.data.inCorrect,
              view: result.data.view,
              _id: result.data._id
            }
          }
        }
      case 8:
        result = await addResultExerciseMultipleUpload(data, id);
        if(result.data.view == 1) {
          return result
        } else {
          return {
            tracking: result.tracking,
            data: {
              correct: result.data.correct,
              inCorrect: result.data.inCorrect,
              view: result.data.view,
              _id: result.data._id
            }
          }
        }
      case 9:
        result =  await addResultExerciseTest(data.answers, data.user, data.id, data.time)
        return result;
      case 10:
        result =  await addResultExerciseSpeaking(data, id)
        if(result.data.view == 1) {
          return result
        } else {
          return {
            tracking: result.tracking,
            data: {
              view: result.data.view,
              _id: result.data._id
            }
          }
        }
      default:
        return null
    }
  } catch (err) {
    console.log('err on addResultExercise service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseBBC(data, id) {
  try {
    let exercise = await ExerciseBBC.findById(id).lean()
    let questions = await ExerciseBBCQuestion.find({exercise: id}).lean()
    let questionsMapper = ArrayHelper.toObjectByKey(questions, '_id');
    let inCorrect = 0, correct = 0
    if(data.questions){
      exercise.result = data.questions.map(question => {
        let answers = questionsMapper[question._id].answer.split(",")
        let resultAnswers = answers.map(answer => {
          return answer.toLowerCase().trim()
        })
        if(resultAnswers.indexOf(question.result.toLowerCase().trim()) !== -1){
          question.corrected = true
          correct++
        } else {
          question.corrected = false
          inCorrect++
        }
        question.answer = questionsMapper[question._id].answer
        return question
      })
      let initData = {
        exercise: exercise._id,
        title: exercise.title,
        description: exercise.description,
        total: exercise.total,
        view: exercise.view,
        text: exercise.text,
        user: data.user,
        lesson: data.lesson || '',
        course: data.course || '',
        url: exercise.url,
        result: exercise.result,
        correct: correct,
        inCorrect: inCorrect
      }
      let joined = await getReportCourseByUser({
        exercise: exercise._id,
        type: 1,
        lesson: data.lesson || '',
        user: data.user
      })
      if(joined){
        return {
          tracking: false,
          data: initData
        }
      } else {
        return {
          tracking: true,
          data: await ExerciseBBCReport.create(initData)
        }
      }
    }
  } catch (err) {
    console.log('err on addResultExerciseBBC service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseReadingKeyword(data, id) {
  try {
    let exercise = await ExerciseReadingKeyWord.findById(id).lean()
    let questions = await ExerciseReadingKeywordQuestion.find({exercise: id}).lean()
    let questionsMapper = ArrayHelper.toObjectByKey(questions, '_id');
    let inCorrect = 0, correct = 0
    if(data.questions){
      exercise.result = data.questions.map(question => {
        let answers = questionsMapper[question._id].answer.split(",")
        let resultAnswers = answers.map(answer => {
          return answer.toLowerCase().trim()
        })
        if(resultAnswers.indexOf(question.result.toLowerCase().trim()) !== -1){
          question.corrected = true
          correct++
        } else {
          question.corrected = false
          inCorrect++
        }
        question.answer = questionsMapper[question._id].answer
        return question
      })
      let initData = {
        exercise: exercise._id,
        title: exercise.title,
        description: exercise.description,
        total: exercise.total,
        view: exercise.view,
        user: data.user,
        lesson: data.lesson || '',
        course: data.course || '',
        url: exercise.url,
        result: exercise.result,
        correct: correct,
        inCorrect: inCorrect
      }
      let joined = await getReportCourseByUser({
        exercise: exercise._id,
        type: 3,
        lesson: data.lesson || '',
        user: data.user
      })
      if(joined){
        return {
          tracking: false,
          data: initData
        }
      } else {
        return {
          tracking: true,
          data: await ExerciseReadingKeyWordReport.create(initData)
        }
      }
    }
  } catch (err) {
    console.log('err on addResultExerciseReadingKeyword service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseWriting(data, id) {
  try {
    let exercise = await ExerciseWriting.findById(id).lean()
    let initData = {
      exercise: exercise._id,
      title: exercise.title,
      description: exercise.description,
      joinAgain: exercise.joinAgain,
      viewBefore: exercise.viewBefore,
      urlAnswer: exercise.urlAnswer,
      descriptionAnswer: exercise.descriptionAnswer,
      total: exercise.total,
      view: exercise.view,
      url: exercise.url,
      user: data.user,
      answers: data.questions,
      lesson: data.lesson || '',
      course: data.course || ''
    }
    let joined = await getReportCourseByUser({
      exercise: exercise._id,
      type: 5,
      lesson: data.lesson || '',
      user: data.user
    })
    if(joined){
      return {
        tracking: false,
        data: initData
      }
    } else {
      return {
        tracking: true,
        data: await ExerciseWritingReport.create(initData)
      }
    }
  } catch (err) {
    console.log('err on addResultExerciseWriting service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseSpeaking(data, id) {
  try {
    let exercise = await ExerciseSpeaking.findById(id).lean()
    const arrQuestion = await ExerciseSpeakingQuestion.find({ exercise: id}).sort({index: 1}).lean();
    let total_point = 0
    let arrResult = arrQuestion.map(async question => {
      let obj = data.questions.find(item => item._id === question._id.toString());
      if (obj) {
        let result = {}, point = 0
        if(exercise.typeSpeaking === 1){
          result = await fetchResultLanguageConfidence(obj._id, obj.base64, question.script)
          if(result && result.sentence_mean){
            point = result.sentence_mean*10
            total_point += result.sentence_mean*10
          }
        }
        question.answer = {
          filename: obj.filename,
          result,
          point
        };
      }
      return question;
    })
    let questions = await Promise.all(arrResult)
    let initData = {
      exercise: exercise._id,
      title: exercise.title,
      description: exercise.description,
      joinAgain: exercise.joinAgain,
      viewBefore: exercise.viewBefore,
      total: exercise.total,
      view: exercise.view,
      user: data.user,
      result: questions,
      point: total_point / arrQuestion.length,
      lesson: data.lesson || '',
      course: data.course || ''
    }
    let joined = await getReportCourseByUser({
      exercise: exercise._id,
      type: 5,
      lesson: data.lesson || '',
      user: data.user
    })
    if(joined){
      return {
        tracking: false,
        data: initData
      }
    } else {
      return {
        tracking: true,
        data: await ExerciseSpeakingReport.create(initData)
      }
    }
  } catch (err) {
    console.log('err on addResultExerciseWriting service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseTeacher(data, id) {
  try {
    switch (data.type) {
      case 1:
        return await addResultExerciseBBCTeacher(data, id)
      case 2:
        return await addResultExerciseVOATeacher(data, id)
      case 3:
        return await addResultExerciseReadingKeywordTeacher(data, id)
      case 4:
        return await addResultExerciseMatchingTeacher(data, id)
      case 5:
        return await addResultExerciseWritingTeacher(data, id)
      case 6:
        return await addResultExerciseWritingIELTSTeacher(data, id)
      case 7:
        return await addResultExerciseMultipleTeacher(data, id)
      case 8:
        return await addResultExerciseMultipleUploadTeacher(data, id)
      case 9:
        return await addResultTest(data, id);
      default:
        return null
    }
  } catch (err) {
    console.log('err on updateExercise service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function addReportExerciseStudent(data, id) {
  try {
    let initialReport = {
      exercise: id,
      lesson: data.lesson,
      user: data.user,
      type: data.type,
    };
    if (data.lesson) {
      const lesson = await LiveStream.findById(data.lesson).lean();
      initialReport.course = lesson.course;
      let course = await Course.findById(lesson.course).lean();
      if (!course) {
        return Promise.reject({ status: 404, error: 'Course not found'})
      }
      let teacherInfo = await User.findById(course.creator);
      let resultExercise = {};
      const condition = {
        exercise: initialReport.exercise,
        user: initialReport.user,
        lesson: data.lesson || ''
      }
      switch (initialReport.type) {
        case 1:
          resultExercise = await ExerciseBBCReport.findOne(condition).lean();
          break
        case 2:
          resultExercise = await ExerciseVOAReport.findOne(condition).lean();
          break
        case 3:
          resultExercise = await ExerciseReadingKeyWordReport.findOne(condition).lean();
          break
        case 4:
          resultExercise = await ExerciseMatchingReport.findOne(condition).lean();
          break
        case 5:
          resultExercise = await ExerciseWritingReport.findOne(condition).lean();
          break
        case 6:
          resultExercise = await ExerciseWritingIELTSReport.findOne(condition).lean();
          break
        case 7:
          resultExercise = await ExerciseMultipleChoiceReport.findOne(condition).lean();
          break
        case 8:
          resultExercise = await FirstTestReport.findOne(condition).lean();
          break;
        default:
          return null
      }
      if (!resultExercise) {
        return Promise.reject({ status: 404, error: 'Exercise report not found'})
      }
      let userInfo = await User.findById(initialReport.user);
      let report = await ExerciseReport.findOne(initialReport);
      if(report && report._id) {
        report.content = data.content;
        report.status = 0;
        let newReport = await report.save();
        return {
          course,
          resultExercise,
          newReport,
          userInfo,
          teacherInfo
        };
      }
      initialReport.content = data.content;
      initialReport.result = resultExercise._id;
      let newReport = await ExerciseReport.create(initialReport);
      return {
        course,
        resultExercise,
        newReport,
        userInfo,
        teacherInfo
      };
    }
  } catch (error) {
    console.log('err on addReportExerciseStudent service:', error);
    return Promise.reject({status: error.status || 500, error: error.err || 'Internal error.'});
  }
}

export async function getStudentReportExercise(options) {
  try {
    let report = await  ExerciseReport.findOne({result: options.id}).lean();
    if(!report) {
      return Promise.reject({ status: 404, error: 'Student report not found'});
    }
    return report;
  } catch(error) {
    console.log('error on getStudentReportExercise service: ', error);
    return Promise.reject({ status: error.status || 500, error: error.err || 'Internal error.'});
  }
}

export async function getReportExerciseCourse(options) {
  try {
    let course = await Course.findById(options.course).lean();
    if(!course) {
      return Promise.reject({ status: 404, error: 'Course not found'});
    }
    if(course.creator.toString() !== options.user._id.toString()) {
      return Promise.reject({ status: 403, error: 'Permission denied'});
    }
    let listReport = await ExerciseReport.find({ course: options.course }).sort({ status: 1}).lean();
    listReport = await ExerciseReport.getMetaDataReport(listReport);
    return listReport;
  } catch(error) {
    console.log('error on getReportExerciseCourse service: ', error);
    return Promise.reject({ status: error.status || 500, error: error.err || 'Internal error.'});
  }
}

export async function changeStatusReportExercise(options) {
  try {
    let report = await ExerciseReport.findById(options.id);
    if(!report) {
      return Promise.reject({status: 404, error: 'Report exercise not found'});
    }
    if(report.status === options.status) {
      return false;
    }
    let lesson = await LiveStream.findById(report.lesson).lean();
    if(!lesson){
      return Promise.reject({status: 404, error: 'Lesson not found'});
    }
    if(options.user._id.toString() !== lesson.user.toString()) {
      return Promise.reject({ status: 403, error: 'Permission denied'});
    }
    report.status = options.status;
    await report.save();
    return true;
  } catch (error) {
    console.log('error on changeStatusReportExercise service: ', error);
    return Promise.reject({ status: error.status || 500, error: error.err || 'Internal error.'});
  }
}

export async function addResultExerciseMultipleTeacher(data, id) {
  try {
    let exercise = await ExerciseMultipleChoiceReport.findById(id)
    if(exercise){
      return await ExerciseMultipleChoiceReport.findOneAndUpdate(
        {_id: id},
        {point: data.point, note: data.note, mark: true},
        {returnNewDocument: true});
    }
    return Promise.reject({status: 400, error: 'Report not found'});
  } catch (err) {
    console.log('err on addResultExerciseWritingIELTSTeacher service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function addResultTest(data, id) {
  try {
    let exercise = await FirstTestReport.findById(id)
    if(exercise){
      let report = await FirstTestReport.findOneAndUpdate(
        {_id: id},
        {point: data.point, note: data.note, mark: true},
        {returnNewDocument: true}).lean();
      return {
        ...report,
        type: 8
      }
    }
    return Promise.reject({status: 400, error: 'Report not found'});
  } catch (err) {
    console.log('err on addResultTest service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseMultipleUploadTeacher(data, id) {
  try {
    let exercise = await ExerciseMultipleChoiceUploadReport.findById(id)
    if(exercise){
      return await ExerciseMultipleChoiceUploadReport.findOneAndUpdate(
        {_id: id},
        {point: data.point, note: data.note, mark: true},
        {returnNewDocument: true});
    }
    return Promise.reject({status: 400, error: 'Report not found'});
  } catch (err) {
    console.log('err on addResultExerciseWritingIELTSTeacher service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseWritingIELTSTeacher(data, id) {
  try {
    let exercise = await ExerciseWritingIELTSReport.findById(id)
    if(exercise){
      return await ExerciseWritingIELTSReport.findOneAndUpdate(
        {_id: id},
        {point: data.point, note: data.note, mark: true},
        {returnNewDocument: true});
    }
    return Promise.reject({status: 400, error: 'Report not found'});
  } catch (err) {
    console.log('err on addResultExerciseWritingIELTSTeacher service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseReadingKeywordTeacher(data, id) {
  try {
    let exercise = await ExerciseReadingKeyWordReport.findById(id)
    if(exercise){
      return await ExerciseReadingKeyWordReport.findOneAndUpdate(
        {_id: id},
        {point: data.point, note: data.note, mark: true},
        {returnNewDocument: true});
    }
    return Promise.reject({status: 400, error: 'Report not found'});
  } catch (err) {
    console.log('err on addResultExerciseReadingKeywordTeacher service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseMatchingTeacher(data, id) {
  try {
    let exercise = await ExerciseMatchingReport.findById(id)
    if(exercise){
      return await ExerciseMatchingReport.findOneAndUpdate(
        {_id: id},
        {point: data.point, note: data.note, mark: true},
        {returnNewDocument: true});
    }
    return Promise.reject({status: 400, error: 'Report not found'});
  } catch (err) {
    console.log('err on addResultExerciseReadingKeywordTeacher service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseBBCTeacher(data, id) {
  try {
    let exercise = await ExerciseBBCReport.findById(id)
    if(exercise){
      return await ExerciseBBCReport.findOneAndUpdate(
        {_id: id},
        {point: data.point, note: data.note, mark: true},
        {returnNewDocument: true});
    }
    return Promise.reject({status: 400, error: 'Report not found'});
  } catch (err) {
    console.log('err on addResultExerciseBBCTeacher service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseVOATeacher(data, id) {
  try {
    let exercise = await ExerciseVOAReport.findById(id)
    if(exercise){
      return await ExerciseVOAReport.findOneAndUpdate(
        {_id: id},
        {point: data.point, note: data.note, mark: true},
        {returnNewDocument: true});
    }
    return Promise.reject({status: 400, error: 'Report not found'});
  } catch (err) {
    console.log('err on addResultExerciseVOATeacher service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseWritingTeacher(data, id) {
  try {
    let exercise = await ExerciseWritingReport.findById(id)
    if(exercise){
      return await ExerciseWritingReport.findOneAndUpdate(
        {_id: id},
        {point: data.point, note: data.note, result: data.result, mark: true},
        {returnNewDocument: true});
    }
    return Promise.reject({status: 400, error: 'Report not found'});
  } catch (err) {
    console.log('err on addResultExerciseWritingTeacher service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseWritingIELTS(data, id) {
  try {
    let exercise = await ExerciseWritingIELTS.findById(id).lean()
    let questions = await ExerciseWritingIELTSQuestion.find({exercise: id}).lean()
    let questionsMapper = ArrayHelper.toObjectByKey(questions, '_id');
    let inCorrect = 0, correct = 0
    if(data.questions){
      exercise.result = data.questions.map(question => {
        let answers = questionsMapper[question._id].answer.split(",")
        let resultAnswers = answers.map(answer => {
          return answer.toLowerCase().trim()
        })
        if(resultAnswers.indexOf(question.result.toLowerCase().trim()) !== -1){
          question.corrected = true
          correct++
        } else {
          question.corrected = false
          inCorrect++
        }
        question.answer = questionsMapper[question._id].answer
        return question
      })
      let initData = {
        exercise: exercise._id,
        title: exercise.title,
        description: exercise.description,
        total: exercise.total,
        view: exercise.view,
        user: data.user,
        lesson: data.lesson || '',
        course: data.course || '',
        url: exercise.url,
        result: exercise.result,
        correct: correct,
        inCorrect: inCorrect
      }
      let joined = await getReportCourseByUser({
        exercise: exercise._id,
        type: 6,
        lesson: data.lesson || '',
        user: data.user
      })
      if(joined){
        return {
          tracking: false,
          data: initData
        }
      } else {
        return {
          tracking: true,
          data: await ExerciseWritingIELTSReport.create(initData)
        }
      }
    }
  } catch (err) {
    console.log('err on addResultExerciseWritingIELTS service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseMultiple(data, id) {
  try {
    let exercise = await ExerciseMultipleChoice.findById(id).lean()
    let questions = await ExerciseMultipleChoiceQuestion.find({exercise: id}).lean()

    let inCorrect = 0, correct = 0
    if(questions){
      let promises = questions.map(question => {
        let answser = null;
        data.questions.find( _item => {
          var key = Object.keys(_item)[0];
          if(key === question._id.toString()){
            answser = _item[key]
            return
          }
        });
        if(answser){
          for (let i = 0; i < question.answers.length; i++){
            if(question.answers[i]._id.toString() === answser){
              question.answers[i].result = true;
              if(question.answers[i].correct){
                question.answers[i].corrected = true;
                correct++
              } else {
                question.answers[i].corrected = false;
                inCorrect++
              }
              break;
            }
          }
        }
        return {
          title: question.title,
          answers: question.answers
        }
      })
      exercise.result = await Promise.all(promises);
      let initData = {
        exercise: exercise._id,
        title: exercise.title,
        description: exercise.description,
        total: exercise.total,
        view: exercise.view,
        joinAgain: exercise.joinAgain,
        user: data.user,
        lesson: data.lesson || '',
        course: data.course || '',
        time: exercise.time,
        result: exercise.result,
        correct: correct,
        inCorrect: inCorrect
      }

      let joined = await getReportCourseByUser({
        exercise: exercise._id,
        type: 7,
        lesson: data.lesson || '',
        user: data.user
      })
      if(joined){
        return {
          tracking: false,
          data: initData
        }
      } else {
        return {
          tracking: true,
          data: await ExerciseMultipleChoiceReport.create(initData)
        }
      }
    }
  } catch (err) {
    console.log('err on addResultExerciseWritingIELTS service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}


export async function addResultExerciseTest(data, idUser, idExercise, time) {
  try {
    if (Array.isArray(data)) {
      const promise = data.map( async item => {
        item.user = idUser;
        return await addResultSectionExerciseTest(item, item._id);
      })
      const result = await Promise.all(promise);
      const listReport = result.map(item => item.newReport._id);
      // const condition = {
      //   user: idUser,
      //   parent: true
      // }
      // const check = await FirstTestReport.findOne(condition);
      // if (!check) {
      const initTrialTestReport = {
        exercise: idExercise,
        result: listReport,
        user: idUser,
        parent: true,
        time: time
      }
      await FirstTestReport.create(initTrialTestReport);
      await User.updateOne({
        _id: idUser
      }, {
        $set: {
          point: {}
        }
      })
      // }
      return result;
    }
  } catch (err) {
    console.log('err on addResultExerciseTest service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}


export function roundPoint(value, step) {
  step || (step = 1.0);
  let inv = 1.0 / step;
  return Math.round(value * inv) / inv;
}


export async function addResultSectionExerciseTest(data, id) {
  try {
    // data.answers = JSON.parse(data.answers);
    let exercise = await FirstTest.findById(id).lean();
    if(!exercise) {
      return Promise.reject({status: 400, error: 'Exercise not found'});
    }
    if (Array.isArray(data.answers)) {
      let promise = data.answers.map(async answer => {
        let result = {};
        let questions = [];
        switch (answer.type) {
          case 1:
            questions = await ExerciseBBCQuestion.find({exercise: answer._id}).sort({index: 1}).lean();
            result = await resultTypeBBC_RK_Matching(questions, answer.answers, answer.type);
            return result;
          case 2:
            result = await resultTypeVOA(answer);
            return result;
          case 3:
            questions = await ExerciseReadingKeywordQuestion.find({exercise: answer._id}).lean();
            result = await resultTypeBBC_RK_Matching(questions, answer.answers, answer.type);
            return result;
          case 4:
            questions = await ExerciseMatchingQuestion.find({exercise: answer._id}).lean();
            result = await resultTypeBBC_RK_Matching(questions, answer.answers, answer.type);
            return result;
          case 5:
            questions = await ExerciseWritingQuestion.find({ exercise: answer._id }).lean();
            result = await resultTypeWriting_WI(questions, answer.answers, answer.type, answer._id);
            return result;
          case 6:
            questions = await ExerciseWritingIELTSQuestion.find({ exercise: answer._id }).lean();
            result = await resultTypeWriting_WI(questions, answer.answers, answer.type, answer._id);
            return result;
          case 7:
            questions = await ExerciseMultipleChoiceQuestion.find({exercise: answer._id}).sort({ index: 1 }).lean();
            result = await resultTypeMultiple(questions, answer.answers, answer.type);
            return result;
          case 10:
            result = await resultTypeSpeaking(answer.result);
            return result;
          default:
            return null
        }
      })
      let arrResult = await Promise.all(promise);
      let totalResult = {
        total: 0,
        correct: 0,
        incorrect: 0
      }

      arrResult.map(result => {
        if (result && result.type !== 5 && result.type !== 6) {
          totalResult.total += (result.total || 0);
          totalResult.correct += (result.correct || 0);
          totalResult.incorrect += (result.incorrect || 0);
        }
      })
      let condition = {
        exercise: id,
        lesson: data.lesson || '',
        course: data.course || '',
        user: data.user
      }
      // let reportTest = await FirstTestReport.findOne(condition);
      let newReport = {}
      let dataReport = await trackingResultTestExercise(id, arrResult, data.lesson, data.user, data.course);
      // if (!reportTest) {
          let initData = {
            exercise: id,
            title: exercise.title,
            description: exercise.description,
            user: data.user,
            course: data.course,
            lesson: data.lesson,
            correct: totalResult.correct,
            inCorrect: totalResult.incorrect,
            result: dataReport,
            numberSubmit: 1,
            total: exercise.total,
            typeTest: data.typeTest,
          };
          if (data.typeTest === 1 || data.typeTest === 3) {
            // max 9.0
            const point = (totalResult.correct / (totalResult.correct + totalResult.incorrect)) * 9;
            initData.point = roundPoint(point, 0.5);
            totalResult.point = initData.point;
            initData.mark = true;
          }
          if (exercise.numberSubmit === 1) {
            initData.final = true;
          }
          newReport = await FirstTestReport.create(initData);
        // }
      // else {
      //     let numberSubmit = reportTest.numberSubmit;
      //     reportTest.title = exercise.title;
      //     reportTest.description = exercise.description;
      //     reportTest.result = dataReport;
      //     reportTest.correct = totalResult.correct;
      //     reportTest.inCorrect = totalResult.incorrect;
      //     reportTest.numberSubmit += 1;
      //     reportTest.total = exercise.total;
      //     if (exercise.numberSubmit === numberSubmit + 1) {
      //       reportTest.final = true;
      //     }
      //     if (data.isFinal === true) {
      //       reportTest.numberSubmit = exercise.numberSubmit;
      //       reportTest.final = true;
      //     }
      //     newReport = await reportTest.save();
      //   }
        if(exercise.numberSubmit > newReport.numberSubmit) {
          return {
            totalResult,
            submit: newReport.numberSubmit,
            newReport
          }
        } else {
          return {
            totalResult,
            arrResult,
            submit: newReport.numberSubmit,
            newReport
          };
        }
    }
  } catch (err) {
    console.log('err on addResultExerciseTest service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function resultTypeBBC_RK_Matching(questions, answers, type) {
  try {
    const total = questions.length;
    let correct = 0;
    let incorrect = 0;
    let data = [];
    questions.map( async question => {
      let index = answers.findIndex(e => e._id.toString() === question._id.toString());
      if (index !== -1) {
        if (answers[index] && answers[index].result
          && answers[index].result.toLowerCase().trim() === question.answer.toLowerCase().trim()) {
          correct += 1;
          question.result = answers[index].result;
          question.corrected = true;
          data.push(question);
        } else {
          incorrect += 1;
          question.result = answers[index].result;
          question.corrected = false;
          data.push(question);
        }
      } else {
        incorrect += 1;
        question.result = '';
        question.corrected = false;
        data.push(question);
      }
    })
    return {
      total,
      correct,
      exercise: questions[0].exercise || '',
      type,
      incorrect,
      result: data
    }
  } catch (err) {
    console.log('err on resultTypeBBC_RK_Matching service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function resultTypeVOA(data) {
  try {
    let exercise = await ExerciseVOA.findById(data._id).lean();
    let text = exercise.text
    let scr = text.split(" ");
    const total = parseInt(scr.length * 2 / 5);
    let incorrect = 0, correct = 0, result = [];
    if (data.answers && data.answers.length > 0) {
      if (data.answers) {
        data.answers.map((item, index) => {
          if(typeof item !== 'string'){
            let answer = scr[index].replace(/[^a-z0-9\s]/gi, '')
            if(item.result && item.result.toLowerCase().trim() === answer.toLowerCase().trim()){
              item.corrected = true
              correct++
            } else {
              item.corrected = false
              incorrect++
            }
            item.answer = answer
            result.push(item)
          } else {
            result.push(item)
          }
        })
      }
    } else {
      incorrect = total;
    }
    return {
      total,
      incorrect,
      exercise: exercise._id,
      type: data.type,
      correct,
      result
    }

  } catch (err) {
    console.log('err on resultTypeVOA service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function resultTypeWriting_WI(questions, answers, type, id) {
  try {
    let exercise = null;
    if (type === 5) {
      exercise = await ExerciseWriting.findById(id).lean();
    } else {
      exercise = await ExerciseWritingIELTS.findById(id).lean();
    }
    if (exercise) {
      let initData = {
        exercise: exercise._id,
        title: exercise.title,
        description: exercise.description,
        joinAgain: exercise.joinAgain,
        viewBefore: exercise.viewBefore,
        urlAnswer: exercise.urlAnswer,
        descriptionAnswer: exercise.descriptionAnswer,
        total: exercise.total,
        view: exercise.view,
        url: exercise.url,
      }
      const dataQuestions =  questions.map(question => {
        const answerIds = answers.map(item => item._id);
        const index = answerIds.indexOf(question._id.toString());
        if (index !== -1) {
          question.result = answers[index].result;
        } else {
          question.result = '';
        }
        return question;
      })
      initData.arrAnswer = dataQuestions;
      if (type === 5) {
        let data = await ExerciseWritingReport.create(initData);
        return { _id: data._id, type: 5 };
      } else {
        let data = await ExerciseWritingIELTSReport.create(initData);
        return { _id: data._id, type: 6 };
      }
    }
  } catch (error) {
    console.log('err on resultTypeWriting_WI service:', error);
    return Promise.reject({status: error.status || 500, error: error.err || 'Internal error.'});
  }
}

export async function resultTypeMultiple(questions, answers, type) {
  try {
    const total = questions.length;
    let correct = 0;
    let incorrect = 0;
    let data = [];
    if (questions && questions.length > 0) {
      questions.map(question => {
        let index = -1;
        answers.map((answer, i) => {
          if (answer._id.toString() === question._id.toString()) {
            index = i;
          }
        });
        let result = {
          title: question.title,
          fileUrl: question.fileUrl,
          desMore: question.desMore,
          fileUrlMore: question.fileUrlMore,
          answers: question.answers,
        };
        if (index !== -1) {
          if (question.answers) {
            let indexAnswer = -1;
            question.answers.map((answer, i) => {
              if (answers[index] && answers[index].result
                && answer._id.toString() === answers[index].result.toString()) {
                result.answers[i].result = true
                if (answer.correct === true) {
                  indexAnswer = i;
                }
              }
            });
            if (indexAnswer !== -1) {
              result.corrected = true;
              correct += 1;
            } else {
              result.corrected = false;
              incorrect += 1;
            }
          }
        } else {
          incorrect += 1;
          result.corrected = false;
        }
        data.push(result);
      })
    }
    return {
      total,
      correct,
      incorrect,
      exercise: questions[0].exercise,
      type,
      result: data
    }
  } catch (err) {
    console.log('err on addResultExerciseMatching service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function resultTypeSpeaking(result) {
  try {
    const data = await ExerciseSpeakingReport.findById(result._id).lean();
    return {
      id: data._id,
      type: 10
    }
  } catch (error) {
    console.log('resultTypeSpeaking =>', error);
  }
}

export async function trackingTestExerciseMatching(result,condition, init) {
  try {
    let report = await ExerciseMatchingReport.findOne(condition);
    if (!report) {
      let exercise = await ExerciseMatching.findById(result.exercise.toString());
      if (exercise) {
        init.title = exercise.title;
        init.description = exercise.description;
        init.url = exercise.url;
        let dataReport = await ExerciseMatchingReport.create(init);
        return {
          id: dataReport._id,
          type: 4
        }
      }
    } else {
      await ExerciseMatchingReport.update(
        { _id: report._id.toString()},
        {
          $set: {
            result: result.result,
            inCorrect: result.incorrect,
            correct: result.correct,
            total: result.total,
          }
        }
      )
      return {
        id: report._id,
        type: 4
      }
    }
  } catch (err) {
    console.log('err on trackingTestExerciseMatching service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function trackingTestExerciseBBC(result, condition, init) {
  try {
    let report = await ExerciseBBCReport.findOne(condition);
    if (!report) {
      let exercise = await ExerciseBBC.findById(result.exercise.toString()).lean();
      if (exercise) {
        init.title = exercise.title;
        init.description = exercise.description;
        init.url = exercise.url;
        let dataReport = await ExerciseBBCReport.create(init);
        return {
          id: dataReport._id,
          type: 1
        }
      }
    } else {
      await ExerciseBBCReport.update(
        { _id: report._id.toString()},
        {
          $set: {
            result: result.result,
            inCorrect: result.incorrect,
            correct: result.correct,
            total: result.total,
          }
        }
      )
      return {
        id: report._id,
        type: 1
      }
    }
  } catch (err) {
    console.log('err on trackingTestExerciseBBC service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function trackingTestExerciseVOA(result,condition, init) {
  try {
    let report = await ExerciseVOAReport.findOne(condition);
    if (!report) {
      let exercise = await ExerciseVOA.findById(result.exercise.toString());
      if (exercise) {
        init.title = exercise.title;
        init.description = exercise.description;
        init.url = exercise.url;
        let dataReport = await ExerciseVOAReport.create(init);
        return {
          id: dataReport._id,
          type: 2
        }
      }
    } else {
      await ExerciseVOAReport.update(
        { _id: report._id.toString()},
        {
          $set: {
            result: result.result,
            inCorrect: result.incorrect,
            correct: result.correct,
            total: result.total,
          }
        }
      )
      return {
        id: report._id,
        type: 2
      }
    }
  } catch (err) {
    console.log('err on trackingTestExerciseVOA service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function trackingTestExerciseRK(result,condition, init) {
  try {
    let report = await ExerciseReadingKeyWordReport.findOne(condition);
    if (!report) {
      let exercise = await ExerciseReadingKeyWord.findById(result.exercise.toString());
      if (exercise) {
        init.title = exercise.title;
        init.description = exercise.description;
        init.url = exercise.url;
        let dataReport = await ExerciseReadingKeyWordReport.create(init);
        return {
          id: dataReport._id,
          type: 3
        }
      }
    } else {
      await ExerciseReadingKeyWordReport.update(
        { _id: report._id.toString()},
        {
          $set: {
            result: result.result,
            inCorrect: result.incorrect,
            correct: result.correct,
            total: result.total,
          }
        }
      )
      return {
        id: report._id,
        type: 3
      }
    }
  } catch (err) {
    console.log('err on trackingTestExerciseRK service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function trackingTestExerciseMultiple(result,condition, init) {
  try {
    let report = await ExerciseMultipleChoiceReport.findOne(condition);
    if (!report) {
      let exercise = await ExerciseMultipleChoice.findById(result.exercise.toString());
      if (exercise) {
        init.title = exercise.title;
        init.description = exercise.description;
        init.url = exercise.url;
        let dataReport = await ExerciseMultipleChoiceReport.create(init);
        return {
          id: dataReport._id,
          type: 7
        }
      }
    } else {
      await ExerciseMultipleChoiceReport.update(
        { _id: report._id.toString()},
        {
          $set: {
            result: result.result,
            inCorrect: result.incorrect,
            correct: result.correct,
            total: result.total,
          }
        }
      )
      return {
        id: report._id,
        type: 7
      }
    }
  } catch (err) {
    console.log('err on trackingTestExerciseMultiple service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function trackingResultTestExercise(id, arrResult, lesson, user, course) {
  try {
    if (Array.isArray(arrResult)) {
      let promise = arrResult.map(async result => {
        if (result) {
          let dataReport = {};
          const condition = {
            exercise: id,
            subSection: result.exercise,
            lesson: lesson,
            user
          }
          let init = {
            exercise: id,
            user: user,
            result: result.result,
            inCorrect: result.incorrect,
            correct: result.correct,
            subSection: result.exercise,
            lesson: lesson,
            course: course,
            total: result.total
          }
          if (Array.isArray(result.result)) {
            result.result.map((item, index) => {
              delete  result.result[index].exercise;
              delete  result.result[index].point;
            })
          }
          switch (result.type) {
            case 1:
              dataReport = await trackingTestExerciseBBC(result,condition, init);
              return dataReport;
            case 2:
              dataReport = await trackingTestExerciseVOA(result,condition, init);
              return dataReport;
            case 3:
              dataReport = await trackingTestExerciseRK(result,condition, init);
              return dataReport;
            case 4:
              dataReport = await trackingTestExerciseMatching(result,condition, init);
              return dataReport;
            case 5:
              return {
                type: 5,
                id: result._id
              }
            case 6:
              return {
                type: 6,
                id: result._id
              }
            case 7:
              dataReport = await trackingTestExerciseMultiple(result,condition, init);
              return dataReport;
            case 10:
              return result
            default:
              return null
          }
        }
      });
      let data = await Promise.all(promise);
      return data;
    }
  } catch (err) {
    console.log('err on addResultExerciseTest service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function addResultExerciseMultipleUpload(data, id) {
  try {
    let exercise = await ExerciseMultipleChoiceUpload.findById(id).lean()
    let inCorrect = 0, correct = 0
    if(exercise.questions && exercise.questions.length){
      let promises = exercise.questions.map((question, index) => {
        let answser = null;
        data.questions.find( _item => {
          var key = Object.keys(_item)[0];
          if(key.toString() === index.toString()){
            answser = _item[key.toString()]
            return
          }
        });
        if(answser !== null){
          let result = parseInt(answser) + 1;
          question.result = result
          if(result && result === question.answer){
            correct++
          } else {
            inCorrect++
          }
        } else {
          inCorrect++
        }
        return question
      })
      exercise.result = await Promise.all(promises);
      let initData = {
        exercise: exercise._id,
        title: exercise.title,
        description: exercise.description,
        total: exercise.total,
        view: exercise.view,
        joinAgain: exercise.joinAgain,
        user: data.user,
        lesson: data.lesson || '',
        course: data.course || '',
        time: exercise.time,
        number: exercise.number,
        url: exercise.url,
        result: exercise.result,
        correct: correct,
        inCorrect: inCorrect
      }
      let joined = await getReportCourseByUser({
        exercise: exercise._id,
        type: 8,
        lesson: data.lesson || '',
        user: data.user
      })
      if(joined){
        return {
          tracking: false,
          data: initData
        }
      } else {
        return {
          tracking: true,
          data: await ExerciseMultipleChoiceUploadReport.create(initData)
        }
      }
    }
  } catch (err) {
    console.log('err on addResultExerciseWritingIELTS service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseMatching(data, id) {
  try {
    let exercise = await ExerciseMatching.findById(id).lean()
    let questions = await ExerciseMatchingQuestion.find({exercise: id}).lean()
    let questionsMapper = ArrayHelper.toObjectByKey(questions, '_id');
    let inCorrect = 0, correct = 0
    if(data.questions){
      exercise.result = data.questions.map(question => {
        if(question.result.toLowerCase().trim() === questionsMapper[question._id].answer.toLowerCase().trim()){
          question.corrected = true
          correct++
        } else {
          question.corrected = false
          inCorrect++
        }
        question.answer = questionsMapper[question._id].answer
        return question
      })
      let initData = {
        exercise: exercise._id,
        title: exercise.title,
        description: exercise.description,
        total: exercise.total,
        view: exercise.view,
        user: data.user,
        lesson: data.lesson || '',
        course: data.course || '',
        url: exercise.url,
        result: exercise.result,
        correct: correct,
        inCorrect: inCorrect
      }

      let joined = await getReportCourseByUser({
        exercise: exercise._id,
        type: 4,
        lesson: data.lesson || '',
        user: data.user
      })
      if(joined){
        return {
          tracking: false,
          data: initData
        }
      } else {
        return {
          tracking: true,
          data: await ExerciseMatchingReport.create(initData)
        }
      }
    }
  } catch (err) {
    console.log('err on addResultExerciseMatching service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultExerciseVOA(data, id) {
  try {
    let exercise = await ExerciseVOA.findById(id).lean()
    let text = exercise.text
    let scr = text.split(" ");
    let inCorrect = 0, correct = 0, result = []
    if(data.text){
      data.text.map((item, index) => {
        if(typeof item !== 'string'){
          let answer = scr[index].replace(/[^a-z0-9\s]/gi, '')
          if(item.result && item.result.toLowerCase().trim() === answer.toLowerCase().trim()){
            item.corrected = true
            correct++
          } else {
            item.corrected = false
            inCorrect++
          }
          item.answer = answer
          result.push(item)
        }
      })
    }
    let initData = {
      exercise: exercise._id,
      title: exercise.title,
      description: exercise.description,
      text: exercise.text,
      total: exercise.total,
      view: exercise.view,
      user: data.user,
      lesson: data.lesson || '',
      course: data.course || '',
      url: exercise.url,
      result: result,
      correct: correct,
      inCorrect: inCorrect
    }

    let joined = await getReportCourseByUser({
      exercise: exercise._id,
      type: 2,
      lesson: data.lesson || '',
      user: data.user
    })
    if(joined){
      return {
        tracking: false,
        data: initData
      }
    } else {
      return {
        tracking: true,
        data: await ExerciseVOAReport.create(initData)
      }
    }
  } catch (err) {
    console.log('err on addResultExerciseVOA service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function removeExercise(id, data) {
  try {
    switch (data.type) {
      case 1:
        return await removeExerciseBBC(id, data.user)
      case 2:
        return await removeExerciseVOA(id, data.user)
      case 3:
        return await removeExerciseReadingKeyword(id, data.user)
      case 4:
        return await removeExerciseMatching(id, data.user)
      case 5:
        return await removeExerciseWriting(id, data.user)
      case 6:
        return await removeExerciseWritingIELTS(id, data.user)
      case 7:
        return await removeExerciseMultiple(id, data.user)
      case 8:
        return await removeExerciseMultipleUpload(id, data.user)
      case 9:
        return await removeExerciseTest(id, data.user)
      case 10:
        return await removeExerciseSpeaking(id, data.user)
      default:
        return null
    }
  } catch (err) {
    console.log('err on updateExercise service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addExerciseToCourse(data) {
  try {
    let initData = {
      title: data.title,
      type: data.type,
      exercise: data.exercise,
      course: data.course,
      lesson: data.lesson,
      index: data.index
    }
    return await ExerciseToCourse.create(initData)
  } catch (err) {
    console.log('err on addExerciseToCourse service:', err);
    return
  }
}
export async function removeExerciseToCourse(lesson) {
  try {
    return await ExerciseToCourse.remove({lesson: lesson})
  } catch (err) {
    console.log('err on removeExerciseToCourse service:', err);
    return
  }
}
export async function getExerciseByCourse(lesson) {
  try {
    let exercises = await ExerciseToCourse.find({lesson: lesson}).sort({index: 1}).lean()
    if(exercises){
      let promises = exercises.map( async item => {
        return await getExercise({id: item.exercise, type: item.type})
      })
      return await Promise.all(promises);
    }
  } catch (err) {
    console.log('err on getExerciseByCourse service:', err);
    return
  }
}
export async function getExerciseByLessons(lessonIds) {
  try {
    if (!(lessonIds instanceof Array)) {
      lessonIds = [lessonIds];
    }

    if (!lessonIds.length) {
      return [];
    }
    let exercises = await ExerciseToCourse.find({lesson: {$in: lessonIds}}).sort({index: 1}).lean();
    return exercises.map(exercise => {
      return {
        _id: exercise._id,
        exercise: exercise.exercise,
        type: exercise.type,
        title: exercise.title,
        lesson: exercise.lesson
      }
    });
  } catch (err) {
    console.log('err on getVideosByLessons:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseByLessonsDetail(lessonIds) {
  try {
    if (!(lessonIds instanceof Array)) {
      lessonIds = [lessonIds];
    }

    if (!lessonIds.length) {
      return [];
    }
    let exercises = await ExerciseToCourse.find({lesson: {$in: lessonIds}}).sort({index: 1}).lean();
    return exercises.map(exercise => {
      return {
        _id: exercise._id,
        exercise: exercise.exercise,
        type: exercise.type,
        title: exercise.title,
        lesson: exercise.lesson,
      }
    });
  } catch (err) {
    console.log('err on getExerciseByLessonsDetail:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function getExerciseByLesson(id) {
  try {
    let exercise = await ExerciseToCourse.findById(id).lean();
    if(exercise){
      let course =  await Course.findById(exercise.course).lean();
      return {
        lesson: exercise.lesson,
        course: exercise.course,
        title: exercise.title,
        slug: course.slug
      }
    }
    return {
      lesson: '',
      course: '',
      title: '',
      slug: ''
    }
  } catch (err) {
    console.log('err on getExerciseByLesson:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getListReportTrialTestService(options) {
  try {
    if (options.user.role !== 'admin') {
      return Promise.reject({status: 401, error: 'Unauthorized'})
    }
    const condition = {
      parent: true
    }
    const promise = [
      FirstTestReport.count(condition),
      FirstTestReport.find(condition).sort({dateAdded: -1}).limit(options.limit).skip(options.skip).lean()
    ]
    const results = await Promise.all(promise);
    const promiseData = results[1].map(async report => {
      const user = await User.findById(report.user);
      if (user) {
        report.user = {
          _id: user._id,
          cuid: user.cuid,
          fullName: user.fullName,
          email: user.email
        }
      }
      return report;
    })
    results[1] = await Promise.all(promiseData);
    return results;
  } catch(err) {
    console.log('err on getListReportTrialTestService:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}


export async function userGetListReportTrialTestService(options) {
  try {
    const condition = {
      parent: true,
      user: options.user._id
    }
    const promise = [
      FirstTestReport.count(condition),
      FirstTestReport.find(condition).sort({dateAdded: -1}).limit(options.limit).skip(options.skip).lean()
    ]
    const results = await Promise.all(promise);
    return results;
  } catch(err) {
    console.log('err on getListReportTrialTestService:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export async function getReportTrialTestService(options) {
  try {
    const condition = {
      _id: options.id,
      parent: true,
    }
    const report = await FirstTestReport.findOne(condition).lean();
    if (!report) {
      return Promise.reject({status: 400, success: false, error: 'Report not found'});
    }
    if (options.user.role !== 'admin') {
      if(options.user._id.toString() !== report.user.toString()){
        return Promise.reject({ status: 401, success: false, error: 'Unauthorized' })
      }
    }
    if (Array.isArray(report.result)) {
      const promise = report.result.map(async (subReportId, index) => {
        const subReport = await FirstTestReport.findOne({
          _id: subReportId,
          parent: false,
        })
        if (subReport) {
          if (Array.isArray(subReport.result)) {
            let countQuestion = [];
            const promise = subReport.result.map(async (exerciseReport) => {
              if (exerciseReport && exerciseReport.id) {
                let report = {};
                report.type = exerciseReport.type;
                const schemaCase = {
                  1: ExerciseBBCReport,
                  2: ExerciseVOAReport,
                  3: ExerciseReadingKeyWordReport,
                  4: ExerciseMatchingReport,
                  5: ExerciseWritingReport,
                  6: ExerciseWritingIELTSReport,
                  7: ExerciseMultipleChoiceReport,
                  10: ExerciseSpeakingReport
                }
                report = await schemaCase[exerciseReport.type].findById(exerciseReport.id).lean();
                if (report && Array.isArray(report.result)) {
                  if (exerciseReport.type === 2) {
                    countQuestion[index] = parseInt(report.result.length * 2 / 5);
                  } else {
                    countQuestion[index] = report.result.length;
                  }
                } else {
                  countQuestion[index] = 0;
                }
                report.type = exerciseReport.type;
                if (report.type === 10 && Array.isArray(report.result)) {
                  const exerciseStorage = 'uploads/exercise/'
                  report.result = report.result.map((question, index) => {
                    if (question.answer && question.answer.filename) {
                      question.answer.filename = exerciseStorage + question.answer.filename;
                    }
                    return question;
                  })
                }
                return report;
              }
            })
            subReport.result = await Promise.all(promise);
          }
        }
        return subReport;
      })
      report.result = await Promise.all(promise);
    }
    return report;
  } catch (err) {
    console.log('err on getReportTrialTestService:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

/**
 *
 * @param options
 * @param options.id
 * @param options.reportTest
 * @param options.point
 * @returns {Promise<boolean>}
 */
export async function updatePointTestService(options) {
  try {
    if (options.user.role !== 'admin') {
      return Promise.reject({status: 401, error: 'Unauthorized'})
    }
    const report = await FirstTestReport.findById(options.id);
    if (!report) {
      return Promise.reject({status: 400, error: 'Report not found!'})
    }
    if (options.point < 0) {
      return Promise.reject({status: 400, error: 'Point is invalid!'})
    }
    report.mark = true;
    if (options.point >=0 && options.point <= 9) {
      report.point = roundPoint(options.point, 0.5);
      await report.save();
      await updateTotalPointTest(options.reportTest);
    }
    return true;
  } catch (err) {
    console.log('err on updatePointTestService:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

/**
 *
 * @param options
 * @param {string} options.id
 * @param options.user
 * @returns {Promise<never>}
 */
export async function sendMailResultTestService(options) {
  try {
    if (options.user.role !== 'admin') {
      return Promise.reject({status: 401, error: 'Unauthorized'})
    }
    const reportTest = await FirstTestReport.findById(options.id).lean();
    if (!reportTest) {
      return Promise.reject({status: 400, error: 'Report not found'});
    }
    if (!reportTest.mark) {
      return Promise.reject({stats: 400, error: 'Report hadn\'t marked yet'});
    }
    const detailPoint = {};
    const promise = reportTest.result.map(async reportId => {
      const checkReport = await FirstTestReport.findById(reportId).lean();
        switch (checkReport.typeTest) {
          case 1:
            detailPoint.listening = checkReport.point;
            break;
          case 2:
            detailPoint.speaking = checkReport.point;
            break;
          case 3:
            detailPoint.reading = checkReport.point;
            break;
          case 4:
            detailPoint.writing = checkReport.point;
            break;
          default:
            break
      }
    });
    await Promise.all(promise);
    const user = await User.findById(reportTest.user).lean();
    if (user) {
      let dataSendMail = {
        type: 'resultTest',
        language: 'en',
        data: {
          email: user.email,
          user: {
            fullName: user.fullName.toUpperCase(),
            code: user.code
          },
          result: {
            updateAt: moment(reportTest.updateAt || reportTest.createdAt).format('DD/MM/YYYY'),
            createdAt: moment(reportTest.createdAt).format('DD/MM/YYYY'),
            total: formatPoint(reportTest.point),
            listening: formatPoint(detailPoint.listening),
            reading: formatPoint(detailPoint.reading),
            speaking: formatPoint(detailPoint.speaking),
            writing: formatPoint(detailPoint.writing),
          }
        }
      };
      Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
      await FirstTestReport.updateOne(
        {
          _id: options.id
        }, {
          $set: {
            sendMail: true
          }
        }
      )
    }
  } catch (err) {
    console.log('err on updateTotalPointTest:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

/**
 *
 * @param options
 * @param {string} options.user
 * @returns {Promise<never>}
 */
export async function getResultTrialTestService(options) {
  try {
    const condition = {
      user: options.user,
      parent: true
    }
    const report = await FirstTestReport.findOne(condition).sort({ _id : -1}).lean();
    if (!report) {
      return Promise.reject({status: 404, success: false, error: 'Report not found'});
    }
    if (Array.isArray(report.result)) {
      const promise = report.result.map(async subReportId => {
        const subReport = await FirstTestReport.findOne({
          _id: subReportId,
          parent: false,
        })
        if (subReport) {
          if (subReport.typeTest === 2  || subReport.typeTest === 4) {
            return {
              _id: subReport._id,
              typeTest: subReport.typeTest,
              point: subReport.point,
              mark: subReport.mark
            }
          }
          return {
            _id: subReport._id,
            typeTest: subReport.typeTest,
            correct: subReport.correct,
            inCorrect: subReport.inCorrect,
            point: subReport.point,
          };
        }
        return null;
      })
      report.result = await Promise.all(promise);
    }
    delete report.__v;
    delete report.total;
    delete report.correct;
    delete report.inCorrect;
    delete report.final;
    delete report.lesson;
    delete report.course;
    return report;
  } catch (error) {
    console.log('err on getResultTrialTestService:', error);
    return Promise.reject({status: error.status || 500, error: error.error || 'Internal error.'});
  }
}

export async function updateTotalPointTest(id) {
  try {
    const reportTest = await FirstTestReport.findById(id).lean();
    if (reportTest) {
      let markFull = true;
      let totalPoint = 0;
      let detailPoint = {}
      const promise = reportTest.result.map(async reportId => {
        const checkReport = await FirstTestReport.findById(reportId).lean();
        if (!checkReport || !checkReport.mark) {
          markFull = false;
        } else {
          totalPoint += checkReport.point;
        }
        switch (checkReport.typeTest) {
          case 1:
            detailPoint.listening = checkReport.point;
            break;
          case 2:
            detailPoint.speaking = checkReport.point;
            break;
          case 3:
            detailPoint.reading = checkReport.point;
            break;
          case 4:
            detailPoint.writing = checkReport.point;
            break;
          default:
            break
        }
      });
      await Promise.all(promise);
      if (markFull === true && typeof totalPoint === 'number') {
        const point = roundPoint(totalPoint / 4, 0.5);
        await FirstTestReport.updateOne(
          {
            _id: id,
          },
          {
            $set: {
              point: point,
              mark: true,
              updateAt: new Date()
            }
          }
        );
        await User.updateOne(
          { _id: reportTest.user },
          {
            $set: {
              point: detailPoint
            }
          })
      }
    }
  } catch (err) {
    console.log('err on updateTotalPointTest:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}

export function formatPoint(point) {
  if (point.toString() && point.toString().length === 1) {
    return `${point}.0`;
  }
  return point.toString();
}

export async function getExercisesByLesson(id) {
  try {
    return  await ExerciseToCourse.find({lesson: id}).lean();
  } catch (err) {
    console.log('err on getExerciseByLesson:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
