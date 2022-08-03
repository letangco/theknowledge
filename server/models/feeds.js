import mongoose from 'mongoose';
import {convertToKnowledgeResult} from '../controllers/knowledge.controller';
import Knowledge from './knowledge';
import Question from './questions';
import QuestionAnswer from './questionAnswers';
import User from './user';
import LiveStream from './liveStream';
import Course from './courses';
import Feeds from './feeds';
import * as Course_Service from '../services/course.services';
const Schema = mongoose.Schema;

const feedSchema = new Schema({
  owner: {type: Schema.ObjectId, ref: 'users', required: true},
  actor: {type: Schema.ObjectId, ref: 'users', required: true},
  object: {type: Schema.ObjectId, required: true},
  action: {
    type: String,
    enum: [
      'published', 'commented', 'voted', 'answer', 'ask', 'follow',
      'replied_voted', 'replied_replied', 'replied_your', 'start_live','course_live'
    ],
    required: true
  },
  type: {
    type: String,
    enum: ['knowledge', 'question', 'user', 'live_stream','course','schedule'],
    required: true,
    index: true
  },
  createdDate: {type: Date, default: Date.now, required: true},
  updatedDate: {type: Date, default: Date.now, required: true},
  priority: {type: Number, default: 0, required: true},
  comment: {type: Schema.ObjectId}
});

feedSchema.index({owner: 1});
feedSchema.index({object: 1});
feedSchema.index({comment: 1});
feedSchema.index({action: 1});
feedSchema.index({owner: 1, object: 1}, {unique: true});
feedSchema.index({createdDate: -1});
feedSchema.index({updatedDate: -1, priority: -1});

feedSchema.statics.getMetadata = async function(feed, userId, langCode) {
  feed = JSON.parse(JSON.stringify(feed));
  // map object
  switch (feed.type) {
    case 'knowledge':
        let knowledge_promises = [User.findById(feed.actor, 'fullName userName cuid')];
        knowledge_promises.push(Knowledge.findById(feed.object));
        let results = await Promise.all(knowledge_promises);
        let knowledge = await convertToKnowledgeResult(results[1], feed.owner);
        feed.object = knowledge;
        feed.actor = results[0];
      break;
    case 'question':
        let question_promises = [Question.findById(feed.object)];
        if(feed.comment) {
          question_promises.push(QuestionAnswer.findById(feed.comment));
        }
        let data = await Promise.all(question_promises);
        if(data[0]) {
          let parsePromises = [Question.getMetadata(data[0], userId, langCode)];
          if (data[1]) {
            parsePromises.push(QuestionAnswer.getMetadata(QuestionAnswer, data[1]));
          }
          let parsedData = await Promise.all(parsePromises);
          let question = parsedData[0];
          question.author = question.user;
          delete question.user;
          feed.object = question;

          let answer = parsedData[1];
          if (feed.action === 'ask') {
            feed.actor = question.author;
          } else if (answer) {
            feed.actor = answer.user;
          }
        } else {
          feed.object = null;
        }
      break;

    case 'live_stream':
        let liveStreamPromises = [
          User.formatBasicInfo(User, [feed.actor]),
          LiveStream.findById(feed.object).lean()
        ];
        let resources = await Promise.all(liveStreamPromises);

        feed.actor = resources[0].pop();
        let liveStream = await LiveStream.getMetadata(resources[1], langCode);
        liveStream = liveStream.pop();
        liveStream.author = liveStream.user;
        delete liveStream.user;
        feed.object = liveStream;

      break;
    case 'schedule':
      let liveStreamSchedule = [
        User.formatBasicInfo(User, [feed.actor]),
        LiveStream.findById(feed.object).lean()
      ];
      let resourceSchedule = await Promise.all(liveStreamSchedule);

      feed.actor = resourceSchedule[0].pop();
      let liveStreams = await LiveStream.getMetadata(resourceSchedule[1], langCode, userId);
      liveStreams = liveStreams.pop();
      liveStreams.author = liveStreams.user;
      delete liveStreams.user;
      feed.object = liveStreams;

      break;
    case 'course':
      let courseData = [
        User.formatBasicInfo(User, [feed.actor]),
        Course.findById(feed.object).lean()
      ];
      let rs = await Promise.all(courseData);
      feed.actor = rs[0].pop();
      let course = await Course_Service.getMetaData(rs[1], userId, langCode);
      course = course.pop();
      feed.object = course;
      break;
    default:
      break;
  }

  delete feed.owner;
  return feed;
};

export default
mongoose.model('Feed', feedSchema);
