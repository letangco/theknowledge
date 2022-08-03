import mongoose from 'mongoose';
import comment from './comment';
import Skills from './skill';
import User from './user';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';
import StringHelper from '../util/StringHelper';
import ArrayHelper from '../util/ArrayHelper';
import Comment from './comment';
import KnowledgeUpvote from './knowledgeUpvote';
import Notification from './notificationNew';
import Feed from './feeds';
import Category from './category';
import {getFollowerByUserId} from '../controllers/follow.controller';
import UserOptions from './userOption';

const Schema = mongoose.Schema;
const knowledgeSchema = new Schema({
    title: {type: String, required: true},
    departmentId: {type: String, required: true, default: 'ge'},
    content: {type: Object, required: true},
    thumbnail: {type: [String], default: ['/public/images/login-bg.jpg']},
    description: {type: String},
    tags: {type: Array},  /* [{id: 'un', name: 'tesse'}, {id: 'skillId', name: 'skillName'}] */
    authorId: {type: Schema.ObjectId, ref: 'users', required: true},
    createdDate: {type: Date, default: Date.now, required: true},
    upVotes: {type: Number, default: 0, required: true},
    state: {
        type: String,
        enum: ['draft', 'waiting', 'published', 'rejected'],
        default: 'draft',
        required: true
    },
    views: {type: Number, default: 0, required: true},
    language: {type: String, default: 'en', required: true},
    slug: {type: String, unique: true}
});

knowledgeSchema.index({tags: 1});
knowledgeSchema.index({departmentId: 1});
knowledgeSchema.index({authorId: 1});
knowledgeSchema.index({state: 1});
knowledgeSchema.index({upVotes: -1, createdDate: -1});
knowledgeSchema.index({views: -1, createdDate: -1});

knowledgeSchema.statics.getCommentCount = function(knowledgeId) {
    return comment.count({knowledgeId: knowledgeId}).exec();
};

knowledgeSchema.statics.getKnowledgeThumbnails = function(knowledge) {
  let urls = [];
  let jsonObj = typeof knowledge.content === 'string' ? JSON.parse(knowledge.content) : knowledge.content;

  // parse entityMap
  let entityMap = jsonObj.entityMap;
  for(let k in entityMap) {
    if(entityMap[k].type === 'embed' && entityMap[k].data.url.startsWith('https://www.youtube.com')) {
      urls.push(entityMap[k].data.url);
    }
  }

  // parse blocks
  let blocks = jsonObj.blocks;
  blocks.forEach(block => {
    if(/(:image)$/.test(block.type)) {
      let imgUrl = block.data.src;
      let index = imgUrl.indexOf('uploads');
      urls.push(imgUrl.substring(index));
    }
  });

  return urls;
}

knowledgeSchema.statics.getKnowledgeDescription = function(self, knowledge) {
  let desc = self.getKnowledgePlainText(self, knowledge);
  desc = desc.substring(0, 300);
  let lastSpace = desc.lastIndexOf(' ');
  desc = desc.substring(0, lastSpace);
  desc += '...';
  desc = StringHelper.standardize(desc);

  return desc;
}

knowledgeSchema.statics.getKnowledgePlainText = function(self, knowledge) {
  let jsonObj = typeof knowledge.content === 'string' ? JSON.parse(knowledge.content) : knowledge.content;

  // parse blocks
  let blocks = jsonObj.blocks;
  let texts = blocks.map(block => {
    return (block.text && block.text !== 'E') ?  block.text : '';
  });

  return texts.join(' ');
}

export async function getType(departmentId) {
  let type = 'general';
  if (departmentId !== 'ge') {
    let department = await Category.findById(departmentId).lean();
    let langIndex = ArrayHelper.findItemByProp(department.description, 'languageID', 'en');
    type = department.description[langIndex].slug;
  }
  return type;
}

knowledgeSchema.statics.toESDoc = async function(self, knowledge) {
  try {
    let plainText = self.getKnowledgePlainText(self, knowledge);
    let tagStrings = knowledge.tags.map(tag => {
      return tag.text
    });

    return {
      id: knowledge._id.toString(),
      search_text: knowledge.title + ' ' + plainText + ' ' + tagStrings.join(' '),
      departmentId: knowledge.departmentId,
      createdDate: knowledge.createdDate,
      language: knowledge.language,
      title: knowledge.title,
      type: await getType(knowledge.departmentId)
    }
  } catch (err) {
    console.log('err on convert knowledge to es doc');
    throw err;
  }
}

