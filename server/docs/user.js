/**
 * @api {post} /api/user/add-device-token Add device token
 * @apiName AddDeviceToken
 * @apiVersion 1.1.0
 * @apiGroup User
 *
 * @apiHeader {String} token User's token
 * @apiParam {String} deviceToken (Body param)
 * @apiParam {String} oldToken (Body param)
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "deviceToken": "fORWPVXSPps:APA91bEiYg7gTFmn5onEtgy09ODIW3TgL0FieIe7PCJOK0wX2mvCqAU7_BbPybKsopDqV-zjsBIcC_e3dftLta74C6VcPT1HYEbw9F5_1n7vXGXGJ36Cq2xWgxPo87WGjhNurD05fE3P",
 *     }
 *
 * @apiSuccess {Boolean} success The request success or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true
 *		}
 *
 */

/**
 * @api {post} /api/user/exchange/points Exchange Points to Balance
 * @apiName ExchangePoints
 * @apiVersion 1.1.0
 * @apiGroup User
 *
 * @apiParam {Number} amount Number gifts to send
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data Result after exchage
 * @apiSuccess {Number} data.balance User's balance
 * @apiSuccess {Number} data.points User's points
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "balance": 997870,
        "points": 9500
    }
}
 *
 */

/**
 * @api {post} /api/user/add-device-aws-token Add device AWS token
 * @apiName AddDeviceAWSToken
 * @apiVersion 1.1.0
 * @apiGroup User
 *
 * @apiHeader {String} token User's token
 * @apiParam {String} deviceAWSToken (Body param)
 * @apiParam {String} oldToken (Body param)
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "deviceToken": "token moi",
 *       "oldToken": "token cu",
 *     }
 *
 * @apiSuccess {Boolean} success The request success or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true
 *		}
 *
 */


 /**
 * @api {post} /api/login Login user
 * @apiName UserLogin
 * @apiVersion 1.1.0
 * @apiGroup User
 *
 * @apiParam {Object} user data login with user.
 * @apiParam {String} user.username email of user
 * @apiParam {String} user.password password of user
 *
 * @apiParamExample {json} Request-Example:
 *    {
 *     "user": {
 *       "username": "letangco@mail.com",
 *       "password": "123123"
 *     }
 *   }
 *
 * @apiSuccess {Object} userLogin User login response
 * @apiSuccess {String} data._id User's id.
 * @apiSuccess {String} data.code User's code.
 * @apiSuccess {String} data.email User's email.
 * @apiSuccess {userName} data.userName User's username.
 * @apiSuccess {tokenAssignAgent} data.tokenAssignAgent Token Bearer Header to register agent.
 * @apiSuccess {role} data.role User's role.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "userLogin": {
 *           "role": "user",
 *           "code": "TE-000099",
 *           "email": "rexviet@gmail.com",
 *           "userName": "rexviet@gmail.com",
 *           "_id": "59b89d0d0701e3420c34d20d",
 *           "tokenAssignAgent": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDlmOTkyY2U3Nzk3ZDU1M2YzNzhlNDgiLCJpYXQiOjE2MjE4Mjk2MjYsImV4cCI6MTYyMTkxNjAyNn0.JOv_7s77f61JYHaJIRGy_qiJ00do9lJCVBjUQoxC9bs"
 *       }
 *   }
 *
 */

 /**
 * @api {post} /api/admin/point-test Admin create a question point test
 * @apiName Admin create point test
 * @apiVersion 1.1.0
 * @apiGroup Admin - Point Test
 *
 * @apiHeader {String} authorization Admin 's token (authorization - JWT token)
 * @apiParam {String} subject Subject of question.
 * @apiParam {String} question Content question
 * @apiParam {Boolean} status Status of question
 * @apiParam {Number} indexQuestion index sort of question
 * @apiParam {Boolean} special Is special question
 * @apiParam {Number} typeSelect type show answer of question 0.checkbox, 1.selection
 * @apiParam {Array} answers List answers of question
 * 
 * @apiParamExample {json} Request-Example:
 *    {
 *     "subject": "This is subject question",
 *     "question": "This is question question",
 *     "status": true,
 *     "indexQuestion": 10,
 *     "special": true,
 *     "typeSelect": 0,
 *     "answers": [
 *          {
 *               "score": 100,
 *               "content": "answer content",
 *               "notEligible": true,
 *               "indexAnswer": 9
 *          },
 *          {
 *               "score": 101,
 *               "content": "answer content",
 *               "notEligible": true,
 *               "indexAnswer": 5
 *          },
 *      ]
 *   }
 *
 * @apiSuccess {String} success payload result
 * @apiSuccess {Object} payload Data create point test response
 * @apiSuccess {String} payload._id Point test id.
 * @apiSuccess {String} data.code User's code.
 * @apiSuccess {Number} data.indexAnswer index sort question.
 * @apiSuccess {Boolean} data.notEligible Point test notEligible of question.
 * @apiSuccess {Boolean} data.status Status of question.
 * @apiSuccess {String} data.question Question content.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "payload": {
 *           "status": true,
 *           "subject": "TE-000099",
 *           "question": "rexviet@gmail.com",
 *           "indexAnswer": 1,
 *           "_id": "59b89d0d0701e3420c34d20d",
 *           "searchString": "search String"
 *       }
 *   }
 *
 */

 /**
 * @api {get} /api/admin/point-test?keyword=live&status=true&limit=2&page=1 Get All Point test question
 * @apiName GetListQuestionPointTest
 * @apiDescription All Question point test by admin
 * @apiVersion 1.1.0
 * @apiGroup Admin - Point Test
 *
 * @apiHeader {String} authorization Admin 's token (authorization - JWT token)
 * @apiParam {String} keyword Search question by content
 * @apiParam {String} status status of question true/false
 * @apiParam {Number} limit Limit Query Default:30
 * @apiParam {Number} page Page Query Default:1
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

/**
 * @api {get} /api/admin/point-test/:id Get detail question of point test
 * @apiName GetDetailQuestion
 * @apiVersion 1.1.0
 * @apiGroup Admin - Point Test
 *
 * @apiHeader {String} authorization Admin 's token (authorization - JWT token)
 * @apiParam {String} id Question id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Integer} current_page Current page query.
 * @apiSuccess {Integer} last_page Last page exist.
 * @apiSuccess {Integer} total_items Total answers
 * @apiSuccess {Object} data Question's answers.
 * @apiSuccess {String} data._id unique ID of the Answer.
 * @apiSuccess {Object} data.user User answered
 * @apiSuccess {String} data.user._id User's _id
 * @apiSuccess {String} data.user.cuid User's cuid
 * @apiSuccess {String} data.user.avatar User's avatar
 * @apiSuccess {String} data.user.fullName User's fullName
 * @apiSuccess {String} data.user.userName User's userName
 * @apiSuccess {String} data.content  Content of the Answer.
 * @apiSuccess {Date} data.publishedDate  Created date of the Answer.
 * @apiSuccess {Boolean} anonymous  Is anonymous question
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "current_page": 1,
 *       "last_page": 1,
 *       "total_items": 4,
 *       "data": [
 *           {
 *               "_id": "59e1f6e2db2f783cecd1e72d",
 *               "user": {
 *                   "avatar": "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg",
 *                   "fullName": "Anonymous"
 *               },
 *               "question": "59e10780ef72e735b0e0cd38",
 *               "content": "bbb",
 *               "__v": 0,
 *               "anonymous": true,
 *               "upVotes": 0,
 *               "publishedDate": "2017-10-14T11:37:06.482Z"
 *           },
 *           {
 *               "_id": "59e1f682ec96223cdbd5f0dc",
 *               "user": {
 *                   "_id": "58e61e310fc0f92c8685b223",
 *                   "cuid": "cj16ab8360031sm7mhs2wekuk",
 *                   "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1504847136613.jpeg",
 *                   "fullName": "Phung Viet",
 *                   "userName": "rexviet"
 *               },
 *               "question": "59e10780ef72e735b0e0cd38",
 *               "content": "aaa",
 *               "__v": 0,
 *               "anonymous": false,
 *               "upVotes": 0,
 *               "publishedDate": "2017-10-14T11:35:30.855Z"
 *           }
 *       ]
 *   }
 *
 */

