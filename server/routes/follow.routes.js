import { Router } from 'express';
import * as FollowController from '../controllers/follow.controller.js';
const router = new Router();
import auth from '../libs/Auth/Auth.js';

router.route('/follow/add').post(auth.auth(), FollowController.add);
router.route('/follow/remove').post(auth.auth(), FollowController.remove);
router.route('/follow/get-following').get(auth.auth(), FollowController.getFollowing);
router.route('/follow/get-followers').get(auth.auth(), FollowController.getFollower);
router.route('/follow/is-following').get(auth.auth(), FollowController.isFollowing);

export default router;
