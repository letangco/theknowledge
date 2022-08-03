import Knowledge from '../models/knowledge';
import User from '../models/user';
import Comment from '../models/comment';
import mongoose from 'mongoose';
import ArrayHelper from "../util/ArrayHelper";
import validUrl from "valid-url";
import {isKnowledgeVotedByUser} from "../controllers/knowledge.controller";
import {cacheImage} from "../libs/imageCache";

export async function getRecentKnowledge(amount, lang) {
  const languageCondition = lang !== 'vi' ? {$ne: 'vi'} : {$ne: null};
  return await Knowledge.find({state: 'published', language: languageCondition}, {content: 0})
    .limit(amount)
    .sort({createdDate: -1})
    .lean();
}

export async function appendMoreInfo(knowledges, user) {
  const authorIds = knowledges.map(knowledge => knowledge.authorId);
  const users = await User.formatFeedInfo(User, authorIds);
  let userMapper = ArrayHelper.toObjectByKey(users, '_id');
  let knowledgesPromises = knowledges.map(async knw => {
    //isKnowledgeVotedByUser
    if (knw.thumbnail && knw.thumbnail[0]) {
      if (!validUrl.isUri(knw.thumbnail[0])) {
        let data = {
          src: knw.thumbnail[0],
          size: 400
        };
        knw.thumbnail[0] = await cacheImage(data);
      }
    }
    knw.author = userMapper[knw.authorId];
    knw.commentCount = await Comment.count({knowledgeId: mongoose.Types.ObjectId(knw._id)});
    if (user && user._id) {
      knw.upvoted = await isKnowledgeVotedByUser(knw, user._id);
    }
    return knw;
  });
  knowledges = await Promise.all(knowledgesPromises);
  return knowledges.filter((know) => !!know.author)
}
