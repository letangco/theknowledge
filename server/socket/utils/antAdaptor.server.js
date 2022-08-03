/**
 * Connect client to Ant media server
 * Open socket namespace /ant
 * @param initialValues
 * @constructor
 */

export default class AntAdaptorServer {
  constructor(initialValues) {
    this.streamId = null;
    this.debug = false;
    this.webSocketUrl = null;

    for(let key in initialValues) {
      if(initialValues.hasOwnProperty(key)) {
        this[key] = initialValues[key];
      }
    }

    this.connected = false;
    this.initial();
    this.gotDescription = this.gotDescription.bind(this);
    this.iceCandidateReceived = this.iceCandidateReceived.bind(this);
    this.onTrack = this.onTrack.bind(this);
  }

  callback(msg) {
    console.log('callback:', msg);
  }

  callbackError(error) {
    console.log('callbackError:', error);
  }

  initial() {
    if (!("WebSocket" in window)) {
      console.log("WebSocket not supported.");
      this.callbackError("WebSocketNotSupported");
      return;
    }

    if ( ! this.wsConn || this.connected === false) {
      this.listenWs();
    }
  }

  listenWs() {
    const wsConn = this.wsConn = new WebSocket(this.webSocketUrl);
    wsConn.onopen = () => {
      if (this.debug) {
        console.log("websocket connected");
      }

      this.connected = true;
      this.callback("initialized");
    };

    wsConn.onmessage = (event) => {
      // Direct data to client
      let obj = JSON.parse(event.data);

      if (obj.command === "start") {
        this.initPeerConnection();
        if (this.debug) {
          console.log("received start command");
        }
        this.remotePeerConnection.createOffer(this.sdpConstraints)
          .then(this.gotDescription)
          .catch(function(ex) {
            console.log("create offer error", ex);
          });
      } else if (obj.command === "takeCandidate") {
        this.initPeerConnection();
        let candidate = new RTCIceCandidate({
          sdpMLineIndex: obj.label,
          candidate: obj.candidate
        });
        this.remotePeerConnection.addIceCandidate(candidate);
        if (this.debug) {
          console.log("received ice candidate: ");
          console.log(candidate);
        }
      } else if (obj.command === "takeConfiguration") {
        this.initPeerConnection();
        this.remotePeerConnection
          .setRemoteDescription(new RTCSessionDescription({
            sdp: obj.sdp,
            type: obj.type
          }));
        if (this.debug) {
          console.log("received remote description type:");
          console.log(obj);
        }

        if (obj.type === "offer") {
          this.remotePeerConnection.createAnswer(this.sdpConstraints)
            .then(this.gotDescription)
            .catch(function(ex) {
              console.log("create answer error", ex);
            });
        }
      } else if (obj.command === "stop") {
        this.closePeerConnection();
      } else if (obj.command === "error") {
        this.callbackError(obj.definition);
      } else if (obj.command === "notification") {
        this.callback(obj.definition);
      }
    };

    wsConn.onerror = (error) => {
      console.log(" error occured: " + JSON.stringify(error));
      this.callbackError(error)
    };

    wsConn.onclose = (event) => {
      this.connected = false;
      console.log("connection closed.");
      this.callback("closed", event);
    };
  }

  sendMessage(text) {
    const wsConn = this.wsConn;
    if (wsConn.readyState === 0 || wsConn.readyState === 2 || wsConn.readyState === 3) {
      this.callbackError("WebSocketNotConnected");
      return;
    }
    wsConn.send(text);
  }

  publish(streamId) {
    this.streamId = streamId;
    this.sendMessage(JSON.stringify({
      command: "publish",
      streamId: streamId
    }));
  }

  play(streamId) {
    this.streamId = streamId;
    this.sendMessage(JSON.stringify({
      command: "play",
      streamId: this.streamId
    }));
  }

  stop() {
    this.closePeerConnection();
    this.sendMessage(JSON.stringify({
      command: "stop",
      streamId: this.streamId
    }));
  }

  join(streamId) {
    this.streamId = streamId;
    this.sendMessage(JSON.stringify({
      command: "join",
      streamId: streamId
    }));
  }

  leave() {
    this.sendMessage(JSON.stringify({
      command: "leave",
      streamId: this.streamId
    }));

    this.closePeerConnection();
  }

  gotStream(stream) {
    this.localStream = stream;
    this.localVideo.srcObject = stream;
    if ( ! this.wsConn || this.connected === false) {
      this.listenWs();
    }
  };

  onTrack(event) {
    if (this.debug) {
      console.log("onTrack");
    }
    this.remoteStream = event.streams[0];
  };

  iceCandidateReceived(event) {
    if (event.candidate) {
      if (this.debug) {
        console.log("sending ice candiate: " + JSON.stringify(event.candidate));
      }

      this.sendMessage(JSON.stringify({
        command: "takeCandidate",
        streamId: this.streamId,
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      }));
    }
  };

  initPeerConnection() {
    if (this.remotePeerConnection === null) {
      this.remotePeerConnection = new RTCPeerConnection(this.peerConnectionConfig);
      if (!this.isPlayMode) {
        this.remotePeerConnection.addStream(this.localStream);
      }
      this.remotePeerConnection.onicecandidate = this.iceCandidateReceived;
      this.remotePeerConnection.ontrack = this.onTrack;
    }
  }

  closePeerConnection() {
    if (this.remotePeerConnection !== null
      && this.remotePeerConnection.signalingState !== "closed") {
      this.remotePeerConnection.close();
      this.remotePeerConnection = null;
    }
  }

  signallingState() {
    if (this.remotePeerConnection !== null) {
      return this.remotePeerConnection.signalingState;
    }
    return null;
  }

  iceConnectionState() {
    if (this.remotePeerConnection !== null) {
      return this.remotePeerConnection.iceConnectionState;
    }
    return null;
  }

  gotDescription(configuration) {
    this.remotePeerConnection.setLocalDescription(configuration);
    if (this.debug) {
      console.log("local sdp: ");
      console.log(configuration);
    }

    this.sendMessage(JSON.stringify({
      command: "takeConfiguration",
      streamId: this.streamId,
      type: configuration.type,
      sdp: configuration.sdp
    }));
  }
}
