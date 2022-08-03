import mongoose from 'mongoose';
import QuestionAnswer from '../models/questionAnswers';
import QuestionUpvote from '../models/questionUpvote';
import QuestionAnswerUpvote from '../models/questionAnswerUpvote';
import User from '../models/user';
import Question from '../models/questions';
import StringHelper from '../util/StringHelper';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';

const ANSWER_LIMIT = 10;

const ERROR = {
  INTERNAL: {error: 'Internal server error.'},
  ID_MISSING: {error: '"id" is required field.'},
  NOT_FOUND: {error: 'No question found.'},
  PERMISSION: {error: 'Permission denied.'}
};
export async function addAnswer(req, res) {
  try {
    let content = req.body.content.replace(/\"/g, "'");
    content = StringHelper.sanitizeHtml(content);
    if(!content) {
      return res.status(400).json({success: false, error: 'Invalid content.'});
    }

    let created = await QuestionAnswer.create({
      user: req.user._id,
      question: req.params.questionId,
      content: content,
      anonymous: req.body.anonymous
    });

    let feedOptions = {
      question: req.params.questionId,
      actor: created.user,
      action: 'answer',
      type: 'question',
      comment: created
    };
    QuestionAnswer.createFeeds(QuestionAnswer, feedOptions);

    created = JSON.parse(JSON.stringify(created));
    created.commentCount = await QuestionAnswer.count({question: req.params.questionId});
    //await pushNotificationAnswerToUser(req, created._id.toString());
    if(req.body.anonymous){
      created.user = {
        avatar: "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg",
        fullName: "Anonymous"
      }
    } else {
      let userSend = await User.findById(req.user._id).exec();
      if(userSend){
        created.user = {
          active: userSend.active,
          avatar: userSend.avatar,
          cuid: userSend.cuid,
          fullName: userSend.fullName,
          userName: userSend.userName,
          _id: userSend._id.toString(),
        }
      }
    }
    return res.json({success: true, data: created});
  } catch (err) {
    console.log('err on addAnswer:', err);
    return res.json({success: false, error: 'Internal error.'});
  }
}
export async function getAnswersByQuestion(req, res) {
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * ANSWER_LIMIT;
  let limit = ANSWER_LIMIT;
  if(req.query.skip0 && req.query.skip0 == 1) {
    skip = 0;
    limit = page * ANSWER_LIMIT;
  }
  let conditions = {
    question: req.params.questionId,
    parentId: null
  };
  let requester = null;
  try {
    if(req.headers && req.headers.token) {
      requester = await User.findOne({token: req.headers.token}, '_id');
    }
    let rs = await Promise.all([
      QuestionAnswer.count(conditions),
      QuestionAnswer.find(conditions).sort({publishedDate: -1}).skip(skip).limit(limit)
    ]);

    let total = rs[0];
    let promises = rs[1].map(answer => QuestionAnswer.getMetadata(QuestionAnswer, answer, requester ? requester._id : null));
    let answers = await Promise.all(promises);
    answers = answers.reverse();

    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(total / ANSWER_LIMIT),
      total_items: total,
      data: answers
    });
  } catch (err) {
    console.log('err on getAnswersByQuestion:', err);
    return res.json({success: false, error: 'Internal error.'});
  }
}

