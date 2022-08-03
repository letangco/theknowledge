import ChatGroup from '../models/chatGroup.js';
import {getUserInfoForChatGroupById} from '../controllers/user.controller';
import cuid from 'cuid';
import {getUsersOnlineState} from '../routes/socket_routes/chat_socket';
import {addMessageNotify} from '../controllers/notification.controller.js';
import User from '../models/user.js';
import mongoose from 'mongoose';
import configs from '../config';
import globalConstants from '../../config/globalConstants';
import {Q} from '../libs/Queue';
import {reply as BotReply} from '../libs/Workers/ChatBotWorker';

export function requestUsersOnlineState(req, res) {
  let token = req.body.token;
  let userIDs = req.body.userIDs;
  if (!token || !userIDs) {
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
      getUsersOnlineState(userIDs).then((usersState)=> {
        res.json({usersState});
      });
    }
  });
}
/**
 * Get chat group by CUID
 * @param req
 * @param res
 */
export async function getChatGroupById(req, res) {
  let chatGroupID = req.params.chatGroupID;
  if (!chatGroupID) {
    return res.status(500).send('Not enough data!');
  }
  try {
    let chatGroup = await ChatGroup.findOne({cuid:chatGroupID}).lean();
    return res.json({
      chatGroup: chatGroup
    })
  } catch (error) {
    return res.status(500).send(error.message);
  }
}
/**
 * Get chat groups of User
 * @param req
 * @param res
 */
export async function getChatGroups(req, res) {
  try{
    let userCuid = req.user.cuid;
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || 10).valueOf();
    let skip = (page - 1) * limit;
    // Have no user with this token
    if ( ! userCuid ) {
      res.status(403).end();
      return;
    }
    let langCode = req.headers.lang || 'en';
    let conditions = {'users.cuid': userCuid};
    // If user is bot
    // if ( langCode == 'vi' ) {
    //  conditions = {$and: [{'users.cuid': userCuid}, {'users.cuid': {$ne: configs.tess.cuid}}]}
    // }
    let count = await ChatGroup.count(conditions);
    ChatGroup
      .find(conditions)
      .sort({lastTimeActive: -1})
      .limit(limit)
      .skip(skip)
      .exec((err, chatGroups) => {
        if (err) {
          res.status(500).send(err);
        }
        res.json({
          total_page:Math.ceil(count/limit),
          page:page,
          total_items:chatGroups.length,
          chatGroups
      });
      });
  } catch (err){
    return res.json({status:500, success:false, error:'Internal Server Error!'})
  }
}
/**
 * Check 2 users had chat group yet, if not: Add new chat group of 2 users
 * If yes: get the group and return
 * @param req
 * @param res
 */
