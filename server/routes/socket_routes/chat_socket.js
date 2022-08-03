/**
 * Server socket handle
 */
import serverConfig from '../../config';
import SocketIO from 'socket.io';
import {updateUserStatus} from '../../controllers/user.controller';
import TransactionController from '../../util/transactionController';
import {addMessage} from '../../controllers/message.controller';
import drawSocketListen from './util/drawSocket';
import drawSocketListenForTool from '../../socket/drawUtil/drawSocket';
import {pushVoIPToUser} from "../../libs/VoIP";
import {checkChatGroupOfUsersExists} from "../../controllers/chatGroup.controller";
import globalConstants from '../../../config/globalConstants';
// import SocketStream from 'socket.io-stream';
import User from '../../models/user';
import initAppLoginSocketNamespace from './appLogin';

// import siredis from 'socket.io-redis';

import authByToken from '../../libs/Auth/SocketAuth';

/**
 * Store list user connected
 * {
 *   'userID00': {
 *     sockets: [
 *        0: 'socketID00',
 *        1: 'socketID01',
 *        ...
 *     ],
 *     supportState: READY/BUSY
 *   },
 *   'userID01': {
 *     sockets: [
 *        0: 'socketID02',
 *        1: 'socketID03',
 *        ...
 *     ],
 *     supportState: READY/BUSY
 *   },
 *   ...
 * }
 * @type {{}}
 */
var socketIDs = {};
export function clearSocketStorage() {
  socketIDs = {};
}
// For test
export function getSocketIDs(req, res) {
  res.json(socketIDs);
}
// todo: store callSessions and chatSessions to database
// Store temp info for callSessions
var callSessions = {};
export function removeCallTransactionInstance(instanceId) {
  // If have call transaction, remove it
  if(callSessions[instanceId]) {
    delete callSessions[instanceId];
  }
}
// Store temp info of chatSessions
var chatSessions = {};
export function removeChatTransactionInstance(instanceId) {
  // If have chat transaction, remove it
  if(chatSessions[instanceId]) {
    delete chatSessions[instanceId];
  }
}
/**
 * When user disconnect
 * Store transaction and close connection between users
 * One user only have one transaction in same time
 * @param userID
 */
export function storeDataWhenUserDisconnect(userID) {
  const userChatSessions = getUserTransaction(chatSessions, userID);
  userChatSessions.map(function(chatSession){
    chatSession.storeData();
  });
  const userCallSessions = getUserTransaction(callSessions, userID);
  userCallSessions.map(function(callSession){
    callSession.storeData();
  });
}

function getUserTransaction(transactions, userID) {
  let resultTransactions = [];
  Object.keys(transactions).map(function(objKey) {
    let transaction = transactions[objKey];
    // If the user are in the transaction, push it to result
    if(transaction && transaction.userLearn === userID || transaction.sharers === userID) {
      resultTransactions.push(transaction);
    }
  });

  return resultTransactions;
}

var io = {};
// Store static instance for another file import
export var serverSocketStaticInstance = null;
/**
 * Check the user is online or not
 * @param userIDs
 * @returns {Promise}
 */
export function getUsersOnlineState(userIDs) {
  return new Promise((resolve)=> {
    let results = [];
    userIDs.map((userID)=> {
      // Check user exists on socketIDs list?
      let onlineState = false;
      if (isUserOnline(userID)) {
        onlineState = true;
      }
      results.push({
        userID,
        onlineState
      });
    });
    resolve(results);
  });
}
/**
 * Check have socket connection of userID?
 * @param userID
 * @returns {boolean}
 */
function isUserOnline(userID) {
  return socketIDs[userID] && socketIDs[userID].sockets && socketIDs[userID].sockets.length > 0;
}
export function changeUserSupportState(userID, supportState) {
  if(isUserOnline(userID)) {
    socketIDs[userID].supportState = supportState;
    updateUserStatus(userID, supportState);
    // Emit to all user connected, exclude current user
    if(serverSocketStaticInstance) {
      serverSocketStaticInstance.broadcastUserStatusChange(userID, supportState);
    }
  }
}

export async function isUserSessionReady(userId) {
  try {
    const userCuid = await User.getCuid(User, userId);
    const userSupportState = getUserSupportState(userCuid);
    return ( userSupportState === globalConstants.userState.ONLINE || userSupportState === globalConstants.userState.READY )
  } catch (ex) {
    return false;
  }
}

