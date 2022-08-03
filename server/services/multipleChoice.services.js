import mongoose from 'mongoose';
import cuid from 'cuid';
import MultipleChoice from '../models/multipleChoice';
import QuestionMultipleChoice from '../models/questionMultipleChoice';
import ReportMultipleChoice from '../models/reportMultipleChoice';
import { slugBuilder } from '../util/string.helper';

export async function createMultipleChoice(data) {
  try {
    if(!data.slug){
      data.slug = await buildSlug(data.title)
    }
    let initData = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      time: data.time,
      user: data.user,
      points: data.points,
      //course: data.course,
      // lesson: data.lesson,
      question1: data.question1,
      question2: data.question2,
      question3: data.question3,
      question4: data.question4,
    }
    let multiple = await MultipleChoice.create(initData);
    multiple = JSON.parse(JSON.stringify(multiple));
    if(multiple && data.questions){
      if(data.questions){
        data.questions.map(async (question, index) => {
          question.multipleChoice = multiple._id;
          question.index = index + 1;
          delete question.id;
          await QuestionMultipleChoice.create(question);
        })
      }
    }
    return multiple;
  } catch (err) {
    console.log('err on createMultipleChoice:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function updateMultipleChoice(id, data) {
  try {
    let multiple = await MultipleChoice.findById(id);
    multiple.title = data.title || multiple.title;
    multiple.slug = data.slug || multiple.slug;
    multiple.description = data.description || multiple.description;
    multiple.time = data.time || multiple.time;
    multiple.user = data.user || multiple.user;
    multiple.points = data.points;
    // multiple.course = data.course;
    // multiple.lesson = data.lesson;
    multiple.question1 = data.question1;
    multiple.question2 = data.question2;
    multiple.question3 = data.question3;
    multiple.question4 = data.question4;
    multiple.dateModified = Date.now();
    multiple.save();
    await QuestionMultipleChoice.remove({multipleChoice: multiple._id})
    if(data.questions){
      data.questions.map(async (question, index) => {
        question.multipleChoice = id;
        question.index = index + 1;
        delete question.id;
        await QuestionMultipleChoice.create(question);
      })
    }
    return multiple;
  } catch (err) {
    console.log('err on updateMultipleChoice service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function addResultMultipleChoice(data, user = '') {
  try {
    let multipleQuestion = await QuestionMultipleChoice.find({multipleChoice: data._id}).lean();
    let multipleChoice = await MultipleChoice.findById(data._id).lean();
    let totalCorrect = 0, questions = [];
    if(multipleQuestion){
      let promises = multipleQuestion.map(question => {
        let answser = null;
        data.results.find( _item => {
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
                totalCorrect++;
              } else {
                question.answers[i].corrected = false;
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
      questions = await Promise.all(promises);
    }
    data.contact.user = user;
    let initData = {
      multipleChoice: {
        _id: multipleChoice._id,
        user: multipleChoice.user,
        title: multipleChoice.title,
        description: multipleChoice.description,
        slug: multipleChoice.slug,
        time: multipleChoice.time,
        points: multipleChoice.points,
        course: multipleChoice.course,
        lesson: multipleChoice.lesson,
      },
      corrected: totalCorrect,
      questions: questions,
      contact: data.contact
    }
    return await ReportMultipleChoice.create(initData);
  } catch (err) {
    console.log('err on updateMultipleChoice service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function multipleChoices(page) {
  try {
    let limit = 10, skip = (page - 1) * limit;
    let resources = await Promise.all([
      MultipleChoice.count({}),
      MultipleChoice.find({}).skip(skip).limit(limit).lean()
    ]);
    let total_items = resources[0], data = resources[1];
    return {total_items, data};
  } catch (err) {
    console.log('err on updateMultipleChoice service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function multipleChoicesReport(_id, page, lecture = false, user = '', limit = 10) {
  try {
    let skip = (page - 1) * limit;
    if(lecture){
      let resources = await Promise.all([
        ReportMultipleChoice.count({'multipleChoice._id':mongoose.Types.ObjectId(_id)}),
        ReportMultipleChoice.find({'multipleChoice._id':mongoose.Types.ObjectId(_id)}).skip(skip).limit(limit).sort({_id: -1}).lean()
      ]);

      let total_items = resources[0], data = resources[1];
      return {total_items, data};
    } else {
      let resources = await Promise.all([
        ReportMultipleChoice.count({
          'multipleChoice._id': mongoose.Types.ObjectId(_id),
          'contact.user': mongoose.Types.ObjectId(user),
        }),
        ReportMultipleChoice.find({
          'multipleChoice._id': mongoose.Types.ObjectId(_id),
          'contact.user': mongoose.Types.ObjectId(user),
        }).skip(skip).limit(limit).sort({_id: -1}).lean()
      ]);
      let total_items = resources[0], data = resources[1];
      return {total_items, data};
    }
  } catch (err) {
    console.log('err on updateMultipleChoice service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function multipleChoicesReportAdmin(_id, page, limit = 10) {
  try {
    let skip = (page - 1) * limit;

    let resources = await Promise.all([
      ReportMultipleChoice.count({
        'multipleChoice._id': mongoose.Types.ObjectId(_id)
      }),
      ReportMultipleChoice.find({
        'multipleChoice._id': mongoose.Types.ObjectId(_id)
      }).skip(skip).limit(limit).sort({_id: -1}).lean()
    ]);
    let total_items = resources[0], data = resources[1];
    return {total_items, data};
  } catch (err) {
    console.log('err on updateMultipleChoice service:', err);
    return Promise.reject({status: err.status || 500, error: err.err || 'Internal error.'});
  }
}
export async function buildSlug(title) {
  let simpleSlug = slugBuilder(title);
  let isExists = await MultipleChoice.count({slug: simpleSlug});
  if(!isExists) {
    return simpleSlug;
  }
  return simpleSlug + '-' + cuid.slug();
}