export async function editAnswer(req, res) {
  try {
    if(!req.params.id || String(req.params.id).valueOf() === 'undefined') {
      return res.status(404).json({success: false, error: 'Answer not found.'});
    }

    let answer = await QuestionAnswer.findById(req.params.id);

    if(!answer) {
      return res.status(404).json({success: false, error: 'Answer not found.'});
    }

    if(answer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({success: false, error: 'Permission denied.'});
    }

    let content = StringHelper.sanitizeHtml(req.body.content);
    if(!content) {
      return res.status(400).json({success: false, error: 'Invalid content.'});
    }

    answer.content = content;
    await answer.save();

    return res.json({success: true, data: answer});
  } catch (err) {
    console.log('err on editAnswer:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function deleteAnswer(req, res) {
  try {
    if(!req.params.id || String(req.params.id).valueOf() === 'undefined') {
      return res.status(404).json({success: false, error: 'Answer not found.'});
    }

    let answer = await QuestionAnswer.findById(req.params.id);

    if(!answer) {
      return res.status(404).json({success: false, error: 'Answer not found.'});
    }

    if(answer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({success: false, error: 'Permission denied.'});
    }

    let replies = await QuestionAnswer.find({parentId: answer._id});
    let commentIds = replies.map(reply => reply._id);
    commentIds.push(answer._id);

    await QuestionAnswer.remove({_id: {$in: commentIds}});

    let commentCount = await QuestionAnswer.count({question: answer.question});

    let jobData = {commentIds: commentIds, type: 'question', object: answer.question};
    Q.create(globalConstants.jobName.DELETE_FEED_COMMENT, jobData).removeOnComplete(true).save();

    return res.json({success: true, data: {commentCount}});
  } catch (err) {
    console.log('err on deleteAnswer:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function replyAnswer(req, res) {
  try {
    if(!req.params.id || String(req.params.id).valueOf() === 'undefined') {
      return res.status(404).json({success: false, error: 'Answer not found.'});
    }

    let answer = await QuestionAnswer.findById(req.params.id);

    if(!answer) {
      return res.status(404).json({success: false, error: 'Answer not found.'});
    }

    let content = req.body.content.replace(/\"/g, "'");
    content = StringHelper.sanitizeHtml(content);
    if(!content) {
      return res.status(400).json({success: false, error: 'Invalid content.'});
    }

    let created = await QuestionAnswer.create({
      user: req.user._id,
      question: answer.question,
      content: content,
      parentId: answer._id,
      anonymous: req.body.anonymous
    });

    let feedOptions = {
      question: req.params.questionId,
      actor: created.user,
      // action: 'replied',
      type: 'question',
      comment: created
    };
    QuestionAnswer.createFeeds(QuestionAnswer, feedOptions);
    created = JSON.parse(JSON.stringify(created));

    //await pushNotificationReplyToUser(req, answer, created._id.toString());
    if(req.body.anonymous){
      created.user = {
        avatar: "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg",
        fullName: "Anonymous"
      }
    } else {
      let userSend = await User.findById(req.user._id).exec();
      if(userSend){
        created.user = {
          active: userSend.active,
          avatar: userSend.avatar,
          cuid: userSend.cuid,
          fullName: userSend.fullName,
          userName: userSend.userName,
          _id: userSend._id.toString(),
        }
      }
    }
    created.commentCount = await QuestionAnswer.count({question: created.question});

    return res.json({success: true, data: created});
  } catch (err) {
    console.log('err on replyAnswer:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}
export async function getReplies(req, res) {
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * ANSWER_LIMIT;
  let limit = ANSWER_LIMIT;
  if(req.query.skip0 && req.query.skip0 == 1) {
    skip = 0;
    limit = page * ANSWER_LIMIT;
  }
  let conditions = {parentId: req.params.id};
  let requester = null;

  try {
    if(!req.params.id || String(req.params.id).valueOf() === 'undefined') {
      return res.status(404).json({success: false, error: 'Answer not found.'});
    }

    let answer = await QuestionAnswer.findById(req.params.id);

    if(!answer) {
      return res.status(404).json({success: false, error: 'Answer not found.'});
    }

    if(req.headers && req.headers.token) {
      requester = await User.findOne({token: req.headers.token}, '_id');
    }

    let rs = await Promise.all([
      QuestionAnswer.count(conditions),
      QuestionAnswer.find(conditions).sort({publishedDate: -1}).skip(skip).limit(limit)
    ]);

    let total = rs[0];
    let promises = rs[1].map(answer => QuestionAnswer.getMetadata(QuestionAnswer, answer, requester ? requester._id : null));
    let answers = await Promise.all(promises);
    answers = answers.reverse();

    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(total / ANSWER_LIMIT),
      total_items: total,
      data: answers
    });
  } catch (err) {
    console.log('err on getReplies:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}
