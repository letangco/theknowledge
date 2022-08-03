import projects from './projects.js';
let draw  = require('./draw'),
    paper = require('paper');
import logger from '../../util/log';

export function destroyProjectData(room) {
  delete projects[room];
}

/**
 * Socket handle for draw tool
 * @param io
 * @param socket
 * Ref: http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io
 */
export default function drawSocketListenForTool(io, socket) {
  let room;
  socket.on('disconnect', function(reason) {
    logger.logX('Tools: socket disconnect', reason);
    logger.logX('Destroy all things');
  });
  function loadError(socket,reason) {
    socket.emit('tool:project:load:error', reason);
  }
  // Subscribe a client to a room
  function subscribe(socket, data) {
    room = data.room;
    logger.logX('Stream tools: subscribe!', room);
    logger.logX('socket.presenterSocketId', socket.presenterSocketId);
    // Subscribe the client to the room
    socket.join(room);

    // If the close timer is set, cancel it
    // if (closeTimer[room]) {
    //  clearTimeout(closeTimer[room]);
    // }

    // Create Paperjs instance for this room if it doesn't exist
    let project = projects[room];
    if (!project) {
      logger.logX('made room', room);
      // Use the view from the default project. This project is the default
      // one created when paper is instantiated. Nothing is ever written to
      // this project as each room has its own project. We share the View
      // object but that just helps it "draw" stuff to the invisible server
      // canvas.
      project = {
        project: new paper.Project(),
        viewSize: null,
        external_paths: {},
        tabData: [],
        selectedTab: 0,
        presentationSettings: {},
        videoSettings: {},
        presenterSocketId: socket.id,
        zoomSettings: {}
      };
      projects[room] = project;
      // db.load(room, socket);
    } else { // Project exists in memory, no need to load from database
      loadFromMemory(room, socket);
    }

    // Broadcast to room the new user count -- currently broken
    let rooms = socket.adapter.rooms[room];
    let roomUserCount = Object.keys(rooms).length;
    io.to(room).emit('tool:user:connect', roomUserCount);
    logger.logX('Subscribe user to room:', room, roomUserCount);
  }
  // Send current project to new client
  function loadFromMemory(room, socket) {
    // if (!project) { // Additional backup check, just in case
    //   db.load(room, socket);
    //   return;
    // }
    if (!projects[room] || !projects[room].project) {
      loadError(socket, 'LoadFromMemory failed');
      return;
    }
    logger.logX('loadFromMemory', room);
    let project = projects[room];
    let drawProject = project.project;
    socket.emit('tool:loading:start');
    socket.emit('tool:project:load', {
      projectJSON: drawProject.exportJSON(),
      viewSize: project.viewSize,
      tabData: project.tabData,
      selectedTab: project.selectedTab,
      presentationSettings: project.presentationSettings,
      videoSettings: project.videoSettings,
      zoomSettings: project.zoomSettings
    });
    // socket.emit('tool:settings', clientSettings);
    socket.emit('tool:loading:end');
  }
  // EVENT: User stops drawing something
  // Having room as a parameter is not good for secure rooms
  socket.on('tool:draw:progress', function (room, uid, co_ordinates, projectIndex) {
    if (!projects[room] || !projects[room].project) {
      loadError(socket, 'Draw progress: Project is not existed');
      return;
    }
    socket.broadcast.to(room).emit('tool:draw:progress', uid, co_ordinates, projectIndex);
    draw.progressExternalPath(room, JSON.parse(co_ordinates), uid);
  });

  // EVENT: User stops drawing something
  // Having room as a parameter is not good for secure rooms
  socket.on('tool:draw:end', function (room, uid, co_ordinates, projectIndex) {
    if (!projects[room] || !projects[room].project) {
      loadError(socket, 'Draw end: Project is not existed');
      return;
    }
    socket.broadcast.to(room).emit('tool:draw:end', uid, co_ordinates, projectIndex);
    draw.endExternalPath(room, JSON.parse(co_ordinates), uid);
  });

  // User joins a room
  socket.on('tool:subscribe', function(data) {
    subscribe(socket, data);
  });

  // User clears canvas
  socket.on('tool:canvas:clear', function(room, projectIndex) {
    if (!projects[room] || !projects[room].project) {
      loadError(socket, 'Canvas clear: Project is not existed');
      return;
    }
    draw.clearCanvas(room);
    socket.broadcast.to(room).emit('tool:canvas:clear', projectIndex);
  });

  // User clears canvas
  socket.on('tool:canvas:updateViewSize', function(room, uid, data) {
    if (!projects[room] || !projects[room].project) {
      loadError(socket, 'Canvas updateViewSize: Project is not existed');
      logger.logX('tool:canvas:updateViewSize push data failed!');
      return;
    }
    projects[room].viewSize = data.viewSize;
    socket.broadcast.to(room).emit('tool:canvas:updateViewSize', uid, data);
  });

  // User removes an item
  socket.on('tool:item:remove', function(room, uid, itemName, projectIndex) {
    draw.removeItem(room, uid, itemName);
    socket.broadcast.to(room).emit('tool:item:remove', uid, itemName, projectIndex);
  });

  // User moves one or more items on their canvas - progress
  socket.on('tool:item:move:progress', function(room, uid, itemNames, delta, projectIndex) {
    draw.moveItemsProgress(room, uid, itemNames, delta);
    if (itemNames) {
      socket.broadcast.to(room).emit('tool:item:move', uid, itemNames, delta, projectIndex);
    }
  });

  // User moves one or more items on their canvas - end
  socket.on('tool:item:move:end', function(room, uid, itemNames, delta, projectIndex) {
    draw.moveItemsEnd(room, uid, itemNames, delta);
    if (itemNames) {
      socket.broadcast.to(room).emit('tool:item:move', uid, itemNames, delta, projectIndex);
    }
  });

  // User adds a raster image
  socket.on('tool:image:add', function(room, uid, data, position, name, projectIndex) {
    draw.addImage(room, uid, data, position, name);
    socket.broadcast.to(room).emit('tool:image:add', uid, data, position, name, projectIndex);
  });

  // User create new tab
  socket.on('tool:tab:create', function(room, uid, tab, selectedTabIndex) {
    logger.logX('tab:create selectedTabIndex:', selectedTabIndex);
    socket.broadcast.to(room).emit('tool:tab:create', uid, tab);
    logger.logX('tab:create', room);
    if ( projects[room] && projects[room].tabData instanceof Array ) {
      projects[room].tabData.push(tab);
      projects[room].selectedTab = selectedTabIndex;
    } else {
      logger.logX('tab:create push data failed!');
    }
  });
  // User remove tab
  socket.on('tool:tab:remove', function(room, uid, tabId, selectedTabIndex) {
    logger.logX('tab:remove selectedTabIndex:', selectedTabIndex);
    socket.broadcast.to(room).emit('tool:tab:remove', uid, tabId);
    let project = projects[room];
    if ( project && project.tabData instanceof Array ) {
      project.tabData = project.tabData.filter(tab => tab.cuid !== tabId);
      project.selectedTab = selectedTabIndex;
    } else {
      logger.logX('tab:create push data failed!');
    }
  });
  // User select a tab
  socket.on('tool:tab:select', function(room, uid, tab, updateOnly) {
    if ( projects[room] ) {
      projects[room].selectedTab = tab;
      logger.logX('tab:select selected on Tab:', tab);
    } else {
      logger.logX('tab:select select on tab failed!');
    }
    if ( ! updateOnly ) {
      socket.broadcast.to(room).emit('tool:tab:select', uid, tab);
    }
  });
  // User modify content of tab
  socket.on('tool:tab:modify', function(room, uid, tab) {
    socket.broadcast.to(room).emit('tool:tab:modify', uid, tab);
  });
  // Code update from code tab
  socket.on('tool:code:update', function(room, uid, text, tabId) {
    socket.broadcast.to(room).emit('tool:code:update', uid, text, tabId);
    let project = projects[room];
    if ( project ) {
      let textTab = project.tabData.filter(tab => tab.type === 'code');
      if ( textTab && textTab.length > 0 ) {
        textTab = textTab[0];
        textTab.text = text;
      }
    }
  });

  function sendVideoActionToRoom(room, tabId, event, data, callback) {
    socket.broadcast.to(room).emit('tool:videoAction', tabId, {
      id: event,
      ...data
    }, callback);
  }

  function sendMessage(socketId, tabId, event, data, callback) {
    // Send message to identity user
    socket.to(socketId).emit('tool:videoAction', tabId, {
      id: event,
      ...data
    }, callback);
  }

  socket.on('tool:videoAction', function(room, tabId, message) {
    switch (message.id) {
      case 'presenter.stop':
        sendVideoActionToRoom(room, tabId, 'presenter.stop');
        break;
      case 'presenter.play':
        sendVideoActionToRoom(room, tabId, 'presenter.play', {
          url: message.url,
          currentTime: message.currentTime,
          isYoutube: message.isYoutube
        });
        break;
      case 'presenter.pause':
        sendVideoActionToRoom(room, tabId, 'presenter.pause');
        break;
      case 'presenter.ended':
        sendVideoActionToRoom(room, tabId, 'presenter.ended');
        break;
      case 'presenter.seeked':
        if ( message.currentTime ) {
          sendVideoActionToRoom(room, tabId, 'presenter.seeked', {currentTime: message.currentTime})
        }
        break;
      case 'presenter.changeVolume':
        if ( message.volume ) {
          sendVideoActionToRoom(room, tabId, 'presenter.changeVolume', {volume: message.volume, muted: message.muted})
        }
        break;
      case 'presenter.youtubeReady':
        sendVideoActionToRoom(room, tabId, 'presenter.youtubeReady', {url: message.url});
        break;
      case 'presenter.stopSyncVideo':
        sendVideoActionToRoom(room, tabId, 'presenter.stopSyncVideo');
        break;
      case 'presenter.error':
        sendVideoActionToRoom(room, tabId, 'presenter.error');
        break;
      case 'presenter.zoomVideo':
        let project = projects[room];
        if ( project ) {
          const { action, videoIndex } = message;
          project.zoomSettings = {
            action: action,
            videoIndex: videoIndex
          };
        }
        sendVideoActionToRoom(room, tabId, 'presenter.zoomVideo', message);
        break;
      case 'viewer.getCurrentTime':
        // Todo: Have only one presenter, so temp send request to all member on room, only presenter listen this event
        sendVideoActionToRoom(room, tabId, 'viewer.getCurrentTime', {
          socketId: socket.id
        });
        break;
      case 'presenter.currentTime':
        if ( message.socketId ) {
          // logger.logX('presenter.currentTime message.socketId', message.socketId);
          delete message.id;
          sendMessage(message.socketId, tabId, 'presenter.seekTo', message);
        }
        break;
    }
    if ( message.settings && projects[room] ) {
      projects[room].videoSettings = message.settings;
    }
  });

  function sendPDFActionToRoom(room, tabId, data) {
    socket.broadcast.to(room).emit('tool:pdfViewAction', tabId, data);
  }

  socket.on('tool:pdfViewAction', function(room, tabId, data) {
    if ( projects[room] ) {
      let project = projects[room];
      let presentationSettings = project.presentationSettings || {};
      switch ( data.id ) {
        case 'change:page':
          if ( data.page ) {
            presentationSettings.page = data.page;
          }
          break;
        case 'change:scale':
          if ( data.scale ) {
            presentationSettings.scale = data.scale;
          }
          break;
        case 'change:rotate':
          if ( data.rotate ) {
            presentationSettings.rotate = data.rotate;
          }
          break;
      }
    } else {
      logger.logX('pdfViewAction project is not found!');
    }
    sendPDFActionToRoom(room, tabId, data);
  });
}
