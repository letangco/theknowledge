import {Q} from '../Queue';
import AMPQ from '../../../rabbitmq/ampq';
import globalConstants from '../../../config/globalConstants';
import Elasticsearch from '../Elasticsearch';
import Question from '../../models/questions';
import Feed from '../../models/feeds';
import Skill from '../../models/skill';
import User from '../../models/user';
import Category from '../../models/category';
import QuestionAnswer from '../../models/questionAnswers';
import QuestionUpvote from '../../models/questionUpvote';
import mongoose from 'mongoose';

Q.process(globalConstants.jobName.QSTN_SYNC_ELASTIC, 1, async (job, done) => {
  try {
    // console.log('job.data:', job.data);
    let data = await Question.toESDoc(job.data);
    let type = data.type;
    delete data.type;

    if (job.data.isNew) {
      await Elasticsearch.index('tesse_questions', data, type);
    } else {
      await Elasticsearch.update('tesse_questions', data, type);
    }

    return done(null);
  } catch (err) {
    console.log('err on sync question:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.QSTN_DELETED, 1, async (job, done) => {
  try {
    await Promise.all([
      Elasticsearch.delete('tesse_questions', job.data._id.toString()),
      Feed.remove({object: job.data._id}),
      QuestionAnswer.remove({question: job.data._id}),
      QuestionUpvote.remove({question: job.data._id})
    ]);

    return done(null);
  } catch (err) {
    console.log('err on QSTN_DELETED:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.QSTN_SYNC_SKILL, 1, async (job, done) => {
  try {
    let question = job.data;
    let skillIds = question.tags.map(tag => {
      if (tag.id !== 'un') return tag.id;
    });
    await Skill.update({_id: {$in: skillIds}}, {$push: {questions: question._id}}, {multi: true});
    return done(null);
  } catch (err) {
    console.log('err on job QSTN_SYNC_SKILL:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.QSTN_PUSH_NOTI, 1, async (job, done) => {
  try {
    let question = job.data;
    let promises = [Category.findById(question.department, 'cuid').lean()];
    if (!question.anonymous) {
      promises.push(User.findById(question.user, 'fullName').lean());
    }
    let promiseRs = await Promise.all(promises);
    let category = promiseRs[0], user = promiseRs[1] || 'Anonymous';

    let skills = await Skill.find({categoryID: category.cuid}, 'owners').lean();

    let expertIds = [];
    skills.forEach(skill => {
      expertIds = expertIds.concat(skill.owners);
    });
    let experts = await User.find({
      _id: {$in: expertIds, $nin: [mongoose.Types.ObjectId(question.user)]},
      expert: 1,
      active: 1,
      deviceTokens: {$nin: [null, []]}
    }, 'deviceTokens').lean();

    experts.forEach(expert => {
      let options = {
        deviceTokens: expert.deviceTokens,
        body: `${user.fullName} needs you help in question: ${question.title}`,
        click_action: 'ask/' + question.slug,
      };
      AMPQ.sendDataToQueue(globalConstants.jobName.PUSH_NOTIFY_TO_USER, options);
    });
    return done(null);
  } catch (err) {
    console.log('err on job QSTN_PUSH_NOTI:', err);
    return done(err);
  }
});
