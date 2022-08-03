import ChatGroup from '../models/chatGroup.js';
import {getUserInfoForChatGroupById} from '../controllers/user.controller';

export function updateChatGroupUserInfo(userID) {
  // Get all chat group this user are in there
  ChatGroup.find({'users.cuid': {$in: [userID]}}).exec((err, chatGroups) => {
    if (err) {
      return false;
    }
    getUserInfoForChatGroupById(userID).then((user) => {
      chatGroups.map((chatGroup) => {
        // Update userInfo for each chat group
        chatGroup.userInfo[userID] = user;
        // Update user data
        chatGroup.users.map((userData,index)=>{
          if(userData.cuid===userID) {
            chatGroup.users[index] = {
              cuid: userID,
              fullName: user.fullName || user.firstName || user.lastName
            };
          }
        });
        ChatGroup.update({cuid: chatGroup.cuid},
          {
            userInfo: chatGroup.userInfo,
            users: chatGroup.users
          },
          (err, numAffected) => {
            // numAffected is the number of updated documents
            if (!err) {
              return numAffected;
            } else {
              return false;
            }
          }
        );
      });
    });
  });
}
