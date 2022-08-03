/**
 * @api {post} /api/payment/createWithdrawal Manual create a Withdrawal
 * @apiName ManualCreateWithdrawal
 * @apiVersion 1.1.0
 * @apiGroup Payment
 *
 * @apiParam {Object} withdrawal Withdrawal info
 * @apiParam {Object} withdrawal.methodType User's Payment method.
 * @apiParam {String} withdrawal.paymentType Only allow `single` or `full`
 * @apiParam {Number} withdrawal.amount  Money amount. If paymentType is `full`, need not to send amount field.
 *
 * @apiParamExample {json}
 *    {
 *     "withdrawal": {
 *       "paymentType": "single",
 *       "methodType": {
 *               "_id": "59b78dc19f1c9e3de5ca9b60",
 *               "user": "58e61e310fc0f92c8685b223",
 *               "type": "paypal",
 *               "detail": {
 *                   "email": "rexviet@gmail.com"
 *               },
 *               "__v": 0,
 *               "dateAdded": "2017-09-12T07:33:21.572Z"
 *           },
 *           "amount": 30
 *     }
 *   }
 *
 * @apiSuccess {Boolean} success The request request or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true
 *		}
 *
 */

/**
 * @api {get} /api/payment/get-full-withdrawl-status Check full withdrawal status
 * @apiName CheckFullWithdrawalStatus
 * @apiVersion 1.1.0
 * @apiGroup Payment
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data Current User's Full Withdrawal. If there is no Full Withdrawal, data will be empty object {}
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true,
 *		  "data": {}
 *		}
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "data": {
 *           "paymentMethod": {
 *               "_id": "59ccb8c3bb16cb445fddd20c",
 *               "user": "58e61e310fc0f92c8685b223",
 *               "type": "paypal",
 *               "detail": {
 *                   "email": "rexviet@gmail.com"
 *               },
 *               "__v": 0,
 *               "dateUpdated": "2017-09-28T08:58:16.241Z",
 *               "dateAdded": "2017-09-28T08:54:27.455Z"
 *           },
 *           "amount": null,
 *           "type": "fullAuto",
 *           "userId": "58e61e310fc0f92c8685b223"
 *       }
 *   }
 *
 */

/**
 * @api {post} /api/payment/cancel-full-withdrawl Cancel Full Withdrawal
 * @apiName CancelFullWithdrawal
 * @apiVersion 1.1.0
 * @apiGroup Payment
 *
 * @apiSuccess {Boolean} success The request request or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true
 *   }
 *
 */
