/**
 * @api {post} /api/courses/create Create Course
 * @apiName CreateCourse
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiParam {String} title Course's title
 * @apiParam {Array} lectures Lecture's id
 * @apiParam {String} description Course's description
 * @apiParam {String} category Course's category id
 * @apiParam {String} language Course's language
 * @apiParam {Array} tags Course's tags, like Knowledge's tags
 * @apiParam {Number} maxStudents Max students can join the course
 * @apiParam {Number} duration Estimate minute each lesson
 * @apiParam {Number} price Course's price
 * @apiParam {Array} lessons Course's lessons. Like schedule stream.
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Course's data
 * @apiSuccess {String} data._id unique ID of the Course.
 * @apiSuccess {String} data.creator Course's creator id.
 * @apiSuccess {Number} data.maxStudents Max students can join the course
 * @apiSuccess {String} data.language Course's language
 * @apiSuccess {Number} data.duration Estimate minute each lesson
 * @apiSuccess {Number} data.price Course's price
 * @apiSuccess {String} data.slug Course's slug
 * @apiSuccess {Number} data.start_date Course's first lesson start date.
 * @apiSuccess {String} status Course's status. Can be `waiting`, `rejected`, `up_coming`, `on_going`, `finish`.
 * @apiSuccess {String} created_at Course's created date as ISOString
 * @apiSuccess {Array} tags Course's tags
 * @apiSuccess {Array} lectures Course's lectures's ids
 * @apiSuccess {Array} lessons Course's lessons objects.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "__v": 0,
        "title": "Trở thành tỷ phú thế giới trước tuổi 30",
        "creator": "58e61e310fc0f92c8685b223",
        "maxStudents": 5,
        "language": "en",
        "duration": 30,
        "price": 100,
        "slug": "tro-thanh-ty-phu-the-gioi-truoc-tuoi-30-b30h1em",
        "_id": "5acf148cfcc7b9a46ce58d13",
        "start_date": 1546214400000,
        "status": "waiting",
        "created_at": "2018-04-12T08:10:52.871Z",
        "tags": [],
        "lectures": [
            "58cb83c6af26811724e555dd",
            "58e61e310fc0f92c8685b223"
        ],
        "lessons": [
            {
                "__v": 0,
                "user": "58e61e310fc0f92c8685b223",
                "title": "Bài 1",
                "course": "5acf148cfcc7b9a46ce58d13",
                "_id": "5acf148cfcc7b9a46ce58d14",
                "time": {
                    "dateCreate": "1522641864698",
                    "dateLiveStream": "1546232400000",
                    "date": "2018-04-02T04:04:01.000Z",
                    "hour": 12,
                    "minute": 0,
                    "utcOffset": 420,
                    "timeZone": "Asia/Bangkok",
                    "countryCode": "VN",
                    "timer": 23590536,
                    "isPlay": false
                },
                "type": "schedule",
                "language": "vi",
                "privacy": {
                    "invited": [
                        "58cb83c6af26811724e555dd",
                        "58e61e310fc0f92c8685b223"
                    ],
                    "to": "custom"
                },
                "totalPoints": 0,
                "totalViewed": 0,
                "like": 0,
                "classRoom": true,
                "isLive": false,
                "createdAt": "2018-04-12T08:10:52.970Z"
            },
            ...
        ]
    }
}
 *
 */


/**
 * @api {post} /api/courses/:id/join Join Course
 * @apiName JoinCourse
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiHeader {String} token User's token
 * @apiParam {String} id {URL param} Course's id
 * @apiParam {String} code Code coupon
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Join Course result
 * @apiSuccess {Number} data.balance Balance after join course.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "balance": 690
    }
}
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 {
    "status": 400,
    "error": "Not enough balance.",
    "missing": 300,
    "success": false
}
 */