knowledgeSchema.statics.createFeeds = async function(self, feedOptions) {
  // self.createFeedsForSkillFollowers(feedOptions);
  // self.createFeedsForAuthorFollowers(feedOptions);
  self.createFeedsForAllUsers(feedOptions);
}

knowledgeSchema.statics.createFeedsForAllUsers = async function(options) {
  try {
    let knowledge = options.knowledge;
    let userIds = [knowledge.authorId];

    if (knowledge.language === 'vi') {
      let userOptions = await UserOptions.find({language: 'vi'}, 'userID').lean();
      let userCuids = userOptions.map(userOption => userOption.userID);
      let skillIds = [];
      knowledge.tags.forEach(tag => {
        if (tag.id !== 'un') {
          skillIds.push(tag.id);
        }
      });

      let resources = await Promise.all([
        User.find({cuid: {$in: userCuids}, active: 1}, '_id').lean(),
        getFollowerByUserId(knowledge.authorId),
        Skills.find({_id: {$in: skillIds}}, 'owners').exec()
      ]);
      let vietnameseUsers = resources[0];
      let authorFollower = resources[1];
      let skills = resources[2];
      vietnameseUsers.forEach(user => {
        userIds.push(user._id.toString())
      });
      authorFollower.forEach(user => {
        if(user){
          userIds.push(user._id.toString());
        }
      });
      skills.forEach(skill => {
        Array.prototype.push.apply(userIds, skill.owners);
        Array.prototype.push.apply(userIds, skill.interester);
      });

      userIds = ArrayHelper.uniqueValuesInArray(userIds);
    } else {
      let users = await User.find({active: 1}).lean();
      userIds = users.map(user => user._id.toString());
    }
    userIds.forEach(userId => {
      let opt = Object.assign({object: knowledge._id, owner: userId}, options);
      Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
    });
  }catch (err){
    console.log("err Loi Nhe Ban : ", err);
  }
}

knowledgeSchema.statics.createFeedsForAuthorFollowers = async function(options) {
  let knowledge = options.knowledge;
  let followers = await getFollowerByUserId(knowledge.authorId);
//  followers.push({_id: knowledge.authorId});
//  console.log('followers:', followers);
  followers.forEach(user => {
    if(user) {
      let opt = Object.assign({object: knowledge._id, owner: user._id}, options);
      Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
    }
  });
  // send feed for author
  let opt = Object.assign({object: knowledge._id, owner: knowledge.authorId}, options);
  Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
}

knowledgeSchema.statics.createFeedsForSkillFollowers = async function(options) {
  let knowledge = options.knowledge;
  let skillIds = [];
  knowledge.tags.forEach(tag => {
    if(tag.id !== 'un') {
      skillIds.push(tag.id);
    }
  });
  let skills = await Skills.find({_id: {$in: skillIds}}, 'owners').exec();
  let userIds = [];
  skills.forEach(skill => {
    Array.prototype.push.apply(userIds, skill.owners);
    Array.prototype.push.apply(userIds, skill.interester);
  });
  userIds.forEach((userId, index, arr) => {
    if(arr.indexOf(userId) === index) {
      let opt = Object.assign({object: knowledge._id, owner: userId}, options);
      Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
    }
  });
}

knowledgeSchema.statics.formatSuggestData = async function(_this, knowledgeIds) {
  let knowledge = await _this.find({_id: {$in: knowledgeIds}}, 'title description slug authorId').lean();
  let userIds = knowledge.map(knw => knw.authorId);
  let users = await User.formatBasicInfo(User, userIds);
  let userMapper = ArrayHelper.toObjectByKey(users, '_id');
  knowledge = knowledge.map(knw => {
    knw.author = userMapper[knw.authorId];
    delete knw.authorId;
    return knw;
  });
  return knowledge;
};
knowledgeSchema.pre('remove',async function (removed,next) {
  await Notification.remove({object:removed._id});
  await KnowledgeUpvote.remove({knowledgeId:removed._id});
  await Comment.remove({knowledgeId:removed._id});
  await Feed.remove({object:removed._id});
  next();
});
export default mongoose.model('Knowledge', knowledgeSchema);
