import { Router } from 'express';
import * as KnowledgeController from '../controllers/knowledge.controller.js';
import {submit} from '../controllers/comment.controller.js';
import authen from '../libs/Auth/Auth.js';
import isAdmin from '../libs/Auth/isAdmin.js';

const router = new Router();
router.use(authen.init());

router.route('/knowledge')
    .get(KnowledgeController.searchKnowledgesV2)
    .post(authen.auth(), KnowledgeController.submit);

router.route('/knowledge-by-user/:userId')
    .get(KnowledgeController.getKnowledgesByUser);

router.route('/knowledge-meta/:id')
    .get(KnowledgeController.getKnowledgeMetaByIdOrSlug);

router.route('/knowledge/:id')
    .get(KnowledgeController.getKnowledgeByIdOrSlug)
    .put(authen.auth(), KnowledgeController.updateKnowledge)
    .delete(authen.auth(), KnowledgeController.deleteKnowledge);

router.route('/get-knowledge-update/:id')
  .get(authen.auth(), KnowledgeController.getKnowledgeToUpdate);

//router.route('/knowledge/:id/publish')
//    .post(authen.auth(), KnowledgeController.publishKnowledge);

router.route('/knowledge/:id/upvote')
    .get(KnowledgeController.getUsersUpvoted)
    .post(authen.auth(), KnowledgeController.upVote);

router.route('/knowledge/:id/downvote')
    .post(authen.auth(), KnowledgeController.downVote);

router.route('/knowledge/:id/bookmark')
    .post(authen.auth(), KnowledgeController.bookmark);

router.route('/knowledge/:id/remove-bookmark')
    .post(authen.auth(), KnowledgeController.removeBookmark);

router.route('/bookmarked')
  .get(authen.auth(), KnowledgeController.getBookmarkedKnowledge);

router.route('/check-slug-knowledge')
    .post(authen.auth(), KnowledgeController.checkSlugKnowledge);

router.route('/knowledge/:id/comments')
    .get(KnowledgeController.getCommentsByKnowledge)
    .post(authen.auth(), submit);

router.route('/me/knowledges')
    .get(authen.auth(), KnowledgeController.getMyKnowledges);

router.route('/knowledges/get_by_cate')
    .get(KnowledgeController.getKnowledgesByCategory);

router.route('/admin/knowledges')
    .get(isAdmin.auth(), KnowledgeController.adminGetKnowledge);

router.route('/admin/knowledges/approve')
    .post(isAdmin.auth(), KnowledgeController.censorKnowledge);

router.route('/admin/knowledges/reject')
    .post(isAdmin.auth(), KnowledgeController.rejectKnowledge);

router.route('/admin/knowledges/delete')
    .delete(isAdmin.auth(), KnowledgeController.adminDeleteKnowledge);

router.route('/admin/knowledges/:id/hard-sync')
  .post(isAdmin.auth(), KnowledgeController.hardSyncToElastic);

export default router;