/**
 * @api {delete} /api/admin/point-test/:id Delete question of point test
 * @apiName DeleteQuestionPointTest
 * @apiVersion 1.1.0
 * @apiGroup Admin - Point Test
 *
 * @apiHeader {String} authorization Admin 's token (authorization - JWT token)
 * @apiParam {String} id Question id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Boolean} payload The result delete question.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "payload": true
 *   }
 *
 */

/**
 * @api {put} /api/admin/point-test/:id Edit a question of point test by admin
 * @apiName EditAQuestionPointTest
 * @apiVersion 1.1.0
 * @apiGroup Admin - Point Test
 *
 * @apiHeader {String} authorization Admin 's token (authorization - JWT token)
 * @apiParam {String} _id Question's _id
 * @apiParam {Boolean} status Status of question
 * @apiParam {String} subject Subject of question
 * @apiParam {Number} indexQuestion Index sort of question
 * @apiParam {Boolean} special Is special of question
 * @apiParam {Number} typeSelect 0: checkbox, 1: selection of question
 * @apiParam {Array} answers List item answer
 * @apiParam {Number} answers.score Score of answer
 * @apiParam {String} answers.content Content of answer
 * @apiParam {Boolean} answers.notEligible Is notEligible of answer
 * @apiParam {Number} answers.indexAnswer Index sort of answer
 * 
 * @apiParamExample {json} Request-Example:
 *    {
 *   "_id": "60ab82e8975414dd6f22aaba",
 *   "updatedAt": "2021-05-24T17:45:15.756Z",
 *   "createdAt": "2021-05-24T10:41:44.655Z",
 *   "typeSelect": 0,
 *   "special": false,
 *   "indexQuestion": 3,
 *   "question": "aaszzzzz",
 *   "subject": "tang co le",
 *   "status": true,
 *   "answers": [
 *       {
 *           "_id": "60ab82e8975414dd6f22aabb",
 *           "updatedAt": "2021-05-24T17:45:31.167Z",
 *           "createdAt": "2021-05-24T10:41:44.661Z",
 *           "parentQuestion": "60ab82e8975414dd6f22aaba",
 *           "indexAnswer": 1,
 *           "notEligible": false,
 *           "content": "this is content 21",
 *           "score": 10
 *       },
 *       {
 *           "_id": "60ab82e8975414dd6f22aabc",
 *           "updatedAt": "2021-05-24T10:41:44.662Z",
 *           "createdAt": "2021-05-24T10:41:44.662Z",
 *           "parentQuestion": "60ab82e8975414dd6f22aaba",
 *           "indexAnswer": 2,
 *           "notEligible": false,
 *           "content": "Nội dung 2",
 *           "score": 14
 *       },
 *       {
 *           "_id": "60ab82e8975414dd6f22aabd",
 *           "updatedAt": "2021-05-24T10:41:44.663Z",
 *           "createdAt": "2021-05-24T10:41:44.663Z",
 *           "parentQuestion": "60ab82e8975414dd6f22aaba",
 *           "indexAnswer": 3,
 *           "notEligible": false,
 *           "content": "NỌi dung 3",
 *           "score": 15
 *       }
 *       ]
 *   }
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Boolean } payload true/false
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *          "payload": true
 *      }
 *
 */

