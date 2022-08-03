/**
 * Client Socket handle
 */
import {serverSocketStaticInstance} from './chat_socket.js';
import User from '../../models/user';
export default class NotificationSocket {
    /**
     * Emit to server when followInfo sent
     * @param followInfo The followInfo sent
     */
    async emitHandleNotification(notification) {
      let user = await User.findById(notification.to).lean();
      serverSocketStaticInstance.emitToUser(user.cuid, 'notification', notification);
    }
}
