/**
 * Author: nhan
 * Created: Feb 1 2018
 *
 * Entry of socket for live stream
 * Live stream namespace include stream room
 */
import StreamRoom from '../utils/stream.room';
import * as LiveStreamServices from '../../services/liveStream.services';
import { userConnectionStates } from '../utils/stream.room';

const liveStreamNamespace = '/live';

export let streamNameSpaceInstance;

export default class StreamNamespace {
  /**
   * @param io express app
   */
  constructor(io) {
    this.io = io;
    // Create live stream
    this.nsp = io.of(liveStreamNamespace);
    // Trying use new service live stream
    // this.handleEvent();
    this.rooms = {};

    // export to external use case
    streamNameSpaceInstance = this;
  }

  /*
  Check room existed?
   */
  roomExist(roomId) {
    return !! this.rooms[roomId];
  }

  handleEvent() {
    // When have user connect to this namespace
    this.nsp.on('connection', socket => {
      // There are have user join room
      socket.on('join-room', ( roomId, ops = {} ) => {
        // If room is exists
        if ( roomId ) {
          socket.roomId = roomId;
          socket.userId = ops.userId;
          socket.userCuid = ops.userCuid;
          socket.join( roomId );
        }
        // Check user is presenter or viewer
        let isPresenter = ops ? ( ops.isPresenter || false ) : false; // Handle is diff to presenter and viewer
        if ( isPresenter ) {
          // Check room with roomId is existed?
          if ( ! this.roomExist( roomId ) ) {
            // If user is presenter and room is not existed, create new room
            // Store this room
            this.rooms[roomId] = new StreamRoom(this.nsp, socket, roomId, ops);
          } else {
            console.log('This room already have streamer, please choose another one');
          }
        } else {
          // You are Viewer, let join room if existed
          if ( this.roomExist( roomId ) ) {
            let streamRoom = this.rooms[roomId];
            if ( streamRoom ) {
              streamRoom.addViewer( socket );
            }
          }
        }
      });
      socket.on('pre-join-room', ( roomId, ops = {} ) => {
        if ( this.roomExist( roomId ) ) {
          let streamRoom = this.rooms[roomId];
          if ( streamRoom ) {
            socket.userId = ops.userId;
            socket.userCuid = ops.userCuid;
            streamRoom.registry( socket );
          }
        }
      });
    });
  }

  /**
   * Emit message to room
   * @param roomId
   * @param event
   * @param data
   * @param ops: { includeSender: true || false // Send to your self or not }
   */
  broadcastToRoom(roomId, event, data, ops) {
    if ( this.roomExist( roomId ) ) {
      let streamRoom = this.rooms[ roomId ];
      if ( streamRoom ) {
        streamRoom.broadcastToRoom( null, event, data, ops );
      } else {
        console.log('Stream room is not existed:', roomId);
      }
    } else {
      console.log('Room is not existed:', roomId);
    }
  }

  /**
   * Get room viewer number
   * @param roomId
   */
  async getRoomViewer( roomId ) {
    if ( this.roomExist( roomId ) ) {
      let streamRoom = this.rooms[ roomId ];
      if ( streamRoom ) {
        return await streamRoom.getNumViewer();
      } else {
        console.log('Stream room is not existed:', roomId);
      }
    } else {
      console.log('Room is not existed:', roomId);
    }
    return 0;
  }

  getTotalViewed( roomId ) {
    if ( this.roomExist( roomId ) ) {
      let streamRoom = this.rooms[ roomId ];
      if ( streamRoom ) {
        return streamRoom.getTotalViewed();
      } else {
        //console.log('Stream room is not existed:', roomId);
      }
    } else {
      //console.log('Room is not existed:', roomId);
    }
    return 0;
  }

  getCurrentViewers( roomId ) {
    if ( this.roomExist( roomId ) ) {
      let streamRoom = this.rooms[ roomId ];
      if ( streamRoom ) {
        return streamRoom.getCurrentViewers();
      } else {
        //console.log('Stream room is not existed:', roomId);
      }
    } else {
      //console.log('Room is not existed:', roomId);
    }
    return {};
  }

  async mapUsersInfo( roomId, userIds = [], justGetInList = false ) {
    if ( this.roomExist( roomId ) ) {
      let streamRoom = this.rooms[ roomId ];
      if ( streamRoom ) {
        return await streamRoom.mapUsersInfo( userIds, justGetInList );
      } else {
        //console.log('Stream room is not existed:', roomId);
      }
    } else {
      //console.log('Room is not existed:', roomId);
    }
    return {};
  }

  async destroyRoom( roomId ) {
    if ( this.roomExist( roomId ) ) {
      let streamRoom = this.rooms[ roomId ];
      if ( streamRoom ) {
        streamRoom.destroy();
        // Remove stream room from list
        delete this.rooms[ roomId ];
        await LiveStreamServices.stopStream(roomId);
        return true;
      } else {
        //console.log('Stream room is not existed:', roomId);
      }
    } else {
      //console.log('Room is not existed:', roomId);
    }
    return false;
  }

  /**
   * Update privacy to change num magic view
   * @param roomId
   * @param privacy
   */
  setStreamPrivacyForRoom(roomId, privacy) {
    // console.log('setStreamPrivacyForRoom', roomId, privacy);
    if ( this.roomExist( roomId ) ) {
      let streamRoom = this.rooms[ roomId ];
      streamRoom.setStreamPrivacy(privacy);
    } else {
      console.log('setStreamPrivacyForRoom room not found', roomId, privacy);
    }
  }

  /**
   * Check if user is ready for establish new connection
   * @param userId
   * return boolean
   */
  isUserReadyForNewConnection(userId) {
    let isReady = true; // Default value
    Object.keys(this.rooms).map( roomId => {
      let viewerStatus = this.rooms[ roomId ] ? this.rooms[ roomId ].getRoomViewerStatus(userId) : userConnectionStates.offline;
      if ( viewerStatus === userConnectionStates.connected || viewerStatus === userConnectionStates.handUp ) {
        isReady = false;
      }
    });
    return isReady;
  }
}
