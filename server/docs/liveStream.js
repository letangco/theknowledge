/**
 * @api {post} /upload/upload-stream-resource/ Add a Live Stream
 * @apiName Add Live Stream
 * @apiDescription Thêm LiveStream!! Ahihi
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiParam {File} thumbnail File Thumbnail
 * @apiParam {Object} data Information Live
 * @apiParam {String} data.title Live Stream title
 * @apiParam {String} data.description Live Stream description
 * @apiParam {String} data.content Live Live content
 * @apiParam {Object} data.thumbnailSize Live thumbnailSize.
 *
 * @apiSuccess {Code} status The status request
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data The Live Stream object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "data": {
        "__v": 0,
        "user": "58cba2adaf26811724e55669",
        "title": "asdasds",
        "description": "asdasdasdasdsad",
        "thumbnail": "",
        "thumbnailMeta": "",
        "_id": "5ab355d5b376b025e02350fb",
        "type": "live_stream",
        "language": "pt",
        "privacy": {
            "invited": [],
            "to": "public"
        },
        "totalPoints": 0,
        "totalViewed": 0,
        "like": 0,
        "classRoom": true,
        "isLive": false,
        "createdAt": "2018-03-24T12:01:24.835Z"
    }
}
 *
 */

/**
 * @api {post} /api/live-stream/:id/comments Add a Comment to Live Stream
 * @apiName CommentToLiveStream
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiParam {String} id Live Stream's _id
 * @apiParam {Number} videoTime Live Stream video time
 * @apiParam {String} content Live Stream content
 *
 * @apiParamExample {json}
 *    {
 *     "videoTime": 0,
 *     "content": "test live stream comment"
 *   }
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data The Comment of Live Stream.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "__v": 0,
        "user": "58e61e310fc0f92c8685b223",
        "liveStream": "5a5c1ede6cb0bc7b4a48fe61",
        "content": "test comment",
        "videoTime": 0,
        "_id": "5a5dc90a81f67dc3aaa91d0a",
        "createdAt": "2018-01-16T09:42:34.531Z"
    }
}
 *
 */

/**
 * @api {get} /api/live-stream/:id/comments Get Live Stream Comments
 * @apiName GetLiveStreamComments
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiParam {String} id Live Stream's _id
 * @apiParam {Number} page Page to query
 *
 * @apiParamExample {curl} Request-Example:
 *  curl "localhost:8001/api/live-stream/5a5c1ede6cb0bc7b4a48fe61/comments"
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Number} current_page Current query
 * @apiSuccess {Number} last_page Last page
 * @apiSuccess {Number} total_items Total comments
 * @apiSuccess {Array} data List Comment of Live Stream.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "current_page": 1,
    "last_page": 1,
    "total_items": 2,
    "data": [
        {
            "_id": "5a5dc90a81f67dc3aaa91d0a",
            "user": {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1504847136613.jpeg",
                "fullName": "Phung Viet",
                "userName": "rexviet"
            },
            "liveStream": "5a5c1ede6cb0bc7b4a48fe61",
            "content": "test comment",
            "videoTime": 0,
            "createdAt": "2018-01-16T09:42:34.531Z",
            "__v": 0
        },
        ...
    ]
}
 *
 */


/**
 * @api {get} /api/live-stream/ Get Living Streams
 * @apiName GetLivingStreams
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiParam {Number} page Page to query
 *
 * @apiParamExample {curl} Request-Example:
 *  curl "localhost:8001/api/live-stream?page=1"
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Number} current_page Current query
 * @apiSuccess {Number} last_page Last page
 * @apiSuccess {Number} total_items Total comments
 * @apiSuccess {Array} data List of living streams.
 * @apiSuccess {String} data._id Stream's id.
 * @apiSuccess {Object} data.user Streamer's info.
 * @apiSuccess {String} data.user._id Streamer's id.
 * @apiSuccess {String} data.user.cuid Streamer's cuid.
 * @apiSuccess {Number} data.user.expert Streamer is expert or not.
 * @apiSuccess {String} data.user.avatar Streamer's avatar.
 * @apiSuccess {String} data.user.fullName Streamer's full name.
 * @apiSuccess {String} data.user.userName Streamer's username.
 * @apiSuccess {String} data.content Stream's url.
 * @apiSuccess {String} data.title Stream's title.
 * @apiSuccess {String} data.description Stream's description.
 * @apiSuccess {Object} data.privacy Stream's privacy.
 * @apiSuccess {Boolean} data.isLive Stream's living status.
 * @apiSuccess {Date} data.createdAt Stream's created time.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "last_page": 1,
    "current_page": 1,
    "total_items": 4,
    "data": [
        {
            "_id": "5a5c28bcb41a8381aee55536",
            "user": {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1504847136613.jpeg",
                "fullName": "Phung Viet",
                "userName": "rexviet"
            },
            "content": "test live stream content 2",
            "title": "test live stream title 2 ",
            "description": "test live stream description2 ",
            "privacy": {
                "to": "public"
            },
            "isLive": true,
            "createdAt": "2018-01-15T04:06:20.781Z",
            "__v": 0
        },
        ...
    ]
}
 *
 */

