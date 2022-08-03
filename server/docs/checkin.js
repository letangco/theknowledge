
/**
 * @api {post} /api/checkin-webinar Checkin Webinar
 * @apiName Checkin Webinar
 * @apiVersion 1.1.0
 * @apiGroup Checkin
 *
 * @apiParam {String} webinar (Body param) Webinar's id
 * @apiParam {String} ticketCode (Body param) ticket's code
 * @apiParam {String} user (Body param) user's id (Not required)
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data Checkin object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "__v": 0,
        "webinar": "5b31c70f34c2a63f91c0456b",
        "ticketCode": "Z26AH8XV",
        "_id": "5b3f30b887e599d52e0cb4cf",
        "updated_at": "2018-07-06T09:04:56.422Z",
        "created_at": "2018-07-06T09:04:56.421Z"
    }
}
 *
 */