/**
 * @api {get} /api/courses Get List Courses
 * @apiName GetListCourses
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiParam {Number} page {Query param} Page to query. If not provided, it default to `1`
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Number} total_items Total courses
 * @apiSuccess {Number} current_page Current page
 * @apiSuccess {Number} last_page Last page
 * @apiSuccess {Array} data List courses
 * @apiSuccess {String} data.id Course's id
 * @apiSuccess {String} data.title Course's title
 * @apiSuccess {Object} data.creator Course's creator
 * @apiSuccess {String} data.creator._id User's id
 * @apiSuccess {String} data.creator.cuid User's cuid
 * @apiSuccess {Number} data.creator.expert User is expert or not.
 * @apiSuccess {Array} data.creator.categories User's category
 * @apiSuccess {String} data.creator.avatar User's avatar
 * @apiSuccess {String} data.creator.fullName User's full name
 * @apiSuccess {Number} data.creator.active User's active status
 * @apiSuccess {String} data.creator.userName User's username
 * @apiSuccess {Number} data.price Course's price
 * @apiSuccess {String} data.slug Course's slug
 * @apiSuccess {String} data.start_date Course's first lesson start date as mili seconds
 * @apiSuccess {String} data.status Course's status. Can be `waiting`, `rejected`, `up_coming`, `on_going`, `finish`.
 * @apiSuccess {Number} data.registered Number students has registered
 * @apiSuccess {Boolean} data.joined Is the current user joined this course or not.
 * @apiSuccess {Boolean} data.waiting_refund Is this user wating to refund this course.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "total_items": 1,
    "data": [
        {
            "_id": "5acf10d0fa2f5aa4447c0c24",
            "title": "updated",
            "creator": {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "categories": [
                    {
                        "title": "Web Development",
                        "slug": "web-development"
                    }
                ],
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1522397450686.jpeg",
                "fullName": "Phung Viet",
                "active": 1,
                "userName": "rexviet"
            },
            "price": 100,
            "slug": "updated",
            "start_date": 1546214400000,
            "status": "up_coming",
            "registered": 1,
            "joined": true,
            "waiting_refund": true
        }
    ],
    "success": true,
    "current_page": 1,
    "last_page": 1
}
 */


/**
 * @api {get} /api/courses/detail Get course's details
 * @apiName GetCourseDetails
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiParam {String} slug {Query param} Course's slug to query
 * @apiParam {String} id {Query param} Course's id to query
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Course's details
 * @apiSuccess {String} data.id Course's id
 * @apiSuccess {String} data.title Course's title
 * @apiSuccess {Object} data.creator Course's creator
 * @apiSuccess {String} data.creator._id User's id
 * @apiSuccess {String} data.creator.cuid User's cuid
 * @apiSuccess {Number} data.creator.expert User is expert or not.
 * @apiSuccess {Array} data.creator.categories User's category
 * @apiSuccess {String} data.creator.avatar User's avatar
 * @apiSuccess {String} data.creator.fullName User's full name
 * @apiSuccess {Number} data.creator.active User's active status
 * @apiSuccess {String} data.creator.userName User's username
 * @apiSuccess {Object} data.category Course's category object
 * @apiSuccess {String} data.category.__id Category's id
 * @apiSuccess {String} data.category.cuid Category's cuid
 * @apiSuccess {String} data.category.parent Category's parent cuid
 * @apiSuccess {String} data.category.title Category's title
 * @apiSuccess {String} data.category.slug Category's slug
 * @apiSuccess {Number} data.maxStudents Max students can join course
 * @apiSuccess {String} data.language Course's language
 * @apiSuccess {Number} data.duration Estimate minutes each lesson
 * @apiSuccess {Number} data.price Course's price
 * @apiSuccess {String} data.slug Course's slug
 * @apiSuccess {String} data.start_date Course's first lesson start date as mili seconds
 * @apiSuccess {String} data.status Course's status. Can be `waiting`, `rejected`, `up_coming`, `on_going`, `finish`.
 * @apiSuccess {String} data.created_at Course's created date as ISOString
 * @apiSuccess {Array} data.tags Course's tags
 * @apiSuccess {Array} data.lectures Course's lectures
 * @apiSuccess {String} data.lectures._id User's id
 * @apiSuccess {String} data.lectures.cuid User's cuid
 * @apiSuccess {Number} data.lectures.expert User is expert or not.
 * @apiSuccess {Array} data.lectures.categories User's category
 * @apiSuccess {String} data.lectures.avatar User's avatar
 * @apiSuccess {String} data.lectures.fullName User's full name
 * @apiSuccess {Number} data.lectures.active User's active status
 * @apiSuccess {String} data.lectures.userName User's username
 * @apiSuccess {Number} data.registered Number students has registered
 * @apiSuccess {Number} data.in_come The money that course's creator has received. Only creator can see this.
 * @apiSuccess {Boolean} data.waiting_refund Is this user wating to refund this course.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "_id": "5acf10d0fa2f5aa4447c0c24",
        "title": "Trở thành tỷ phú thế giới trước tuổi 30",
        "creator": {
            "_id": "58e61e310fc0f92c8685b223",
            "cuid": "cj16ab8360031sm7mhs2wekuk",
            "expert": 1,
            "categories": [
                {
                    "title": "Web Development",
                    "slug": "web-development"
                }
            ],
            "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1522397450686.jpeg",
            "fullName": "Phung Viet",
            "active": 1,
            "userName": "rexviet"
        },
        "category": {
            "_id": "5828ae7cfbddb053adaf1752",
            "cuid": "catqgkv4q01ck7453ualdn3sdec14",
            "parent": "catqgkv4q01ck7453ualdn3sd0003",
            "title": "Web Development",
            "status": "1",
            "dateModified": "2016-10-05T12:28:25.868Z",
            "dateAdded": "2016-10-05T12:28:25.867Z",
            "__v": 1,
            "slug": "web-development"
        },
        "maxStudents": 5,
        "language": "en",
        "duration": 30,
        "price": 100,
        "slug": "tro-thanh-ty-phu-the-gioi-truoc-tuoi-30",
        "start_date": 1546214400000,
        "status": "up_coming",
        "created_at": "2018-04-12T07:54:56.589Z",
        "tags": [],
        "lectures": [
            {
                "_id": "58cb83c6af26811724e555dd",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "fullName": "John Smith",
                "expert": 1,
                "categories": [
                    {
                        "title": "Web Development",
                        "slug": "web-development"
                    }
                ],
                "active": 1,
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1509016458824.jpeg",
                "userName": "johnsmith"
            },
            {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "categories": [
                    {
                        "title": "Web Development",
                        "slug": "web-development"
                    }
                ],
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1522397450686.jpeg",
                "fullName": "Phung Viet",
                "active": 1,
                "userName": "rexviet"
            }
        ],
        "__v": 0,
        "registered": 1,
        "in_come": 70,
        "joined": false,
        "waiting_refund": false
    }
}
 */


