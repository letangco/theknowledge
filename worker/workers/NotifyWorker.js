import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';
import {pushNotifyToUser, pushMessageNotifyToUser} from "../../server/libs/Fcm";
import User from '../../server/models/user';
import ChatGroup from '../../server/models/chatGroup';
import ArrayHelper from '../../server/util/ArrayHelper';
import cuid from 'cuid';

export function run() {
  AMPQ.consumeData(globalConstants.jobName.PUSH_MSG_NOTIFY_TO_USER, async (msg, channel) => {
    try {
      let message = JSON.parse(msg.content.toString());
      if(message.type === 'msg' || message.type === 'files') {
        let rs = await Promise.all([
          User.findOne({cuid: message.userSend}, 'userName fullName avatar cuid').lean(),
          ChatGroup.findOne({cuid: message.chatGroup}).lean(),
        ]);
        let userSend = rs[0], chatGroup = rs[1];
        let userSendIndex = ArrayHelper.findItemByProp(chatGroup.users, 'cuid', userSend.cuid);
        let userReceiveIndex = 2 - userSendIndex - 1;
        let userReceive = await User.findOne({cuid: chatGroup.users[userReceiveIndex]['cuid']}, 'token cuid deviceTokens').lean();
        if(userReceive && userReceive.deviceTokens && userReceive.deviceTokens.length){
          let body = '';
          switch (message.type) {
            case 'msg':
              body = userSend.fullName + ': ' + message.content;
              break;
            case 'files':
              body = userSend.fullName + ' sent a file.';
              break;
          }
          let notifyOptions = {
            deviceTokens: userReceive.deviceTokens,
            body: body,
            data: {
              userSend: JSON.stringify(userSend),
              chatGroup: JSON.stringify({
                token: userReceive.token,
                chatGroupCuid: message.chatGroup || '',
                users: [userReceive.cuid, userSend.cuid]
              })
            },
            click_action: 'chat',
            icon: userSend.avatar
          };
          await pushMessageNotifyToUser(notifyOptions)
        }
      }
      return true;
    } catch (error) {
      console.error('PUSH_MSG_NOTIFY_TO_USER error');
      console.error(error);
      return true;
    }
  });

  AMPQ.consumeData(globalConstants.jobName.PUSH_NOTIFY_TO_USER, async (msg, channel) => {
    try {
      let options = JSON.parse(msg.content.toString());
      let user = await User.findOne({_id: options.to, active: 1}, 'deviceTokens').lean();
      if(user && user.deviceTokens && user.deviceTokens.length > 0 ){
        const result = user.deviceTokens.filter(token =>{
          if(token) return token;
        });
        if(result && result.length){
          let notifyOptions = {
            deviceTokens: result,
            data: JSON.stringify(options)
          };
          await pushNotifyToUser(notifyOptions);
        }
      }
      return true;
    } catch (error) {
      console.error('PUSH_NOTIFY_TO_USER error');
      console.error(error);
      return true;
    }
  });
}
