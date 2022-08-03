/**
 * Author: nhan
 * Created: Feb 1 2018
 * Content on live stream instance, include: streamer, viewer and they activities ( comment, give gifts,... )
 */

import kurento from 'kurento-client';
import config from '../../config';
import AMPQ from '../../../rabbitmq/ampq';
import globalConstants from '../../../config/globalConstants';
// import { stopStream, getStreamPrivacy } from '../../controllers/liveStream.controller';
import {stopStream} from "../../services/liveStream.services";
import {streamNameSpaceInstance} from "../controllers/stream.namespace";
import User from '../../models/user';
import {getUserSupportState} from '../../routes/socket_routes/chat_socket';
import {removeOfficeFile} from '../../controllers/upload.controller';
import {isUserReadyForNewConnection} from '../../controllers/ant.controller';
import { destroyProjectData } from '../drawUtil/drawSocket';
import logger from '../../util/log';

const noPresenterMessage = 'No active presenter. Try again later...';
const noPipelineMessage = 'No active pipe presenter. Try again later...';
const maxVideoSendBandwidth = 1500;
const minVideoSendBandwidth = 300;

const maxVideoRecvBandwidth = 1500;
const minVideoRecvBandwidth = 300;

export const userConnectionStates = {
  offline: 'offline',
  online: 'online',
  connected: 'connected',
  handUp: 'handUp'
};

export default class StreamRoom {
  /**
   * Begin of everything
   * @param nsp stream namespace instance
   * @param socket your socket
   * @param roomId your room
   * @param ops ship your options
   */
  constructor(nsp, socket, roomId, ops) {
    this.nsp = nsp;
    this.roomId = roomId;

    this.presenter = null;
    this.candidatesQueue = {};
    this.kurentoClient = null;
    this.viewers = [];
    this.currentViewers = {}; // User info of current viewers watching stream

    this.totalViewed = 0;

    this.numViewerMagicCurrently = 0;
    this.numViewerMagic = 0;

    this.idCounter = 0;

    this.streamPrivacy = 'private';

    this.addPresenter(socket);
    // getStreamPrivacy(roomId).then( privacy => {
    //   if ( privacy && privacy.privacy && privacy.privacy.to ) {
    //     this.streamPrivacy = privacy.privacy.to
    //   }
    // });
  }

  nextUniqueId() {
    this.idCounter = this.idCounter + 1;
    return this.idCounter.toString();
  }

  clearCandidatesQueue(sessionId) {
    let candidatesQueue = this.candidatesQueue;
    if (candidatesQueue[sessionId]) {
      delete candidatesQueue[sessionId];
    }
  }

  // Recover kurentoClient for the first time.
  getKurentoClient(callback) {
    let kurentoClient = this.kurentoClient;
    if (kurentoClient !== null) {
      return callback(null, kurentoClient);
    }

    kurento(config.stream.ws_uri, function(error, _kurentoClient) {
      if (error) {
        logger.logX('Could not find media server at address ' + config.stream.ws_uri);
        return callback('Could not find media server at address' + config.stream.ws_uri
          + '. Exiting with error ' + error);
      }

      kurentoClient = _kurentoClient;
      callback(null, kurentoClient);
    });
  }

  /**
   *
   * @param socket
   */
  addPresenter(socket) {
    this.listenSocket(socket);
    this.presenterId = socket.userId;
    this.presenterSocketId = socket.id;
    socket.isPresenter = true;
  }

  addViewer(socket) {
    this.listenSocket(socket);
    socket.isViewer = true;
    // this.totalViewed++;
  }

  registry(socket) {
    if ( ! socket.userId ) {
      // logger.logX('socket userId not found!');
      return false;
    }
    // if ( this.currentViewers[socket.userId] ) {
      // logger.logX('Viewer info already existed!', socket.userId);
      // return false;
    // }
    // logger.logX('registry');
    this.listenLiveStreamAction(socket);
    this.emitMagicCurrentView(socket);
  }

