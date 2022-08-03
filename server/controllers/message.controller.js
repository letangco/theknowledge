import Message from '../models/message.js';
import ChatGroup from '../models/chatGroup';
import cuid from 'cuid';
import {syncChatGroupAndMessage} from './chatGroup.controller';
import User from '../models/user.js';
import configs from '../config';
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';
var MetaInspector = require('meta-scrape');

/**
 * Todo: set limit when select for get a part of latest message to have best performance
 * Get messages of group
 * @param req
 * @param res
 */
export function getMessages(req, res) {
  let token = req.params.token;
  let groupId = req.params.groupId;
  let skip = req.params.skip;
  skip = isNaN(skip)?0:parseInt(skip); // Check data valid
  let limit = req.params.limit;
  limit = isNaN(limit)?0:parseInt(limit); // Check data valid
  // Check data required
  if (!token || !groupId) {
    res.status(500).send('Not enough data!');
    return;
  }
  // Get user from token
  User.findOne({token}).exec((err, user) => {
    // Had error
    if (err) {
      res.status(500).send(err);
    }
    // Have no user with this token
    else if (!user) {
      res.status(403).end();
    } else {
      Message
        .find({chatGroup: groupId})
        .sort({time: -1})
        .skip(skip)
        .limit(limit)
        .exec((err, messages) => {
        if (err) {
          res.status(500).send(err);
        }
        res.json({messages});
      });
    }
  });
}

export async function getImagesFromGroup(req, res) {
  let userId = req.user._id; // _id
  let userCuid = req.user.cuid;
  // Have no user with this token
  if (!userId) {
    res.status(403).end();
    return;
  }
  let groupId = req.query.groupId;
  // Check data required
  if (!groupId) {
    res.status(500).send('Not enough data!');
    return;
  }
  // Check user request are in group
  let group = await ChatGroup.findOne({cuid: groupId, 'users.cuid': {$in: [userCuid]}});
  if(!group) {
    res.status(403).end('Access denied!');
    return;
  }
  let skip = req.query.skip;
  skip = isNaN(skip) ? 0 : parseInt(skip); // Check data valid
  let limit = req.query.limit;
  limit = isNaN(limit) ? 10 : parseInt(limit); // Check data valid
  if (limit > 100) {
    res.status(500).send('Let try with smaller number!');
    return;
  }
  Message
    .aggregate([
      // Find messages of chat group and have type "files"
      {$match: {$and:[
        {'chatGroup': groupId},
        {'type': 'files'}
      ]}},
      {$unwind: '$content'}, // Split messages by content
      {$match: {'content.type': 'image'}}, // Find the messages have content type is image
      {$sort: {time: -1}},
      {$skip: skip},
      {$limit: limit}
    ])
    .exec((err, messages) => {
    if (err) {
      res.status(500).send({err});
    } else {
      res.json({success: true, data: messages});
    }
  });
}

export async function getFilesFromGroup(req, res) {
  let userId = req.user._id; // _id
  let userCuid = req.user.cuid; // _id
  // Have no user with this token
  if (!userId) {
    res.status(403).end();
    return;
  }
  let groupId = req.query.groupId;
  // Check data required
  if (!groupId) {
    res.status(500).send('Not enough data!');
    return;
  }

  // Check user request are in group
  let group = await ChatGroup.findOne({cuid: groupId, 'users.cuid': {$in: [userCuid]}});
  if(!group) {
    res.status(403).end('Access denied!');
    return;
  }
  let skip = req.query.skip;
  skip = isNaN(skip) ? 0 : parseInt(skip); // Check data valid
  let limit = req.query.limit;
  limit = isNaN(limit) ? 10 : parseInt(limit); // Check data valid
  if (limit > 100) {
    res.status(500).send('Let try with smaller number!');
    return;
  }
  Message
    .aggregate([
      // Find messages of chat group and have type "files"
      {$match: {$and:[
        {'chatGroup': groupId},
        {'type': 'files'}
      ]}},
      {$unwind: '$content'}, // Split messages by content
      {$match: {'content.type': { $ne: 'image' } } }, // Find the messages is file but is not image
      {$sort: {time: -1}},
      {$skip: skip},
      {$limit: limit}
    ])
    .exec((err, messages) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({success: true, data: messages});
    }
  });
}

/**
 * Insert a message
 * message: {
 *  chatGroup: 'ID of group chat message will insert',
 *  userSend: 'ID of user send this message',
 *  content: 'Message content'
 * }
 * @param req
 * @param res
 */
export function add(req, res) {
  let token = req.body.token;
  let message = req.body.message;
  // Check data required
  if (!token || !message) {
    res.status(500).send('Not enough data!');
    return;
  }
  // Get user from token
  User.findOne({token}).exec((err, user) => {
    // Had error
    if (err) {
      res.status(500).send(err);
    }
    // Have no user with this token
    else if (!user) {
      res.status(403).end();
    } else {
      if (!message.chatGroup || !message.userSend || !message.content) {
        res.status(403).end();
        return;
      }

      // begin chat bot session
    //   if(message.userSend !== configs.tess.cuid && message.userReceive === configs.tess.cuid && message.type === 'msg') {
    //     let mess = Object.assign({}, message);
    //     mess.langCode = req.headers.lang;
    //     Q.create(globalConstants.jobName.NEW_MESSAGE, mess).removeOnComplete(true).save();
    //   }
      // end chat bot session

      let messageModel = new Message(message);
      messageModel.cuid = cuid();
      messageModel.save((err, saved) => {
        if (err) {
          res.status(500).send(err);
          return;
        }
        Promise.resolve(syncChatGroupAndMessage(saved)).then(() => {
          res.json({message: saved});
        });
      });
    }
  });
}

export function addMessage(message) {
  return new Promise(function(resolve){
    let messageModel = new Message(message);
    messageModel.cuid = cuid();
    messageModel.save((err, saved) => {
      if (err) {
        resolve(null);
      }
      Promise.resolve(syncChatGroupAndMessage(saved)).then(function(){
        resolve(saved);
      });
    });
  });
}

export function addMessageFiles(message) {
  return new Promise((resolve) => {
    let messageModel = new Message(message);
    messageModel.cuid = cuid();
    messageModel.save((err, messageSaved) => {
      if (err) {
        resolve(null);
      }
      Promise.resolve(syncChatGroupAndMessage(messageSaved)).then(() => {
        resolve(messageSaved);
      });
    });
  });
}

export function metaScrapeLink(req, res) {
  let link = req.body.link;
  var client = new MetaInspector(link, {});

  client.on("fetch", function(){
    let data = {};
    if(client.url){
      data.url = client.url;
    }
    if(client.host){
      data.host = client.host;
    }
    if(client.image){
      data.image = client.image;
    } else {
      data.image = '';
    }
    if(client.title){
      data.title = client.title;
    }
    if(client.description){
      data.description = client.description;
    } else {
      data.description = '';
    }
    return res.json({success: true, data: data});
  });

  client.on("error", function(err){
    return res.status(500).send(err);
  });
  client.fetch();
}