export function getUserSupportState(userID) {
  if (isUserOnline(userID)) {
    return socketIDs[userID].supportState;
  }
  return globalConstants.userState.OFFLINE;
}

// Begin socket for live stream
// import StreamNamespace from '../../socket/controllers/stream.namespace';
// import ToolActionController from "../../../socket/controllers/actions.controller";
// End socket for live stream

export default class ServerSocketIO {
  constructor(httpServer) {
    io = new SocketIO(httpServer);
    io.of('/stream-tool').on('connection', socket => {
      drawSocketListenForTool(io, socket);
    });
    initAppLoginSocketNamespace(io);
    // io.adapter(siredis({ host: 'localhost', port: 6379 }));
    // Begin try to stream via Kurento
    // let streamNameSpace = new StreamNamespace(io);
    // End try to stream via Kurento
  }

  beginListen() {
    // Using Socket.io Communication
    io.on('connection', (socket) => {
      // Begin demo stream via socket
      // SocketStream(socket).on('stream', (stream, data) => {
      //   this.stream = stream;
      //   stream.on('pipe', (src) => {
      //     console.error('something is piping into the writer');
      //   });
      //
      //   stream.on('readable', () => {
      //     let chunk;
      //     while (null !== (chunk = stream.read())) {
      //       console.log(`Received ${chunk.length} bytes of data., ${chunk}`);
      //     }
      //   });
      //
      //   stream.on('data', function(chunk) {
      //     console.log('data', chunk);
      //   });
      //
      //   stream.on('finish', () => {
      //     console.log('All writes are now complete.');
      //   });
      //
      //   stream.on('unpipe', () => {
      //     console.log('On unpipe.');
      //   });
      //
      //   stream.on('end', () => {
      //     console.log('On end.');
      //   });
      //
      //   stream.on('error', (error) => {
      //     console.log('On error:', error);
      //   });
      //   // End test events
      // });
      //
      // socket.on('view-stream', () => {
      //   if ( this.stream ) {
      //     const stream = this.stream;
      //     // const stream = Object.assign( Object.create( Object.getPrototypeOf(this.stream)), this.stream);
      //     let streamM = SocketStream.createStream();
      //     SocketStream( socket ).emit( 'stream-m', streamM, {dkm: true} );
      //     stream.on('data', (chunk) => console.log('chunk'));
      //     stream.on('end', () => {
      //       console.log('End stream');
      //     });
      //     stream.pipe(streamM);
      //   } else {
      //     console.log('Does not have stream');
      //   }
      // });

      // End demo stream via socket

      // When a message send success
      socket.on('MessageSent', (message) => {
        let userReceive = message.userReceive;
        let userSend = message.userSend;
        let sendToYourSelf = message.sendToYourSelf?true:false;
        delete message.userReceive;
        if(sendToYourSelf) {
          delete message.sendToYourSelf;
        }
        this.emitToUser(userReceive, 'UpdateMessageList', message);
        // Ensure the sender and receiver are difference
        // In case send the call message, the user send and receive are same
        if (userReceive !== userSend) {
          // Send to rest part of user's sockets
          // If you want to send the message to your self too
          if(sendToYourSelf) {
            this.emitToUser(userSend, 'UpdateMessageList', message);
          } else {
            this.emitToUserExclude(userSend, socket.id, 'UpdateMessageList', message);
          }
        }
      });
      socket.on(globalConstants.socketActionTypes.USER_UPDATE_EXPERT_INFO, (expertInfo) => {
        socket.broadcast.emit(
          globalConstants.socketActionTypes.USER_UPDATE_EXPERT_INFO, expertInfo);
      });

      // ************************************************************************************
      /**
       * Request from client
       * When an user want to make video call to another user
       * @users, store user send and user receive
       * {
       *  userSend: 'userID0',
       *  userReceive: 'userID1'
       * }
       */
      socket.on(globalConstants.socketActions.CLIENT.REQUEST, (data) => {
        let userReceive = data.users.userReceive;
        let userSend = data.users.userSend;
        let dataTransfer = Object.assign({}, data);
        switch (data.type) {
          // Chat session block
          case globalConstants.socketActionTypes.REQUEST_BEGIN_CHAT_SESSION:
            // Send to user receive the request begin chat session
            dataTransfer.type = globalConstants.socketActionTypes.REQUEST_BEGIN_CHAT_SESSION;
            this.emitToUser(userReceive, globalConstants.socketActions.SERVER.REQUEST, dataTransfer);
            break;
          case globalConstants.socketActionTypes.REQUEST_CANCEL_CHAT_SESSION:
            // Because userReceive not accept the request, then this user is not have any request
            // So set state to this user is READY
            changeUserSupportState(userSend, globalConstants.userState.READY);
            changeUserSupportState(userReceive, globalConstants.userState.READY);
            // Send to user receive the request cancel chat session when session is not established
            dataTransfer.type = globalConstants.socketActionTypes.REQUEST_CANCEL_CHAT_SESSION;
            this.emitToUser(userReceive, globalConstants.socketActions.SERVER.REQUEST, dataTransfer);
            // Add the session missed message
            addMessage({
              chatGroup: data.chatGroupID,
              type: 'chat',
              userSend: userSend,
              content: {
                type: 'missed',
                isCaller: true
              }
            }).then((messageAdded) => {
              this.emitToUser(userSend, 'UpdateMessageList', messageAdded);
              // Ensure the sender and receiver are difference
              // In case send the call message, the user send and receive are same
              // if (userReceive !== userSend) {
              //   // Send to rest part of user's sockets
              //   this.emitToUserExclude(userReceive, socket.id, 'UpdateMessageList', messageAdded);
              // }
            });
            // Add the session missed message
            addMessage({
              chatGroup: data.chatGroupID,
              type: 'chat',
              userSend: userReceive,
              content: {
                type: 'missed',
                isCaller: false
              }
            }).then((messageAdded) => {
              this.emitToUser(userReceive, 'UpdateMessageList', messageAdded);
              // Ensure the sender and receiver are difference
              // In case send the call message, the user send and receive are same
              // if (userReceive !== userSend) {
              //   // Send to rest part of user's sockets
              //   this.emitToUserExclude(userSend, socket.id, 'UpdateMessageList', messageAdded);
              // }
            });
            break;
          case globalConstants.socketActionTypes.REQUEST_END_CHAT_SESSION:
            // Important: Set end time for this transaction
            if(chatSessions[userSend+userReceive]) {
              // Push the transaction cuid to data transfer
              dataTransfer.transactionCuid = chatSessions[userSend+userReceive].cuid;
              dataTransfer.isExpert = chatSessions[userSend+userReceive].isExpert;
              dataTransfer.callDuration = chatSessions[userSend+userReceive].storeData();
              // Todo: delete transaction when it saved data
              changeUserSupportState(userSend, globalConstants.userState.READY);
              changeUserSupportState(userReceive, globalConstants.userState.READY);
              // Send to user receive/send the request end chat session when the session started
              dataTransfer.type = globalConstants.socketActionTypes.REQUEST_END_CHAT_SESSION;
              this.emitToUser(userSend, globalConstants.socketActions.SERVER.REQUEST, dataTransfer);
              dataTransfer.type = globalConstants.socketActionTypes.REQUEST_WINDOW_END_CHAT_SESSION;
              this.emitToUser(userSend, globalConstants.socketActions.SERVER.REQUEST, dataTransfer);

              dataTransfer.type = globalConstants.socketActionTypes.REQUEST_END_CHAT_SESSION;
              this.emitToUser(userReceive, globalConstants.socketActions.SERVER.REQUEST, dataTransfer);
              dataTransfer.type = globalConstants.socketActionTypes.REQUEST_WINDOW_END_CHAT_SESSION;
              this.emitToUser(userReceive, globalConstants.socketActions.SERVER.REQUEST, dataTransfer);
            } else {
              this.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, {
                type: globalConstants.socketActionTypes.SERVER_TRANSACTION_FAILED,
                users: data.users,
                data: {
                  message: 'Transaction not found!'
                }
              });
              this.emitToUser(userReceive, globalConstants.socketActions.SERVER.RESPONSE, {
                type: globalConstants.socketActionTypes.SERVER_TRANSACTION_FAILED,
                users: data.users,
                data: {
                  message: 'Transaction not found!'
                }
              });
            }
            break;
          // Video call block
          case globalConstants.socketActionTypes.REQUEST_CALL:
            // Because have the request to userReceive, so set state to this user is BUSY
            changeUserSupportState(userSend, globalConstants.userState.BUSY);
            changeUserSupportState(userReceive, globalConstants.userState.BUSY);
            // Send to user receive the call request
            this.emitToUser(userReceive, globalConstants.socketActions.SERVER.REQUEST, {
              type: globalConstants.socketActionTypes.REQUEST_CALL,
              users: data.users
            });
            // Push VoIP notification for user that receive the call
            checkChatGroupOfUsersExists([userReceive, userSend])
              .then(chatGroup => {
                let chatGroupID = chatGroup ? chatGroup.cuid : '';
                pushVoIPToUser({userReceive, userSend, chatGroupID});
              });
            break;
          case globalConstants.socketActionTypes.REQUEST_CALL_CANCEL:
            // Because userReceive not accept the request, then this user is not have any request
            // So set state to this user is READY
            changeUserSupportState(userSend, globalConstants.userState.READY);
            changeUserSupportState(userReceive, globalConstants.userState.READY);
            // Send to user receive the call Cancel request
            this.emitToUser(userReceive, globalConstants.socketActions.SERVER.REQUEST, {
              type: globalConstants.socketActionTypes.REQUEST_CALL_CANCEL,
              users: data.users
            });

            // Push VoIP notification for user that receive the call
            checkChatGroupOfUsersExists([userReceive, userSend])
              .then(chatGroup => {
                let chatGroupID = chatGroup ? chatGroup.cuid : '';
                pushVoIPToUser({userReceive, userSend, chatGroupID, requestCancel: true});
              });

            // Add the session missed message
            addMessage({
              chatGroup: data.chatGroupID,
              type: 'call',
              userSend: userSend,
              content: {
                type: 'missed',
                isCaller: true
              }
            }).then((messageAdded) => {
              this.emitToUser(userSend, 'UpdateMessageList', messageAdded);
              // Ensure the sender and receiver are difference
              // In case send the call message, the user send and receive are same
              // if (userReceive !== userSend) {
              //   // Send to rest part of user's sockets
              //   this.emitToUserExclude(userReceive, socket.id, 'UpdateMessageList', messageAdded);
              // }
            });
            // Add the session missed message
            addMessage({
              chatGroup: data.chatGroupID,
              type: 'call',
              userSend: userReceive,
              content: {
                type: 'missed',
                isCaller: false
              }
            }).then((messageAdded) => {
              this.emitToUser(userReceive, 'UpdateMessageList', messageAdded);
              // Ensure the sender and receiver are difference
              // In case send the call message, the user send and receive are same
              // if (userReceive !== userSend) {
              //   // Send to rest part of user's sockets
              //   this.emitToUserExclude(userSend, socket.id, 'UpdateMessageList', messageAdded);
              // }
            });
            break;
          // When the video of videoCall displayed
          case globalConstants.socketActionTypes.USER_REQUEST_BEGIN_TIMER:
            // This user is connected video
            let userRequest = data.users.userRequest;
            // Add num connection when have user request begin timer
            let transaction = callSessions[userSend+userReceive];
            if(transaction && transaction.connectState) {
              transaction.connectState.connectionCount++;
              // If num connection equal real connection, emit the begin timer request to client
              if(transaction.connectState.connectionCount === transaction.connectState.numConnection) {
                // Set begin time
                let beginTime = Date.now();
                transaction.beginTime = beginTime;
                // Store data of transaction to database
                transaction.initData();
                this.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, {
                  type: globalConstants.socketActionTypes.SERVER_BEGIN_TIMER,
                  users: data.users,
                  data: {
                    beginTime
                  }
                });
                this.emitToUser(userReceive, globalConstants.socketActions.SERVER.RESPONSE, {
                  type: globalConstants.socketActionTypes.SERVER_BEGIN_TIMER,
                  users: data.users,
                  data: {
                    beginTime
                  }
                });
              }
            } else {
              this.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, {
                type: globalConstants.socketActionTypes.SERVER_TRANSACTION_FAILED,
                users: data.users,
                data: {
                  message: 'Transaction connect state not found!'
                }
              });
              this.emitToUser(userReceive, globalConstants.socketActions.SERVER.RESPONSE, {
                type: globalConstants.socketActionTypes.SERVER_TRANSACTION_FAILED,
                users: data.users,
                data: {
                  message: 'Transaction connect state not found!'
                }
              });
            }
            break;
        }
      });