  sendMessageToYourSelf(socket, data) {
    let roomId = this.roomId;
    if ( roomId && socket.rooms[ roomId ] ) {
      // Only send When socket is in room
      socket.emit('message', data);
    } else {
      logger.logX('Socket is not in room', roomId);
    }
  }

  /**
   * Emit some event with data to room
   * @param socket sender's socket
   * @param event
   * @param data
   * @param ops ship your options, this data is not use to send
   */
  broadcastToRoom(socket, event, data, ops) {
    let roomId = this.roomId;
    if ( roomId ) {
      // If room created, send message to all user of room
      // Base on emit cheatsheet: https://socket.io/docs/emit-cheatsheet/
      if ( ops && ops.includeSender ) {
        // sending to all clients in roomId room, including sender
        this.nsp.in(roomId).emit(event, data);
      } else {
        // sending to all clients in roomId room except sender
        // logger.logX('sending to all clients in roomId room except sender');
        if ( socket ) {
          socket.to(roomId).emit(event, data);
        } else {
          logger.logX('You must set your socket');
        }
      }
    } else {
      logger.logX('Room is not defined');
    }
  }

  /**
   * Emit with action 'liveStreamAction' to all users on room
   * @param socket
   * @param event
   * @param data
   */
  sendLiveStreamActionToRoom(socket, event, data) {
    this.broadcastToRoom(null, 'liveStreamAction', {
      socketId: socket.id,
      type: event,
      data: data
    }, {includeSender: true});
  }

  sendMessage(socketId, action, data) {
    // Send message to identity user
    this.nsp.to(socketId).emit(action, data);
  }

  listenSocket(socket) {
    let sessionId = this.nextUniqueId();
    // logger.logX('sessionId', sessionId);
    // And listen socket event
    socket.on('error', () => {
      logger.logX('Connection ' + sessionId + ' error');
      this.stop(sessionId);
    });

    socket.on('disconnect', (reason) => {
      logger.logX('Connection ' + sessionId + ' closed');
      this.stop(sessionId);
    });

    socket.on('message', (message) => {
      // logger.logX('Connection ' + sessionId + ' received message ', message);
      // logger.logX('Connection ' + sessionId + ' received message');

      switch (message.id) {
        case 'presenter':
          this.startPresenter(sessionId, socket, message.sdpOffer, (error, sdpAnswer) => {
            if (error) {
              this.sendMessageToYourSelf(socket, {
                id : 'presenterResponse',
                response : 'rejected',
                message : error
              });
              return;
            }
            this.sendMessageToYourSelf(socket, {
              id : 'presenterResponse',
              response : 'accepted',
              sdpAnswer : sdpAnswer
            });
          });
          break;

        case 'viewer':
          this.startViewer(sessionId, socket, message.sdpOffer, (error, sdpAnswer) => {
            if (error) {
              this.sendMessageToYourSelf(socket, {
                id : 'viewerResponse',
                response : 'rejected',
                message : error
              });
              return;
            }

            this.sendMessageToYourSelf(socket, {
              id : 'viewerResponse',
              response : 'accepted',
              sdpAnswer : sdpAnswer
            });
          });
          break;

        case 'stop':
          this.stop(sessionId);
          break;

        case 'onIceCandidate':
          this.onIceCandidate(sessionId, message.candidate);
          break;

        default:
          this.sendMessageToYourSelf(socket, {
            id : 'error',
            message : 'Invalid message ' + message
          });
          break;
      }
    });

    this.listenLiveStreamAction(socket);
  }

  /**
   * Check user is ready for establish new invite connection
   * @param userCuid
   * @param userId
   * @returns {boolean}
   */
  async isUserReady(userCuid, userId) {
    let userSupportStatus = getUserSupportState(userCuid);
    let isUserReady = await isUserReadyForNewConnection(userId);
    logger.logX('socket.userCuid', userCuid);
    logger.logX('socket.userId', userId);
    logger.logX('userSupportStatus:', userSupportStatus, 'isUserReady:', isUserReady);
    return (
      ( userSupportStatus === globalConstants.userState.ONLINE || userSupportStatus === globalConstants.userState.READY )
      && isUserReady === true
    )
  }