export function addByUsers(req, res) {
  let token = req.body.token;
  let users = req.body.users;
  if (!token || !users) {
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
      checkChatGroupOfUsersExists(users).then(async (existedChatGroup) => {
        // If have no chat group yet, create one
        // todo: check case return null, because this returned when have an error
        if (typeof existedChatGroup === 'undefined' || existedChatGroup === null) {
          let promises = [];
          let botIndex = users.indexOf(configs.tess.cuid), reply = null;

          // Create userViewInfo
          let userViewInfo = [];

          users.map((userID)=>{
            promises.push(getUserInfoForChatGroupById(userID));

            let viewInfoItem = {
              userID,
              messageUnread: 0,
              lastMessage: {},
              firstMessage: {},
              lastTimeActive: Date.now
            };
            userViewInfo.push(viewInfoItem);
          });
          Promise.all(promises)
            .then((results) => {
              let userInfo = {};
              let usersData = [];
              results.map((user) => {
                let objKey = user.cuid;
                usersData.push({
                  cuid: objKey,
                  fullName: user.fullName || user.firstName || user.lastName
                });
                userInfo[objKey] = user;
              });

              let chatGroupModel = new ChatGroup();
              chatGroupModel.cuid = cuid();
              chatGroupModel.users = usersData;
              chatGroupModel.lastMessage = reply;
              chatGroupModel.userInfo = userInfo;
              chatGroupModel.userViewInfo = userViewInfo;

              chatGroupModel.save(async (err, newGroup) => {
                if (err) {
                  res.status(500).send(err);
                }
                newGroup = JSON.parse(JSON.stringify(newGroup));
                if(botIndex >= 0) {
                  let userIndex = 2 - botIndex - 1;
                  let user = await User.findOne({cuid: users[userIndex]});
                  let content = `Hello ${user.fullName}.`;
                  newGroup.lastMessage = await BotReply({chatGroup: newGroup.cuid, userSend: users[userIndex]}, content);
                }
                res.json({newGroup: newGroup});
              });
            })
            .catch((e) => {
              // Handle errors here
              res.status(500).send(e);
            });
        }
        // If chat group existed, return it
        else {
          let promises = [setChatGroupTime(existedChatGroup.cuid, new Date())];
          // let botIndex = users.indexOf(configs.tess.cuid);
          // if(botIndex >= 0) {
            // let userIndex = 2 - botIndex - 1;
            // let user = await User.findOne({cuid: users[userIndex]});
            // let content = `Hello ${user.fullName}, I'm Tess Bot from Tesse, Inc. How can I help you?`;
            // promises.push(
            //   BotReply({chatGroup: existedChatGroup.cuid, userSend: users[userIndex]}, content)
            // );
          // }
          let rs = await Promise.all(promises);
          if(rs.length === 2) {
            existedChatGroup = JSON.parse(JSON.stringify(existedChatGroup));
            existedChatGroup.lastMessage = rs[1];
          }
          res.json({newGroup: existedChatGroup});
          // Promise.resolve().then(() => {
          //
          // });
        }
      });
    }
  });
}

export function addChatGroupByUsers(users) {
  return new Promise(function (resolve) {
    checkChatGroupOfUsersExists(users).then((existedChatGroup) => {
      // If have no chat group yet, create one
      if (typeof existedChatGroup === 'undefined' || existedChatGroup === null) {
        let promises = [];
        // Create userViewInfo
        let userViewInfo = [];
        users.map((userID)=>{
          promises.push(getUserInfoForChatGroupById(userID));

          let viewInfoItem = {
            userID,
            messageUnread: 0,
            lastMessage: {},
            firstMessage: {},
            lastTimeActive: Date.now
          };
          userViewInfo.push(viewInfoItem);
        });

        Promise.all(promises)
          .then((results) => {
            let userInfo = {};
            let usersData = [];
            results.map((user) => {
              let objKey = user.cuid;
              usersData.push({
                cuid: objKey,
                fullName: user.fullName || user.firstName || user.lastName
              });
              userInfo[objKey] = user;
            });

            let chatGroupModel = new ChatGroup();
            chatGroupModel.cuid = cuid();
            chatGroupModel.users = usersData;
            chatGroupModel.lastMessage = null;
            chatGroupModel.userInfo = userInfo;
            chatGroupModel.userViewInfo = userViewInfo;
            chatGroupModel.save((err, newGroup) => {
              if (err) {
                resolve(err);
              }
              resolve(newGroup);
            });
          })
          .catch((exception) => {
            // Handle exception here
            resolve(exception);
          });
      }
      // If chat group existed, return it
      else {
        Promise.resolve(setChatGroupTime(existedChatGroup.cuid, new Date())).then(() => {
          resolve(existedChatGroup);
        });
      }
    });
  });
}
/**
 * Check the chat group of users had created or not
 * Return null if not created
 * Return chatGroup object if created
 * @param users
 */
export function checkChatGroupOfUsersExists(users) {
  // Todo: check the number users of chat group must match with number users input
  return new Promise((resolve) => {
    ChatGroup.findOne({'users.cuid': {$all: users}}).exec((err, chatGroup) => {
      if (err || chatGroup === null) {
        resolve(null);
      }
      resolve(chatGroup);
    });
  });
}

/**
 * Sync chat group and last message added
 * Update last time active of this group is current time
 * And update the last message
 * @param message
 */