/**
 * @api {get} /api/live-stream/:id Get Stream by id
 * @apiName GetStreamById
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiParam {String} id Stream's id
 *
 * @apiParamExample {curl} Request-Example:
 *  curl "localhost:8001/api/live-stream/5a5c28bcb41a8381aee55536"
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data List of living streams.
 * @apiSuccess {String} data._id Stream's id.
 * @apiSuccess {Object} data.user Streamer's info.
 * @apiSuccess {String} data.user._id Streamer's id.
 * @apiSuccess {String} data.user.cuid Streamer's cuid.
 * @apiSuccess {Number} data.user.expert Streamer is expert or not.
 * @apiSuccess {String} data.user.avatar Streamer's avatar.
 * @apiSuccess {String} data.user.fullName Streamer's full name.
 * @apiSuccess {String} data.user.userName Streamer's username.
 * @apiSuccess {String} data.content Stream's url.
 * @apiSuccess {String} data.title Stream's title.
 * @apiSuccess {String} data.description Stream's description.
 * @apiSuccess {Object} data.privacy Stream's privacy.
 * @apiSuccess {Boolean} data.isLive Stream's living status.
 * @apiSuccess {Date} data.createdAt Stream's created time.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
            "_id": "5a5c28bcb41a8381aee55536",
            "user": {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1504847136613.jpeg",
                "fullName": "Phung Viet",
                "userName": "rexviet"
            },
            "content": "test live stream content 2",
            "title": "test live stream title 2 ",
            "description": "test live stream description2 ",
            "privacy": {
                "to": "public"
            },
            "isLive": true,
            "createdAt": "2018-01-15T04:06:20.781Z",
            "__v": 0
    }
}
 *
*/

/**
* @api {put} /api/live-stream/:id/privacy Add Invited and Update Privacy Stream by id
* @apiName GetStreamById
* @apiVersion 1.1.0
* @apiGroup LiveStream
*
* @apiParam {Object} privacy Stream's Privacy
* @apiParam {String} privacy.to Stream's status
* @apiParam {String} privacy.invited Stream's invited
*
* @apiParamExample {json}
*{
*	"privacy":{
*		"to":"custom",
*		"invited":["58cb926daf26811724e555ef"]
*	}
*}
*
* @apiParamExample {curl} Request-Example:
*  curl "localhost:8001/api/live-stream/5a71a4429f4ad23b6ced7bb2/privacy"
*
* @apiSuccess {Boolean} success The request request or not.
* @apiSuccess {Object} data List of living streams.
* @apiSuccess {String} data._id Stream's id.
* @apiSuccess {Object} data.user Streamer's info.
* @apiSuccess {String} data.user._id Streamer's id.
* @apiSuccess {String} data.user.cuid Streamer's cuid.
* @apiSuccess {Number} data.user.expert Streamer is expert or not.
* @apiSuccess {String} data.user.avatar Streamer's avatar.
* @apiSuccess {String} data.user.fullName Streamer's full name.
* @apiSuccess {String} data.user.userName Streamer's username.
* @apiSuccess {String} data.content Stream's url.
* @apiSuccess {String} data.title Stream's title.
* @apiSuccess {String} data.description Stream's description.
* @apiSuccess {Object} data.privacy Stream's privacy.
* @apiSuccess {Boolean} data.isLive Stream's living status.
* @apiSuccess {Date} data.createdAt Stream's created time.
*
* @apiSuccessExample Success-Response:
*     HTTP/1.1 200 OK
{
    "success": true,
    "data": {
        "_id": "5a71a4429f4ad23b6ced7bb2",
        "user": "5a0e9dbc5ac67d29520ddd66",
        "content": "Default content loaded",
        "title": "",
        "__v": 0,
        "language": "vi",
        "privacy": {
            "to": "custom",
            "invited": [
                "58cb926daf26811724e555ef"
            ]
        },
        "totalPoints": 0,
        "totalViewed": 0,
        "like": 0,
        "isLive": false,
        "createdAt": "2018-01-31T11:10:58.762Z"
    }
}
*/

