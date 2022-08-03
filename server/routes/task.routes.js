import { Router } from 'express';
import authen from '../libs/Auth/Auth.js';
import isAdmin from '../libs/Auth/isAdmin.js';
import * as TaskController from '../controllers/task.controller';
const router = new Router();

router.route('/tasks/getTaskByType/:type').get(authen.auth(), TaskController.getTaskByType);
router.route('/tasks/getActive').get(authen.auth(), TaskController.getActive);
router.route('/tasks/getTasks').get(authen.auth(), TaskController.getTasks);
router.route('/tasks/getTasksByType/:type').get(authen.auth(), TaskController.getTasksByType);
router.route('/tasks/getTasksByTypes').post(authen.auth(), TaskController.getTasksByTypes);
router.route('/tasks/updateTaskSocialMedia').post(authen.auth(), TaskController.updateTaskSocialMedia);
router.route('/tasks/addTaskProgram').post(authen.auth(), TaskController.addTaskProgram);
router.route('/tasks/getTotalTaskToken').get(authen.auth(), TaskController.getTotalTaskToken);
router.route('/tasks/admin-get-bounties')
  .get(isAdmin.auth(), TaskController.adminGetTasks);

router.route('/tasks/:id/admin-update-task')
  .post(isAdmin.auth(), TaskController.adminUpdateTask);

router.route('/tasks/:id/delete')
  .delete(authen.auth(), TaskController.userDeleteTask);

export default router;
