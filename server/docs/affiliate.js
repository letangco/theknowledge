/**
 * @api {get} /api/affiliate-histories Get own affiliate histories
 * @apiName GetOwnAffiliateHistory
 * @apiVersion 1.1.0
 * @apiGroup Affiliate
 *
 * @apiHeader {String} token User's token
 * @apiParam {Number} page {Query param} Page to query. If not provided, it default to `1`
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Number} current_page Current page.
 * @apiSuccess {Number} last_page Last page.
 * @apiSuccess {Number} total_items Total affiliate histories
 * @apiSuccess {Array} data List affiliate histories
 * @apiSuccess {String} data._id Affiliate history's id
 * @apiSuccess {Object} data.user User who use the affiliate link
 * @apiSuccess {String} data.code Affiliate code
 * @apiSuccess {Number} data.type Affiliate product type. `1` is `Call/Chat session`, `2` is `join course`
 * @apiSuccess {Object} data.orderObject The order that use the affiliate link
 * @apiSuccess {Object} data.orderObject.course The course that user had bought. Only exist if the `type` is `2`
 * @apiSuccess {Object} data.orderObject.sharer The expert that user had contacted. Only exist if the `type` is `1`
 * @apiSuccess {Number} data.commission Commission ratio.
 * @apiSuccess {Number} data.value Commission value.
 * @apiSuccess {Date} data.createdAt Commission created time.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "current_page": 1,
    "last_page": 1,
    "total_items": 1,
    "data": [
        {
            "_id": "5afe9da7973e666e13e5d845",
            "owner": "58cb83c6af26811724e555dd",
            "user": {
                "_id": "58cb9003af26811724e555e4",
                "cuid": "cj0di5ugr000ckk7mevi6etvf",
                "fullName": "Le Bao Chi",
                "expert": 0
            },
            "code": "5BW73Z",
            "type": 2,
            "orderObject": {
                "_id": "5afe9da6973e666e13e5d843",
                "course": {
                    "_id": "5afc54e2cd719a120f9d75ed",
                    "title": "test send mail",
                    "creator": "58cbd5fbaf26811724e557c7",
                    "category": "58bbff53c8f8e87c0b2ebd14",
                    "slug": "test-send-mail-jf8knbo",
                    "maxStudents": 12,
                    "language": "cj0ah7fsu003ayz7mbs3rp3sc",
                    "duration": 12,
                    "price": 12,
                    "thumbnail": "uploads/courses/test-send-mail-jf8knbo//1526486242013-images.jpeg",
                    "next_lesson_date": 0,
                    "start_date": 0,
                    "isLive": false,
                    "status": 2,
                    "created_at": "2018-05-16T15:57:22.023Z",
                    "tags": [
                        {
                            "name": "Drawing",
                            "_id": "58edd88610584c409e89b9b6",
                            "checked": true
                        }
                    ],
                    "description": {
                        "general": "1",
                        "yourKnowledge": "1",
                        "attendees": "1",
                        "purpose": "1"
                    },
                    "lectures": [
                        "58cbd5fbaf26811724e557c7"
                    ],
                    "__v": 0
                }
            },
            "commission": 0.2,
            "value": 2.4000000000000004,
            "createdAt": "2018-05-18T09:32:23.358Z",
            "__v": 0
        }
    ],
    "success": true
}
 *
 */