/**
 * @api {post} /api/agents/register User register to agent or university
 * @apiName User register to Agent or University
 * @apiVersion 1.1.0
 * @apiGroup User
 *
 * @apiHeader {String} Authorization User 's bearerToken (Authorization: Bearer bearerToken)
 * @apiParam {String} role Role register (agent/university) of account
 * @apiParam {String} email Email register (agent/university) of account
 * @apiParam {String} telephone telephone register (agent/university) of account
 * @apiParam {String} organization organization register (agent/university) of account
 * @apiParam {String} ABNNumber ABNNumber register (agent/university) of account
 * @apiParam {String} address address register (agent/university) of account
 * @apiParam {Array} tags Id tags register (agent/university) of account
 * @apiParam {String} CIRCONumber CIRCO Number register (university) of account
 * @apiParam {String} country Id country register (agent/university) of account
 * @apiParam {String} state Id state register (agent/university) of account
 * @apiParam {String} MARANumber MARA Number register (agent) of account
 * 
 * @apiParamExample {json} Request-Example:
 *    {
 *     "role": "university",
 *     "email": "htop@organi.vn",
 *     "telephone": "0332858127",
 *     "organization": "UIT TECHNOLOGY HCMC",
 *     "ABNNumber": "489884585",
 *     "address": "Linh Trung Thu Duc HCMC",
 *     "tags": ["60b665e407f6e595764c061f", "60b665d807f6e595764c061e", "60b66acd07f6e595764c0623"],
 *     "CIRCONumber": "CIR124824324",
 *     "MARANumber": "489884585",
 *     "country": "6006b2f4c5b9232bc16a180b",
 *     "state": "60b9e22adb332887c070064e",
 *   }
 *
 * @apiSuccess {String} success payload result
 * @apiSuccess {Object} payload Data create point test response
 * @apiSuccess {String} payload._id Point test id.
 * @apiSuccess {String} data.code User's code.
 * @apiSuccess {Number} data.indexAnswer index sort question.
 * @apiSuccess {Boolean} data.notEligible Point test notEligible of question.
 * @apiSuccess {Boolean} data.status Status of question.
 * @apiSuccess {String} data.question Question content.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "payload": {
 *           "status": true,
 *           "subject": "TE-000099",
 *           "question": "rexviet@gmail.com",
 *           "indexAnswer": 1,
 *           "_id": "59b89d0d0701e3420c34d20d",
 *           "searchString": "search String"
 *       }
 *   }
 *
 */

 /**
 * @api {post} /api/admin/login Login Admin
 * @apiName Admin Login
 * @apiVersion 1.1.0
 * @apiGroup User
 *
 * @apiParam {String} email email of Admin
 * @apiParam {String} password password of Admin
 *
 * @apiParamExample {json} Request-Example:
 *    {
 *       "email": "chloe@theseedsoft.com",
 *       "password": "123321"
 *     }
 *
 * @apiSuccess {Object} userLogin admin login response
 * @apiSuccess {String} data._id admin 's id.
 * @apiSuccess {String} data.code admin 's code.
 * @apiSuccess {String} data.email admin 's email.
 * @apiSuccess {userName} data.userName admin 's.
 * @apiSuccess {token} data.token Token JWT Header to register admin.
 * @apiSuccess {role} data.role admin 's role.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "userLogin": {
 *           "role": "admin",
 *           "code": "TE-000099",
 *           "email": "rexviet@gmail.com",
 *           "userName": "rexviet@gmail.com",
 *           "_id": "59b89d0d0701e3420c34d20d",
 *           "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDlmOTkyY2U3Nzk3ZDU1M2YzNzhlNDgiLCJpYXQiOjE2MjE4Mjk2MjYsImV4cCI6MTYyMTkxNjAyNn0.JOv_7s77f61JYHaJIRGy_qiJ00do9lJCVBjUQoxC9bs"
 *       }
 *   }
 *
 */

 /**
 * @api {get} /api/admin/agents/news?keyword=live&status=true&sort=name_asc&role=agent&limit=2&page=1 Admin get list news agent or university
 * @apiName Admin Get list News of Agent or University
 * @apiDescription All News by Agent or University
 * @apiVersion 1.1.0
 * @apiGroup Admin - News Agent
 *
 * @apiHeader {String} authorization Admin 's token (authorization: JWT token)
 * @apiParam {String} keyword Search news by title
 * @apiParam {String} status status of news true/false/''
 * @apiParam {String} sort Type sort - default is sort index: index_asc/ index_desc/ name_asc/ name_desc/ created_asc/ created_desc
 * @apiParam {String} role Role author news agent/university/admin/''
 * @apiParam {Number} limit Limit Query Default:30
 * @apiParam {Number} page Page Query Default:1
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

 /**
 * @api {get} /api/user/get-profile-token get Profile user, university, agent by token
 * @apiName User get profile by bearerToken
 * @apiVersion 1.1.0
 * @apiGroup User
 *
 * @apiHeader {String} authorization User 's token (authorization: Bearer token)
 *
 *
 * @apiSuccess {Object} userLogin user login response
 * @apiSuccess {String} data._id user 's id.
 * @apiSuccess {String} data.code user 's code.
 * @apiSuccess {String} data.email user 's email.
 * @apiSuccess {userName} data.userName user 's.
 * @apiSuccess {token} data.token Token JWT Header to register user.
 * @apiSuccess {role} data.role user 's role.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "userLogin": {
 *           "role": "user",
 *           "code": "TE-000099",
 *           "email": "rexviet@gmail.com",
 *           "userName": "rexviet@gmail.com",
 *           "_id": "59b89d0d0701e3420c34d20d",
 *           "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDlmOTkyY2U3Nzk3ZDU1M2YzNzhlNDgiLCJpYXQiOjE2MjE4Mjk2MjYsImV4cCI6MTYyMTkxNjAyNn0.JOv_7s77f61JYHaJIRGy_qiJ00do9lJCVBjUQoxC9bs"
 *       }
 *   }
 *
 */

 /**
 * @api {post} /api/admin/agents/news Admin create a news
 * @apiName Admin create a news
 * @apiVersion 1.1.0
 * @apiGroup Admin - News Agent
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} title Title of news.
 * @apiParam {String} content Content news
 * @apiParam {String} shortDescription Short Description of news
 * @apiParam {Number} sort index sort of news
 * @apiParam {Boolean} priority Is priority of news
 * @apiParam {Boolean} status Status of news true/false
 * @apiParam {String} banner url image banner of news
 * @apiParam {String} breadcrumb breadcrumb of news
 * @apiParam {Array} tag tag of news
 * 
 * @apiParamExample {json} Request-Example:
 *    {
 *     "title": "This is subject news",
 *     "content": "This is news news",
 *     "shortDescription": "shortDescription",
 *     "banner": "https://theknowledgeai.tesse.io/uploads/news-image/1622010994095-screenshot-from-2021-05-15-01-26-09.png",
 *     "status": true,
 *     "sort": 10,
 *     "priority": true,
 *     "breadcrumb": "breadcrumb"
 *   }
 *
 * @apiSuccess {String} success payload result
 * @apiSuccess {Object} payload Data create point test response
 * @apiSuccess {String} payload._id Point test id.
 * @apiSuccess {String} data.code User's code.
 * @apiSuccess {Number} data.indexAnswer index sort news.
 * @apiSuccess {Boolean} data.notEligible Point test notEligible of news.
 * @apiSuccess {Boolean} data.status Status of news.
 * @apiSuccess {String} data.news news content.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "payload": {
 *           "status": true,
 *           "subject": "TE-000099",
 *           "news": "rexviet@gmail.com",
 *           "indexAnswer": 1,
 *           "_id": "59b89d0d0701e3420c34d20d",
 *           "searchString": "search String"
 *       }
 *   }
 *
 */

 /**
 * @api {put} /api/admin/agents/news/:id Edit a News by Admin
 * @apiName Edit news by Admin
 * @apiVersion 1.1.0
 * @apiGroup Admin - News Agent
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} id News id 
 * @apiParam {String} title Title of news.
 * @apiParam {String} content Content news
 * @apiParam {String} shortDescription Short Description of news
 * @apiParam {Number} sort index sort of news
 * @apiParam {Boolean} priority Is priority of news
 * @apiParam {Boolean} status Status of news true/false
 * @apiParam {String} banner url image banner of news
 * @apiParam {String} breadcrumb breadcrumb of news
 * @apiParam {Array} tag tag of news
 * 
 * @apiParamExample {json} Request-Example:
 *    {
 *   "_id": "60ab82e8975414dd6f22aaba",
 *   "updatedAt": "2021-05-24T17:45:15.756Z",
 *   "createdAt": "2021-05-24T10:41:44.655Z",
 *   "typeSelect": 0,
 *   "special": false,
 *   "indexQuestion": 3,
 *   "question": "aaszzzzz",
 *   "subject": "tang co le",
 *   "status": true,
 *   "answers": [
 *       {
 *           "_id": "60ab82e8975414dd6f22aabb",
 *           "updatedAt": "2021-05-24T17:45:31.167Z",
 *           "createdAt": "2021-05-24T10:41:44.661Z",
 *           "parentQuestion": "60ab82e8975414dd6f22aaba",
 *           "indexAnswer": 1,
 *           "notEligible": false,
 *           "content": "this is content 21",
 *           "score": 10
 *       },
 *       {
 *           "_id": "60ab82e8975414dd6f22aabc",
 *           "updatedAt": "2021-05-24T10:41:44.662Z",
 *           "createdAt": "2021-05-24T10:41:44.662Z",
 *           "parentQuestion": "60ab82e8975414dd6f22aaba",
 *           "indexAnswer": 2,
 *           "notEligible": false,
 *           "content": "Nội dung 2",
 *           "score": 14
 *       },
 *       {
 *           "_id": "60ab82e8975414dd6f22aabd",
 *           "updatedAt": "2021-05-24T10:41:44.663Z",
 *           "createdAt": "2021-05-24T10:41:44.663Z",
 *           "parentQuestion": "60ab82e8975414dd6f22aaba",
 *           "indexAnswer": 3,
 *           "notEligible": false,
 *           "content": "NỌi dung 3",
 *           "score": 15
 *       }
 *       ]
 *   }
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Boolean } payload true/false
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *          "payload": true
 *      }
 *
 */

 /**
 * @api {delete} /api/admin/agents/news/:id Delete news by admin
 * @apiName Delete a news by Admin
 * @apiVersion 1.1.0
 * @apiGroup Admin - News Agent
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} id news id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Boolean} payload The result delete news.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "payload": true
 *   }
 *
 */

 /**
 * @api {get} /api/news?keyword=live&role=&sort=new&limit=2&page=1 Get list News by user
 * @apiName Get list News by User
 * @apiDescription All News by User
 * @apiVersion 1.1.0
 * @apiGroup User - News
 *
 * @apiParam {String} keyword Search news by title
 * @apiParam {String} role Author role create news agent/university/agent-university/''
 * @apiParam {String} sort Type sort - Type sort list: new/old/'' (default: createdAt: desc)
 * @apiParam {Number} limit Limit Query Default:30
 * @apiParam {Number} page Page Query Default:1
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

 /**
 * @api {get} /api/news/:id Get detail news by user
 * @apiName Get detail news by user
 * @apiVersion 1.1.0
 * @apiGroup User - News
 *
 * @apiParam {String} id News id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Integer} current_page Current page query.
 * @apiSuccess {Integer} last_page Last page exist.
 * @apiSuccess {Integer} total_items Total answers
 * @apiSuccess {Object} data Question's answers.
 * @apiSuccess {String} data._id unique ID of the Answer.
 * @apiSuccess {Object} data.user User answered
 * @apiSuccess {String} data.user._id User's _id
 * @apiSuccess {String} data.user.cuid User's cuid
 * @apiSuccess {String} data.user.avatar User's avatar
 * @apiSuccess {String} data.user.fullName User's fullName
 * @apiSuccess {String} data.user.userName User's userName
 * @apiSuccess {String} data.content  Content of the Answer.
 * @apiSuccess {Date} data.publishedDate  Created date of the Answer.
 * @apiSuccess {Boolean} anonymous  Is anonymous question
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "current_page": 1,
 *       "last_page": 1,
 *       "total_items": 4,
 *       "data": [
 *           {
 *               "_id": "59e1f6e2db2f783cecd1e72d",
 *               "user": {
 *                   "avatar": "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg",
 *                   "fullName": "Anonymous"
 *               },
 *               "question": "59e10780ef72e735b0e0cd38",
 *               "content": "bbb",
 *               "__v": 0,
 *               "anonymous": true,
 *               "upVotes": 0,
 *               "publishedDate": "2017-10-14T11:37:06.482Z"
 *           },
 *           {
 *               "_id": "59e1f682ec96223cdbd5f0dc",
 *               "user": {
 *                   "_id": "58e61e310fc0f92c8685b223",
 *                   "cuid": "cj16ab8360031sm7mhs2wekuk",
 *                   "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1504847136613.jpeg",
 *                   "fullName": "Phung Viet",
 *                   "userName": "rexviet"
 *               },
 *               "question": "59e10780ef72e735b0e0cd38",
 *               "content": "aaa",
 *               "__v": 0,
 *               "anonymous": false,
 *               "upVotes": 0,
 *               "publishedDate": "2017-10-14T11:35:30.855Z"
 *           }
 *       ]
 *   }
 *
 */

 /**
 * @api {get} /api/news-carousel Get 9 newest News by user
 * @apiName Get list 9 newest News by User
 * @apiDescription 9 newest News by User
 * @apiVersion 1.1.0
 * @apiGroup User - News
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

/**
 * @api {post} /api/admin/agents/tags Admin create tags Agent
 * @apiName AdminAgentTags
 * @apiVersion 1.1.0
 * @apiGroup Admin - Agent Tags
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} tagName (Body param) Tag Name
 * @apiParam {String} type (Body param) type tag agent/university
 * @apiParam {Number} sort (Body param) sort index tag
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "tagName": "tagName moi",
 *       "type": "university",
 *       "sort": 10
 *     }
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Object} payload Tag has created.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true,
 *        "payload": {
 *              "_id": "60b66acd07f6e595764c0623",
 *              "tagName": "tagName moi"
 *           }
 *		}
 *
 */

 /**
 * @api {get} /api/admin/agents/tags?role=&sort=&keyword=&limit=1&page=2 Get list Tag Agent By Admin
 * @apiName Get list Tag Agent By Admin
 * @apiDescription All Tag Agent By Admin
 * @apiVersion 1.1.0
 * @apiGroup Admin - Agent Tags
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} keyword Search tag by tag name
 * @apiParam {String} role agent/university/'' (default: '')
 * @apiParam {String} sort ''/tag-asc/tag-desc/index-desc/index-asc (default: index-desc)
 * @apiParam {Number} limit Limit Query Default:30
 * @apiParam {Number} page Page Query Default:1
 *
 * @apiSuccess {Boolean} status The status request
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Number} totalItem Total Tag Name
 * @apiSuccess {Number} totalPages Total page Tag Name
 * @apiSuccess {Number} page Page current Tag Name
 * @apiSuccess {Number} item item of page current
 * @apiSuccess {Object} data The Tag Name object.
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

 /**
 * @api {get} /api/admin/agents/tags/:id Get detail tag agent by admin
 * @apiName Get detail tag by admin
 * @apiVersion 1.1.0
 * @apiGroup Admin - Agent Tags
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} id Tag _id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Integer} current_page Current page query.
 * @apiSuccess {Integer} last_page Last page exist.
 * @apiSuccess {Integer} total_items Total answers
 * @apiSuccess {Object} data Question's answers.
 * @apiSuccess {String} data._id unique ID of the Answer.
 * @apiSuccess {Object} data.user User answered
 * @apiSuccess {String} data.user._id User's _id
 * @apiSuccess {String} data.user.cuid User's cuid
 * @apiSuccess {String} data.user.avatar User's avatar
 * @apiSuccess {String} data.user.fullName User's fullName
 * @apiSuccess {String} data.user.userName User's userName
 * @apiSuccess {String} data.content  Content of the Answer.
 * @apiSuccess {Date} data.publishedDate  Created date of the Answer.
 * @apiSuccess {Boolean} anonymous  Is anonymous question
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "current_page": 1,
 *       "last_page": 1,
 *       "total_items": 4,
 *       "data": [
 *           {
 *               "_id": "59e1f6e2db2f783cecd1e72d",
 *               "user": {
 *                   "avatar": "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg",
 *                   "fullName": "Anonymous"
 *               },
 *               "question": "59e10780ef72e735b0e0cd38",
 *               "content": "bbb",
 *               "__v": 0,
 *               "anonymous": true,
 *               "upVotes": 0,
 *               "publishedDate": "2017-10-14T11:37:06.482Z"
 *           },
 *           {
 *               "_id": "59e1f682ec96223cdbd5f0dc",
 *               "user": {
 *                   "_id": "58e61e310fc0f92c8685b223",
 *                   "cuid": "cj16ab8360031sm7mhs2wekuk",
 *                   "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1504847136613.jpeg",
 *                   "fullName": "Phung Viet",
 *                   "userName": "rexviet"
 *               },
 *               "question": "59e10780ef72e735b0e0cd38",
 *               "content": "aaa",
 *               "__v": 0,
 *               "anonymous": false,
 *               "upVotes": 0,
 *               "publishedDate": "2017-10-14T11:35:30.855Z"
 *           }
 *       ]
 *   }
 *
 */