  listenLiveStreamAction(socket) {
    if ( ! socket.userId || ( socket.userId === socket.prevUserId )) {
      // Only listen events when have userId
      // logger.logX('Only listen events when have userId and not listened before');
      return false;
    }
    socket.prevUserId = socket.userId;
    socket.on('liveStreamAction', async message => {
      logger.logX('liveStreamAction', message);
      switch (message.type) {
        // Presenter emit to Viewer
        case 'presenter.inviteStreamer':
          let userReceiveId = message.userReceive;
          let userReceiveCuid = message.inviteInfo.users.userReceive;
          // Check user receive status is ready for connect
          logger.logX('listenLiveStreamAction', message.type, userReceiveCuid, userReceiveId);
          if ( await this.isUserReady(userReceiveCuid, userReceiveId) ) {
            this.putHandUp(message.userReceive);
            this.sendLiveStreamActionToRoom(socket, 'presenter.inviteStreamer', {
              userId: message.userReceive,
              inviteInfo: message.inviteInfo
            });
          } else {
            this.sendMessageToYourSelf(socket, {
              id: 'reject',
              message: 'This user is on a session or have stream invite now, please try again later!'
            });
          }
          break;
        case 'presenter.cancelInvite':
          this.putHandDown(message.userReceive);
          this.sendLiveStreamActionToRoom(socket, 'presenter.cancelInvite', {userId: message.userReceive});
          break;
        case 'presenter.stopStreamer':
          this.putHandDown(message.userReceive);
          this.sendLiveStreamActionToRoom(socket, 'presenter.stopStreamer', {userId: message.userReceive});
          break;
        case 'presenter.acceptStreamer':
          this.inviteConnected(message.userReceive);
          this.sendLiveStreamActionToRoom(socket, 'presenter.acceptStreamer', {
            userId: message.userReceive,
            inviteInfo: message.inviteInfo
          });
          break;

        // Viewer emit to Presenter
        case 'viewer.acceptInvite':
          this.inviteConnected(socket.userId);
          this.sendLiveStreamActionToRoom(socket, 'viewer.acceptInvite', {presenterId: this.presenterId, userId: socket.userId});
          break;
        case 'viewer.declineInvite':
          this.putHandDown(socket.userId);
          this.sendLiveStreamActionToRoom(socket, 'viewer.declineInvite', {presenterId: this.presenterId, userId: socket.userId});
          break;
        case 'viewer.closeStream':
          this.putHandDown(socket.userId);
          this.sendLiveStreamActionToRoom(socket, 'viewer.closeStream', {presenterId: this.presenterId, userId: socket.userId});
          break;
        case 'viewer.handUp':
          logger.logX('listenLiveStreamAction', message.type, socket.userCuid, socket.userId);
          if ( await this.isUserReady(socket.userCuid, socket.userId) ) {
            this.putHandUp(socket.userId);
            this.sendLiveStreamActionToRoom(socket, 'viewer.handUp', {presenterId: this.presenterId, userId: socket.userId});
          } else {
            this.sendMessageToYourSelf(socket, {
              id: 'reject',
              message: 'You already have a session or stream invite, please cancel them to continue!'
            });
          }
          break;
        case 'viewer.stopHandUp':
          this.putHandDown(socket.userId);
          this.sendLiveStreamActionToRoom(socket, 'viewer.stopHandUp', {presenterId: this.presenterId, userId: socket.userId});
          break;
        default:
          this.sendMessageToYourSelf(socket, {
            id : 'error',
            message : 'Invalid message ' + message
          });
          break;
      }
    });
  }

  /**
   * Check user with the socket is presenter or not
   * @param socket
   * @returns {boolean}
   */
  isPresenter(socket) {
    return socket.isPresenter;
  }

  putHandUp(userId) {
    if ( ! userId ) {
      return false;
    }
    logger.logX('putHandUp', userId);
    // Update data for viewer user info and emit to client
    if ( this.currentViewers[userId] ) {
      this.currentViewers[userId].status = userConnectionStates.handUp;
    } else {
      logger.logX('PutHandUp: User not found', userId);
    }
  }

