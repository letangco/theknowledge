import {Q} from '../Queue';
import Feed from '../../models/feeds';
import User from '../../models/user';
import Knowledge from '../../models/knowledge';
import Question from '../../models/questions';
import UserEngagement from '../../models/userEngagements';
import KnowledgeEngagement from '../../models/knowledgeEngagements';
import CategoryEngagement from '../../models/categoryEngagements';
import SkillEngagement from '../../models/skillEngagements';
import globalConstants from '../../../config/globalConstants';
import Follow from '../../models/follow';

Q.process(globalConstants.jobName.CREATE_FEED_COURSE, 1,async (job,done)=>{
  try{
    let data = job.data;
    let feed = {
      owner:data.owner,
      object:data.object,
      actor:data.actor,
      type:data.type,
      action:data.action
    }
    await Feed.create(feed);
    return done(null);
  }catch (err){
    console.log('err on create feed course :',err);
    return done(err);
  }
});
Q.process(globalConstants.jobName.CREATE_FEED, 1, async (job, done) => {
  try {
    let conditions = {
      owner: job.data.owner,
      object: job.data.object,
    };
    let feed = Object.assign({}, conditions);
    feed.actor = job.data.actor;
    feed.action = job.data.action;
    feed.type = job.data.type;
    feed.comment = job.data.comment;
    feed.updatedDate = new Date();
    feed.priority = await calculateFeedPriority(feed);
    // console.log('priority:', feed.priority);
    await Feed.update(conditions, feed, {upsert: true});
    // console.log('create feed done.');
    return done(null);
  } catch(err) {
    console.log('err on create feed:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.CREATE_FEED_AFTER_FOLLOW, 1, async (job, done) => {
  try {
    console.log(globalConstants.jobName.CREATE_FEED_AFTER_FOLLOW);
    let knowledges = await Knowledge.find({authorId: job.data.to, state: globalConstants.knowledgeState.PUBLISHED});
    let promises = await knowledges.map(async knowledge => {
      let conditions = {
        owner: job.data.from,
        object: knowledge._id
      };

      let feed = Object.assign({}, conditions);
      feed.actor = knowledge.authorId;
      feed.action = 'published';
      feed.type = 'knowledge';
      feed.updatedDate = new Date();
      feed.priority = await calculateFeedPriority(feed);

      return Feed.update(conditions, feed, {upsert: true});
    });

    await Promise.all(promises);
    return done(null);
  } catch (err) {
    return done(err);
  }
});

Q.process(globalConstants.jobName.DELETE_FEED_COMMENT, 1, async (job, done) => {
  try {
    if (job.data.type === 'knowledge') {
      // let knowledge = await Knowledge.findById(feed.object);
      // let author = knowledge.authorId;
      // await Feed.update(job.data, {$unset: {comment: 1}}, {
      //   $set: {
      //     actor: author,
      //     action: 'published'
      //   }
      // }, {$multi: true});
    } else if (job.data.type === 'question') {
      let question = await Question.findById(job.data.object);
      let author = question.user;
      await Feed.update(job.data, {$unset: {comment: 1}, $set: {actor: author, action: 'ask'}}, {$multi: true});
    }


    return done(null);
  } catch (err) {
    console.log('err on job DELETE_FEED:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.CREATE_FEED_ONE_USER, 1, async (job, done) => {
  try {
    let rs = await Promise.all([
      User.findById(job.data.userId),
      Knowledge.find({state: globalConstants.knowledgeState.PUBLISHED}),
      Question.find({state: globalConstants.knowledgeState.PUBLISHED}),
      Follow.find({from: job.data.userId})
    ]);

    let user = rs[0];
    let interested_skills = user.interested_skills.map(skillId => skillId.toString());
    let knowledges = rs[1];
    let questions = rs[2];
    let follows = rs[3];
    let followingUserIds = follows.map(follow => follow.to.toString());

    let feedKnowledge = knowledges.map(knowledge => {
      let feed = {
        owner: job.data.userId,
        object: knowledge._id,
        actor: knowledge.authorId,
        action: 'published',
        type: 'knowledge',
        updatedDate: new Date(),
        priority: 0
      };
      // increase priority if user has interested knowledge's tags
      knowledge.tags.forEach(tag => {
        if (tag.id !== 'un' && interested_skills.indexOf(tag.id) >= 0) {
          feed.priority++;
        }
      });
      // increase priority if user has followed knowledge's author
      if (followingUserIds.indexOf(knowledge.authorId.toString()) >= 0) {
        feed.priority++;
      }

      return feed;
    });

    let feedQuestion = questions.map(question => {
      let feed = {
        owner: job.data.userId,
        object: question._id,
        actor: question.user,
        action: 'ask',
        type: 'question',
        updatedDate: new Date(),
        priority: 0
      };
      // increase priority if user has interested knowledge's tags
      question.tags.forEach(tag => {
        if (tag.id !== 'un' && interested_skills.indexOf(tag.id) >= 0) {
          feed.priority++;
        }
      });
      // increase priority if user has followed knowledge's author
      if (followingUserIds.indexOf(question.user.toString()) >= 0) {
        feed.priority++;
      }

      return feed;
    });

    // below are magic codes,
    // by the benchmark from 2016-1-14 (https://jsperf.com/array-prototype-push-apply-vs-concat/84),
    // these codes are the fasted way to concat 2 arrays
    let feedKnowledge_clone = feedKnowledge.slice(0);
    let feedQuestion_clone = feedQuestion.slice(0);
    let feeds = feedKnowledge_clone.concat(feedQuestion_clone);

    await Feed.create(feeds);
    return done(null);
  } catch (err) {
    console.log('err on job CREATE_FEED_ONE_USER:', err);
    return done(err);
  }
});

async function calculateFeedPriority(feed)  {
  try {
    let skillIds = [], knowledge = null;
    if(feed.type === 'knowledge') {
      knowledge = await Knowledge.findById(feed.object);
      knowledge.tags.forEach(tag => {
        if (tag.id !== 'un') skillIds.push(tag.id);
      });
    }

    let promises = [
      UserEngagement.findOne({
        $or: [
          {user1: feed.actor, user2: feed.owner},
          {user1: feed.owner, user2: feed.actor},
        ]
      }),
      KnowledgeEngagement.findOne({user: feed.owner, knowledge: feed.object})
    ];
    if(knowledge && knowledge.departmentId !== 'ge') {
      promises.push(CategoryEngagement.findOne({user: feed.owner, category: knowledge.departmentId}));
    }
    promises.push(SkillEngagement.find({user: feed.owner, skill: {$in: skillIds}}));

    let engagements = await Promise.all(promises);
    let skillEngagements = engagements.pop();
    Array.prototype.push.apply(engagements, skillEngagements);

    let sum_engagement = 0, divable = 0;
    engagements.forEach(egm => {
      if (egm && egm.engagement) {
        sum_engagement += egm.engagement;
        divable++;
      }
    });

    return divable ? sum_engagement / divable : 0;
  } catch (err) {
    console.log('err cc gi vay dmm', err);
  }
}
