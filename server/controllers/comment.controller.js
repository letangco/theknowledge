/* global Promise */
import mongoose from 'mongoose';
import Comment from '../models/comment';
import Knowledge from '../models/knowledge';
import User from '../models/user';
import CommentUpvote from '../models/commentUpvote';
import * as CommentServices from '../services/comment.services';
import StringHelper from '../util/StringHelper';
import KnowledgeUpvote from '../models/knowledgeUpvote';
import KnowledgeBookmark from '../models/knowledgeBookmark';
import {addNotification} from './notification.controller.js';
import globalConstants from '../../config/globalConstants';
import {Q} from '../libs/Queue';
import AMPQ from '../../rabbitmq/ampq';
import {cacheImage} from '../libs/imageCache'

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
  let feedOptions = {
    comment: saved,
    actor: req.user._id,
    type: 'knowledge'
  };
  Comment.createFeeds(Comment, feedOptions);

  commentId = saved._id.toString();
    let rs = await Promise.all([
      convertToCommentResult(req, saved, isParent || false),
      Comment.count({knowledgeId: saved.knowledgeId})
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
    Knowledge.findById(req.params.id, {__v: false}, async (err, knowledge) => {
      if (err && err.name !== 'CastError') {
        console.log('err on getKnowledgeById:', err);
        return res.status(500).json(ERROR.INTERNAL);
      }
      if (!knowledge) {
        return res.status(404).json(ERROR.NOT_FOUND);
      }
      let comment = new Comment({
        publisherId: req.user._id.toString(),
        knowledgeId: req.params.id,
        content: req.body.content
      });
      //let userSend = await User.findById(req.user._id).exec();
      comment.save(await afterSaved.bind(this, 'submit', req, res));
    })
  }catch (err){
    console.log("err ", err);
  }
  //console.log("AAAAAAAAAAAAAAAAAAAAAA");
};
//    let feedOptions = {
//      knowledge: knowledge,
//      actor: req.user._id,
//      action: 'commented',
//      type: 'knowledge'
//    };
//    Knowledge.createFeeds(Knowledge, feedOptions);

  //   var userUpvote = [];
  //   /*Than: notification to user upvote*/
  //   let promises = [
  //     KnowledgeUpvote.find({$and: [{knowledgeId: req.params.id},
  //       {userId:{$ne:knowledge.authorId.toString()}},
  //       {userId:{$ne:req.user._id.toString()}}]}).exec()
  //   ];
  //   let results = await Promise.all(promises);
  //   let users = results[0];
  //   if(users){
  //     users.map(async user => {
  //       userUpvote.push(user.userId.toString());
  //       let userRec = await User.findById(user.userId).exec();
  //       var dataNotify = {
  //         userID : userRec.cuid,
  //         userSendID : userSend.cuid,
  //         type : 'commentKnowledgeUserVote',
  //         data : {
  //           knowledgeId : req.params.id,
  //           commentId : commentId,
  //           content: req.body.content
  //         }
  //       }
  //       // addNotification(dataNotify);
  //       AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
  //     });
  //   }
  //   Comment.aggregate([
  //     { $match:
  //     {$and: [
  //       {knowledgeId: mongoose.Types.ObjectId(req.params.id)},
  //       {publisherId:{$ne:mongoose.Types.ObjectId(knowledge.authorId.toString())}},
  //       {publisherId:{$ne:mongoose.Types.ObjectId(req.user._id.toString())}}
  //     ]}
  //     },
  //     {'$group': {
  //       '_id': {'publisherId': '$publisherId'},
  //       'count': {'$sum': 1}
  //     }},
  //     {$unwind: '$_id.publisherId'},
  //     {$replaceRoot: {newRoot: '$_id'}},
  //   ]).exec((err, users) => {
  //     if (err) {
  //       resolve(false);
  //     } else {
  //       if(users){
  //         users.map(async user => {
  //           if(userUpvote){
  //             if(userUpvote.indexOf(user.publisherId.toString()) === -1){
  //               let userRec = await User.findById(user.publisherId).exec();
  //               var dataNotify = {
  //                 userID : userRec.cuid,
  //                 userSendID : userSend.cuid,
  //                 type : 'commentKnowledgeUserComment',
  //                 data : {
  //                   knowledgeId : req.params.id,
  //                   commentId : commentId,
  //                   content: req.body.content
  //                 }
  //               }
  //               // addNotification(dataNotify);
  //               AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
  //             }
  //           } else {
  //             let userRec = await User.findById(user.publisherId).exec();
  //             var dataNotify = {
  //               userID : userRec.cuid,
  //               userSendID : userSend.cuid,
  //               type : 'commentKnowledgeUserComment',
  //               data : {
  //                 knowledgeId : req.params.id,
  //                 commentId : commentId,
  //                 content: req.body.content
  //               }
  //             }
  //             // addNotification(dataNotify);
  //             AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
  //           }
  //         });
  //       }
  //     }
  //   });
  //   if(knowledge.authorId.toString() != req.user._id.toString()){
  //     let userRec = await User.findById(knowledge.authorId).exec();
  //     var dataNotify = {
  //       userID : userRec.cuid,
  //       userSendID : userSend.cuid,
  //       type : 'commentKnowledgeAuthor',
  //       data : {
  //         knowledgeId : req.params.id,
  //         commentId : commentId,
  //         content: req.body.content
  //       }
  //     }
  //     // addNotification(dataNotify);
  //     AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
  //   }
  // });