/**
 * @api {post} /api/live-stream/:id/interact Interact Webinar
 * @apiName InteractWebinar
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiParam {String} id {URL param} Stream's id
 * @apiParam {String} interact {Body param} Interaction. Only allow `going`, `interested` and `not`
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Object} data Interaction detail. If the `interact` param is `not`, there is no data
 *
 * @apiSuccessExample Missing-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "__v": 0,
        "interact": "going",
        "user": "58e61e310fc0f92c8685b223",
        "webinar": "5b29cada048844059d570e12",
        "_id": "5b29cf393b9e82698c849168",
        "created_at": "2018-06-20T03:51:21.671Z"
    }
}
 */



/**
 * @api {get} /api/live-stream/check-buy Check buy-able
 * @apiName CheckBuyAble
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiHeader {String} token User's token
 * @apiParam {String} ticket {Query param} Ticket's id
 * @apiParam {Number} quantity {Query param} Quantity to buy
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Check result
 * @apiSuccess {Number} data.balance Balance currently.
 * @apiSuccess {Boolean} data.buyAble Buy-able
 * @apiSuccess {String} data.currency Currency
 * @apiSuccess {String} data.reason If the `buyAble` is `false`, this is the reason why. Only have value `missing` or `out_of_stock`.
 * @apiSuccess {Number} data.missing If `reason` is `missing`, this will show the missing money
 *
 * @apiSuccessExample Missing-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "balance": 6,
        "buyAble": false,
        "currency": "USD",
        "missing": 139994,
        "reason": "missing"
    }
}
 * @apiSuccessExample OutOfStock-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "balance": 6,
        "buyAble": false,
        "currency": "USD",
        "reason": "out_of_stock"
    }
}
 *
 * @apiErrorExample Buy-Able-Response:
 *     HTTP/1.1 400 Bad Request
 {
    "success": true,
    "data": {
        "balance": 99940349.75,
        "buyAble": true,
        "currency": "USD"
    }
}
 */

/**
 * @api {post} /api/live-stream/buy-ticket?ticket=&quantity= Buy Webinar Ticket
 * @apiName BuyWebinarTicket
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiHeader {String} token User's token
 * @apiParam {String} ticket {Query param} Ticket's id
 * @apiParam {Number} quantity {Query param} Quantity to buy
 * @apiParam {Object} contactInfo {Body param} Contact info
 * @apiParam {String} contactInfo.fullName {Body param} Contact full name
 * @apiParam {String} contactInfo.email {Body param} Contact email
 * @apiParam {String} contactInfo.phoneNumber {Body param} Contact phone number
 * @apiParam {String} code Code coupon.
 *
 * @apiParamExample {curl} Request-Example:
 *  curl "localhost:8001/api/live-stream/buy-ticket?ticket=5b31c70f34c2a63f91c0456c&quantity=3"
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data Remain balance and list tickets
 * @apiSuccess {Number} data.balance Remain balance after buy tickets
 * @apiSuccess {Array} data.booked List booked tickets
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "balance": 99020349.75,
        "booked": [
            {
                "__v": 0,
                "webinar": "5b31c70f34c2a63f91c0456b",
                "user": "58e61e310fc0f92c8685b223",
                "ticket": "5b31c70f34c2a63f91c0456c",
                "price": 20000,
                "uniqueCode": "B2RB8WLN",
                "_id": "5b3499a5f815f65245f87fde",
                "priceRate": 23000,
                "currency": "VND",
                "created_at": "2018-06-28T08:17:41.896Z",
                "creator_receive": 14000,
                "fee": 6000,
                "tax": 0
            },
            ...
        ]
    }
}
 *
 */

/**
 * @api {get} /api/live-stream/:id/interact Get Webinar's interactions list
 * @apiName GetWebinarInteractions
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiParam {String} id {URL param} Stream's id
 * @apiParam {String} interact {Query param} Interaction to filter
 * @apiParam {Number} page {Query param} Page to query
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Number} current_page Current page.
 * @apiSuccess {Number} last_page The Last page.
 * @apiSuccess {Number} total_items Total interaction items.
 * @apiSuccess {Array} data Interactions list.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "current_page": 1,
    "last_page": 1,
    "total_items": 1,
    "data": [
      {
        "_id": "5b29cf393b9e82698c849168",
        "interact": "going",
        "user": {
          "_id": "58e61e310fc0f92c8685b223",
          "cuid": "cj16ab8360031sm7mhs2wekuk",
          "expert": 1,
          "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1525337482267.jpeg",
          "fullName": "Phung Viet",
          "userName": "rexviet"
        },
        "webinar": "5b29cada048844059d570e12",
        "created_at": "2018-06-20T03:51:21.671Z",
        "__v": 0
      },
      ...
    ],
    "success": true
 }
 */




