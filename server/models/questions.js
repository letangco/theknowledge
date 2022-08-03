import mongoose from 'mongoose';
import User from './user';
import Skills from './skill';
import UserOptions from './userOption';
import Category from './category';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';
import Knowledge from './knowledge';
import QuestionAnswer from './questionAnswers';
import QuestionUpvote from './questionUpvote';
import Feed from './feeds';
import ArrayHelper from '../util/ArrayHelper';
import Notification from './notificationNew';
import {getType} from "./knowledge";
import {getFollowerByUserId} from "../controllers/follow.controller";
import {cacheImage} from '../libs/imageCache';
import validUrl from 'valid-url';

const Schema = mongoose.Schema;
const questionSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users'},
  title: {type: String, required: true},
  department: {type: String, required: true, default: 'ge'},
  questionType: {
    type: String,
    enum: ['normal', 'poll'],
    default: 'normal',
    required: true
  },
  anonymous: {type: Boolean, default: false, required: true},
  content: {type: Object},
  description: {type: String},
  thumbnail: {type: [String]},
  tags: {type: Array},  /* [{id: 'un', name: 'tesse'}, {id: 'skillId', name: 'skillName'}] */
  createdDate: {type: Date, default: Date.now, required: true},
  upVotes: {type: Number, default: 0, required: true},
  state: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    required: true
  },
  slug: {type: String, unique: true, required: true},
  language: {type: String, default: 'en', required: true},
});

questionSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  next();
});

questionSchema.post('save', function(created, next) {
  // let question = Object.assign({}, created);
  let question = JSON.parse(JSON.stringify(created));
  question.isNew = this.wasNew;
  // console.log('isNew:', this.wasNew);
  Q.create(globalConstants.jobName.QSTN_SYNC_ELASTIC, question).removeOnComplete(true).save();
  //
  if (this.wasNew) {
    if(created.department !== 'ge') {
      Q.create(globalConstants.jobName.QSTN_PUSH_NOTI, question).removeOnComplete(true).save();
    }

    //Q.create(globalConstants.jobName.ASK_BOT_FOR_ANSWER, question).removeOnComplete(true).save();
  }

  Q.create(globalConstants.jobName.QSTN_SYNC_SKILL, question).removeOnComplete(true).save();

  return next();
});

questionSchema.post('remove', function(removed, next) {
  Q.create(globalConstants.jobName.QSTN_DELETED, removed).removeOnComplete(true).save();
  return next();
});

questionSchema.statics.getMetadata = async function(question, userId, langCode) {
  question = JSON.parse(JSON.stringify(question));
  if(userId && question.user.toString() === userId.toString()) {
    question.isOwner = true;
  }

  let promises = [
    User.formatFeedInfo(User, question.user, langCode, question.department),
    // User.findById(question.user, 'fullName userName cuid avatar'),
    getDepartment(question, langCode),
    QuestionAnswer.count({question: question._id})
  ];
  if(userId) {
    promises.push(QuestionUpvote.count({question: question._id, user: userId}));
  }
  if(userId) {
    promises.push(QuestionUpvote.count({question: question._id}));
  }

  let data = await Promise.all(promises);

  if(question.anonymous) {
    question.user = {
      avatar: 'https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg',
      fullName: 'Anonymous'
    };
  } else {
    let obj = data[0].pop();
    if(obj && obj.avatar){
      let data={
        src: obj.avatar,
        size: 150
      }
      let thumb = await cacheImage(data);
      obj.avatar = thumb;
      question.user = obj;
    }else {
      question.user = {
        avatar: 'https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg',
        fullName: 'Anonymous'
      };
    }

  }
  if(question.thumbnail && question.thumbnail[0]){
    if(!validUrl.isUri(question.thumbnail[0])){
      let data={
        src: question.thumbnail[0],
        size: 650
      }
      question.thumbnail[0] = await cacheImage(data);
    }
  }
  question.department = data[1];
  question.commentCount = data[2];
  question.upvoted = !!data[3];
  question.upVotes = data[4];

  return question;
};

async function getDepartment (question, langCode) {
  if(!langCode || langCode === 'null' || langCode === 'undefined') langCode = 'en';

  if(question.department !== 'ge') {
    let department =  await Category.findById(question.department).lean();
    let langIndex = ArrayHelper.findItemByProp(department.description, 'languageID', langCode);
    return {
      _id: department._id,
      title: department.description[langIndex].name
    };
  }
  return {
    _id: 'ge',
    title: 'General'
  };
}

questionSchema.statics.toESDoc = async function(question) {
  let plainText = Knowledge.getKnowledgePlainText(Knowledge, question);
  let tagStrings = question.tags.map(tag => {return tag.text});
  return {
    id: question._id.toString(),
    search_text: question.title + ' ' + plainText + ' ' + tagStrings.join(' '),
    department: question.department,
    createdDate: question.createdDate,
    title: question.title,
    type: await getType(question.department)
  }
};

questionSchema.statics.createFeeds = async function(feedOptions) {
  // create feed for all users
  let question = feedOptions.question;
  let userIds = [question.user];

  // For the vietnamese questions, create feed for Vietnamese user and Follower users
  if(question.language === 'vi') {
    let userOptions = await UserOptions.find({language: 'vi'}, 'userID').lean();
    let userCuids = userOptions.map(userOption => userOption.userID);

    let skillIds = [];
    question.tags.forEach(tag => {
      if(tag.id !== 'un') {
        skillIds.push(tag.id);
      }
    });

    let resources = await Promise.all([
      User.find({cuid: {$in: userCuids}, active: 1}, '_id').lean(),
      getFollowerByUserId(question.user),
      Skills.find({_id: {$in: skillIds}}, 'owners').exec()
    ]);
    let vietnameseUsers = resources[0];
    let authorFollower = resources[1];
    let skills = resources[2];

    vietnameseUsers.forEach(user => {userIds.push(user._id.toString())});
    authorFollower.forEach(user => {if(user) {userIds.push(user._id.toString())}});
    skills.forEach(skill => {
      Array.prototype.push.apply(userIds, skill.owners);
      Array.prototype.push.apply(userIds, skill.interester);
    });

    userIds = ArrayHelper.uniqueValuesInArray(userIds);
  } else {
    let users = await User.find({active: 1}, '_id').lean();
    userIds = users.map(user => user._id.toString());
  }


  userIds.forEach(userId => {
    let opt = Object.assign({object: question._id, owner: userId}, feedOptions);
    let priority = question.user.toString() === userId ? -15 : 0;
    Q.create(globalConstants.jobName.CREATE_FEED, opt).priority(priority).removeOnComplete(true).save();
  });
};

questionSchema.statics.formatSuggestData = async function(_this, questionIds) {
  let questions = await _this.find({_id: {$in: questionIds}}, 'title description slug user').lean();
  let userIds = questions.map(question => question.user);
  let users = await User.formatBasicInfo(User, userIds);
  let userMapper = ArrayHelper.toObjectByKey(users, '_id');
  questions = questions.map(question => {
    question.author = userMapper[question.user];
    delete question.authorId;
    return question;
  });
  return questions;
};
questionSchema.pre('remove',async function (removed, next) {
  await Notification.remove({object:removed._id});
  await QuestionAnswer.remove({question:removed._id});
  await QuestionUpvote.remove({question:removed._id});
  await Feed.remove({object:removed._id});
  next();
});
export default mongoose.model('Questions', questionSchema);