export async function submitReply(req, res) {
  if (!req.params.id) {
    return res.status(400).json({error: 'Please provide comment id.'});
  }

  let parent = await Comment.findById(req.params.id, 'knowledgeId publisherId').exec();
  if (!parent) {
    return res.status(404).json(ERROR.NOT_FOUND);
  }
  Knowledge.findById(parent.knowledgeId, {__v: false}, async(err, knowledge) => {
    if (err && err.name !== 'CastError') {
      console.log('err on getKnowledgeById:', err);
      return res.status(500).json(ERROR.INTERNAL);
    }
    if (!knowledge) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }
    let reply = new Comment({
      publisherId: req.user._id.toString(),
      knowledgeId: parent.knowledgeId.toString(),
      parentId: req.params.id,
      content: req.body.content
    });
    reply.save(afterSaved.bind(this, 'submitReply', req, res));
    // let userSend = await User.findById(req.user._id).exec();
    // let userRecAuthor = await User.findById(knowledge.authorId).exec();
    // let userRecComment = await User.findById(parent.publisherId).exec();
    // if(userRecAuthor.cuid != userSend.cuid){
    //   var dataNotify = {
    //     userID : userRecAuthor.cuid,
    //     userSendID : userSend.cuid,
    //     type : 'commentReplyKnowledgeAuthor',
    //     data : {
    //       knowledgeId : parent.knowledgeId.toString(),
    //       commentId : commentId,
    //       parentId: req.params.id,
    //       content: req.body.content
    //     }
    //   }
    //   // addNotification(dataNotify);
    //   AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
    // }
    // if(userRecComment && userRecComment.cuid && (userRecComment.cuid != userSend.cuid) && (userRecComment.cuid != userRecAuthor.cuid)){
    //   var dataNotify = {
    //     userID : userRecComment.cuid,
    //     userSendID : userSend.cuid,
    //     type : 'commentReplyKnowledgeComment',
    //     data : {
    //       knowledgeId : parent.knowledgeId.toString(),
    //       commentId : commentId,
    //       parentId: req.params.id,
    //       content: req.body.content
    //     }
    //   }
    //   // addNotification(dataNotify);
    //   AMPQ.sendDataToQueue(globalConstants.jobName.ADD_NOTIFICATION_NEW, dataNotify);
    // }
  });
}
export function updateComment(req, res) {
  if (!req.params.id) {
    return res.status(400).json(ERROR.ID_MISSING);
  }

  if (req.body.knowledgeId || req.body.publisherId) {
    return res.status(403).json({error: 'Dont hack my app, fucker!'});
  }

  Comment.findById(req.params.id, 'content publisherId', (err, comment) => {
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
    let comment = await Comment.findById(req.params.id);
    if(!comment) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }
    let promiseResults = await Promise.all([
      Knowledge.findById(comment.knowledgeId),
      Comment.find({parentId: comment._id})
    ]);

    let knowledge = promiseResults[0];
    let childIds = promiseResults[1].map(reply => {return reply._id});
    childIds.push(comment._id);

    if (!req.user.role) {
      return res.status(403).json(ERROR.PERMISSION);
    }

    if (req.user.role === globalConstants.role.USER) {
      if (comment.publisherId.toString() !== req.user._id.toString() &&
          knowledge.authorId.toString() !== req.user._id.toString()) {
        return res.status(403).json(ERROR.PERMISSION);
      }
    }

    await Comment.remove({_id: {$in: childIds}});
    let commentCount = await Comment.count({knowledgeId: knowledge._id});

    return res.json({success: true, commentCount: commentCount});
  } catch(err) {
    if (err.name !== 'CastError') {
      console.log('err on delete comment: ', err);
      return res.status(500).json(ERROR.INTERNAL);
    } else {
      return res.status(404).json(ERROR.NOT_FOUND);
    }
  }
//  Comment.findById(req.params.id, 'publisherId', (err, comment) => {
//    if (err && err.name !== 'CastError') {
//      console.log('err on delete comment: ', err);
//      return res.status(500).json(ERROR.INTERNAL);
//    }
//
//    if (!comment) {
//      return res.status(404).json(ERROR.NOT_FOUND);
//    }
//
//    if (!req.user.role) {
//      return res.status(403).json(ERROR.PERMISSION);
//    }
//
//    if (req.user.role === globalConstants.role.USER) {
//      if (comment.publisherId.toString() !== req.user._id.toString()) {
//        return res.status(403).json(ERROR.PERMISSION);
//      }
//    }
//
//    return res.json({success: true});
//  });
};

