/**
 * @api {post} /upload/upload-schedule-resource/ Add Schedule
 * @apiName AddSchedule
 * @apiDescription Thêm Đặt Lịch Nhé!! Ahihi
 * @apiVersion 1.1.0
 * @apiGroup Schedule Stream
 *
 * @apiParam {File} thumbnail File Thumbnail
 * @apiParam {Object} data Information Schedule
 * @apiParam {String} data.title Schedule Stream title
 * @apiParam {String} data.description Schedule Stream description
 * @apiParam {String} data.content Live Schedule content
 * @apiParam {Object} data.thumbnailSize Schedule thumbnailSize.
 * @apiParam {TimeStamp} data.dateSchedule Time Create Schedule. Exam: "1521892884835"
 * @apiParam {TimeStamp} data.dateLiveStream Time Live Schedule. Exam: "1522092884835"
 * @apiParam {Number} data.hour Hour Live Schedule
 * @apiParam {Number} data.minute Minute Live Schedule
 * @apiParam {String} data.timeZone TimeZone
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
        "time": {
            "dateLiveStream": "2018-03-25T15:48:04.835Z",
            "hour":5,
            "minute":20,
            "timer": 100000000,
            "timeZone":"+7:00"
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
        "createdAt": "2018-03-24T12:01:24.835Z"
    }
}
 *
 */

/**
 * @api {delete} /api/schedule-stream/:id Delete Schedule By User
 * @apiName RemoveSchedule
 * @apiDescription Xóa Đặt Lịch Nhé!! Ahihi
 * @apiVersion 1.1.0
 * @apiGroup Schedule Stream
 *
 * @apiParam {ObjectId} id ID Schedule Stream
 *
 * @apiSuccess {Code} status The status request
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {String} msg The Message Information.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "msg": "Delete Schedule Success!"
}
 *
 */


/**
 * @api {get} /api/get-schedule-stream?type=live&limit=2&page=1 Get All Schedule Stream
 * @apiName GetSchedule
 * @apiDescription Tất cả các Schedule !! Ahihi
 * @apiVersion 1.1.0
 * @apiGroup Schedule Stream
 *
 * @apiParam {token} token Token User (Yes or No)
 * @apiParam {String} type Type Query [live or courses] Default:"live"
 * @apiParam {Number} limit Limit Query Default:10
 * @apiParam {Number} page Page Query Default:1
 *
 * @apiSuccess {Code} status The status request
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Number} total Total Schedule Stream
 * @apiSuccess {Number} total_page Total page Schedule Stream
 * @apiSuccess {Number} current_page Page current Schedule Stream
 * @apiSuccess {Object} data The Schedule Stream object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "total": 2,
    "total_page": 1,
    "current_page": 1,
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

/**
 * @api {get} /api/get-schedule-stream-of-user?type=live&limit=2&page=1  Get Schedule Of User
 * @apiName Get Schedule Of User
 * @apiDescription Schedule của người dùng Nhé!! Ahihi
 * @apiVersion 1.1.0
 * @apiGroup Schedule Stream
 *
 * @apiParam {token} token Token User (Require)
 * @apiParam {String} type Type Query [live or courses] Default:"live"
 * @apiParam {Number} limit Limit Query Default:10
 * @apiParam {Number} page Page Query Default:1
 *
 * @apiSuccess {Code} status The status request
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Number} total Total Schedule Stream
 * @apiSuccess {Number} total_page Total page Schedule Stream
 * @apiSuccess {Number} current_page Page current Schedule Stream
 * @apiSuccess {Object} data The Schedule Stream object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "total": 2,
    "total_page": 1,
    "current_page": 1,
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
/**
 * @api {put} /upload/upload-schedule-resource/ Update a Schedule Stream
 * @apiName Update Schedule
 * @apiDescription Cập Nhật Đặt Lịch Nhé!! Ahihi
 * @apiVersion 1.1.0
 * @apiGroup Schedule Stream
 *
 * @apiParam {File} thumbnail File Thumbnail
 * @apiParam {Object} data Information Schedule
 * @apiParam {ObjectId} id ID Stream
 * @apiParam {String} data.title Schedule Stream title
 * @apiParam {String} data.description Schedule Stream description
 * @apiParam {String} data.content Live Schedule content
 * @apiParam {Object} data.thumbnailSize Schedule thumbnailSize.
 * @apiParam {TimeStamp} data.dateSchedule Time Create Schedule. Exam: "1521892884835"
 * @apiParam {TimeStamp} data.dateLiveStream Time Live Schedule. Exam: "1522092884835"
 * @apiParam {Number} data.hour Hour Live Schedule
 * @apiParam {Number} data.minute Minute Live Schedule
 * @apiParam {String} data.timeZone TimeZone
 *
 * @apiSuccess {Code} status The status request
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {String} msg The Message Information.
 * @apiSuccess {Object} data The Live Stream object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "msg": "Update Success!",
    "data": {
        "_id": "5ab35c1c3c6ee129ef7c3d1d",
        "user": "58cba2adaf26811724e55669",
        "title": "Update",
        "description": "asdasdasdasdsad",
        "thumbnail": "undefined/undefined",
        "thumbnailMeta": "undefined/undefined",
        "time": {
            "dateLiveStream": "2018-03-26T19:34:44.835Z",
            "timeZone": null,
            "timer": 200000000
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
        "__v": 0
    }
}
 *
 */


