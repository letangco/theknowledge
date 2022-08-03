import { Router } from 'express';
import * as PointTestController from '../controllers/pointTest.controller';

const router = new Router();


router.route('/point-test')
    .get(
        PointTestController.getListQuestionPointTest
    );

export default router;

