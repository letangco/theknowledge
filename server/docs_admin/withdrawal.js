/**
 * @api {get} /api/admin/withdrawals Admin get Withdrawals
 * @apiName AdminGetWithdrawals
 * @apiVersion 1.0.0
 * @apiGroup Withdrawals
 *
 * @apiParam {String} type (Optional) Filter by type. Only allow `manual` or `auto`. If not provided, it will get all Withdrawals.
 * @apiParam {Integer} page (Optional) Pagination. If not provided, it defaults to `1`.
 * @apiParam {String} status (Optional) Filter by status. Only allow `pending`, `approved`, `rejected`, `calcelled`. If not provided, it will get all Withdrawals.
 * @apiParam {String} method (Optional) Filter by payment method. Only allow `paypal`, `SWIFT`. If not provided, it will get all Withdrawals.
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Integer} current_page
 * @apiSuccess {Integer} last_page
 * @apiSuccess {Integer} total_items
 * @apiSuccess {Array} data  Array Withdrawals
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "current_page": 1,
 *    "last_page": 1,
 *    "total_items": 1,
 *    "data": [
 *       {
 *           "_id": "59688ee0b910ad0f10500345",
 *           "type": "manual",
 *           "paymentMethod": "paypal",
 *           "amount": 990,
 *           "detail": {
 *               "emailPaypal": "rexviet@gmail.com"
 *           },
 *           "__v": 0,
 *           "status": "pending",
 *           "requestDate": "2017-07-14T09:29:04.224Z",
 *           "user": {
 *               "_id": "594becb364ca120bdff64371",
 *               "cuid": "cj48mndxj0000cfemeibpnjup",
 *               "avatar": "",
 *               "fullName": "Viet Phung",
 *               "userName": "rexviet",
 *               "balance": 1000
 *           }
 *      }
 *    ]
 * }
 *
 */

/**
 * @api {post} /api/admin/withdrawals/approve Admin approve Withdrawals
 * @apiName AdminApproveWithdrawals
 * @apiVersion 1.0.0
 * @apiGroup Withdrawals
 *
 * @apiParam {String} id (For single Withdrawal) Withdrawal's id.
 * @apiParam {Array} ids (For multiple Withdrawals) Withdrawal's ids.
 *
 * @apiExample Example single Withdrawal usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 *
 * @apiExample Example multiple Withdrawals usage:
 * body:
 * {
 *    "ids": ["594becb364ca120bdff64371", "59606970412dad12aa344a2b"]
 * }
 *
 * @apiSuccess {Boolean} success The request request or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true
 * }
 *
 */

/**
 * @api {post} /api/admin/withdrawals/reject Admin reject Withdrawals
 * @apiName AdminRejectWithdrawals
 * @apiVersion 1.0.0
 * @apiGroup Withdrawals
 *
 * @apiParam {String} id (For single Withdrawal) Withdrawal's id.
 * @apiParam {Array} ids (For multiple Withdrawals) Withdrawal's ids.
 *
 * @apiExample Example single Withdrawal usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 *
 * @apiExample Example multiple Withdrawals usage:
 * body:
 * {
 *    "ids": ["594becb364ca120bdff64371", "59606970412dad12aa344a2b"]
 * }
 *
 * @apiSuccess {Boolean} success The request request or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true
 * }
 *
 */