/**
 * @api {put} /api/schedule-stream/:id/live Update Live a Schedule Stream
 * @apiName Update Live Schedule
 * @apiDescription Khi người dùng Live Schedule!! Ahihi
 * @apiVersion 1.1.0
 * @apiGroup Schedule Stream
 *
 * @apiParam {ObjectId} id ID Schedule Stream (Require)
 * @apiParam {token} token Token User (Require)
 *
 * @apiSuccess {Code} status The status request
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {String} msg The Message Information.
 * @apiSuccess {Object} data The Live Stream object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "msg": "Update Live Success!",
    "data": {
        "_id": "5ab35c1c3c6ee129ef7c3d1d",
        "user": "58cba2adaf26811724e55669",
        "title": "Update",
        "description": "asdasdasdasdsad",
        "thumbnail": "undefined/undefined",
        "thumbnailMeta": "undefined/undefined",
        "time": {
            "dateLiveStream": "2018-03-26T19:34:44.835Z",
            "timeZone": null,
            "timer": 200000000
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
        "__v": 0
    }
}
 * */
/**
 * @api {get} /api/get-stream-home?type=live&limit=2&page=1 Get All Stream
 * @apiName Get Stream All Type
 * @apiDescription Load Tất Cả (Stream + Schedule)!!
 * @apiVersion 1.1.0
 * @apiGroup Schedule Stream
 *
 * @apiParam {token} token Token User (Yes or No)
 * @apiParam {String} type Type Query [live or courses] Default:"live"
 * @apiParam {Number} limit Limit Query Default:10
 * @apiParam {Number} page Page Query Default:1
 *
 * @apiSuccess {Code} status The status request
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Number} limit Limit Result
 * @apiSuccess {Number} total_living Total Living Stream
 * @apiSuccess {Number} total_schedule Total Live Stream
 * @apiSuccess {Object} list_stream The Live Stream object.
 * @apiSuccess {Object} list_schedule The Schedule Stream object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "limit": 2,
    "total_living": 1,
    "total_schedule": 2,
    "data_living": [
        {
            "_id": "5abcb3e4aa5210235315999a",
            "user": {
                "_id": "596f8f0295059504b20c2f7e",
                "cuid": "cj5b917dv0002xeo9s4v3p1n9",
                "expert": 0,
                "avatar": "uploads/avatar/cj5b917dv0002xeo9s4v3p1n9-1521787746592.jpeg",
                "fullName": "sou yang",
                "active": 1,
                "userName": "namnt"
            },
            "title": "aw",
            "description": "asa",
            "thumbnail": "uploads/stream-thumb/596f8f0295059504b20c2f7e/1522316259566-stream-thumbnail.png",
            "thumbnailMeta": "uploads/stream-thumb/596f8f0295059504b20c2f7e/1522316260110-stream-thumbnail-meta.png",
            "thumbnailSize": {
                "height": 720,
                "width": 1280
            },
            "time": {
                "isPlay": false
            },
            "type": "live_stream",
            "language": "un",
            "privacy": {
                "invited": [],
                "to": "public"
            },
            "totalPoints": 0,
            "totalViewed": 0,
            "like": 0,
            "classRoom": false,
            "isLive": true,
            "createdAt": "2018-03-29T09:37:40.188Z",
            "__v": 0,
            "liked": false,
            "currentViewer": 0,
            "currentViewerInfo": {},
            "invitedUser": {},
            "url": "namnt/videos/5abcb3e4aa5210235315999a"
        }
    ],
    "data_schedule": [
        {
            "_id": "5abc95052e91750e59ea1813",
            "user": {
                "_id": "5a0e9dbc5ac67d29520ddd66",
                "cuid": "cja3n7l3l00045ukn0temym2f",
                "expert": 1,
                "categories": [],
                "avatar": "https://lh6.googleusercontent.com/-9oYEwvO9DEo/AAAAAAAAAAI/AAAAAAAACvc/pEUxfyHkQV8/s96-c/photo.jpg",
                "fullName": "Than Pham",
                "active": 1,
                "userName": "thanpham"
            },
            "title": "thanthan",
            "description": "thsdfnsdfmds",
            "thumbnail": "uploads/schedule-thumb/5a0e9dbc5ac67d29520ddd66/1522308357987-bg-landingpage-png.png",
            "thumbnailMeta": "uploads/schedule-thumb/5a0e9dbc5ac67d29520ddd66/1522308357987-bg-landingpage-png.png",
            "time": {
                "dateLiveStream": "2018-03-30T17:10:00.000Z",
                "hour": 0,
                "minute": 10,
                "timeZone": "Africa/El_Aaiun",
                "timer": 113533,
                "isPlay": false
            },
            "type": "schedule",
            "language": "en",
            "privacy": {
                "invited": [],
                "to": "public"
            },
            "totalPoints": 0,
            "totalViewed": 0,
            "like": 0,
            "classRoom": false,
            "isLive": false,
            "createdAt": "2018-03-29T07:25:57.912Z",
            "__v": 0,
            "liked": false,
            "currentViewer": 0,
            "currentViewerInfo": {},
            "invitedUser": {},
            "url": "thanpham/videos/5abc95052e91750e59ea1813"
        },
        {
            "_id": "5ab8a6e02acf7b32eb48233b",
            "user": {
                "_id": "596f8f0295059504b20c2f7e",
                "cuid": "cj5b917dv0002xeo9s4v3p1n9",
                "expert": 0,
                "avatar": "uploads/avatar/cj5b917dv0002xeo9s4v3p1n9-1521787746592.jpeg",
                "fullName": "sou yang",
                "active": 1,
                "userName": "namnt"
            },
            "title": "test schedule after 55min- 26/3",
            "description": "Pellentesque in ipsum id orci porta dapibus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.",
            "thumbnail": "uploads/schedule-thumb/596f8f0295059504b20c2f7e/1522050784646-screen-shot-2018-03-24-at-4-53-49-pm-png.png",
            "thumbnailMeta": "uploads/schedule-thumb/596f8f0295059504b20c2f7e/1522050784646-screen-shot-2018-03-24-at-4-53-49-pm-png.png",
            "time": {
                "dateLiveStream": "2018-03-30T10:17:38.000Z",
                "hour": 15,
                "minute": 55,
                "timeZone": "+07:00",
                "timer": 88791,
                "isPlay": false
            },
            "type": "schedule",
            "language": "de",
            "privacy": {
                "invited": [],
                "to": "public"
            },
            "totalPoints": 0,
            "totalViewed": 0,
            "like": 0,
            "classRoom": false,
            "isLive": false,
            "createdAt": "2018-03-26T07:53:04.459Z",
            "__v": 0,
            "liked": false,
            "currentViewer": 0,
            "currentViewerInfo": {},
            "invitedUser": {},
            "url": "namnt/videos/5ab8a6e02acf7b32eb48233b"
        }
    ]
}
 */