      /**
       * Responses from client
       */
      socket.on(globalConstants.socketActions.CLIENT.RESPONSE, (data) => {
        let userSend = data.users.userSend;
        let userReceive = data.users.userReceive;
        const {users, ...remains} = data;
        switch (data.type) {
          // If the receiver accept the call request
          case globalConstants.socketActionTypes.USER_ACCEPT_CALL:
            // Init transaction data
            // Important: provide enough data
            let transaction = callSessions[userSend+userReceive] = new TransactionController(userSend+userReceive);
            transaction.userLearn = userSend;
            transaction.sharers = userReceive;
            transaction.type = 'call';
            transaction.currency = 'USD';
            transaction.connectState = {
              numConnection: 2,
              connectionCount: 0
            };
            transaction.socketID = socket.id;
            // If the call established, the support state of this user is BUSY
            changeUserSupportState(userSend, globalConstants.userState.BUSY);
            changeUserSupportState(userReceive, globalConstants.userState.BUSY);
            this.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, {
              type: globalConstants.socketActionTypes.USER_ACCEPT_CALL,
              users: users,
              ...remains,
            });
            break;
          // If the userReceive not accept the call, and send back to server
          case globalConstants.socketActionTypes.USER_CANCEL_CALL:
            changeUserSupportState(userSend, globalConstants.userState.READY);
            changeUserSupportState(userReceive, globalConstants.userState.READY);
            this.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, {
              type: globalConstants.socketActionTypes.USER_CANCEL_CALL,
              users: data.users
            });
            // Send to all user receive to close the dialog call coming
            this.emitToUser(userReceive, globalConstants.socketActions.SERVER.RESPONSE, {
              type: globalConstants.socketActionTypes.USER_CANCEL_CALL,
              users: data.users
            });
            break;
          case globalConstants.socketActionTypes.USER_END_CALL:
            // Create new transaction and send message notifications
            // todo: if the call is not established, no need to add transaction
            // Important: Set end time for this transaction
            socket.isUserEndCall = true;
            if(callSessions[userSend+userReceive]) {
              let dataTransfer = Object.assign({}, data);
              dataTransfer.transactionCuid = callSessions[userSend+userReceive].cuid;
              dataTransfer.isExpert = callSessions[userSend+userReceive].isExpert;
              dataTransfer.callDuration = callSessions[userSend+userReceive].storeData();
              // Todo: delete transaction when it saved data
              changeUserSupportState(userSend, globalConstants.userState.READY);
              changeUserSupportState(userReceive, globalConstants.userState.READY);
              // If userSend/userReceive have connected, tell them make the call end
              dataTransfer.type = globalConstants.socketActionTypes.USER_END_CALL;
              this.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, dataTransfer);
              this.emitToUser(userReceive, globalConstants.socketActions.SERVER.RESPONSE, dataTransfer);

              dataTransfer.type = globalConstants.socketActionTypes.USER_WINDOW_END_CALL;
              this.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, dataTransfer);
              this.emitToUser(userReceive, globalConstants.socketActions.SERVER.RESPONSE, dataTransfer);
            } else {
              this.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, {
                type: globalConstants.socketActionTypes.SERVER_TRANSACTION_FAILED,
                users: data.users,
                data: {
                  message: 'Transaction not found!'
                }
              });
              this.emitToUser(userReceive, globalConstants.socketActions.SERVER.RESPONSE, {
                type: globalConstants.socketActionTypes.SERVER_TRANSACTION_FAILED,
                users: data.users,
                data: {
                  message: 'Transaction not found!'
                }
              });
            }
            break;
          // In case have many socket on an user, if this user have the call request
          // And have one of them accept this call
          // emit to a rest of user's sockets that have one socket accept this call
          // And they will close the IncomingCall Dialog
          case globalConstants.socketActionTypes.HAVE_USER_ACCEPT_REQUEST:
            this.emitToUserExclude(userReceive, socket.id, globalConstants.socketActions.SERVER.RESPONSE, {
              type: globalConstants.socketActionTypes.HAVE_USER_ACCEPT_REQUEST,
              users: data.users
            });
            break;

          // Chat session block
          case globalConstants.socketActionTypes.RESPONSE_ACCEPT_CHAT_SESSION:
            // Init transaction data
            // Important: provide enough data
            let chatSession = chatSessions[userSend+userReceive] = new TransactionController(userSend+userReceive);
            chatSession.userLearn = userSend;
            chatSession.sharers = userReceive;
            chatSession.type = 'chat';
            chatSession.currency = 'USD';
            chatSession.socketID = socket.id;
            chatSession.beginTime = Date.now();
            chatSession.initData();
            // If the chat session established, the support state of this user is BUSY
            changeUserSupportState(userSend, globalConstants.userState.BUSY);
            changeUserSupportState(userReceive, globalConstants.userState.BUSY);
            this.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, {
              type: globalConstants.socketActionTypes.RESPONSE_ACCEPT_CHAT_SESSION,
              users: users,
              ...remains
            });
            break;
          case globalConstants.socketActionTypes.RESPONSE_CANCEL_CHAT_SESSION:
            changeUserSupportState(userSend, globalConstants.userState.READY);
            changeUserSupportState(userReceive, globalConstants.userState.READY);
            this.emitToUser(userSend, globalConstants.socketActions.SERVER.RESPONSE, {
              type: globalConstants.socketActionTypes.RESPONSE_CANCEL_CHAT_SESSION,
              users: data.users
            });
            this.emitToUser(userReceive, globalConstants.socketActions.SERVER.RESPONSE, {
              type: globalConstants.socketActionTypes.RESPONSE_CANCEL_CHAT_SESSION,
              users: data.users
            });
            break;
        }
      });

      /**
       * Use for peer connection data chanel
       */
      socket.on('ReconnectPeerRequest', (userInfo) => {
        if(userInfo.userReceive) {
          this.emitToUser(userInfo.userReceive, 'ReconnectPeerRequest', userInfo);
        }
      });
      socket.on('ReconnectPeerResponse', (userInfo) => {
        if(userInfo.userReceive) {
          this.emitToUser(userInfo.userReceive, 'ReconnectPeerResponse', userInfo);
        }
      });
      socket.on('PeerIceCandidate', (data) => {
        if(data.userReceive) {
          this.emitToUser(data.userReceive, 'PeerIceCandidate', data);
        }
      });
      socket.on('PeerSDP', (data) => {
        if(data.userReceive) {
          this.emitToUser(data.userReceive, 'PeerSDP', data);
        }
      });
      /**
       * End
       * Use for peer connection data chanel
       */

      /**
       * Use for share screen
       */
      // When you want to share screen
      socket.on('ShareScreenRequest', data => {
        if ( data.userReceive ) {
          this.emitToUser(data.userReceive, 'ShareScreenRequest', data);
        }
      });
      // When you have the request share your screen and accept it
      socket.on('ShareScreenResponse', data => {
        if ( data.userReceive ) {
          this.emitToUser(data.userReceive, 'ShareScreenResponse', data);
        }
      });
      // When you want to stop the current share screen
      socket.on('StopShareScreenRequest', data => {
        if ( data.userReceive ) {
          this.emitToUser(data.userReceive, 'StopShareScreenRequest', data);
        }
      });
      // When you receive the stop request and accept it
      socket.on('StopShareScreenResponse', data => {
        if ( data.userReceive ) {
          this.emitToUser(data.userReceive, 'StopShareScreenResponse', data);
        }
      });
      /**
       * End
       * Use for share screen
       */

      // Peer data channel
      socket.on('PeerDataChannel', data => {
        if ( data.socketId ) {
          this.emitToSocketId( data.socketId, 'PeerDataChannel', data );
        }
      });

      /**
       * When have new user connect, register it
       * @param userInfo, you can push the info you need to store on socket
       */
      socket.on('NewUserConnect', async (userInfo) => {
        const token = userInfo.a660023adb629b830230;

        // Auth user permission
        let isAuth = await authByToken(token);
        if ( isAuth.result === null ) { // Not auth
          return isAuth;
        }
        const userID = userInfo ? userInfo.id : null;

        if(!userID) {
          // If userId is empty don't register it
          return;
        }
        socket.userID = userID;
        socket.userInfo = userInfo;
        // If the user is offline, update user status and broadcast to all socket connected
        if(!isUserOnline(userID)) {
          // Because if have user connect in the time waiting, this user can not know current user online or not
          // So, Emit to all user connected
          io.emit('UserConnect', userID);
          updateUserStatus(userID, globalConstants.userState.ONLINE);
        }
        // console.log(`Add socket ${socket.id} to user ${userID}`);
        // console.log('<userInfo>');
        // console.log(userInfo);
        // console.log('</userInfo>');
        this.addSocketToUser(userID, socket.id);
        // console.log('--------------------------');
        //console.log('on NewUserConnect', userID);
        //console.log(socketIDs);
        // console.log('--------------------------');
      });

      /**
       * When user disconnect, logout it from users connected list
       */
      socket.on('disconnect', (reason) => {
        // If this socket belong to session page, send the cancel request if the caller close the window
        if(socket.userInfo) {
          let userInfo = socket.userInfo;
          if(userInfo.isSessionPage === true && socket.isUserEndCall !== true ) {
            if(userInfo.isCallSession === true) {
              cancelTheCallSessionRequest(userInfo);
            } else {
              cancelTheChatSessionRequest(userInfo);
            }
          }
        }
        if(reason === 'ping timeout') {
          disconnectInstant();
        } else {
          disconnectWithTimeout();
        }
      });

      socket.on(globalConstants.socketActionTypes.USER_LOGOUT, (data) => {
        disconnectInstant();
      });

      const cancelTheCallSessionRequest = (data) => {
        let dataTransfer = Object.assign({}, data);
        let userSend = data.users.userSend;
        let userReceive = data.users.userReceive;
        // Because userReceive not accept the request, then this user is not have any request
        // So set state to this user is READY
        changeUserSupportState(userSend, globalConstants.userState.READY);
        changeUserSupportState(userReceive, globalConstants.userState.READY);
        // console.log('cancelTheCallSessionRequest');
        // Send to user receive the call Cancel request
        dataTransfer.isDisconnectHandler = true;
        dataTransfer.type = globalConstants.socketActionTypes.REQUEST_CALL_CANCEL;
        this.emitToUser(userSend, globalConstants.socketActions.SERVER.REQUEST, dataTransfer);
        this.emitToUser(userReceive, globalConstants.socketActions.SERVER.REQUEST, dataTransfer);
      };

      const cancelTheChatSessionRequest = (data) => {
        let dataTransfer = Object.assign({}, data);
        let userSend = data.users.userSend;
        let userReceive = data.users.userReceive;
        // Because userReceive not accept the request, then this user is not have any request
        // So set state to this user is READY
        changeUserSupportState(userSend, globalConstants.userState.READY);
        changeUserSupportState(userReceive, globalConstants.userState.READY);
        // console.log('cancelTheChatSessionRequest');
        // Send to user receive the request cancel chat session when session is not established
        dataTransfer.isDisconnectHandler = true;
        dataTransfer.type = globalConstants.socketActionTypes.REQUEST_CANCEL_CHAT_SESSION;
        this.emitToUser(userSend, globalConstants.socketActions.SERVER.REQUEST, dataTransfer);
        this.emitToUser(userReceive, globalConstants.socketActions.SERVER.REQUEST, dataTransfer);
      };
      /**
       * Disconnect with user without timeout
       * The case ex: user still have internet connection and then user close app or logout
       */
      const disconnectInstant = () => {
        // Only set user offline when this user have no any socket connected
        const userID = socket.userID;
        if(!userID) {
          return;
        }
        // Remove this socket from user
        this.removeSocketFormUser(userID, socket.id);
        // Check this user have connection on others devices or not
        // If not have any socket of this user, then set timeout to emit disconnect event
        if (!isUserOnline(userID)) {
          // Remove socket info of user
          this.removeUserSocketInfo(userID);
          // Push this user for all connect to remove this user form these online users list
          // Emit to all user connected, exclude current user
          socket.broadcast.emit('UserDisconnect', userID);
          // Update online status in database
          updateUserStatus(userID, globalConstants.userState.OFFLINE);
        }
        // Store transaction of user if have
        // If the socket is running on session page
        // So when the socket was closed
        // Let store transaction of this session if it is not store before
        if(socket.userInfo && socket.userInfo.isSessionPage) {
          storeDataWhenUserDisconnect(userID);
        }
        // Todo: because user can connect on multiple devices
        // Bug: In case the devices connect to difference network, check carefully
        // This case is not usually
        // console.log('disconnect Instance socketIDs');
        // console.log(socketIDs);
        // console.log('--------------------------');
      };

      /**
       * Remove this socket of user
       * The main case fire when user lost internet connection
       */
      const disconnectWithTimeout = () => {
        // Only set user offline when this user have no any socket connected
        const userID = socket.userID;
        if(!userID) {
          return;
        }
        // Remove this socket from user
        this.removeSocketFormUser(userID, socket.id);
        // Check this user have connection on others devices or not
        // If not have any socket of this user, then set timeout to emit disconnect event
        if (!isUserOnline(userID)) {
          // Waiting for user reconnect, if not mean this user disconnected
          setTimeout(() => {
            // If the user still disconnect (have no user reconnect)
            if(this.getDisconnectState(userID)) {
              // Remove socket info of user
              this.removeUserSocketInfo(userID);
              // Push this user for all connect to remove this user form these online users list
              // Emit to all user connected, exclude current user
              socket.broadcast.emit('UserDisconnect', userID);
              // Update online status in database
              updateUserStatus(userID, globalConstants.userState.OFFLINE);
            }
          }, serverConfig.socketSessionTimeout);
        }
        // Store transaction of user if have
        // If the socket is running on session page
        // So when the socket was closed
        // Let store transaction of this session if it is not store before
        if(socket.userInfo && socket.userInfo.isSessionPage) {
          storeDataWhenUserDisconnect(userID);
        }
        // Todo: because user can connect on multiple devices
        // Bug: In case the devices connect to difference network, check carefully
        // console.log('disconnect with timeout socketIDs');
        // console.log(socketIDs);
        // console.log('--------------------------');
      };

      drawSocketListen(io, socket);
      // new ToolActionController(socket);
    });
    serverSocketStaticInstance = this;
  }

  /**
   * Emit data socketId
   * @param socketId
   * @param action
   * @param data
   */
  emitToSocketId(socketId, action, data) {
    io.to(socketId).emit(action, data);
  }

  /**
   * Emit data to all sockets of userID
   * @param userID
   * @param action
   * @param data
   */
  emitToUser(userID, action, data) {
    if (isUserOnline(userID)) {
      socketIDs[userID].sockets.map((socketID)=> {
        io.to(socketID).emit(action, data);
      });
    }
  }

  /**
   * Emit data to all sockets of userID, exclude current socketID
   * @param userID
   * @param socketID, the socket will exclude
   * @param action
   * @param data
   */
  emitToUserExclude(userID, socketID, action, data) {
    if (isUserOnline(userID)) {
      socketIDs[userID].sockets.map((socketIDItem)=> {
        if (socketIDItem !== socketID) {
          io.to(socketIDItem).emit(action, data);
        }
      });
    }
  }

  /**
   * Get disconnect status of user
   * @param userID
   * @returns boolean
   */
  getDisconnectState(userID) {
    if(socketIDs[userID]) {
      return socketIDs[userID].disconnected;
    }
    return false;
  }

  /**
   * Add more socketID to User
   * @param userID
   * @param socketID
   */
  addSocketToUser(userID, socketID) {
    if (isUserOnline(userID)) {
      // Add new one
      let userSocket = socketIDs[userID];
      userSocket.sockets.push(socketID);
      userSocket.disconnected = false;
    } else {
      // Init new one
      socketIDs[userID] = {
        sockets: [socketID],
        // Because user just connect, so it is not have any connection
        supportState: globalConstants.userState.READY,
        disconnected: false
      };
    }
  }

  /**
   * Remove socketID of userID
   * @param userID
   * @param socketID
   */
  removeSocketFormUser(userID, socketID) {
    // console.log(`Remove socket: ${socketID} from user: ${userID}`);
    // If have connections
    if (isUserOnline(userID)) {
      let userSocket = socketIDs[userID];
      userSocket.sockets.map(function (socket, index) {
        // If the socket is correct socket want to remove
        if(socket === socketID) {
          userSocket.sockets.splice(index, 1);
          // If have no socket in list, disconnected is true
          if (userSocket.sockets.length < 1) {
            userSocket.disconnected = true;
            userSocket.supportState = globalConstants.userState.OFFLINE;
          }
          return false;
        }
      });
    }
  }

  /**
   * Remove user socket info from socket list when user disconnect
   * @param userID
   */
  removeUserSocketInfo(userID) {
    // If have user socket info in list, remove this item
    if (socketIDs[userID]) {
      delete socketIDs[userID];
    }
  }

  /**
   * Emit file uploaded and request client refresh their message
   * @param userID
   * @param message
   */
  emitFileUploaded(userID, message) {
    this.emitToUser(userID, globalConstants.socketActions.SERVER.RESPONSE, {
      type: globalConstants.socketActionTypes.FILE_UPLOADED
    });
    this.emitToUser(userID, 'UpdateMessageList', message);
  }

  /**
   * Remove static instance of SocketObject
   */
  removeStaticInstance() {
    serverSocketStaticInstance = null;
  }

  /**
   * Broadcast that user status change to all user
   * @param userID
   * @param status
   */
  broadcastUserStatusChange(userID, status) {
    // Emit to all user connected, exclude current user
    io.emit(globalConstants.socketActionTypes.USER_STATUS_CHANGE, {userID, status});
  }
}
