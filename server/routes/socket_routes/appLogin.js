const NAMESPACE = 'app-login';
let nsp;

export function emitAppLoggedIn(roomId, data) {
  if ( nsp ) {
    // Send to all clients in roomId room, including sender
    nsp.in(roomId).emit('loggedIn', data);
  } else {
    console.error('emitAppLogin error');
    console.error(Error('emitAppLogin: nsp is not defined!'));
  }
}

export function emitAppLoginFailed(roomId, data) {
  if ( nsp ) {
    // Send to all clients in roomId room, including sender
    nsp.in(roomId).emit('loginFailed', data);
  } else {
    console.error('emitAppLoginFailed error');
    console.error(Error('emitAppLoginFailed: nsp is not defined!'));
  }
}

export default function initAppLoginSocketNamespace(io) {
  if ( nsp ) {
    console.warn('App login socket already initialized!');
    return;
  }
  nsp = io.of(NAMESPACE);
  nsp.on('connection', socket => {
    socket.on('auth', data => {
      // console.log('auth');
      // console.log(data);
      const roomId = data.appLoginId;
      if ( roomId ) {
        socket.client.roomId = roomId;
        socket.join(roomId);
      } else {
        socket.disconnect();
      }
    });
    socket.on('disconnect', () => {
      socket.leave(socket.client.roomId);
    });
  });
}