export function syncChatGroupAndMessage(message) {
  if(!message || !message.chatGroup) {return}
  ChatGroup.findOne({cuid: message.chatGroup}).exec((err, cg) => {
    if (err) {
      return false;
    } else {
      if (cg === null) {
        return false;
      } else {
        var infoView = [];
        if (typeof cg.userViewInfo !== 'undefined') {
          cg.userViewInfo.map((item) => {
            if ( item.userID === message.userSend ) {
              item.messageUnread = 0;
              item.firstMessage = message;
              item.lastMessage = message;
              item.lastTimeActive = new Date();
              addMessageNotify(message.userSend, message.chatGroup);
            } else {
              // Update info message unread
              if (item.messageUnread > 0) {
                item.messageUnread = item.messageUnread + 1;
                item.lastMessage = message;
                item.lastTimeActive = new Date();
              } else {
                item.messageUnread = 1;
                item.firstMessage = message;
                item.lastMessage = message;
                item.lastTimeActive = new Date();
              }
              addMessageNotify(item.userID, message.chatGroup, true);
            }
            infoView.push(item);
          });
        }
        ChatGroup.update(
          {cuid: message.chatGroup},
          {$set: {lastMessage: message, lastTimeActive: new Date(), userViewInfo: infoView}},
          (err, numAffected) => {
            if (!err) {
              return numAffected;
            } else {
              return false;
            }
          }
        );
      }
    }
  });
}

export function setChatGroupTime(chatGroupID, time) {
  ChatGroup.update(
    {cuid: chatGroupID},
    {lastTimeActive: time},
    (err, numAffected) => {
      if (!err) {
        return numAffected;
      } else {
        return false;
      }
    }
  );
}

/**
 * Update user info in chat group when User update trigger
 * @param userID
 */
export function updateChatGroupUserInfo(userID) {
  // Get all chat group this user are in there
  ChatGroup.find({'users.cuid': {$in: [userID]}}).exec((err, chatGroups) => {
    if (err) {
      return false;
    }
    getUserInfoForChatGroupById(userID).then((user) => {
      chatGroups.map((chatGroup) => {
        // Update userInfo for each chat group
        chatGroup.userInfo[userID] = user;
        // Update user data
        chatGroup.users.map((userData,index)=>{
          if(userData.cuid===userID) {
            chatGroup.users[index] = {
              cuid: userID,
              fullName: user.fullName || user.firstName || user.lastName
            };
          }
        });
        ChatGroup.update({cuid: chatGroup.cuid},
          {
            userInfo: chatGroup.userInfo,
            users: chatGroup.users
          },
          (err, numAffected) => {
            // numAffected is the number of updated documents
            if (!err) {
              return numAffected;
            } else {
              return false;
            }
          }
        );
      });
    });
  });
}

export function searchChatGroup(req, res) {
  let token = req.params.token;
  let keyWord = req.params.key;
  if (!token || !keyWord) {
    res.status(500).send('Not enough data!');
    return;
  }
  // Get user from token
  User.findOne({token}).exec((err, user) => {
    // Had error
    if (err) {
      res.status(500).send(err).end();
    }
    // Have no user with this token
    else if (!user) {
      // Forbidden
      res.status(403).end();
    } else {
      searchChatGroupByName(user.cuid, keyWord).then((result)=>{
        if(result&&result.isError) {
          res.status(500).send(err);
        } else {
          res.json(result).end();
        }
      });
    }
  });
}

