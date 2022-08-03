// Worker to increase engagements after comment or reply a knowledge

import UserEngagement from '../../../models/userEngagements';
import KnowledgeEngagement from '../../../models/knowledgeEngagements';
import CategoryEngagement from '../../../models/categoryEngagements';
import SkillEngagement from '../../../models/skillEngagements';
import Knowledge from '../../../models/knowledge';
import Comment from '../../../models/comment';
import globalConstants from '../../../../config/globalConstants';
import {Q} from '../../Queue';

Q.process(globalConstants.jobName.KNOWLEDGE_COMMENT_ENGAGEMENT, 1, async (job, done) => {
  try {
    let knowledge = await Knowledge.findById(job.data.knowledgeId);
    if(knowledge) {
      let skillIds = [];
      knowledge.tags.forEach(tag => {
        if (tag.id !== 'un') skillIds.push(tag.id);
      });


      let promises = [
        KnowledgeEngagement.update({
          user: job.data.publisherId,
          knowledge: job.data.knowledgeId
        }, {$inc: {engagement: 1}}, {upsert: true})
      ];

      if (knowledge.departmentId !== 'ge') {
        promises.push(CategoryEngagement.update({
          user: job.data.publisherId,
          category: knowledge.departmentId
        }, {$inc: {engagement: 1}}, {upsert: true}));
      }

      // Neu nguoi comment khong phai nguoi viet knowledge, tang engagement cho nguoi comment va nguoi viet knowledge.
      if (job.data.publisherId.toString() !== knowledge.authorId.toString()) {
        let userEngagementConditions = {
          $or: [
            {user1: job.data.publisherId, user2: knowledge.authorId},
            {user1: knowledge.authorId, user2: job.data.publisherId},
          ]
        };
        promises.push(UserEngagement.update(userEngagementConditions, {
          $inc: {engagement: 1},
          $set: {user1: knowledge.authorId, user2: job.data.publisherId}
        }, {upsert: true}));
      }

      let skillEngagementPromises = skillIds.map(async skillId => {
        return SkillEngagement.update({
          user: job.data.publisherId,
          skill: skillId
        }, {$inc: {engagement: 1}}, {upsert: true});
      });
      Array.prototype.push.apply(promises, skillEngagementPromises);


      await Promise.all(promises);
      console.log('comment knowledge engagement done');
    }
    return done(null);
  } catch (err) {
    console.log('comment knowledge engagement err:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.KNOWLEDGE_REPLY_ENGAGEMENT, 1, async (job, done) => {
  try {
    let data = await Promise.all([
      Knowledge.findById(job.data.knowledgeId),
      Comment.findById(job.data.parentId)
    ]);
    let knowledge = data[0];
    let parent = data[1];

    let skillIds = [];
    knowledge.tags.forEach(tag => {
      if(tag.id !== 'un') skillIds.push(tag.id);
    });


    let promises = [
      KnowledgeEngagement.update({user: job.data.publisherId, knowledge: job.data.knowledgeId}, {$inc: {engagement: 1}}, {upsert: true})
    ];

    if(knowledge.departmentId !== 'ge') {
      promises.push(CategoryEngagement.update({user: job.data.publisherId, category: knowledge.departmentId}, {$inc: {engagement: 1}}, {upsert: true}));
    }

    // Neu nguoi comment khong phai nguoi viet knowledge, tang engagement cho nguoi comment va nguoi viet knowledge.
    if(job.data.publisherId.toString() !== knowledge.authorId.toString()) {
      let userEngagementConditions = {
        $or: [
          {user1: job.data.publisherId, user2: knowledge.authorId},
          {user1: knowledge.authorId, user2: job.data.publisherId},
        ]
      };
      promises.push(UserEngagement.update(userEngagementConditions, {$inc: {engagement: 1}, $set: {user1: knowledge.authorId, user2: job.data.publisherId}}, {upsert: true}));
    }

    // Neu nguoi reply khong phai nguoi comment, tang engagement cho 2 nguoi.
    if(job.data.publisherId.toString() !== parent.publisherId.toString()) {
      let userEngagementConditions = {
        $or: [
          {user1: job.data.publisherId, user2: parent.publisherId},
          {user1: parent.publisherId, user2: job.data.publisherId},
        ]
      };
      promises.push(UserEngagement.update(userEngagementConditions, {$inc: {engagement: 1}, $set: {user1: knowledge.authorId, user2: job.data.publisherId}}, {upsert: true}));
    }

    let skillEngagementPromises = skillIds.map(async skillId => {
      return SkillEngagement.update({user: job.data.publisherId, skill: skillId}, {$inc: {engagement: 1}}, {upsert: true});
    });
    Array.prototype.push.apply(promises, skillEngagementPromises);


    await Promise.all(promises);
    console.log('reply knowledge engagement done');
    return done(null);
  } catch (err) {
    console.log('reply knowledge engagement err:', err);
    return done(err);
  }
});