/**
 * @api {get} /api/live-stream/booked Get Booked Webinars
 * @apiName Get Booked Webinar
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiHeader {String} token User's token
 *
 * @apiParamExample {curl} Request-Example:
 *  curl "localhost:8001/api/live-stream/booked"
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Array} data Remain balance and list tickets
 * @apiSuccess {Number} current_page Current page
 * @apiSuccess {Number} last_page Last page
 * @apiSuccess {Number} total_items Total items
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "current_page": 1,
    "last_page": 1,
    "total_items": 2,
    "data": [
        {
            "_id": "5b31c70f34c2a63f91c0456b",
            "user": {
                "_id": "5a339bbc7a7675444f31c63e",
                "cuid": "cjb7ql5xk002nhrkncenyndrn",
                "expert": 0,
                "avatar": "https://lh6.googleusercontent.com/-ns9p6MqJQJI/AAAAAAAAAAI/AAAAAAAAAqA/WCBxM-qG1uU/s96-c/photo.jpg",
                "fullName": "Nam1 Nguyễn",
                "active": 1,
                "userName": "nam"
            },
            "title": "title",
            "description": "hello",
            "thumbnail": "cache/schedule-thumb/5a339bbc7a7675444f31c63e/1529988879065-34837317_-636426453366586-_295439534592622592_n-jpg-650x650.jpg",
            "thumbnailMeta": "uploads/schedule-thumb/5a339bbc7a7675444f31c63e/1529988879065-34837317_-636426453366586-_295439534592622592_n-jpg.jpg",
            "time": {
                "dateCreate": "1529988879185",
                "dateLiveStream": "1530291600000",
                "date": "2018-06-29T17:00:00.000Z",
                "hour": 0,
                "minute": 0,
                "utcOffset": 420,
                "timeZone": "Asia/Bangkok",
                "countryCode": "VN",
                "timer": 302721,
                "isPlay": false
            },
            "type": "schedule",
            "language": "et",
            "privacy": {
                "invited": [],
                "to": "ticket"
            },
            "totalPoints": 0,
            "totalViewed": 0,
            "like": 0,
            "classRoom": false,
            "isLive": false,
            "createdAt": "2018-06-26T04:54:39.073Z",
            "__v": 1,
            "status": "stopped",
            "booked": [
                "596f8f0295059504b20c2f7e"
            ],
            "liked": false,
            "currentViewer": 0,
            "currentViewerInfo": {},
            "invitedUser": {},
            "url": "nam/videos/5b31c70f34c2a63f91c0456b",
            "tickets": [
                {
                    "_id": "5b31c70f34c2a63f91c0456c",
                    "webinar": "5b31c70f34c2a63f91c0456b",
                    "price": 20000,
                    "quantity": 20,
                    "sold": 3,
                    "__v": 0
                }
            ]
        },
        ...
    ],
    "success": true
}
 *
 */

/**
 * @api {get} /api/live-stream/:id/tickets Get booked tickets by Webinar
 * @apiName GetBookedTicketsByWebinar
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiHeader {String} token User's token
 * @apiParam {String} id Webinar's id
 *
 * @apiParamExample {curl} Request-Example:
 *  curl "localhost:8001/api/live-stream/5b31c70f34c2a63f91c0456b/tickets"
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Array} data List tickets
 * @apiSuccess {String} data.uniqueCode Ticket's unique code
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "success": true,
     "data": [
         {
             "_id": "5b39df5e018d007a0d6720e8",
             "uniqueCode": "U6JA7ZKZ"
         },
         {
             "_id": "5b39df5e018d007a0d6720e9",
             "uniqueCode": "BZ6UH09K"
         },
         {
             "_id": "5b39df7f018d007a0d6720ed",
             "uniqueCode": "ZDVKU6GY"
         }
     ]
 }
 *
 */

/**
 * @api {post} /api/live-stream/:id/validate-ticket Validate webinar ticket
 * @apiName Validate Webinar Ticket
 * @apiVersion 1.1.0
 * @apiGroup LiveStream
 *
 * @apiParam {String} id (URL param) Webinar's id
 * @apiParam {String} ticket (Query param) ticket's code
 *
 * @apiParamExample {curl} Request-Example:
 *  curl "localhost:8001/api/live-stream/5b31c70f34c2a63f91c0456b/validate-ticket?ticket="
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Boolean} valid The ticket valid or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "success": true,
     "valid": true/false
 }
 *
 */
