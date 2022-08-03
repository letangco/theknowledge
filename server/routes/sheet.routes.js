import { Router } from 'express';
import * as SheetController from '../controllers/sheet.controller';
import isAdmin from '../libs/Auth/isAdmin';
const router = new Router();

router.route('/sheet/add')
  .post(SheetController.addSheet);
router.route('/sheet/create')
  .post(SheetController.createSheet);
// router.route('/sheet/read')
//   .get(isAdmin.auth(),SheetController.readSheet);
// router.route('/sheet/update')
//   .put(isAdmin.auth(),SheetController.updateSheet);

export default router;
