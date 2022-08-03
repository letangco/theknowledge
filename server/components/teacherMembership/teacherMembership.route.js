import { Router } from 'express';
import * as TeacherMembershipValidator from './teacherMembership.validator';
import * as TeacherMembershipController from './teacherMembership.controller';
import auth from '../../libs/Auth/Auth.js';
import isAdmin from '../../libs/Auth/isAdmin.js';

const router = new Router();

/**
 * @swagger
 * /teacher-memberships/trial:
 *   post:
 *     summary: Registry teacher membership trial
 *     tags:
 *       - Teacher membership
 *     responses:
 *       200:
 *         description: Add membership trial for teacher succeed
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *       400:
 *         description: Bad Request
 *         schema:
 *           type: string
 *           example: Bad Request
 *       500:
 *         description: When got server exception
 *         schema:
 *           type: string
 *           example: Internal server error
 */
router.route('/trial')
  .post(
    auth.auth(),
    TeacherMembershipController.addTeacherMemberShipTrial,
  );

/**
 * @swagger
 * /teacher-memberships/add-manually:
 *   post:
 *     summary: Add teacher membership manually
 *     tags:
 *       - Teacher membership
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         properties:
 *           userId:
 *             type: string
 *           days:
 *             type: number
 *           note:
 *             type: string
 *         example: {
 *           userId: '5bea5655d05143d8a576a5a9',
 *           days: 10,
 *         }
 *     responses:
 *       200:
 *         description: Add membership manually for teacher succeed
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *       400:
 *         description: Bad Request
 *         schema:
 *           type: string
 *           example: Bad Request
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
 *                 "value": "abc",
 *                 "msg": "User id is not valid",
 *                 "param": "userId",
 *                 "location": "body"
 *               },
 *               {
 *                 "value": "abc",
 *                 "msg": "Number of days must be positive integer number",
 *                 "param": "days",
 *                 "location": "body"
 *               },
 *             ]
 *           }
 *       500:
 *         description: When got server exception
 *         schema:
 *           type: string
 *           example: Internal server error
 */
router.route('/add-manually')
  .post(
    TeacherMembershipValidator.addTeacherMemberShipManually,
    isAdmin.auth(),
    TeacherMembershipController.addTeacherMemberShipManually,
  );

/**
 * @swagger
 * /teacher-memberships/check:
 *   get:
 *     summary: Check user teacher membership available or not
 *     tags:
 *       - Teacher membership
 *     responses:
 *       200:
 *         description: Teacher membership available flag
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             payload:
 *               type: boolean
 *               description: Teacher membership available flag
 *               example: true
 *       400:
 *         description: Bad Request
 *         schema:
 *           type: string
 *           example: Bad Request
 *       500:
 *         description: When got server exception
 *         schema:
 *           type: string
 *           example: Internal server error
 */
router.route('/check')
  .get(
    auth.auth(),
    TeacherMembershipController.checkTeacherMemberShip,
  );

router.route('/teacher-memberships/check')
  .get(
    auth.auth(),
    TeacherMembershipController.checkTeacherMemberShip,
  );

/**
 * @swagger
 * /teacher-memberships:
 *   get:
 *     summary: Get teacher membership list
 *     tags:
 *       - Teacher membership
 *     parameters:
 *       - name: page
 *         in: query
 *         description: The page want to load
 *         type: string
 *         required: true
 *       - name: rowPerPage
 *         in: query
 *         description: The rowPerPage want to load
 *         type: string
 *       - name: search
 *         in: query
 *         description: Search by user fullName, email
 *         type: string
 *       - name: status
 *         in: query
 *         description: The status want to load (pending, active, expired, rejected, deleted, paused, failed)
 *         type: string
 *     responses:
 *       200:
 *         description: Teacher membership list
 *         schema:
 *           type: object
 *           example: {
 *             success: true,
 *             payload: {
 *               "data": [
 *                  {
 *                      "_id": "5ed62abaa65696008fbf2b34",
 *                      "user": {
 *                          "_id": "5971e17bc86d9212f1745a2e",
 *                          "cuid": "cj5drn2cg000tqpo99kkfkog7",
 *                          "avatar": "https://graph.facebook.com/1141308542631290/picture?type=large&redirect=true&width=720&height=720",
 *                          "fullName": "Thanh Nhàn",
 *                          "lastName": "Nhàn",
 *                          "firstName": "Thanh",
 *                          "userName": "ntnhan",
 *                          "teacherMembership": "1593685946746",
 *                          "telephone": "0987654321"
 *                      },
 *                      "type": "monthly",
 *                      "packageType": "trial",
 *                      "beginTime": 1591093946746,
 *                      "endTime": 1593685946746,
 *                      "status": "active"
 *                  }
 *               ],
 *               "currentPage": 1,
 *               "totalPage": 1,
 *               "totalItems": 1
 *             }
 *           }
 *       401:
 *         description: Unauthorized
 *         schema:
 *           type: string
 *           example: Unauthorized
 *       422:
 *         description: Unprocessable Entity, the data is not valid
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             errors:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/ValidatorErrorItem'
 *           example: {
 *             success: false,
 *             errors: [
 *               {
 *                 "msg": "Page number must be a number minimum is 1",
 *                 "param": "page",
 *               },
 *               {
 *                 "msg": "Row per page must be a number",
 *                 "param": "rowPerPage",
 *               }
 *             ]
 *           }
 *       500:
 *         description: When got server exception
 *         schema:
 *           type: string
 *           example: Internal server error
 */
router.route('/')
  .get(
    TeacherMembershipValidator.getTeacherMemberShip,
    isAdmin.auth(),
    TeacherMembershipController.getTeacherMembership,
  );
export default router;
