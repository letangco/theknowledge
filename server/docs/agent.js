/**
 * @api {post} /api/registry/agent-page Registry account user from Agent page
 * @apiName Registry account
 * @apiVersion 1.1.0
 * @apiGroup Agent
 *
 * @apiParam {String} email email of user
 * @apiParam {String} password password of user
 * @apiParam {String} firstName firstName of user
 * @apiParam {String} lastName lastName of user
 * @apiParam {String} telephone telephone of user
 * @apiParam {String} type type of user (tutor/null)
 *
 * @apiParamExample {json} Request-Example:
 *    {
 *       "email": "letangco@mail.com",
 *       "password": "123123",
 *       "firstName": "123123",
 *       "lastName": "123123",
 *       "telephone": "099999999",
 *       "type": "tutor/null"
 *     }
 *
 * @apiSuccess {Object} userLogin Agent login response
 * @apiSuccess {String} data._id Agent's id.
 * @apiSuccess {String} data.code Agent's code.
 * @apiSuccess {String} data.email Agent's email.
 * @apiSuccess {userName} data.AgentName Agent's Agentname.
 * @apiSuccess {token} data.token Token Bearer Header to register agent.
 * @apiSuccess {role} data.role Agent's role.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "userLogin": {
 *           "role": "agent",
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
 * @api {post} /api/agents/login Login agent
 * @apiName Agent Login
 * @apiVersion 1.1.0
 * @apiGroup Agent
 *
 * @apiParam {String} email email of agent
 * @apiParam {String} password password of agent
 *
 * @apiParamExample {json} Request-Example:
 *    {
 *       "email": "letangco@mail.com",
 *       "password": "123123"
 *     }
 *
 * @apiSuccess {Object} userLogin Agent login response
 * @apiSuccess {String} data._id Agent's id.
 * @apiSuccess {String} data.code Agent's code.
 * @apiSuccess {String} data.email Agent's email.
 * @apiSuccess {userName} data.AgentName Agent's Agentname.
 * @apiSuccess {token} data.token Token Bearer Header to register agent.
 * @apiSuccess {role} data.role Agent's role.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "userLogin": {
 *           "role": "agent",
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
 * @api {get} /api/agents/get-by-token Get info agent by token
 * @apiName Agent Get info by token
 * @apiVersion 1.1.0
 * @apiGroup Agent
 *
 * @apiHeader {String} Authorization Agent 's token (Authorization: Bearer token)
 *
 * @apiSuccess {Object} userLogin Agent login response
 * @apiSuccess {String} data._id Agent's id.
 * @apiSuccess {String} data.code Agent's code.
 * @apiSuccess {String} data.email Agent's email.
 * @apiSuccess {userName} data.AgentName Agent's Agentname.
 * @apiSuccess {role} data.role Agent's role.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "userLogin": {
 *           "role": "agent",
 *           "code": "TE-000099",
 *           "email": "rexviet@gmail.com",
 *           "userName": "rexviet@gmail.com",
 *           "_id": "59b89d0d0701e3420c34d20d"
 *       }
 *   }
 *
 */

/**
 * @api {post} /api/agents/news Agent create a news
 * @apiName Agent create a news
 * @apiVersion 1.1.0
 * @apiGroup Agent
 *
 * @apiHeader {String} Authorization Agent 's token (Authorization: Bearer token)
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
 *     "breadcrumb": "breadcrumb",
 *     "answers": ['#abc', '#tag']
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
 * @api {get} /api/agents/news?keyword=live&status=true&sort=name_asc&limit=2&page=1 Get All News by agent or university
 * @apiName Get list News by Agent or University
 * @apiDescription All News by Agent or University
 * @apiVersion 1.1.0
 * @apiGroup Agent
 *
 * @apiHeader {String} Authorization Agent 's token (Authorization: Bearer token)
 * @apiParam {String} keyword Search news by title
 * @apiParam {String} status status of news true/false/''
 * @apiParam {String} sort Type sort - default is sort index: index_asc/ index_desc/ name_asc/ name_desc/ created_asc/ created_desc
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
 * @api {delete} /api/agents/news/:id Delete news
 * @apiName Delete a news by Agent - University
 * @apiVersion 1.1.0
 * @apiGroup Agent
 *
 * @apiHeader {String} Authorization Agent 's token (Authorization: Bearer token)
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
 * @api {get} /api/agents/news/:id Get detail news by agent/university
 * @apiName Get detail news
 * @apiVersion 1.1.0
 * @apiGroup Agent
 *
 * @apiHeader {String} Authorization Agent 's token (Authorization: Bearer token)
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
 * @api {put} /api/agents/news/:id Edit a News by agent
 * @apiName Edit news by agent
 * @apiVersion 1.1.0
 * @apiGroup Agent
 *
 * @apiHeader {String} Authorization Agent 's token (Authorization: Bearer token)
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
 * @api {put} /api/agents/news/change-status/:id Update status news by agent
 * @apiName Agent active or unactive news
 * @apiVersion 1.1.0
 * @apiGroup Agent
 *
 * @apiHeader {String} authorization Admin 's token (authorization - JWT token)
 * @apiParam {String} id Agent id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Boolean} payload The result update status
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "payload": true
 *   }
 *
 */