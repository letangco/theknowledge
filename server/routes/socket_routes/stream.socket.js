import kurento from 'kurento-client';
import SocketIO from 'socket.io';
/*
 * Definition of global variables.
 */
import config from '../../config';
let idCounter = 0;
let candidatesQueue = {};
let kurentoClient = null;
let presenter = null;
let viewers = [];
let noPresenterMessage = 'No active presenter. Try again later...';

/*
 * Definition of functions
 */

// Recover kurentoClient for the first time.
function getKurentoClient(callback) {
  if (kurentoClient !== null) {
    return callback(null, kurentoClient);
  }

  kurento(config.stream.ws_uri, function(error, _kurentoClient) {
    if (error) {
      console.log("Could not find media server at address " + config.stream.ws_uri);
      return callback("Could not find media server at address" + config.stream.ws_uri
        + ". Exiting with error " + error);
    }

    kurentoClient = _kurentoClient;
    callback(null, kurentoClient);
  });
}

function nextUniqueId() {
  idCounter++;
  return idCounter.toString();
}

function clearCandidatesQueue(sessionId) {
  if (candidatesQueue[sessionId]) {
    delete candidatesQueue[sessionId];
  }
}

let livingRoom;

/**
 * Socket handle for streaming
 * @param httpServer express app
 */
