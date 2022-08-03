import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';
// import * as CrawlerWorker from '../libs/Workers/CrawlerWorker';
import ServerSettings from '../models/serverSettings';
import SimpleQuestions from '../models/simpleQuestions';
import fs from 'fs';

// CrawlerWorker.init();

export async function add(req, res) {
  try {
    // console.log('body:', req.body);
    // if(req.body.url) {
      Q.create(globalConstants.jobName.ADD_QUESTION, req.body).removeOnComplete(true).save();
      return res.json({success: true});
    // } else {
    //   return res.status(400).json({success: false, error: 'No URL'});
    // }
  } catch (err) {
    console.log('err on add simple questions:', err);
    return res.status(500).json(err);
  }
}

export async function getData(req, res) {
  try {
    let conditions = {
      tags: {$ne: []}
    };
    let lastQuestion = await ServerSettings.findOne({key: 'last_question'});
    if (lastQuestion) {
      conditions._id = {$gt: lastQuestion.value}
    }

    let questions = await SimpleQuestions.find(conditions, 'question_text tags');

    questions = JSON.parse(JSON.stringify(questions));
    if(questions instanceof Array && questions.length) {
      let lastQuestionId = questions[questions.length - 1]._id;
      await ServerSettings.update({key: 'last_question'}, {$set: {value: lastQuestionId}}, {upsert: true});

      let string = "";
      questions.forEach(question => {
        question.tags.forEach(tag => {
          string += question.question_text + "\n";
          string += tag.name + "\n";
        });
      });

      res.writeHead(200, {
        'Content-Type': 'application/force-download',
        'Content-disposition': 'attachment; filename=questions.txt'
      });

      return res.end(string);
    } else {
      return res.end('No new Data');
    }
  } catch (err) {
    console.log('err:', err);
  }
}

export async function summary(req, res) {
  let rs = await Promise.all([
    SimpleQuestions.count({'tags.cateId': '5828ae7cfbddb053adaf1752'}),
    SimpleQuestions.count({'tags.cateId': '5828ae7cfbddb053adaf1749'}),
    SimpleQuestions.count({'tags.cateId': '5828ae7cfbddb053adaf1750'}),
    SimpleQuestions.count({'tags.cateId': '58bbfecec8f8e87c0b2ebd05'})
  ]);

  let data = {
    'Web Development': rs[0],
    'Mobile Programming': rs[1],
    'Software Programming': rs[2],
    'Bussiness & Finance': rs[3]
  };
  return res.end(data);
}