/**
 * @api {delete} /api/courses/:id Delete Course
 * @apiName DeleteCourse
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiHeader {String} token User's token
 * @apiParam {String} id {URL param} Course's id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Delete course results
 * @apiSuccess {Boolean} data.deleted Is the course deleted. If `false`, there's an object bellow
 * @apiSuccess {Object} data.request The request to delete course
 *
 * @apiSuccessExample NotDeleted-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "deleted": false,
        "request": {
            "__v": 0,
            "user": "58e61e310fc0f92c8685b223",
            "course": "5acf10d0fa2f5aa4447c0c24",
            "_id": "5acf11bc130c74a456b811a5",
            "created_at": "2018-04-12T07:58:52.321Z",
            "status": "waiting"
        }
    }
}

 * @apiSuccessExample NotDeleted-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "deleted": true
    }
}
 */


/**
 * @api {get} /api/courses/mine Get List My Courses
 * @apiName GetListMyCourses
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiParam {Number} page {Query param} Page to query. If not provided, it default to `1`
 * @apiParam {String} status {Query param} Status to filter.
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Number} total_items Total courses
 * @apiSuccess {Number} current_page Current page
 * @apiSuccess {Number} last_page Last page
 * @apiSuccess {Array} data List courses
 * @apiSuccess {String} data.id Course's id
 * @apiSuccess {String} data.title Course's title
 * @apiSuccess {Object} data.creator Course's creator
 * @apiSuccess {String} data.creator._id User's id
 * @apiSuccess {String} data.creator.cuid User's cuid
 * @apiSuccess {Number} data.creator.expert User is expert or not.
 * @apiSuccess {Array} data.creator.categories User's category
 * @apiSuccess {String} data.creator.avatar User's avatar
 * @apiSuccess {String} data.creator.fullName User's full name
 * @apiSuccess {Number} data.creator.active User's active status
 * @apiSuccess {String} data.creator.userName User's username
 * @apiSuccess {Number} data.price Course's price
 * @apiSuccess {String} data.slug Course's slug
 * @apiSuccess {String} data.start_date Course's first lesson start date as mili seconds
 * @apiSuccess {String} data.status Course's status. Can be `waiting`, `rejected`, `up_coming`, `on_going`, `finish`.
 * @apiSuccess {Number} data.registered Number students has registered
 * @apiSuccess {Boolean} data.joined Is the current user joined this course or not.
 * @apiSuccess {Boolean} data.waiting_refund Is this user wating to refund this course.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "total_items": 1,
    "data": [
        {
            "_id": "5acf10d0fa2f5aa4447c0c24",
            "title": "updated",
            "creator": {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "categories": [
                    {
                        "title": "Web Development",
                        "slug": "web-development"
                    }
                ],
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1522397450686.jpeg",
                "fullName": "Phung Viet",
                "active": 1,
                "userName": "rexviet"
            },
            "price": 100,
            "slug": "updated",
            "start_date": 1546214400000,
            "status": "up_coming",
            "registered": 1,
            "joined": true,
            "waiting_refund": true
        }
    ],
    "success": true,
    "current_page": 1,
    "last_page": 1
}
 */