  putHandDown(userId) {
    if ( ! userId ) {
      return false;
    }
    if ( this.currentViewers[userId] ) {
      this.currentViewers[userId].status = userConnectionStates.online;
    } else {
      logger.logX('PutHandDown: User not found', userId);
    }
  }

  userOffline(userId) {
    if ( ! userId ) {
      return false;
    }
    if ( this.currentViewers[userId] ) {
      this.currentViewers[userId].status = userConnectionStates.offline;
    } else {
      logger.logX('UserOffline: User not found', userId);
    }
  }

  inviteConnected(userId) {
    if ( ! userId ) {
      return false;
    }
    if ( this.currentViewers[userId] ) {
      this.currentViewers[userId].status = userConnectionStates.connected;
    } else {
      logger.logX('InviteConnected: User not found', userId);
    }
  }

  /**
   * Get the invite connection state of this user
   * @param userId
   * @returns {string}
   */
  getRoomViewerStatus(userId) {
    if ( this.currentViewers[userId] ) {
      logger.logX('getRoomViewerStatus', this.currentViewers[userId].status);
      return this.currentViewers[userId].status;
    }
    logger.logX('getRoomViewerStatus have no user info');
    return userConnectionStates.offline;
  }

  startPresenter(sessionId, socket, sdpOffer, callback) {
    this.clearCandidatesQueue(sessionId);

    let presenter = this.presenter;

    if (presenter !== null) {
      this.stop(sessionId);
      return callback("Another user is currently acting as presenter in this room. Try again later ...");
    }

    this.presenter = presenter = {
      id : sessionId,
      pipeline : null,
      webRtcEndpoint : null,
      socket: socket
    };

    this.getKurentoClient((error, kurentoClient) => {
      if (error) {
        this.stop(sessionId);
        return callback(error);
      }

      if (presenter === null) {
        this.stop(sessionId);
        return callback(noPresenterMessage);
      }

      kurentoClient.create('MediaPipeline', (error, pipeline) => {
        if (error) {
          this.stop(sessionId);
          return callback(error);
        }

        if (presenter === null) {
          this.stop(sessionId);
          return callback(noPresenterMessage);
        }

        presenter.pipeline = pipeline;
        pipeline.create('WebRtcEndpoint', (error, webRtcEndpoint) => {
          if (error) {
            this.stop(sessionId);
            return callback(error);
          }

          webRtcEndpoint.setMaxVideoRecvBandwidth(maxVideoRecvBandwidth);
          webRtcEndpoint.setMinVideoRecvBandwidth(minVideoRecvBandwidth);

          if (presenter === null) {
            this.stop(sessionId);
            return callback(noPresenterMessage);
          }

          presenter.webRtcEndpoint = webRtcEndpoint;

          let candidatesQueue = this.candidatesQueue;

          if (candidatesQueue[sessionId]) {
            while(candidatesQueue[sessionId].length) {
              let candidate = candidatesQueue[sessionId].shift();
              webRtcEndpoint.addIceCandidate(candidate);
            }
          }

          webRtcEndpoint.on('OnIceCandidate', (event) => {
            let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            this.sendMessageToYourSelf( socket, {
              id : 'iceCandidate',
              candidate : candidate
            });
          });

          webRtcEndpoint.processOffer(sdpOffer, (error, sdpAnswer) => {
            if (error) {
              this.stop(sessionId);
              return callback(error);
            }

            if (presenter === null) {
              this.stop(sessionId);
              return callback(noPresenterMessage);
            }

            callback(null, sdpAnswer);
          });

          webRtcEndpoint.gatherCandidates( error => {
            if (error) {
              this.stop(sessionId);
              return callback(error);
            }
          });
        });
      });
    });
  }

