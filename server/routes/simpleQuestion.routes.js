import { Router } from 'express';
import * as SimpleQuestionController from '../controllers/simpleQuestion.controller';
const router = new Router();

router.post('/simple-questions/add', SimpleQuestionController.add);

router.get('/simple-questions/get', SimpleQuestionController.getData);

router.get('/simple-questions/summary', SimpleQuestionController.summary);

export default router;
