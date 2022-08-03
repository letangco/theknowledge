import { Router } from 'express';
import * as EdutekContactController from './edutekContact.controller';
import * as EdutekContactValidator from './edutekContact.validator';

const router = new Router();

/**
 * @swagger
 * /edutek-contacts:
 *   post:
 *     summary: Use for Edutek.io page, send contact
 *     tags:
 *       - Edutek contact
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         properties:
 *           name:
 *             type: string
 *           email:
 *             type: string
 *           phone:
 *             type: string
 *           message:
 *             type: string
 *         example: {
 *           name: 'David Teo',
 *           email: 'mail@mail.cx',
 *           phone: '0983653233',
 *           message: 'Hello, i need your solutions',
 *         }
 *     responses:
 *       200:
 *         description: Teacher dashboard report data
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
router.route('/')
  .post(
    EdutekContactValidator.sendEmailContact,
    EdutekContactController.sendEmailContact,
  );

export default router;