  startViewer(sessionId, socket, sdpOffer, callback) {
    this.clearCandidatesQueue(sessionId);

    let presenter = this.presenter;

    if (presenter === null) {
      this.stop(sessionId);
      return callback(noPresenterMessage);
    }
    if (presenter.pipeline === null) {
      this.stop(sessionId);
      return callback(noPipelineMessage);
    }

    presenter.pipeline.create('WebRtcEndpoint', (error, webRtcEndpoint) => {
      if (error) {
        this.stop(sessionId);
        return callback(error);
      }

      webRtcEndpoint.setMaxVideoSendBandwidth(maxVideoSendBandwidth);
      webRtcEndpoint.setMinVideoSendBandwidth(minVideoSendBandwidth);

      this.viewers[sessionId] = {
        "webRtcEndpoint" : webRtcEndpoint,
        "socket" : socket // mapping socket
      };

      if (presenter === null) {
        this.stop(sessionId);
        return callback(noPresenterMessage);
      }

      let candidatesQueue = this.candidatesQueue;
      if (candidatesQueue[sessionId]) {
        while(candidatesQueue[sessionId].length) {
          let candidate = candidatesQueue[sessionId].shift();
          webRtcEndpoint.addIceCandidate(candidate);
        }
      }

      webRtcEndpoint.on('OnIceCandidate', (event) => {
        let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
        this.sendMessageToYourSelf( socket, {
          id : 'iceCandidate',
          candidate : candidate
        });
      });

      webRtcEndpoint.processOffer(sdpOffer, (error, sdpAnswer) => {
        if (error) {
          this.stop(sessionId);
          return callback(error);
        }
        if (presenter === null) {
          this.stop(sessionId);
          return callback(noPresenterMessage);
        }

        presenter.webRtcEndpoint.connect(webRtcEndpoint, (error) => {
          if (error) {
            this.stop(sessionId);
            return callback(error);
          }
          if (presenter === null) {
            this.stop(sessionId);
            return callback(noPresenterMessage);
          }

          callback(null, sdpAnswer);
          webRtcEndpoint.gatherCandidates( error => {
            if (error) {
              this.stop(sessionId);
              return callback(error);
            }
          });
        });
      });
    });

    this.emitMagicCurrentView(socket);
  }

  /**
   * Emit current viewer
   * @param socket
   * @param withoutMagic if want to magic increase/decrease set it false, else set it true
   */
  emitMagicCurrentView(socket, withoutMagic = false) {
    // If everything is ok, broadcast have new viewer
    this._getRealNumViewer().then( async realNumViewer => {
      // logger.logX('realNumViewer', realNumViewer);
      // Clear prev interval
      this._clearTimeWaiting();
      // If the num view is zero, is will be zero
      this.numViewerMagic = this._calcMagicNumView(realNumViewer);
      // logger.logX('this.numViewerMagic', this.numViewerMagic);
      let prevNumViewer = this.numViewerMagicCurrently || 0;
      // logger.logX('prevNumViewer', prevNumViewer);

      let deltaNumViewer = this.numViewerMagic - prevNumViewer;
      // logger.logX('deltaNumViewer', deltaNumViewer);

      if ( withoutMagic ) {
        logger.logX('Current view withoutMagic');
        this.numViewerMagicCurrently = this.numViewerMagic;
        await this.emitCurrentView(socket);
        return false;
      }

      // logger.logX('Continue with magic');
      // Begin Emit first view without waiting
      if ( deltaNumViewer > 0 ) {
        ++this.numViewerMagicCurrently;
        ++this.totalViewed;
      } else if ( deltaNumViewer < 0 ) {
        --this.numViewerMagicCurrently;
      }
      await this.emitCurrentView(socket);
      if ( this.numViewerMagicCurrently === this.numViewerMagic || this.numViewerMagicCurrently === 0 ) {
        this._clearTimeWaiting();
        // logger.logX('Enough num viewer', this.numViewerMagicCurrently);
        return false;
      }
      // End Emit first view without waiting
      // logger.logX('Begin waiting time');
      this.viewerInterval = setInterval( () => {
        this.viewerTimeout = setTimeout( async () => {
          if ( deltaNumViewer > 0 ) {
            ++this.numViewerMagicCurrently;
            ++this.totalViewed;
          } else if ( deltaNumViewer < 0 ) {
            --this.numViewerMagicCurrently;
          }

          await this.emitCurrentView(socket);

          if ( this.numViewerMagicCurrently === this.numViewerMagic || this.numViewerMagicCurrently === 0 ) {
            this._clearTimeWaiting();
          }
        }, Math.floor(Math.random() * 10000));
      }, 10000 );
    });
  }

