import NotificationOld from '../models/notification';
import * as NotificationServices from '../services/notification.services';
import ChatGroup from '../models/chatGroup.js';
import sanitizeHtml from 'sanitize-html';
import cuid from 'cuid';
import mongoose from 'mongoose';
import {sendMail} from '../libs/EmailDispatcher';
import checkEmail from 'email-validator';
import Notify from '../routes/socket_routes/notification.js';
import {checkOptionNotify} from './userOption.controller.js';
import User from '../models/user.js';
import ArrayHelper from '../util/ArrayHelper';
import StringHelper from '../util/StringHelper';
import {pushNotifyToUser} from "../libs/Fcm";
import {Q} from '../libs/Queue';
// import AMPQ from '../ampq/ampq';
import globalConstants from '../../config/globalConstants';
const LIMIT = 30;

export async function addNotificationNew(options) {
  try{
    await NotificationServices.AddNotification(options);
  }catch (err){
    console.log("err Controller Notification :", err);
  }
}
// export function addNotification(notify) {
//   return new Promise((resolve, reject) => {
//     // var result = {
//     //   key: -10,
//     //   message: '',
//     //   data: null
//     // };
//     if (typeof notify === 'undefined') {
//       return reject('Data empty');
//     }
//     let receiver = User.findById(notify.to);
//     let sender;
//     if (notify.from){
//       sender = User.findById(notify.from);
//     }
//     var notifyInfo = {
//       notifyID: cuid(),
//       userID: receiver.cuid,
//       userSendID: sender.cuid ? sender.cuid : '',
//       notifyType: notify.type,
//       notifyInfo: notify.data,
//       viewStatus: 1,
//       status: 1
//     };
//     var notifyResponse = {
//       userID: notifyInfo.userID,
//       notifyInfo: {
//         notifyID: notifyInfo.notifyID,
//         userSendID: notifyInfo.userSendID,
//         notifyType: notifyInfo.type,
//         notifyInfo: notifyInfo.data,
//         viewStatus: 1,
//         status: 1
//       }
//     };
//     var notification = new Notify();
//     //Check user option.
//     //Promise.resolve(checkOptionNotify(notify.userID)).then((res) => {
//     //if (res) {
//     //If Follow ==> save & send notify.
//     Notification.findOne({userID: notify.userID}).exec((err, currentNotify) => {
//       if (err) {
//         return reject(err);
//       } else {
//         var notifyList = [];
//         if (currentNotify === null) {
//           //add new,
//           notifyList.push(notifyInfo);
//           var itemAdd = new Notification();
//           itemAdd.userID = notify.userID;
//           itemAdd.notifyList = notifyList;
//           itemAdd.save((err) => {
//             if (err) {
//               return reject(err);
//             } else {
//               //notification.emitHandleNotification(notifyResponse);
//               //AMPQ.sendDataToQueue(globalConstants.jobName.PUSH_NOTIFY_TO_USER, notifyResponse);
//               return resolve();
//               // result.key = 1;
//               // result.message = 'Success.';
//               // //res.json({result});
//               // return result;
//             }
//           });
//         } else {
//           //update. Delete & Add follow Setting RowNotifySave.
//           notifyList = currentNotify.notifyList;
//           notifyList.push(notifyInfo);
//           Notification.update(
//             {userID: notify.userID},
//             {notifyList: notifyList}
//           ).exec((err) => {
//             if (err) {
//               return reject(err);
//               // result.message = 'System error.';
//               // //res.json({result});
//               // return result;
//             } else {
//               //notification.emitHandleNotification(notifyResponse);
//               //AMPQ.sendDataToQueue(globalConstants.jobName.PUSH_NOTIFY_TO_USER, notifyResponse);
//               return resolve();
//               // result.key = 1;
//               // result.message = 'Success.';
//               // //res.json({result});
//               // return result;
//             }
//           });
//         }
//       }
//     });
//   });
// }

export async function getNotificationByUserV2(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let lastId = req.query.lastId || null;
    let langCode = req.headers.lang || 'en';
    let type = req.query.type || 'web';
    if (isNaN(page)) {
      return res.status(404).json({success: false, err: 'Invalid page number.'});
    }
    let options = {
      to: req.user._id,
      skip: (page - 1) * 10,
      limit: 10,
      type:type,
      langCode: req.headers.lang || null
    };
    if (lastId){
      options.lastId = lastId;
    }
    let data = await Promise.all([
      NotificationServices.countNotification(options),
      NotificationServices.getNotificationByUser(options, langCode)
    ]);
    let count = data[0];
    let notifications = data[1];
    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(count / 10),
      total_items: count,
      data: notifications
    })
  } catch (err) {
    console.log("err getNotificationByUser ", err);
    return res.status(err.status).json(err);
    /** Code of mr.than  }

     var result = {
    key: -10,
    message: '',
    data: null
  };
     var userID = sanitizeHtml(req.params.userID);
     // call function getNotificationByUserID()
     var query = 'getNotificationByUserID("' + userID + '")';
     mongoose.connection.db.eval(query, function (err, follow) {
    if (err) {
      result.value = err;
      res.json({result});
    } else {
      result.key = 1;
      result.value = 'Success.';
      result.data = follow;
      res.json({result});
    }
  });
     */
  }
}
export function getNotificationByUser(req, res) {
  var result = {
    key: -10,
    message: '',
    data: null
  };
  var userID = sanitizeHtml(req.params.userID);
  // call function getNotificationByUserID()
  var query = 'getNotificationByUserID("' + userID + '")';
  mongoose.connection.db.eval(query, function (err, follow) {
    if (err) {
      result.value = err;
      res.json({result});
    } else {
      result.key = 1;
      result.value = 'Success.';
      result.data = follow;
      res.json({result});
    }
  });
}

