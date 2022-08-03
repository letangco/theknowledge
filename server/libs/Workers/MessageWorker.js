import {Q} from '../Queue';
import {serverSocketStaticInstance} from '../../routes/socket_routes/chat_socket';
import {addMessage} from '../../controllers/message.controller';
import {addChatGroupByUsers} from '../../controllers/chatGroup.controller';
import globalConstants from '../../../config/globalConstants';

Q.process( globalConstants.jobName.BROADCAST_MESSAGE, 1, async ( job, done ) => {
  try {
    let jobData = job.data;
    let newChatGroup = await addChatGroupByUsers( [ jobData.userSend, jobData.userReceive ] );
    // If add success
    if ( newChatGroup.cuid ) {
      let chatGroupID = newChatGroup.cuid;
      // Add message
      let messageAdded = await addMessage({
        chatGroup: chatGroupID,
        type: 'msg',
        userSend: jobData.userSend,
        content: jobData.content
      });
      if ( serverSocketStaticInstance ) {
        serverSocketStaticInstance.emitToUser( jobData.userReceive, 'UpdateMessageList', messageAdded );
      }
    }
    return done( null );
  } catch ( err ) {
    console.log( 'err on job BROADCAST_MESSAGE:', err );
    return done( err );
  }
});