/**
 * @api {get} /api/courses/joined Get List My Joined Courses
 * @apiName GetListMyJoinedCourses
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiParam {Number} page {Query param} Page to query. If not provided, it default to `1`
 * @apiParam {String} status {Query param} Status to filter.
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Number} total_items Total courses
 * @apiSuccess {Number} current_page Current page
 * @apiSuccess {Number} last_page Last page
 * @apiSuccess {Array} data List courses
 * @apiSuccess {String} data.id Course's id
 * @apiSuccess {String} data.title Course's title
 * @apiSuccess {Object} data.creator Course's creator
 * @apiSuccess {String} data.creator._id User's id
 * @apiSuccess {String} data.creator.cuid User's cuid
 * @apiSuccess {Number} data.creator.expert User is expert or not.
 * @apiSuccess {Array} data.creator.categories User's category
 * @apiSuccess {String} data.creator.avatar User's avatar
 * @apiSuccess {String} data.creator.fullName User's full name
 * @apiSuccess {Number} data.creator.active User's active status
 * @apiSuccess {String} data.creator.userName User's username
 * @apiSuccess {Number} data.price Course's price
 * @apiSuccess {String} data.slug Course's slug
 * @apiSuccess {String} data.start_date Course's first lesson start date as mili seconds
 * @apiSuccess {String} data.status Course's status. Can be `waiting`, `rejected`, `up_coming`, `on_going`, `finish`.
 * @apiSuccess {Number} data.registered Number students has registered
 * @apiSuccess {Boolean} data.joined Is the current user joined this course or not.
 * @apiSuccess {Boolean} data.waiting_refund Is this user wating to refund this course.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "total_items": 1,
     "data": [
         {
             "_id": "5acf10d0fa2f5aa4447c0c24",
             "title": "updated",
             "creator": {
                 "_id": "58e61e310fc0f92c8685b223",
                 "cuid": "cj16ab8360031sm7mhs2wekuk",
                 "expert": 1,
                 "categories": [
                     {
                         "title": "Web Development",
                         "slug": "web-development"
                     }
                 ],
                 "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1522397450686.jpeg",
                 "fullName": "Phung Viet",
                 "active": 1,
                 "userName": "rexviet"
             },
             "price": 100,
             "slug": "updated",
             "start_date": 1546214400000,
             "status": "up_coming",
             "registered": 1,
             "joined": true,
             "waiting_refund": true
         }
     ],
     "success": true,
     "current_page": 1,
     "last_page": 1
 }
 */

/**
 * @api {post} /api/courses/:id/refund Request to refund course
 * @apiName RequestRefundCourse
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiHeader {String} token User's token
 * @apiParam {String} id {URL param} Course's id
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true
}

 * @apiErrorExample DuplicateRequest-Response:
 *     HTTP/1.1 400 Bad Request
 {
    "status": 400,
    "error": "You has requested to refund this object.",
    "success": false
}

 * @apiErrorExample CourseHasStarted-Response:
 *     HTTP/1.1 400 Bad Request
 {
    "status": 400,
    "error": "Course has started.",
    "success": false
}

 * @apiErrorExample NotJoined-Response:
 *     HTTP/1.1 400 Bad Request
 {
     "status": 400,
     "error": "You have not joined this course.",
     "success": false
 }
 */

/**
 * @api {get} /api/courses/:id/check-buy Check buy-able
 * @apiName CheckBuyAble
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiHeader {String} token User's token
 * @apiParam {String} id {URL param} Course's id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Join Course result
 * @apiSuccess {Number} data.balance Balance currently.
 * @apiSuccess {Boolean} data.buyAble Buy-able
 * @apiSuccess {Number} data.missing If `buyAble` is `false`, this will show the missing money
 *
 * @apiSuccessExample Un-Buy-Able-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "balance": 23000,
        "buyAble": false,
        "currency": "VND",
        "missing": 253000
    }
}
 *
 * @apiErrorExample Buy-Able-Response:
 *     HTTP/1.1 400 Bad Request
 {
    "success": true,
    "data": {
        "balance": 2298628044250,
        "buyAble": true,
        "currency": "VND"
    }
}
 */

/**
 * @api {post} /api/courses/:id/approve-delete Admin approve delete course
 * @apiName AdminApproveDeleteCourse
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiHeader {String} Authorization Admin's JWT
 * @apiParam {String} id {URL param} Course's id
 * @apiParam {String} notes {Body param} Admin's notes
 *
 * @apiSuccess {Boolean} success The query success or not
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true
}
 */