  _clearTimeWaiting() {
    // logger.logX('_clearTimeWaiting: this.viewerInterval');
    // Clear current interval
    clearInterval(this.viewerInterval);
    // Clear current timeout
    clearTimeout(this.viewerTimeout);
  }

  /**
   * Get magic view by privacy
   * @param realNumView
   * @returns {*}
   * @private
   */
  _calcMagicNumView(realNumView) {
    logger.logX('_calcMagicNumView', realNumView, this.streamPrivacy);
    if ( this.streamPrivacy === 'public' ) {
      return realNumView === 0 ? 0 : ( realNumView * 10 ) + Math.floor( Math.random() * 10 );
    } else {
      return realNumView;
    }
  }

  async emitCurrentView(socket) {
    let userId = socket.userId;
    logger.logX('emitCurrentView', userId, this.roomId);
    if ( userId ) {
      logger.logX('emitCurrentView case ONE', this.numViewerMagicCurrently, this.totalViewed);
      let viewerUserInfo;
      if ( this.currentViewers[userId] ) {
        viewerUserInfo = this.currentViewers[userId];
      } else {
        viewerUserInfo = await User.formatBasicInfoById(User, userId);
        this.currentViewers[userId] = viewerUserInfo;
      }

      // logger.logX('BEFORE viewerUserInfo.status', viewerUserInfo.status);

      if ( ! viewerUserInfo.status || viewerUserInfo.status === userConnectionStates.offline ) {
        viewerUserInfo.status = userConnectionStates.online;
        AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {
          type: 'currentView',
          obj: {
            numViewer: this.numViewerMagicCurrently,
            totalViewed: this.totalViewed,
            liveStream: this.roomId,
            user: {
              userId: socket.userId,
              status: userConnectionStates.online
            },
            userInfo: viewerUserInfo
          }
        });
        // logger.logX('Case 00 with status:', viewerUserInfo.status);
      } else {
        AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {
          type: 'currentView',
          obj: {
            numViewer: this.numViewerMagicCurrently,
            totalViewed: this.totalViewed,
            liveStream: this.roomId
          }
        });
        // logger.logX('Case 22 with status:', viewerUserInfo.status);
      }
    } else {
      // logger.logX('emitCurrentView case TWO', this.numViewerMagicCurrently, this.totalViewed);
      AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {
        type: 'currentView',
        obj: {
          numViewer: this.numViewerMagicCurrently,
          totalViewed: this.totalViewed,
          liveStream: this.roomId
        }
      });
    }
  }

  onIceCandidate(sessionId, _candidate) {
    let candidate = kurento.getComplexType('IceCandidate')(_candidate);
    let presenter = this.presenter;
    let viewers = this.viewers;
    let candidatesQueue = this.candidatesQueue;

    if (presenter && presenter.id === sessionId && presenter.webRtcEndpoint) {
      // console.info('Sending presenter candidate');
      presenter.webRtcEndpoint.addIceCandidate(candidate);
    } else if (viewers[sessionId] && viewers[sessionId].webRtcEndpoint) {
      // console.info('Sending viewer candidate');
      viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
    } else {
      // console.info('Queueing candidate');
      if (!candidatesQueue[sessionId]) {
        candidatesQueue[sessionId] = [];
      }
      candidatesQueue[sessionId].push(candidate);
    }
  }

  async stop(sessionId) {
    let presenter = this.presenter;
    let kurentoClient = this.kurentoClient;
    let viewers = this.viewers;

    if (presenter !== null && presenter.id === sessionId) {
      for (let i in viewers) {
        let viewer = viewers[i];
        if (viewer.socket) {
          viewer.socket.emit('message', {
            id : 'stopCommunication'
          });
          viewer.socket.leave(this.roomId);
        }
      }

      if ( presenter.socket ) {
        presenter.socket.leave(this.roomId);
      }

      if ( presenter.pipeline ) {
        presenter.pipeline.release();
      }
      presenter = null;
      viewers = [];
      // Update to database
      // Presenter stop live stream
      try {
        await stopStream( this.roomId, this.totalViewed );

        // Remove room from list rooms
        streamNameSpaceInstance.destroyRoom( this.roomId );
      } catch (err) {
        logger.logX('err');
        logger.logX(err);
      }
    } else if (viewers[sessionId]) {
      let viewerSocket = viewers[sessionId].socket;
      // Leave room
      viewerSocket.leave(this.roomId);
      viewerSocket.stopViewStream = true;
      if ( viewers[sessionId].webRtcEndpoint ) {
        viewers[sessionId].webRtcEndpoint.release();
      }
      delete this.viewers[sessionId];
      if ( viewerSocket.userId ) {
        delete this.currentViewers[viewerSocket.userId];
      }

      this.viewerOffline(viewerSocket);
    }

    this.clearCandidatesQueue(sessionId);

    if (viewers.filter(value => !!value).length < 1 // Count the item have value
      && !presenter && kurentoClient) {
      kurentoClient.close();
      kurentoClient = null;
    }
  }

  viewerOffline(socket = {}) {
    let userConnectionState = userConnectionStates.offline;
    let userId = socket.userId;

    if ( userId ) {
      /**
       this.viewers[sessionId] = {
        "webRtcEndpoint" : webRtcEndpoint,
        "socket" : socket // mapping socket
      };
      */
      let viewers = this.viewers.filter(viewer => viewer.socket && viewer.socket.userId === userId);
      if ( viewers.length > 0 ) {
        userConnectionState = userConnectionStates.online;
      }
    }

    if ( userConnectionState === userConnectionStates.offline ) {
      this.userOffline(socket.userId);
    }

    this._getRealNumViewer().then( realNumViewer => {
      let viewInfo = {
        numViewer: realNumViewer,
        totalViewed: this.totalViewed,
        liveStream: this.roomId
      };
      // If user still online on other devices/browser tabs, just update the num view without change user status
      if ( userConnectionState === userConnectionStates.offline ) {
        viewInfo.user = {
          userId: socket.userId || null,
          status: userConnectionState
        }
      }

      logger.logX('viewerOffline: realNumViewer', realNumViewer);

      // When user offline, we sure that the realNumViewer must be changes
      this._clearTimeWaiting();
      // If the num view is zero, is will be zero
      this.numViewerMagic = this._calcMagicNumView(realNumViewer);
      logger.logX('viewerOffline: this.numViewerMagic', this.numViewerMagic);
      let prevNumViewer = this.numViewerMagicCurrently || 0;
      logger.logX('viewerOffline: prevNumViewer', prevNumViewer);

      let deltaNumViewer = this.numViewerMagic - prevNumViewer;
      logger.logX('viewerOffline: deltaNumViewer', deltaNumViewer);

      if ( this.streamPrivacy !== 'public' ) {
        logger.logX('Current view withoutMagic');
        this.numViewerMagicCurrently = this.numViewerMagic;

        AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {
          type: 'currentView',
          obj: viewInfo
        });

        return false;
      }

      // Begin Emit user offline instance
      if ( deltaNumViewer > 0 ) {
        ++this.numViewerMagicCurrently;
        ++this.totalViewed;
      } else if ( deltaNumViewer < 0 ) {
        --this.numViewerMagicCurrently;
      }
      viewInfo.numViewer = this.numViewerMagicCurrently;
      viewInfo.totalViewed = this.totalViewed;

      AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {
        type: 'currentView',
        obj: viewInfo
      });

      if ( this.numViewerMagicCurrently === this.numViewerMagic || this.numViewerMagicCurrently === 0 ) {
        this._clearTimeWaiting();
        return false;
      }
      // End Emit user offline instance

      logger.logX('Offline with waiting time');
      this.viewerInterval = setInterval( () => {
        this.viewerTimeout = setTimeout( () => {
          if ( deltaNumViewer > 0 ) {
            ++this.numViewerMagicCurrently;
            ++this.totalViewed;
          } else if ( deltaNumViewer < 0 ) {
            --this.numViewerMagicCurrently;
          }
          viewInfo.numViewer = this.numViewerMagicCurrently;
          viewInfo.totalViewed = this.totalViewed;

          AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {
            type: 'currentView',
            obj: viewInfo
          });

          if ( this.numViewerMagicCurrently === this.numViewerMagic || this.numViewerMagicCurrently === 0 ) {
            this._clearTimeWaiting();
          }
        }, Math.floor(Math.random() * 10000));
      }, 10000 );
    });
  }

  _getRealNumViewer() {
    return new Promise( (resolve) => {
      try {
        this.nsp.in(this.roomId).clients( (err, clients) => {
          if ( err ) {
            logger.logX('err:', err);
            return resolve(0);
          } else {
            let numViewer = clients.length - 1;
            numViewer = numViewer < 0 ? 0 : numViewer; // Minimum num viewer is 0
            return resolve( numViewer );
          }
        });
      } catch (err) {
        logger.logX('err', err);
        return resolve(0);
      }
    })
  }

  /**
   * Return current viewer of this stream
   */
  getNumViewer() {
    return this.numViewerMagicCurrently;
  }

  /**
   * Total viewer all of time
   * @returns {number}
   */
  getTotalViewed() {
    return this.totalViewed;
  }

  /**
   * Get current viewers watching this stream
   * @returns {*}
   */
  getCurrentViewers() {
    return this.currentViewers;
  }

  /**
   * Update privacy to change num magic view
   * @param privacy
   */
  setStreamPrivacy(privacy) {
    // this.streamPrivacy = privacy;
    // logger.logX('setStreamPrivacy', privacy);
    // if ( privacy === 'public' ) {
    //   this.emitMagicCurrentView({});
    // } else {
    //   this.emitMagicCurrentView({}, true);
    // }
  }

  /**
   * Map data for users in invited list
   * @param userIds the array users invited
   * @param justGetInList if true, just get user info in list received
   * If you want to just get user info of userIds only
   * @returns {Promise.<Object>}
   */
  async mapUsersInfo( userIds = [], justGetInList = false) {
    if ( userIds instanceof Array ) {
      if ( justGetInList === true ) {
        let currentViewers = {};
        await Promise.all(
          userIds.map( async userId => {
            if ( this.currentViewers[userId] ) {
              currentViewers[userId] = this.currentViewers[userId];
            } else {
              // The user info already existed on currentView, just push it
              // So get new info when it doesn't existed
              let userInfo = await User.formatBasicInfoById(User, userId);
              userInfo.status = userConnectionStates.offline; // Default value
              this.currentViewers[userId] = currentViewers[userId] = userInfo;
            }
          })
        );
        return currentViewers;
      } else {
        let currentViewers = this.currentViewers;
        await Promise.all(
          userIds.map( async userId => {
            if ( ! currentViewers[userId] ) {
              // The user info already existed on currentView, just push it
              // So get new info when it doesn't existed
              let userInfo = await User.formatBasicInfoById(User, userId);
              userInfo.status = userConnectionStates.offline; // Default value
              currentViewers[userId] = userInfo;
            }
          })
        );
        this.currentViewers = currentViewers;
        return currentViewers;
      }
    } else {
      logger.logX('Stream room: userIds must be an array');
    }
    return {};
  }
  /**
   * Self destroy
   */
  destroy() {
    // Remove socket listener
    // Do your stuff
    logger.logX('Destroy stream room', this.roomId);
    this._clearTimeWaiting();
    removeOfficeFile(this.roomId);
    destroyProjectData(this.roomId);
  }
}
