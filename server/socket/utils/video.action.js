/**
 * Actions for draw
 */

export function subscribe(socket, channel) {
  console.log('subscribe for video actions at channel:', channel);
  socket.on('videoAction', message => {
    switch (message.id) {
      case 'presenter.stop':
        socket.to(channel).emit('presenter.stop');
        break;
      case 'presenter.play':
        socket.to(channel).emit('presenter.play', {
          url: message.url,
          currentTime: message.currentTime,
          isYoutube: message.isYoutube});
        break;
      case 'presenter.pause':
        socket.to(channel).emit('presenter.pause');
        break;
      case 'presenter.ended':
        socket.to(channel).emit('presenter.ended');
        break;
      case 'presenter.seeked':
        socket.to(channel).emit('presenter.seeked', {
          currentTime: message.currentTime
        });
        break;
      case 'presenter.changeVolume':
        socket.to(channel).emit('presenter.changeVolume', {
          volume: message.volume,
          muted: message.muted
        });
        break;
      case 'presenter.youtubeReady':
        socket.to(channel).emit('presenter.youtubeReady', {
          url: message.url
        });
        break;
      case 'presenter.stopSyncVideo':
        socket.to(channel).emit('presenter.stopSyncVideo');
        break;
      case 'presenter.error':
        socket.to(channel).emit('presenter.error');
        break;
      case 'viewer.getCurrentTime':
        socket.to(channel).emit('viewer.getCurrentTime');
        break;
    }
  });
}

export function listen(socket) {
  console.log('subscribe for video actions');
}