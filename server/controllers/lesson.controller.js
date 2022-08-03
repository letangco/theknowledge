/* global Promise */
import mongoose from 'mongoose';
import CommentLesson from '../models/commentLesson';
import LiveStream from '../models/liveStream';
import User from '../models/user';
import globalConstants from '../../config/globalConstants';
import {cacheImage} from '../libs/imageCache'
import Knowledge from "../models/knowledge";
import {getCommentsByKnowledgeId} from "./comment.controller";

const ERROR = {
  INTERNAL: { error: 'Internal server error.' },
  ID_MISSING: { error: '"id" is required field.' },
  NOT_FOUND: { error: 'No comment found.' }
};
const REPLIES_PER_PAGE = 10;
const COMMENTS_PER_PAGE = 10;
var commentId = '';
async function afterSaved(action, req, res, err, saved, isParent) {
  try {
    if (err || !saved) {
      console.log('err on', action, 'comment:', err);
      return res.status(500).json(ERROR.INTERNAL);
    }
    commentId = saved._id.toString();
    let rs = await Promise.all([
      convertToCommentResult(req, saved, isParent || false),
      CommentLesson.count({lessonId: saved.lessonId})
    ])
    // let commentRs = await convertToCommentResult(req, saved, isParent || false);
    return res.json({comment: rs[0], commentCount: rs[1]});
  } catch (err) {
    console.log('err on', action, 'comment:', err);
    return res.status(500).json(ERROR.INTERNAL);
  }
}

export async function submit(req, res) {
  try{
    if (!req.body.content) {
      return res.status(400).json({error: 'Please provide full required fields.'});
    }
    LiveStream.findById(req.params.id, {__v: false}, async (err, lesson) => {
      if (err && err.name !== 'CastError') {
        console.log('err on getLessonById:', err);
        return res.status(500).json(ERROR.INTERNAL);
      }
      console.log('req.params.id: ', req.params.id)
      console.log('lesson: ', lesson)
      if (!lesson) {
        return res.status(404).json(ERROR.NOT_FOUND);
      }
      let comment = new CommentLesson({
        publisherId: req.user._id.toString(),
        lessonId: req.params.id,
        content: req.body.content
      });
      //let userSend = await User.findById(req.user._id).exec();
      comment.save(await afterSaved.bind(this, 'submit', req, res));
    })
  }catch (err){
    console.log("err ", err);
  }
}
export async function submitReply(req, res) {
  if (!req.params.id) {
    return res.status(400).json({error: 'Please provide comment id.'});
  }

  let parent = await CommentLesson.findById(req.params.id, 'lessonId publisherId').exec();
  if (!parent) {
    return res.status(404).json(ERROR.NOT_FOUND);
  }
  LiveStream.findById(parent.lessonId, {__v: false}, async(err, lesson) => {
    if (err && err.name !== 'CastError') {
      console.log('err on getLessonById:', err);
      return res.status(500).json(ERROR.INTERNAL);
    }
    if (!lesson) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }
    let reply = new CommentLesson({
      publisherId: req.user._id.toString(),
      lessonId: parent.lessonId.toString(),
      parentId: req.params.id,
      content: req.body.content
    });
    reply.save(afterSaved.bind(this, 'submitReply', req, res));
  });
}
export function updateComment(req, res) {
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }

  if (req.body.lessonId || req.body.publisherId) {
    return res.status(403).json({error: 'Dont hack my app, fucker!'});
  }

  CommentLesson.findById(req.params.id, 'content publisherId', (err, comment) => {
    if (err && err.name !== 'CastError') {
      console.log('err on update comment:', err);
      return res.status(500).json(ERROR.INTERNAL);
    }

    if (!comment) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    if (!req.user.role) {
      return res.status(403).json(ERROR.PERMISSION);
    }

    if (req.user.role === globalConstants.role.USER) {
      if (comment.publisherId !== req.user._id.toString()) {
        return res.status(403).json(ERROR.PERMISSION);
      }
    }
    comment.content = req.body.content ? req.body.content : comment.content;
    comment.save(afterSaved.bind(this, 'update', req, res));
  });
}

