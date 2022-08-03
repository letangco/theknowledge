import projects from './projects.js';
let draw  = require('./draw'),
    paper = require('paper');

import logger from '../../../util/log';
function destroyProjectData(room) {
  delete projects[room];
}

/**
 * Socket handle for draw tool
 * @param io
 * @param socket
 * Ref: http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io
 */
export default function drawSocketListen(io, socket) {
  let room;
  socket.on('disconnect', function(reason) {
    logger.logX('Session draw tool: socket disconnect, reason:', reason);
    if ( room ) {
      logger.logX('Destroy all things on room:', room);
      destroyProjectData(room);
    }
  });
  function loadError(socket) {
    socket.emit('project:load:error');
  }
  // Subscribe a client to a room
  function subscribe(socket, data) {
    room = data.room;
    logger.logX('Session subscribe', room);

    // Subscribe the client to the room
    socket.join(room);

    // If the close timer is set, cancel it
    // if (closeTimer[room]) {
    //  clearTimeout(closeTimer[room]);
    // }

    // Create Paperjs instance for this room if it doesn't exist
    let project = projects[room];
    if (!project) {
      logger.logX('made room');
      projects[room] = {};
      // Use the view from the default project. This project is the default
      // one created when paper is instantiated. Nothing is ever written to
      // this project as each room has its own project. We share the View
      // object but that just helps it "draw" stuff to the invisible server
      // canvas.
      projects[room].project = new paper.Project();
      projects[room].external_paths = {};
      // db.load(room, socket);
    } else { // Project exists in memory, no need to load from database
      // loadFromMemory(room, socket);
    }

    // Broadcast to room the new user count -- currently broken
    let rooms = socket.adapter.rooms[room];
    let roomUserCount = Object.keys(rooms).length;
    io.to(room).emit('user:connect', roomUserCount);
  }
  // Send current project to new client
  function loadFromMemory(room, socket) {
    logger.logX('loadFromMemory');
    // let project = projects[room].project;
    // if (!project) { // Additional backup check, just in case
    //   db.load(room, socket);
    //   return;
    // }
    // socket.emit('loading:start');
    // let value = project.exportJSON();
    // socket.emit('project:load', {project: value});
    // socket.emit('settings', clientSettings);
    // socket.emit('loading:end');
  }
  // EVENT: User stops drawing something
  // Having room as a parameter is not good for secure rooms
  socket.on('draw:progress', function (room, uid, co_ordinates, projectIndex) {
    if (!projects[room] || !projects[room].project) {
      loadError(socket);
      return;
    }
    socket.broadcast.to(room).emit('draw:progress', uid, co_ordinates, projectIndex);
    draw.progressExternalPath(room, JSON.parse(co_ordinates), uid);
  });

  // EVENT: User stops drawing something
  // Having room as a parameter is not good for secure rooms
  socket.on('draw:end', function (room, uid, co_ordinates, projectIndex) {
    if (!projects[room] || !projects[room].project) {
      loadError(socket);
      return;
    }
    socket.broadcast.to(room).emit('draw:end', uid, co_ordinates, projectIndex);
    draw.endExternalPath(room, JSON.parse(co_ordinates), uid);
  });

  // User joins a room
  socket.on('subscribe', function(data) {
    subscribe(socket, data);
  });

  // User clears canvas
  socket.on('canvas:clear', function(room, projectIndex) {
    if (!projects[room] || !projects[room].project) {
      loadError(socket);
      return;
    }
    draw.clearCanvas(room);
    socket.broadcast.to(room).emit('canvas:clear', projectIndex);
  });

  // User removes an item
  socket.on('item:remove', function(room, uid, itemName, projectIndex) {
    draw.removeItem(room, uid, itemName);
    socket.broadcast.to(room).emit('item:remove', uid, itemName, projectIndex);
  });

  // User moves one or more items on their canvas - progress
  socket.on('item:move:progress', function(room, uid, itemNames, delta, projectIndex) {
    draw.moveItemsProgress(room, uid, itemNames, delta);
    if (itemNames) {
      socket.broadcast.to(room).emit('item:move', uid, itemNames, delta, projectIndex);
    }
  });

  // User moves one or more items on their canvas - end
  socket.on('item:move:end', function(room, uid, itemNames, delta, projectIndex) {
    draw.moveItemsEnd(room, uid, itemNames, delta);
    if (itemNames) {
      socket.broadcast.to(room).emit('item:move', uid, itemNames, delta, projectIndex);
    }
  });

  // User adds a raster image
  socket.on('image:add', function(room, uid, data, position, name, projectIndex) {
    draw.addImage(room, uid, data, position, name);
    socket.broadcast.to(room).emit('image:add', uid, data, position, name, projectIndex);
  });

  // User create new tab
  socket.on('tab:create', function(room, uid, tab) {
    socket.broadcast.to(room).emit('tab:create', uid, tab);
  });
  // User select a tab
  socket.on('tab:select', function(room, uid, tab) {
    socket.broadcast.to(room).emit('tab:select', uid, tab);
  });
  // User modify content of tab
  socket.on('tab:modify', function(room, uid, tab) {
    socket.broadcast.to(room).emit('tab:modify', uid, tab);
  });
  // User remove tab
  socket.on('tab:remove', function(room, uid, tab) {
    socket.broadcast.to(room).emit('tab:remove', uid, tab);
  });
  // Code update from code tab
  socket.on('code:update', function(room, uid, tab) {
    socket.broadcast.to(room).emit('code:update', uid, tab);
  });
}
