import { Router } from 'express';
import * as RoomValidator from './room.validator';
import * as RoomController from './room.controller';
import auth from '../../libs/Auth/Auth.js';

const router = new Router();

/**
 * @swagger
 * /rooms/join:
 *   get:
 *     summary: Get room join url
 *     tags:
 *       - Room
 *     parameters:
 *       - name: streamId
 *         in: query
 *         description: The stream id to get join url
 *         type: string
 *     responses:
 *       200:
 *         description: The room info
 *         schema:
 *           type: string
 *           description: The join url
 *           example: https://host.com/html5client/sessionToken=abc2313
 *       403:
 *         description: When data cannot be process. If got "Email is not verified" add verificationCode to body - verificationCode get from email
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               $ref: '#/definitions/ValidatorErrorItem'
 *           example: {
 *             success: false,
 *             errors: [
 *               {
 *                 "msg": "Permission denied",
 *                 "param": "permissionDenied",
 *               },
 *               {
 *                 "msg": "Room is not valid",
 *                 "param": "roomNotValid",
 *               },
 *               {
 *                 "msg": "Teacher membership was expired",
 *                 "param": "teacherMembershipExpired",
 *               },
 *             ]
 *           }
 *       404:
 *         description: When stream not found
 *         schema:
 *           type: string
 *           example: "Stream not found"
 *       422:
 *         description: Unprocessable Entity, the data is not valid
 *         schema:
 *           type: object
 *           properties:
 *             $ref: '#/definitions/ValidatorError'
 *           example: {
 *             success: false,
 *             errors: [
 *               {
 *                 "value": "123abc",
 *                 "msg": "Stream id is invalid",
 *                 "param": "streamId",
 *                 "location": "query"
 *               }
 *             ]
 *           }
 *       500:
 *         description: When got server exception
 *         schema:
 *           type: string
 *           example: "Internal server error"
 */

router.route('/join')
  .get(
    RoomValidator.getJoinUrl,
    auth.auth(),
    RoomController.getJoinUrl,
  );

router.route('/hook')
  .post(
    RoomController.callRoomHook,
  );

router.route('/hook/recorded')
  .post(
    RoomController.callRoomRecordedHook,
  );

export default router;