export async function getCommentsByKnowledgeId(req) {
  let knowledgeId = req.params.id;
  let page = req.query.page || 1;

  let skip = (page - 1) * COMMENTS_PER_PAGE;
  let limit = COMMENTS_PER_PAGE;
  if(req.query.skip0 && req.query.skip0 == 1) {
    skip = 0;
    limit = page * COMMENTS_PER_PAGE;
  }
  let conditions = {
    knowledgeId: knowledgeId,
    parentId: null
  };
  try {
    let countPromise = Comment.count(conditions).exec();
    let commentPromise = Comment
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
  return Comment.count({knowledgeId: comment.knowledgeId, parentId: comment._id}).exec();
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
    let comment = await Comment.findById(req.params.id, 'knowledgeId').exec();

    if (!comment) {
      return res.status(404).json(ERROR.NOT_FOUND);
    }

    let conditions = {
      knowledgeId: comment.knowledgeId,
      parentId: comment._id.toString()
    };

    let countPromise = Comment.count(conditions).exec();
    let replyPromise = Comment.find(conditions)
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
    let userId = '';
    if(req.headers.token) {
      let user = await User.findOne({token: req.headers.token}, '_id').exec();
      userId = user ? user._id : '';
    }
    let results = await Promise.all([
        getPublisher(commentObj),
        isCommentVotedByUser(commentObj._id, userId)
    ]);
    commentObj.publisher = results[0];
    commentObj.upVoted = results[1];
    commentObj.countComment = await Knowledge.getCommentCount(commentObj.knowledgeId);
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

export async function upVote(req, res) {
    try {
        let comment = await Comment.findById(req.params.id).exec();
        if (!comment) {
            return res.status(404).json(ERROR.NOT_FOUND);
        }

        let conditions = {
            commentId: req.params.id,
            userId: req.user._id.toString()
        };

        let count = await CommentUpvote.count(conditions).exec();
        if (count > 0) {
            return res.status(400).json({error: 'You already up voted this knowledge before.'});
        }

        let commentUpvote = new CommentUpvote(conditions);
        await commentUpvote.save();

        comment.upVotes++;
        let saved = await comment.save();
        let savedObject = JSON.parse(JSON.stringify(saved));
        savedObject.upvoted = true;
        return res.json(savedObject);
    } catch (err) {
        if (err.name !== 'CastError') {
          console.log('err on upVote knowledge: ', err);
          return res.status(500).json(ERROR.INTERNAL);
        }
    }
}

export async function downVote(req, res) {
  try {
        let comment = await Comment.findById(req.params.id).exec();
        if (!comment) {
            return res.status(404).json(ERROR.NOT_FOUND);
        }

        let conditions = {
            commentId: req.params.id,
            userId: req.user._id.toString()
        };

        let count = await CommentUpvote.count(conditions).exec();
        if (count <= 0) {
            return res.status(400).json({error: 'You have not voted this knowledge before.'});
        }

        await CommentUpvote.findOneAndRemove(conditions).exec();

        comment.upVotes--;
        let saved = await comment.save();
        let savedObject = JSON.parse(JSON.stringify(saved));
        savedObject.upvoted = false;
        return res.json(savedObject);
    } catch (err) {
        if (err.name !== 'CastError') {
            console.log('err on upVote knowledge: ', err);
            return res.status(500).json(ERROR.INTERNAL);
        }
    }
}

async function isCommentVotedByUser(commentId, userId) {
  if (!userId) return false;

  let count = await CommentUpvote.count({
        commentId: commentId,
        userId: userId
  }).exec();
  return count > 0;
}