export function searchChatGroupByName(yourUserID, keyWord) {
  return new Promise((resolve)=>{
    if(keyWord) {
      let regExpKeyWord = new RegExp(keyWord,'i');
      ChatGroup
        .aggregate([
          // Get only the document of your chat group
          {$match: {'users.cuid': {$in: [yourUserID]}}}, // Because search on your chat groups
          {$unwind: '$users'}, // Split chat groups by users field
          {$match: {$and: [
            {'users.fullName': {$regex: regExpKeyWord}}, // Match the key word
            {'users.cuid': {$ne: yourUserID}} // Because not search your name
          ]}},
          // Join collections to get full chat group object, because the unwind splitted the users field
          {$lookup: {
            from: 'chatgroups',
            localField: '_id',
            foreignField: '_id',
            as: 'searchResults'
          }},
          // Unwind to get new collection from searchResults
          {$unwind: '$searchResults'},
          // Replace each document with searchResults
          {$replaceRoot: {newRoot: '$searchResults'}},
          // Sort the result by time active
          {$sort: {lastTimeActive: -1}}
        ])
        .exec((error, chatGroups) => {
          if(error) {
            resolve({isError: true, error});
          } else {
            resolve(chatGroups);
          }
        });
    } else {
      resolve(null);
    }
  });
}

export function updateMessageViewStatus(req, res) {
  var userID = req.body.userID;
  var chatGroupID = req.body.chatGroupID;
  var token = req.body.token;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  //Check token
  User.findOne({cuid: userID, token: token}).exec((err, user) => {
    if (err) {
      result.key = -2;
      result.message = 'System error.';
      res.json({result});
    } else {
      if (user === null) {
        result.key = -1;
        result.message = 'User not exist.';
        res.json({result});
      } else {
        ChatGroup.findOne({cuid: chatGroupID, 'userViewInfo.userID': userID}).exec((err, cg) => {
          if (err) {
            result.key = -2;
            result.message = 'System error.';
            res.json({result});
          } else {
            if (cg === null) {
              result.key = -3;
              result.message = 'Chat group or user not exist.';
              res.json({result});
            } else {
              //Update item.
              var userViewInfo = [];
              if (typeof cg.userViewInfo !== 'undefined') {
                cg.userViewInfo.map((item) => {
                  if (item != userID) {
                    item.messageUnread = 0;
                    item.firstMessage = item.lastMessage;
                  }
                  userViewInfo.push(item);
                });
              }
              //Update chatgroup
              ChatGroup.update(
                {cuid: chatGroupID},
                {$set: {userViewInfo: userViewInfo}},
                (err, numAffected) => {
                  if (err) {
                    result.key = -4;
                    result.message = 'System error.';
                    res.json({result});
                  } else {
                    result.key = 1;
                    result.message = 'Success.';
                    res.json({result});
                  }
                }
              );
            }
          }
        });
      }
    }
  });
}



const senderAcc = {
  tessBot: 'tessBot',
  customerSup: 'customerSup',
  tesseSup: 'tesseSup'
};
/**
 * Broadcast message to all user
 * @param req
 * @param res
 */
export async function broadcastMessage(req, res) {
  let account = req.body.account;
  if ( ! account ) {
    res.json({success: false, data: 'Account not found!'});
    return;
  }
  let userSend;
  switch ( account ) {
    case senderAcc.tessBot:
      userSend = configs.tess.cuid;
      break;
    case senderAcc.customerSup:
      userSend = configs.supportAccounts.customerSupport.cuid;
      break;
    case senderAcc.tesseSup:
      userSend = configs.supportAccounts.tesseSupport.cuid;
      break;
  }

  if ( ! userSend ) {
    res.json({success: false, data: 'User send not found!'});
    return;
  }

  let content = req.body.content;
  if ( ! content ) {
    res.json({success: false, data: 'Content not found!'});
    return;
  }

  // Get all user
  let users = await User.find({
    cuid: {$nin: [
      configs.supportAccounts.tesseSupport.cuid,
      configs.supportAccounts.customerSupport.cuid,
      configs.tess.cuid
    ]},
    active: 1
  }, 'cuid').exec();
  let numUser = users.length;
  // Create chat group + add message + emit to socket
  if ( users instanceof Array ) {
    await users.map( async user => {
      let userReceive = user.cuid;
      Q.create(globalConstants.jobName.BROADCAST_MESSAGE, {userSend, userReceive, content})
        .removeOnComplete(true).save();
    });
    res.json({success: true, numUser: numUser});
  } else {
    res.json({success: false, data: 'Users not found!'});
  }
}