/**
 * @api {delete} /api/admin/agents/tags/:id Delete Tag Agent by admin
 * @apiName Delete a Tag Agent by Admin
 * @apiVersion 1.1.0
 * @apiGroup Admin - Agent Tags
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} id Tag Agent id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Boolean} payload The result delete Tag Agent.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "payload": true
 *   }
 *
 */


/**
 * @api {put} /api/admin/agents/tags/:id Admin update tags Agent
 * @apiName AdminAgentTagsUpdate
 * @apiVersion 1.1.0
 * @apiGroup Admin - Agent Tags
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} tagName (Body param) Tag Name
 * @apiParam {String} type (Body param) type tag agent/university
 * @apiParam {Number} sort (Body param) sort index tag
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "tagName": "tagName moi",
 *       "type": "university",
 *       "sort": 10
 *     }
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Boolean} payload Tag has created.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true,
 *        "payload": true
 *		}
 *
 */

/**
 * @api {get} /api/admin/agents/user-management?role=user&status=all&keyword=abc&sort=1 Admin get User Management Page Virtual Agent
 * @apiName AdminUserManagementVirtualAgentPage
 * @apiVersion 1.1.0
 * @apiGroup Admin - User Virtual Agent
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} keyword (on Query) search: email, fullName, phone
 * @apiParam {String} role (on Query) user/agent/university (required)
 * @apiParam {String} status (on Query) all/active/ban/pending (required)
 * @apiParam {Number} sort (on Query) sort list by dateAdded [1,-1]
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Boolean} payload Tag has created.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true,
 *        "payload": true
 *		}
 *
 */

/**
 * @api {get} /api/admin/agents/user-management/:id Admin get detail User Management Page Virtual Agent
 * @apiName AdminUserDetailManagementVirtualAgentPage
 * @apiVersion 1.1.0
 * @apiGroup Admin - User Virtual Agent
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} id (on Params) _id user
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Boolean} payload Tag has created.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true,
 *        "payload": true
 *		}
 *
 */

 /**
 * @api {put} /api/admin/agents/user-management/update-status/:id/:status Admin update status User/Agent Management Page Virtual Agent
 * @apiName AdminUpdateStatusUserManagementVirtualAgentPage
 * @apiVersion 1.1.0
 * @apiGroup Admin - User Virtual Agent
 *
 * @apiHeader {String} Authorization Admin 's token (Authorization: JWT token)
 * @apiParam {String} id (on Params) _id user
 * @apiParam {Number} status (on Params) status of user in [1, -1]
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Boolean} payload Tag has created.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true,
 *        "payload": true
 *		}
 *
 */