export default function handleSocketStream( httpServer ) {
  let io = new SocketIO(httpServer);
  let live = io.of('/live'); // custom namespace
  live.on('connection', function(socket) {
    let room;
    socket.on('join-room', _room => {
      room = _room;
      // console.log('Have user join room', room);
      // If room is exists
      if ( room ) {
        socket.join( room );
      }
    });
    // Begin demo webrtc stream handle
    let sessionId = nextUniqueId();
    // console.log('Connection received with sessionId ' + sessionId);

    socket.on('error', () => {
      console.log('Connection ' + sessionId + ' error');
      stop(sessionId);
    });

    socket.on('disconnect', (reason) => {
      // console.log('Connection ' + sessionId + ' closed');
      stop(sessionId);
    });

    socket.on('message', (message) => {
      // console.log('Connection ' + sessionId + ' received message ', message);
      // console.log(message);

      switch (message.id) {
        case 'presenter':
          startPresenter(sessionId, socket, message.sdpOffer, function(error, sdpAnswer) {
            if (error) {
              sendMessage({
                id : 'presenterResponse',
                response : 'rejected',
                message : error
              });
              return;
            }
            sendMessage({
              id : 'presenterResponse',
              response : 'accepted',
              sdpAnswer : sdpAnswer
            });
          });
          break;

        case 'viewer':
          startViewer(sessionId, socket, message.sdpOffer, function(error, sdpAnswer) {
            if (error) {
              sendMessage({
                id : 'viewerResponse',
                response : 'rejected',
                message : error
              });
              return;
            }

            sendMessage({
              id : 'viewerResponse',
              response : 'accepted',
              sdpAnswer : sdpAnswer
            });
          });
          break;

        case 'stop':
          stop(sessionId);
          break;

        case 'onIceCandidate':
          onIceCandidate(sessionId, message.candidate);
          break;

        default:
          sendMessage({
            id : 'error',
            message : 'Invalid message ' + message
          });
          break;
      }
    });

    function sendMessage(data) {
      if ( room && socket.rooms[ room ] ) {
        // Only send When socket is in room
        socket.emit('message', data);
      }
    }

    function startPresenter(sessionId, socket, sdpOffer, callback) {
      clearCandidatesQueue(sessionId);

      if (presenter !== null) {
        stop(sessionId);
        return callback("Another user is currently acting as presenter. Try again later ...");
      }

      presenter = {
        id : sessionId,
        pipeline : null,
        webRtcEndpoint : null
      };

      getKurentoClient(function(error, kurentoClient) {
        if (error) {
          stop(sessionId);
          return callback(error);
        }

        if (presenter === null) {
          stop(sessionId);
          return callback(noPresenterMessage);
        }

        kurentoClient.create('MediaPipeline', function(error, pipeline) {
          if (error) {
            stop(sessionId);
            return callback(error);
          }

          if (presenter === null) {
            stop(sessionId);
            return callback(noPresenterMessage);
          }

          presenter.pipeline = pipeline;
          pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
            if (error) {
              stop(sessionId);
              return callback(error);
            }

            if (presenter === null) {
              stop(sessionId);
              return callback(noPresenterMessage);
            }

            presenter.webRtcEndpoint = webRtcEndpoint;

            if (candidatesQueue[sessionId]) {
              while(candidatesQueue[sessionId].length) {
                let candidate = candidatesQueue[sessionId].shift();
                webRtcEndpoint.addIceCandidate(candidate);
              }
            }

            webRtcEndpoint.on('OnIceCandidate', function(event) {
              let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
              sendMessage({
                id : 'iceCandidate',
                candidate : candidate
              });
            });

            webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
              if (error) {
                stop(sessionId);
                return callback(error);
              }

              if (presenter === null) {
                stop(sessionId);
                return callback(noPresenterMessage);
              }

              livingRoom = room;
              callback(null, sdpAnswer);
            });

            webRtcEndpoint.gatherCandidates(function(error) {
              if (error) {
                stop(sessionId);
                return callback(error);
              }
            });
          });
        });
      });
    }

    function startViewer(sessionId, socket, sdpOffer, callback) {
      clearCandidatesQueue(sessionId);

      if (presenter === null) {
        stop(sessionId);
        return callback(noPresenterMessage);
      }

      presenter.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
        if (error) {
          stop(sessionId);
          return callback(error);
        }
        if ( room !== livingRoom ) {
          return callback('You is not in living room');
        }
        viewers[sessionId] = {
          "webRtcEndpoint" : webRtcEndpoint,
          "socket" : socket
        };

        if (presenter === null) {
          stop(sessionId);
          return callback(noPresenterMessage);
        }

        if (candidatesQueue[sessionId]) {
          while(candidatesQueue[sessionId].length) {
            let candidate = candidatesQueue[sessionId].shift();
            webRtcEndpoint.addIceCandidate(candidate);
          }
        }

        webRtcEndpoint.on('OnIceCandidate', function(event) {
          let candidate = kurento.getComplexType('IceCandidate')(event.candidate);
          sendMessage({
            id : 'iceCandidate',
            candidate : candidate
          });
        });

        webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
          if (error) {
            stop(sessionId);
            return callback(error);
          }
          if (presenter === null) {
            stop(sessionId);
            return callback(noPresenterMessage);
          }

          presenter.webRtcEndpoint.connect(webRtcEndpoint, function(error) {
            if (error) {
              stop(sessionId);
              return callback(error);
            }
            if (presenter === null) {
              stop(sessionId);
              return callback(noPresenterMessage);
            }

            callback(null, sdpAnswer);
            webRtcEndpoint.gatherCandidates(function(error) {
              if (error) {
                stop(sessionId);
                return callback(error);
              }
            });
          });
        });
      });
    }

    function onIceCandidate(sessionId, _candidate) {
      let candidate = kurento.getComplexType('IceCandidate')(_candidate);

      if (presenter && presenter.id === sessionId && presenter.webRtcEndpoint) {
        console.info('Sending presenter candidate');
        presenter.webRtcEndpoint.addIceCandidate(candidate);
      } else if (viewers[sessionId] && viewers[sessionId].webRtcEndpoint) {
        console.info('Sending viewer candidate');
        viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate);
      } else {
        console.info('Queueing candidate');
        if (!candidatesQueue[sessionId]) {
          candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
      }
    }

    function stop(sessionId) {
      if (presenter !== null && presenter.id === sessionId) {
        for (let i in viewers) {
          let viewer = viewers[i];
          if (viewer.socket) {
            viewer.socket.emit('message', {
              id : 'stopCommunication'
            });
          }
        }
        presenter.pipeline.release();
        presenter = null;
        viewers = [];

      } else if (viewers[sessionId]) {
        viewers[sessionId].webRtcEndpoint.release();
        delete viewers[sessionId];
      }

      clearCandidatesQueue(sessionId);

      if (viewers.length < 1 && !presenter && kurentoClient) {
        kurentoClient.close();
        kurentoClient = null;
      }
    }
    // End demo webrtc stream handle
  });
}