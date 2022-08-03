import { Router } from 'express';
import * as SearchController from '../controllers/search.controller';
const router = new Router();

// Get expert by data search
// router.route('/search/').post(SearchController.getResultsSearch);
router.route('/search/keyWord/:limit').get(SearchController.getKeyWord);
router.route('/search/tesse-support/').get(SearchController.getTesseSupport);
router.route('/search/totalUser/').post(SearchController.getTotalSearch);
// router.route('/search/testTop/:skills').get(SearchController.getTestTop);
router.route('/search/suggest/:type/').get(SearchController.getSuggestV2);
router.route('/search/get-user-by-name/').get(SearchController.getUserByName);

router.get('/search/report', SearchController.getReport);


export default router;