export async function updateStatusByUser(req, res) {
  try {
    let object = await StringHelper.isObjectId(req.body.notifyId);
    if(!object) {
      return res.json({status:400, success:false , err:"Object Not Format!"});
    }
    let options = {
      to:req.user._id,
      notifyId: req.body.notifyId
    };
    let data = await NotificationServices.updateStatusByUser(options);
    return res.json({
      success:true,
      data:data
    })
  }catch (err) {
    console.log("err updateStatusByUser", err);
    return res.status(err.status).json(err);
  }
  /**
 var result = {
    key: -10,
    message: '',
    data: null
  };
 var userID = req.body.userID;
 Notification.findOne({userID: userID}).exec((err, userInfo) => {
    if (err) {
      result.key = -1;
      result.message = 'System error.';
      res.json({result});
      return false;
    } else {
      if (userInfo !== null) {
        var notifyList = userInfo.notifyList;
        userInfo.notifyList.map((item, index) => {
          if (item.status == 1) {
            notifyList[index].status = 0;
          }
          //Update notifyList.
        });
        Notification.update(
          {userID: userID},
          {$set: {notifyList: notifyList}},
          function (err) {
            if (err) {
              result.key = -1;
              result.message = 'System error.';
              res.json({result});
              return false;
            } else {
              result.key = 1;
              result.message = 'Success.';
              res.json({result});
              return true;
            }
          }
        );
      } else {
        result.key = -2;
        result.message = 'User not exist.';
        res.json({result});
        return false;
      }
    }
  });
   */
 }

 export function updateViewStatus(req, res) {
  var userID = req.body.userID;
  var notifyID = req.body.notifyID;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  NotificationOld.update(
    {
      userID: userID,
      "notifyList.notifyID": notifyID
    },
    {
      $set: {"notifyList.$.viewStatus": 0}
    },
    function (err) {
      if (err) {
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

export function addMessageNotify(userID, chatGroup, isReceiver) {
  NotificationOld.findOne({userID: userID}).exec((err, notify) => {
    if (err) {
      return false;
    } else {
      if (notify === null) {
        //Add new notify
        notify = new NotificationOld();
        notify.cuid = cuid();
        notify.userID = userID;
        notify.notifyList = [];
        if ( isReceiver ) {
          // Only need to update notifications if user is not sender
          notify.messageGroup = [chatGroup];
        }
        notify.messageGroupInfo = [chatGroup];
        notify.save((err) => {
          if (err) {
            return false;
          } else {
            return true;
          }
        });
      } else {
        let listChatGroupInfo = notify.messageGroupInfo;
        if (typeof notify.messageGroupInfo !== 'undefined') {
          let index = notify.messageGroupInfo.indexOf(chatGroup);
          if (index < 0) {
            listChatGroupInfo.push(chatGroup);
          } else {
            listChatGroupInfo.splice(index, 1);
            listChatGroupInfo.push(chatGroup);
          }
        } else {
          listChatGroupInfo = [chatGroup];
        }

        let updateFields = {messageGroupInfo: listChatGroupInfo};

        if ( isReceiver ) {
          let listChatGroup = notify.messageGroup;
          if (typeof listChatGroup !== 'undefined') {
            if (listChatGroup.indexOf(chatGroup) < 0) {
              listChatGroup.push(chatGroup);
            }
          } else {
            listChatGroup = [chatGroup];
          }
          updateFields.messageGroup = listChatGroup;
        }

        //Update info.
        NotificationOld.update(
          {userID: userID},
          {$set: updateFields},
          (err) => {
            if (err) {
              return false;
            } else {
              return true;
            }
          });
      }
    }
  });
}

 export function updateMessageNotifyStatus(req, res) {
  var userID = req.body.userID;
  var token = req.body.token;
  var result = {
    key: -10,
    message: '',
    data: null
  };
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
        NotificationOld.update(
          {userID: userID},
          {$set: {messageGroup: []}},
          (err) => {
            if (err) {
              result.key = -2;
              result.message = 'System error.';
              res.json({result});
            } else {
              result.key = 1;
              result.message = 'Success';
              res.json({result});
            }
          }
        );
      }
    }
  });
}

