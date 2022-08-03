/**
 * @api {get} /api/point-test Get All Point test question by User
 * @apiName GetListQuestionPointTest
 * @apiDescription All Question point test by user
 * @apiVersion 1.1.0
 * @apiGroup Point Test
 *
 * @apiSuccess {Boolean} status The status request
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Number} totalItem Total Question Point Test
 * @apiSuccess {Number} totalPages Total page Question Point Test
 * @apiSuccess {Number} page Page current Question Point Test
 * @apiSuccess {Number} item item of page current
 * @apiSuccess {Object} data The Question Point Test object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "totalItem": 5,
    "totalPages": 1,
    "page": 1,
    "item": 5,
    "data": [
        {
            "_id": "5ab35c1a3c6ee129ef7c3d1c",
            "user": {
                "_id": "58cba2adaf26811724e55669",
                "cuid": "cj0dl08pn0015kk7myjy7mz2y",
                "fullName": "Customer Support",
                "expert": 0,
                "active": 1,
                "avatar": "/uploads/avatar/cj0dl08pn0015kk7myjy7mz2y-1491402677723.jpeg",
                "userName": ""
            },
            "title": "asdasds",
            "description": "asdasdasdasdsad",
            "thumbnail": "undefined/undefined",
            "thumbnailMeta": "undefined/undefined",
            "time": {
                "dateLiveStream": "2018-03-25T15:48:04.835Z",
                "timer": 100000000
            },
            "type": "schedule",
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
            "createdAt": "2018-03-24T12:01:24.835Z",
            "__v": 0,
            "liked": false,
            "currentViewer": 0,
            "currentViewerInfo": {},
            "invitedUser": {},
            "url": "cj0dl08pn0015kk7myjy7mz2y/videos/5ab35c1a3c6ee129ef7c3d1c"
        }
    ]
 }
 *
 */