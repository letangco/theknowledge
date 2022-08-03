/**
 * Main controller for socket actions for Tools:
 * 1. Draw actions
 * 2. Code actions
 * 3. Video actions
 * 4. Pdf view actions
 */
import DrawActions from "../utils/draw.action";
import * as videoActions from "../utils/video.action";

export default class ToolActionController {
  constructor(socket) {
    this.socket = socket;
    this.drawActions = new DrawActions(socket);
    this.listenSocket(socket);
  }

  listenSocket(socket) {
    socket.on('subscribeToolActions', data => {
      switch (data.toolName) {
        case 'draw':
          this.drawActions.subscribe(socket);
          break;
        case 'code':
          break;
        case 'video':
          videoActions.subscribe(socket, data.channel);
          break;
        case 'pdf':
          break;
        default:
          // Todo: Emit the toolName is not valid
      }
    });
    socket.on('listenToolActions', data => {
      switch (data.toolName) {
        case 'draw':
          break;
        case 'code':
          break;
        case 'video':
          break;
        case 'pdf':
          break;
        default:
        // Todo: Emit the toolName is not valid
      }
    });
  }
}