

/**
 * @api {post} /api/gifts/send Send Gifts
 * @apiName SendGifts
 * @apiVersion 1.1.0
 * @apiGroup Gift
 *
 * @apiParam {String} gift Gift type. Only allow `flowers`, `coffee`, `cars`, `houses`
 * @apiParam {Number} amount Number gifts to send
 * @apiParam {String} to Receiver's _id
 * @apiParam {String} liveStream Live Stream's _id
 *
 * @apiParamExample {json}
 *    {
 *     "gift": "flowers",
 *     "amount": 2,
 *     "to": "58cb83c6af26811724e555dd"
 *     "liveStream": "5a79921ecbd14d144ef6a678"
 *   }
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data User's gifts after sending
 * @apiSuccess {Number} data.flowers Total user's flowers
 * @apiSuccess {Number} data.coffee Total user's coffee
 * @apiSuccess {Number} data.cars Total user's cars
 * @apiSuccess {Number} data.houses Total user's houses
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "balance": 997390
    }
}
 *
 */

/**
 * @api {get} /api/gifts/price Get Gifts's price
 * @apiName GetGiftsPrice
 * @apiVersion 1.1.0
 * @apiGroup Gift
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data Price Data
 * @apiSuccess {Number} data.tcoin Tcoin's price by $
 * @apiSuccess {Object} data.points Point's price info
 * @apiSuccess {Number} data.points.price Point's price by $
 * @apiSuccess {Number} data.points.exchangeFee Percent fee to exchange from Points to Balance
 * @apiSuccess {Object} data.gifts Gifts's price by Points
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "tcoin": 0.01,
        "points": {
            "price": 10,
            "exchangeFee": 0.2
        },
        "gifts": {
            "flowers": 10,
            "coffee": 20,
            "cars": 30,
            "houses": 40
        }
    }
}
 *
 */