/**
 * @api {post} /api/courses/:id/approve Admin approve course
 * @apiName AdminApproveCourse
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiHeader {String} Authorization Admin's JWT
 * @apiParam {String} id {URL param} Course's id
 * @apiParam {String} notes {Body param} Admin's notes
 *
 * @apiSuccess {Boolean} success The query success or not
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true
}
 */

/**
 * @api {get} /api/courses/:id/review-options?star= Get list options to review
 * @apiName GetListOptionsReview
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiHeader {String} token user's token
 * @apiParam {String} id {URL param} Course's id
 * @apiParam {Number} star {Query param} Star to review, from `1` to `5`
 *
 * @apiSuccess {Boolean} success The query success or not
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "success": true,
     "data": [
         {
             "_id": "5addabe2e22b3ac4b6631809",
             "title": "Những điều bạn thích về khoá học",
             "children": [
                 {
                     "_id": "5addad9ee22b3ac4b663180f",
                     "parent": "5addabe2e22b3ac4b6631809",
                     "title": "Nội dung phong phú",
                     "selected": false
                 },
                 {
                     "_id": "5addadc0e22b3ac4b6631810",
                     "parent": "5addabe2e22b3ac4b6631809",
                     "title": "Thực tế",
                     "selected": false
                 },
                 ...
             ]
         },
         {
             "_id": "5addabb1e22b3ac4b6631808",
             "title": "Những điều góp ý về giảng viên",
             "children": [
                 {
                     "_id": "5addacf7e22b3ac4b663180d",
                     "parent": "5addabb1e22b3ac4b6631808",
                     "title": "Phương pháp giảng dạy không hấp dẫn",
                     "selected": true
                 },
                 {
                     "_id": "5addad42e22b3ac4b663180e",
                     "parent": "5addabb1e22b3ac4b6631808",
                     "title": "Không nhiệt tình hỗ trợ",
                     "selected": false
                 },
                 {
                     "_id": "un",
                     "title": "?? :D ??",
                     "parent": "5addabb1e22b3ac4b6631808",
                     "selected": true
                 },
                 ...
             ]
         },
         ...
     ]
 }
 */

/**
 * @api {post} /api/courses/:id/reviews Review the course
 * @apiName ReviewTheCourse
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiHeader {String} token user's token
 * @apiParam {String} id {URL param} Course's id
 * @apiParam {String} content {Body param} Review's content
 * @apiParam {Array} options {Body param} Detail Review
 * @apiParam {String} options.parent Option parent's id
 * @apiParam {Array} options.children Array of option children or other reviews
 * @apiParam {Number} star {Body param} Star to review, from `1` to `5`
 *
 * @apiSuccess {Boolean} success The query success or not
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "__v": 0,
        "user": "5a1b9b6ddf3bd87012573553",
        "course": "5addb42301bc2c59a52ff6dc",
        "content": "hay",
        "_id": "5adef2794c11873c0661cf94",
        "createdDate": "2018-04-24T09:01:45.609Z",
        "options": [
            {
                "children": [
                    "5addac5de22b3ac4b663180b"
                ],
                "parent": "5addab5be22b3ac4b6631807"
            },
            {
                "children": [
                    "5addacf7e22b3ac4b663180d",
                    "?? :D ??"
                ],
                "parent": "5addabb1e22b3ac4b6631808"
            }
        ],
        "star": 3
    }
}
 */

/**
 * @api {get} /api/courses/:id/reviews Get Course's reviews
 * @apiName GetCourseReviews
 * @apiVersion 1.1.0
 * @apiGroup Course
 *
 * @apiHeader {String} token user's token
 * @apiParam {String} id {URL param} Course's id
 *
 * @apiSuccess {Boolean} success The query success or not
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "total_items": 2,
    "data": [
        {
            "_id": "5adef2794c11873c0661cf94",
            "user": {
                "_id": "5a1b9b6ddf3bd87012573553",
                "cuid": "cjahq3j9400004yknbd49aafw",
                "expert": 1,
                "avatar": "uploads/avatar/cjahq3j9400004yknbd49aafw-1522377615872.jpeg",
                "fullName": "V P",
                "userName": "vp"
            },
            "course": "5addb42301bc2c59a52ff6dc",
            "content": "hay",
            "createdDate": "2018-04-24T09:01:45.609Z",
            "star": 3,
            "__v": 0
        },
        ...
    ],
    "success": true,
    "current_page": 1,
    "last_page": 1
}
 */
