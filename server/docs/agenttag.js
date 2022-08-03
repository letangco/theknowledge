/**
 * @api {get} /api/tags/agents/:role Get list tag agent by user
 * @apiName Get list tag
 * @apiVersion 1.1.0
 * @apiGroup Agent Tags
 *
 * @apiParam {String} role Tag role (agent/university)
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
 * @api {get} /api/tags/agents/:role?keyword=123 Search AutoComplete and Get list tag agent by user
 * @apiName Search AutoComplete and Get list tag
 * @apiVersion 1.1.0
 * @apiGroup Agent Tags
 *
 * @apiParam {String} role Tag role (agent/university)
 * @apiParam {String} keyword search keyword (on query)
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
 * @api {get} /api/tags/agents/detail/:id Get tag agent by id
 * @apiName GetTagAgentById
 * @apiVersion 1.1.0
 * @apiGroup Agent Tags
 *
 * @apiParam {String} id Tag id
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