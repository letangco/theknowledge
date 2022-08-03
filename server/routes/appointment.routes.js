import { Router } from 'express';
import * as AppointmentController from '../controllers/appointment.controller.js';
import auth from '../libs/Auth/Auth.js';
const router = new Router();

router.route('/appointment/bookAppointment').post(auth.auth(),AppointmentController.bookAppointment);
router.route('/appointment/add-comment').post(auth.auth(),AppointmentController.addComment);
router.route('/appointment/get-appointment/:cuid').get(AppointmentController.getAppointment);
router.route('/appointment/get-book-appointment/:token').get(AppointmentController.getBookAppointments);
router.route('/appointment/get-my-appointment/:token').get(AppointmentController.getMyAppointments);
router.route('/appointment/get-comment/:cuid').get(AppointmentController.getComment);
export default router;