/**
 * @api {get} /api/get-streams?type=live&limit=2&page=1 Get List Streams
 * @apiName Get Total Stream By Type
 * @apiDescription Load Total Stream (Stream + Schedule)!!
 * @apiVersion 1.1.0
 * @apiGroup Schedule Stream
 *
 * @apiParam {token} token Token User (Yes or No)
 * @apiParam {String} type Type Query [live or courses] Default:"live"
 * @apiParam {Number} limit Limit Query Default:10
 * @apiParam {Number} page Page Query Default:1
 *
 * @apiSuccess {Code} status The status request
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data Date Response
 * @apiSuccess {Number} data.total_page Total Page
 * @apiSuccess {Number} data.current_page Current Page
 * @apiSuccess {Number} data.total_stream Total Stream
 * @apiSuccess {Object} data.data Data
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "current_page": 1,
        "total_page": 1,
        "total_stream": 9,
        "data": [
            {
                "_id": "5ac337b8dfd8ce7ff3ce9ad8",
                "user": {
                    "_id": "596f8f0295059504b20c2f7e",
                    "cuid": "cj5b917dv0002xeo9s4v3p1n9",
                    "expert": 0,
                    "avatar": "uploads/avatar/cj5b917dv0002xeo9s4v3p1n9-1521787746592.jpeg",
                    "fullName": "************************",
                    "active": 1,
                    "userName": "namnt"
                },
                "title": "ht",
                "description": "hg",
                "thumbnail": "uploads/schedule-thumb/596f8f0295059504b20c2f7e/1522743224870-26904256_-1600763759993149-_5806490062565895045_n-jpg.jpg",
                "thumbnailMeta": "uploads/schedule-thumb/596f8f0295059504b20c2f7e/1522743224870-26904256_-1600763759993149-_5806490062565895045_n-jpg.jpg",
                "time": {
                    "dateCreate": "1522743224691",
                    "dateLiveStream": "1522746000000",
                    "date": "2018-04-03T08:13:22.000Z",
                    "hour": 16,
                    "minute": 0,
                    "utcOffset": 7,
                    "timeZone": "Asia/Bangkok",
                    "countryCode": "VN",
                    "timer": 2776,
                    "isPlay": false
                },
                "type": "schedule",
                "language": "un",
                "privacy": {
                    "invited": [],
                    "to": "public"
                },
                "totalPoints": 0,
                "totalViewed": 0,
                "like": 0,
                "classRoom": true,
                "isLive": false,
                "createdAt": "2018-04-03T08:13:44.884Z",
                "__v": 0,
                "liked": false,
                "currentViewer": 0,
                "currentViewerInfo": {},
                "invitedUser": {},
                "url": "namnt/videos/5ac337b8dfd8ce7ff3ce9ad8"
            }
        ]
    }
}
 * */
