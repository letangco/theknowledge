import View from '../../models/knowledgeView';
import UpVotes from '../../models/knowledgeUpvote';
import Comments from '../../models/comment';
import TransactionDetail from '../../models/transactionDetail';
import globalConstants from '../../../config/globalConstants';
import UserEngagement from '../../models/userEngagements';
import KnowledgeEngagement from '../../models/knowledgeEngagements';
import CategoryEngagement from '../../models/categoryEngagements';
import SkillEngagement from '../../models/skillEngagements';
import {Q} from '../../libs/Queue';

async function init() {
  return await Promise.all([
    UserEngagement.remove({}),
    KnowledgeEngagement.remove({}),
    CategoryEngagement.remove({}),
    SkillEngagement.remove({}),
  ]);
}

module.exports = async function () {
  await init();

  let data = await Promise.all([
    View.find({user: {$ne: null}}),
    UpVotes.find(),
    Comments.find({parent: null}),
    Comments.find({parent: {$ne: null}}),
    TransactionDetail.find()
  ]);
  let views = data[0] ;
  views.forEach(view => Q.create(globalConstants.jobName.VIEW_ENGAGEMENT, view).removeOnComplete(true).save());

  let upvotes = data[1] ;
  upvotes.forEach(upvote => Q.create(globalConstants.jobName.KNOWLEDGE_UPVOTE_ENGAGEMENT, upvote).removeOnComplete(true).save());

  let comments = data[2] ;
  comments.forEach(comment => Q.create(globalConstants.jobName.KNOWLEDGE_COMMENT_ENGAGEMENT, comment).removeOnComplete(true).save());

  let replies = data[3] ;
  replies.forEach(reply => Q.create(globalConstants.jobName.KNOWLEDGE_REPLY_ENGAGEMENT, comment).removeOnComplete(true).save());

  let transactionDetails = data[4] ;
  transactionDetails.forEach(transactionDetail => Q.create(globalConstants.jobName.SESSION_ENGAGEMENT, transactionDetail).removeOnComplete(true).save());

};
