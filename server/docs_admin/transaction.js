/**
 * @api {get} /api/admin/transactions Admin get Transactions
 * @apiName AdminGetTransactions
 * @apiVersion 1.0.0
 * @apiGroup Transaction
 *
 * @apiParam {String} type (Optional) Filter by type. Only allow `call`, `chat`. If not provided, it will get all Transactions.
 * @apiParam {Integer} page (Optional) Pagination. If not provided, it defaults to `1`.
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Integer} current_page
 * @apiSuccess {Integer} last_page
 * @apiSuccess {Integer} total_items
 * @apiSuccess {Array} data  Array Transactions
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "current_page": 1,
 *    "last_page": 1,
 *    "total_items": 1,
 *    "data": [
 *        {
 *           "_id": "5917bb5da9b218250f44d4e1",
 *           "cuid": "cj2o265wt00skbj7mtwv8qnmx",
 *           "type": "call",
 *           "dateAdded": "2017-05-14T02:05:17.545Z",
 *           "duration": 2436,
 *           "sharersFunds": 0,
 *           "fees": 0,
 *           "tax": 0,
 *           "moneyEarnings": 0,
 *           "from": {
 *               "_id": "591559aea9b218250f44cff3",
 *               "cuid": "cj2lh8u7300f2bj7m4fisdb5d",
 *               "avatar": "https://scontent.xx.fbcdn.net/v/t1.0-1/c47.0.499.592/10255432_908232645877833_5892776927334614902_n.jpg?oh=4b8238c216136d62d6cf6c6a15481828&oe=59AD7838",
 *               "fullName": "Huynh Tuan",
 *               "userName": ""
 *           }
 *         }
 *    ]
 * }
 * 
 */