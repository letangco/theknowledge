// Worker to increase engagements after upvote a knowledge

import UserEngagement from '../../../models/userEngagements';
import KnowledgeEngagement from '../../../models/knowledgeEngagements';
import CategoryEngagement from '../../../models/categoryEngagements';
import SkillEngagement from '../../../models/skillEngagements';
import Knowledge from '../../../models/knowledge';
import globalConstants from '../../../../config/globalConstants';
import {Q} from '../../Queue';

Q.process(globalConstants.jobName.KNOWLEDGE_UPVOTE_ENGAGEMENT, 1, async (job, done) => {
  try {
    let knowledge = await Knowledge.findById(job.data.knowledgeId);
    if(knowledge) {
      let skillIds = [];
      knowledge.tags.forEach(tag => {
        if (tag.id !== 'un') skillIds.push(tag.id);
      });


      let promises = [
        KnowledgeEngagement.update({
          user: job.data.userId,
          knowledge: job.data.knowledgeId
        }, {$inc: {engagement: 1}}, {upsert: true})
      ];

      if (knowledge.departmentId !== 'ge') {
        promises.push(CategoryEngagement.update({
          user: job.data.userId,
          category: knowledge.departmentId
        }, {$inc: {engagement: 1}}, {upsert: true}));
      }

      // neu nguoi like knowledge khong phai nguoi viet knowledge, tang engagement cho 2 nguoi.
      if (job.data.userId.toString() !== knowledge.authorId.toString()) {
        let userEngagementConditions = {
          $or: [
            {user1: job.data.userId, user2: knowledge.authorId},
            {user1: knowledge.authorId, user2: job.data.userId},
          ]
        };
        promises.push(UserEngagement.update(userEngagementConditions, {
          $inc: {engagement: 1},
          $set: {user1: knowledge.authorId, user2: job.data.userId}
        }, {upsert: true}));
      }

      let skillEngagementPromises = skillIds.map(async skillId => {
        return SkillEngagement.update({user: job.data.userId, skill: skillId}, {$inc: {engagement: 1}}, {upsert: true});
      });
      Array.prototype.push.apply(promises, skillEngagementPromises);


      await Promise.all(promises);
    }
    // console.log('upvote engagement done');
    return done(null);
  } catch (err) {
    console.log('upvote engagement err:', err);
    return done(err);
  }
});
