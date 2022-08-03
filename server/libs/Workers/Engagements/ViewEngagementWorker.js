// Worker to increase engagements after upvote a knowledge

import UserEngagement from '../../../models/userEngagements';
import KnowledgeEngagement from '../../../models/knowledgeEngagements';
import CategoryEngagement from '../../../models/categoryEngagements';
import SkillEngagement from '../../../models/skillEngagements';
import Knowledge from '../../../models/knowledge';
import globalConstants from '../../../../config/globalConstants';
import {Q} from '../../Queue';

Q.process(globalConstants.jobName.VIEW_ENGAGEMENT, 1, async (job, done) => {
  try {
    let knowledge = await Knowledge.findById(job.data.knowledgeId);
    if(knowledge) {
      let skillIds = [];
      knowledge.tags.forEach(tag => {
        if (tag.id !== 'un') skillIds.push(tag.id);
      });


      let promises = [
        KnowledgeEngagement.update({
          user: job.data.user,
          knowledge: job.data.knowledgeId
        }, {$inc: {engagement: 1}}, {upsert: true})
      ];

      if (knowledge.departmentId !== 'ge') {
        promises.push(CategoryEngagement.update({
          user: job.data.user,
          category: knowledge.departmentId
        }, {$inc: {engagement: 1}}, {upsert: true}));
      }

      // neu nguoi view knowledge khong phai nguoi viet knowledge, tang engagement cho 2 nguoi.
      if (job.data.user && job.data.user.toString() !== knowledge.authorId.toString()) {
        let userEngagementConditions = {
          $or: [
            {user1: job.data.user, user2: knowledge.authorId},
            {user1: knowledge.authorId, user2: job.data.user},
          ]
        };
        promises.push(UserEngagement.update(userEngagementConditions, {
          $inc: {engagement: 1},
          $set: {user1: job.data.user, user2: knowledge.authorId}
        }, {upsert: true}));
      }

      let skillEngagementPromises = skillIds.map(async skillId => {
        return SkillEngagement.update({user: job.data.user, skill: skillId}, {$inc: {engagement: 1}}, {upsert: true});
      });
      Array.prototype.push.apply(promises, skillEngagementPromises);


      await Promise.all(promises);
      // console.log('view engagement done');
    }
    return done(null);
  } catch (err) {
    console.log('view engagement err:', err);
    return done(err);
  }
});