export async function deleteComment(req, res) {
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }
  try {
    let comment = await CommentLesson.findById(req.params.id);
    if (!comment) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }
    let promiseResults = await Promise.all([
      LiveStream.findById(comment.lessonId),
      CommentLesson.find({parentId: comment._id})
    ]);

    let lesson = promiseResults[0];
    let childIds = promiseResults[1].map(reply => {
      return reply._id
    });
    childIds.push(comment._id);

    if (!req.user.role) {
      return res.status(403).json(ERROR.PERMISSION);
    }

    if (req.user.role === globalConstants.role.USER) {
      if (comment.publisherId.toString() !== req.user._id.toString() &&
        lesson.user.toString() !== req.user._id.toString()) {
        return res.status(403).json(ERROR.PERMISSION);
      }
    }

    await CommentLesson.remove({_id: {$in: childIds}});
    let commentCount = await CommentLesson.count({lessonId: lesson._id});

    return res.json({success: true, commentCount: commentCount});
  } catch (err) {
    if (err.name !== 'CastError') {
      console.log('err on delete comment: ', err);
      return res.status(500).json(ERROR.INTERNAL);
    } else {
      return res.status(404).json(ERROR.NOT_FOUND);
    }
  }
}

export async function getCommentsByLeson(req, res) {
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }

  try {
    let lesson = await LiveStream.findById(req.params.id).exec();
    if (!lesson) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    let comments = await getCommentsByLessonId(req);

    return res.json(comments);
  } catch (err) {
    console.log('err on getCommentsByLesson:', err);
    return res.status(500).json(ERROR.INTERNAL);
  }
}
export async function getCommentsByLessonId(req) {
  let page = req.query.page || 1;
  let skip = (page - 1) * COMMENTS_PER_PAGE;
  let limit = COMMENTS_PER_PAGE;
  if(req.query.skip0 && req.query.skip0 == 1) {
    skip = 0;
    limit = page * COMMENTS_PER_PAGE;
  }
  let conditions = {
    lessonId: req.params.id,
    parentId: null
  };
  try {
    let countPromise = CommentLesson.count(conditions).exec();
    let commentPromise = CommentLesson
      .find(conditions)
      .skip(skip)
      .limit(limit)
      .sort({publishedDate: -1})
      .exec();
    let resultPromise = await Promise.all([
      countPromise,
      commentPromise
    ]);

    let comments = resultPromise[1];
    let arrCommentsPm = comments.map(async comment => convertToCommentResult(req, comment, true));
    let arrComments = await Promise.all(arrCommentsPm);

    let results = {
      last_page: Math.ceil(resultPromise[0] / COMMENTS_PER_PAGE),
      current_page: page,
      total_items: resultPromise[0],
      data: arrComments.reverse()
    };
    return results;
  } catch (e) {
    throw e;
  }
};

function countCommentReplies(comment) {
  return CommentLesson.count({lessonId: comment.lessonId, parentId: comment._id}).exec();
};

export async function getCommentReplies(req, res) {
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }

  let page = req.query.page || 1;
  let skip = (page - 1) * REPLIES_PER_PAGE;
  let limit = REPLIES_PER_PAGE;
  if(req.query.skip0 && req.query.skip0 == 1) {
    skip = 0;
    limit = page * REPLIES_PER_PAGE;
  }

  try {
    let comment = await CommentLesson.findById(req.params.id, 'lessonId').exec();

    if (!comment) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    let conditions = {
      lessonId: comment.lessonId,
      parentId: comment._id.toString()
    };

    let countPromise = CommentLesson.count(conditions).exec();
    let replyPromise = CommentLesson.find(conditions)
      .skip(skip)
      .limit(limit)
      .sort({publishedDate: -1})
      .exec();
    let results = await Promise.all([countPromise, replyPromise]);

    let replies = results[1];
    let arrRepliesPm = replies.map(async reply => convertToCommentResult(req, reply, false));
    let arrReplies = await Promise.all(arrRepliesPm);

    return res.json({
      last_page: Math.ceil(results[0] / REPLIES_PER_PAGE),
      current_page: page,
      total_items: results[0],
      data: arrReplies.reverse()
    });
  } catch (err) {
    if (err.name !== 'CastError') {
      console.log('err on getCommentReplies:', err);
      return res.status(500).json(ERROR.INTERNAL);
    }
  }
};
async function convertToCommentResult(req, comment, isParent) {
  try {
    let commentObj = JSON.parse(JSON.stringify(comment));
    if (isParent) {
      commentObj.replyCount = await countCommentReplies(commentObj);
    }
    let results = await Promise.all([
      getPublisher(commentObj),
    ]);
    commentObj.publisher = results[0];
    delete commentObj.publisherId;
    delete commentObj.__v;
    return commentObj;
  } catch (err) {
    throw err;
  }
}
export async function getPublisher(comment) {
  return new Promise((resolve) => {
    User.findById(comment.publisherId, 'fullName avatar cuid userName active', async (err, user) => {
      if (err) throw err;
      let obj = JSON.parse(JSON.stringify(user));
      if(obj && obj.avatar){
        let data={
          src: obj.avatar,
          size: 50
        }
        let thumb = await cacheImage(data);
        obj.avatar = thumb;
      }
      return resolve(obj);
    });
  });
}
