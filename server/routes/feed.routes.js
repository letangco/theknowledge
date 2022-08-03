import { Router } from 'express';
import authen from '../libs/Auth/Auth.js';
const router = new Router();

import * as FeedController from '../controllers/feed.controller.js';

router.route('/feeds')
  .get(authen.auth(), FeedController.getFeeds);

router.route('home-feeds').get(FeedController.getFeeds);

//get Home feed v2

router.route('/home-feeds-v2').get(FeedController.getHomeFeeds);

//router.route('/feeds/bookmarked')
//  .get(authen.auth(), FeedController.getBookMarkedKnowledges);

export default router;
