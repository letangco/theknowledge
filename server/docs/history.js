/**
 * @api {get} /api/history Get all History
 * @apiName GetAllHistory
 * @apiVersion 1.1.0
 * @apiGroup History
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Number} current_page Price Data
 * @apiSuccess {Number} last_page Tcoin's price by $
 * @apiSuccess {Number} total_items Point's price info
 * @apiSuccess {Array} data Point's price by $
 * @apiSuccess {String} data.action Has values: `deposit`, `withdrawal`, `transaction` when call/chat, `invite_code` when use invite code, `send` when send gift, `receive` when receive points, `exchange` when exchange from points to balance
 * @apiSuccess {Number} data.change `1` is increase, `0` is decrease.
 * @apiSuccess {String} data.account `balance` for $, `points` for points.
 * @apiSuccess {Number} data.amount Total amount input
 * @apiSuccess {Number} data.price Price per unit
 * @apiSuccess {Number} data.total Total output, after fee
 * @apiSuccess {Date} data.createdDate History created date
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "success": true,
     "current_page": 1,
     "last_page": 2,
     "total_items": 39,
     "data": [
         {
             "_id": "5a7444f2cf09b0e89c5d16fc",
             "owner": "58e61e310fc0f92c8685b223",
             "action": "exchange",
             "change": 1,
             "account": "balance",
             "detail": {
                 "price": 10,
                 "amount": 60,
                 "fee": 120,
                 "total": 480,
                 "createdAt": "2018-02-02T11:01:06.286Z",
                 "_id": "5a7444f2cf09b0e89c5d16fb",
                 "user": "58e61e310fc0f92c8685b223",
                 "__v": 0
             },
             "amount": 60,
             "total": 480,
             "price": 10,
             "createdDate": "2018-02-02T11:01:06.298Z",
             "__v": 0
         },
         ...
     ]
 }
 *
 */
