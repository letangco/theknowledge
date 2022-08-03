/**
 * @api {get} /withdrawal Get own Wihdrawals
 * @apiName GetOwnWithdrawals
 * @apiVersion 1.1.0
 * @apiGroup Wihdrawal
 *
 * @apiParam {Number} from `Optional`. From Date (timestamp). If not provided or invalid date, it's default to the first date of current month.
 * @apiParam {Number} to `Optional`. To Date (timestamp).If not provided or invalid date, it's default to the last date of current month.
 * @apiParam {String} type `Optional`. Withdrawal's type. Only allow `single`, `full` and `fullAuto`. If not provided, it's will get all types.
 * @apiParam {String} status `Optional`. Withdrawal's status. Only allow `pending`, `approved`, `rejected`, `canceled` and `paid`. If not provided, it's will get all statuses.
 *
 * @apiSuccess {Boolean} success The request success or not
 * @apiSuccess {Number} current_page Current page
 * @apiSuccess {Number} last_page Last page
 * @apiSuccess {Number} total_items Total Withdrawals
 * @apiSuccess {Number} total_amount Total Withdrawals's amount
 * @apiSuccess {Array} data Array Withdrawals
 * @apiSuccess {String} data._id Withdrawl's id
 * @apiSuccess {Object} data.paymentMethod Withdrawl's payment method
 * @apiSuccess {String} data.paymentMethod._id Payment method's id
 * @apiSuccess {String} data.paymentMethod.type Payment method's type
 * @apiSuccess {Object} data.paymentMethod.detail Payment method's detail
 * @apiSuccess {Date} data.paymentMethod.dateAdded Payment method's date added
 * @apiSuccess {Number} data.amount Withdrawl's amount
 * @apiSuccess {String} data.type Withdrawl's type
 * @apiSuccess {Date} data.requestDate Withdrawl's request Date
 * @apiSuccess {Date} data.checkedDate Withdrawl's checked Date
 * @apiSuccess {Date} data.canceledDate Withdrawl's canceled Date (Only status is `canceled`)
 * @apiSuccess {Date} data.paidDate Withdrawl's paid Date (Only status is `paid`)
 * @apiSuccess {String} data.status Withdrawl's status
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *          "current_page": 1,
 *          "last_page": 1,
 *          "total_items": 3,
 *          "total_amount": 180,
 *          "data": [
 *              {
 *                  "_id": "59ce2738523499a7171d674b",
 *                  "paymentMethod": {
 *                      "_id": "59ccc943f6cb90454b2b826f",
 *                      "user": "58e61e310fc0f92c8685b223",
 *                      "type": "paypal",
 *                      "detail": {
 *                          "email": "rexviet4@gmail.com"
 *                      },
 *                      "__v": 0,
 *                      "dateAdded": "2017-09-28T10:04:51.324Z"
 *                  },
 *                  "amount": 90,
 *                  "type": "fullAuto",
 *                  "userId": "58e61e310fc0f92c8685b223",
 *                  "checkedDate": "2017-09-29T10:58:00.638Z",
 *                  "__v": 0,
 *                  "status": "approved",
 *                  "requestDate": "2017-09-29T10:58:00.650Z"
 *              },
 *              {
 *                  "_id": "59ce26482b73ada67ec43e1f",
 *                  "paymentMethod": {
 *                      "_id": "59ccc943f6cb90454b2b826f",
 *                      "user": "58e61e310fc0f92c8685b223",
 *                      "type": "paypal",
 *                      "detail": {
 *                          "email": "rexviet4@gmail.com"
 *                      },
 *                      "__v": 0,
 *                      "dateAdded": "2017-09-28T10:04:51.324Z"
 *                  },
 *                  "amount": 80,
 *                  "type": "full",
 *                  "userId": "58e61e310fc0f92c8685b223",
 *                  "checkedDate": "2017-09-29T10:54:00.655Z",
 *                  "__v": 0,
 *                  "status": "approved",
 *                  "requestDate": "2017-09-29T10:54:00.662Z"
 *              }
 *          ]
 *      }
 *
 */

/**
 * @api {post} /api/withdrawal/:id/cancel Cancel a single withdrawal
 * @apiName CancelSingleWithdrawal
 * @apiVersion 1.1.0
 * @apiGroup Wihdrawal
 *
 * @apiParam {String} id Withdrawal's id
 *
 * @apiSuccess {Boolean} success The request success or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true
 *		}
 *
 */