/**
 * Get the num messages user not read yet
 * @param req
 * @param res
 */
 export function getNotifyChatGroup(req, res) {
  var userID = req.params.userID;
  var token = req.params.token;
  var result = {
    key: -10,
    message: '',
    data: null
  };
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
        NotificationOld.findOne({userID: userID}).exec(async (err, notify) => {
          if (err) {
            result.key = -1;
            result.message = 'Data empty';
            res.json({result});
          } else {
            if (notify === null) {
              result.key = -1;
              result.message = 'Data empty';
              res.json({result});
            } else {
              result.key = 1;
              result.message = 'Success';
              result.data = notify.messageGroup;
              // Count the number of message unread from ChatGroup collection
              // const chatGroups = await ChatGroup.find({
              //   cuid: { $in: notify.messageGroupInfo },
              //   userViewInfo: { $elemMatch: { userID: userID, messageUnread: { $gt: 0 } } }
              // });
              // result.data = chatGroups.map(chatGroup => {
              //   return chatGroup.cuid;
              // });
              res.json({result});
            }
          }
        });
      }
    }
  });
}

 export async function getMessageNotifyInfo(req, res) {
  try{
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || LIMIT).valueOf();
    let skip = (page - 1) * limit;
    let userCuid = req.params.userID;
    let userId = req.user._id;
    let user = await User.findOne({_id: userId}).lean();
    if (!user){
      return res.json({
        result:{
          key: -2,
          message : 'User not found',
          value: ''
        }
      })
    }
    let result = [];
    let notifications = await NotificationOld.findOne({userID: userCuid}).lean();
    let count;
    if ( notifications && notifications.messageGroupInfo && notifications.messageGroupInfo.length > 0 ) {
      count = notifications.messageGroupInfo.length;
      let chatGroups = await ChatGroup.find({cuid:{$in:notifications.messageGroupInfo}}).sort({lastTimeActive:-1}).skip(skip).limit(limit);
      if ( chatGroups instanceof Array ) {
        const length = chatGroups.length;
        for ( let index = 0; index < length; index++ ) {
          let chatGroup = chatGroups[index];
          let e = {};
          let message = chatGroup.userViewInfo.map(async user => {
            if (user.userID === userCuid) {
              e.lastTimeActive = user.lastTimeActive;
              e.lastMessage = user.lastMessage;
              e.messageUnread = user.messageUnread
            } else {
              let userInfo = await User.findOne({cuid:user.userID, active:1}).lean();
              if (userInfo){
                e.userID = userInfo.cuid;
                e.avatar = userInfo.avatar;
                e.fullName = userInfo.fullName;
                e.userName = userInfo.userName;
              }
            }
          });
          await Promise.all(message);
          if ( e.userID ) {
            result.push(e);
          }
        }
      }
    }
    return res.json({
      result:{
        key:1,
        miss_user:LIMIT - result.length,
        total_page: Math.ceil(count / limit),
        page: page,
        total_items: result.length,
        message:'Success',
        data:result
      }
    });
  }catch (err){
    console.log(err);
    return res.json({
      result:{
        key : -2,
        message : 'System error.',
        value:''
      }
    })
  }
  // var userID = req.params.userID;
  // var token = req.headers.token;
  // var result = {
  //   key: -10,
  //   message: '',
  //   data: null
  // };
  // User.findOne({cuid: userID, token: token}).exec((err, user) => {
  //   if (err) {
  //     result.key = -2;
  //     result.message = 'System error.';
  //     res.json({result});
  //   } else {
  //     if (user === null) {
  //       result.key = -1;
  //       result.message = 'User not exist.';
  //       res.json({result});
  //     } else {
  //       var query = 'getMessageNotify("' + userID + '")';
  //       mongoose.connection.db.eval(query, function (err, messageList) {
  //         if (err) {
  //           result.key = -2;
  //           result.message = 'System error.';
  //           res.json({result});
  //         } else {
  //           let messageList1 = ArrayHelper.sortByProp(messageList, 'lastTimeActive', 'desc');
  //           result.key = 1;
  //           result.value = 'Success.';
  //           result.data = messageList;
  //           res.json({result});
  //         }
  //       });
  //     }
  //   }
  // });
}

export function testPushNotify(req, res) {
  let options = {
    userId: req.params.userId,
    title: req.body.title,
    body: req.body.body
  };
  pushNotifyToUser(options)
    .then(rs => {
      console.log('push success:', rs);
      return res.json(rs);
    })
    .catch(err => {
      console.log('push fail:', err);
      return res.json(err);
    });
}


export async function searchNotify(options) {
  try{
    // let url = `course/${slug}`;
    // console.log('url : ',url);
    let notify = await NotificationOld.findOne({userID:options.userID}).lean();
    if(notify){
      let notifyList = notify.notifyList;
      return notifyList.findIndex(e => {
        return e.notifyType === options.type && e.userSendID === options.userSendID && e.notifyInfo.coursesId.toString() === options.data.coursesId.toString();
      });
      // console.log('notify : ', notifyList[index])
      // if(index !== -1){
      //   await Notification.update(
      //     {userID:options.userID,"notifyList.notifyID":notifyList[index].notifyID},
      //     {$set:
      //         {
      //           "notifyList.$.notifyInfo.url":url
      //         }
      //     }
      //   )
      // }
      // return index;
    }else{
      return -1;
    }
  }catch(e) {
    console.log("err Search Notify : ",e);
  }
}
