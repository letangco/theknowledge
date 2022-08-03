import { Router } from 'express';
import * as MessageController from '../controllers/message.controller';
import * as ChatGroupController from '../controllers/chatGroup.controller';
import {getSocketIDs} from './socket_routes/chat_socket';
import isAdmin from '../libs/Auth/isAdmin.js';
import auth from '../libs/Auth/Auth';

const router = new Router();

// Add message to group
router.route('/chat/message/add').post(MessageController.add);
// Add message to group
router.route('/chat/message/scrape-link').post(MessageController.metaScrapeLink);
// Get messages of group
router.route('/chat/message/:token/:groupId/:skip/:limit').get(MessageController.getMessages);
// Get images from messages of group
router.route('/chat/images').get(auth.auth(), MessageController.getImagesFromGroup);
router.route('/chat/files').get(auth.auth(), MessageController.getFilesFromGroup);
// Get chat group of current user (user login)
router.route('/chat/group/get-groups').get(auth.auth(), ChatGroupController.getChatGroups);
// Get chat group by id
router.route('/chat/group/get-group/:chatGroupID/:token').get(auth.auth(), ChatGroupController.getChatGroupById);
// Create new group
router.route('/chat/group/add').post(ChatGroupController.addByUsers);
// Search chat groups
router.route('/chat/group/search/:token/:key').get(ChatGroupController.searchChatGroup);
// Get users online status
router.route('/chat/get-user-status').post(ChatGroupController.requestUsersOnlineState);

router.route('/chat/update-message-status').post(ChatGroupController.updateMessageViewStatus);

router.route('/chat/all-socket').get(isAdmin.auth(), getSocketIDs);

router.route('/chat/broadcast-message').post(isAdmin.auth(), ChatGroupController.broadcastMessage);

export default router;