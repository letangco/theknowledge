/**
 * @api {put} /api/answers/:id/edit Edit an answer
 * @apiName EditAnAnswer
 * @apiVersion 1.1.0
 * @apiGroup Answers
 *
 * @apiParam {String} id Question's _id
 * @apiParam {String} content (Optional) New content
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Answer's data
 * @apiSuccess {String} data._id unique ID of the Answer.
 * @apiSuccess {String} data.user User's _id post the Answer
 * @apiSuccess {String} data.question  Question's _id
 * @apiSuccess {String} data.content  Content of the Answer.
 * @apiSuccess {Integer} data.upVotes  Number up votes of the Answer.
 * @apiSuccess {Date} data.publishedDate  Published date of the Answer.
 * @apiSuccess {Boolean} anonymous  Is anonymous Answer
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "data": {
 *           "_id": "59e1f682ec96223cdbd5f0dc",
 *           "user": "58e61e310fc0f92c8685b223",
 *           "question": "59e10780ef72e735b0e0cd38",
 *           "content": "aaa updated",
 *           "__v": 0,
 *           "anonymous": false,
 *           "upVotes": 1,
 *           "publishedDate": "2017-10-14T11:35:30.855Z"
 *       }
 *   }
 *
 */

/**
 * @api {post} /api/answers/:id/upvotes Upvote an answer
 * @apiName UpvoteAnAnswer
 * @apiVersion 1.1.0
 * @apiGroup Answers
 *
 * @apiParam {String} id Question's _id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Boolean} upvoted Upvote state between current user and answer
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "upvoted": false
 *   }
 *
 */

/**
 * @api {delete} /api/answers/:id/delete Delete an answer
 * @apiName DeleteAnAnswer
 * @apiVersion 1.1.0
 * @apiGroup Answers
 *
 * @apiParam {String} id Answer's _id
 *
 * @apiSuccess {Boolean} success The query success or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true
 *   }
 *
 */

/**
 * @api {post} /api/answers/:id/replies Reply to an answer
 * @apiName ReplyToAnAnswer
 * @apiVersion 1.1.0
 * @apiGroup Answers
 *
 * @apiParam {String} id Answer's _id
 * @apiParam {String} content Reply's content
 * @apiParam {Boolean} anonymous Reply with anonymous
 *
 * @apiSuccess {Boolean} success The query success or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "data": {
 *           "__v": 0,
 *           "user": "58e61e310fc0f92c8685b223",
 *           "question": "59e1024f8513bd34e52abf9c",
 *           "content": "reply deeee",
 *           "parentId": "59e43047d013c455a68d326e",
 *           "_id": "59e48e1ff025545f65bc042b",
 *           "anonymous": false,
 *           "upVotes": 0,
 *           "publishedDate": "2017-10-16T10:46:55.330Z"
 *       }
 *   }
 *
 */

/**
 * @api {get} /api/answers/:id/replies Get answer's replies
 * @apiName GetAnswerReplies
 * @apiVersion 1.1.0
 * @apiGroup Answers
 *
 * @apiParam {String} id Answer's _id
 * @apiParam {Integer} page page to query
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
 *           },
 *           ...
 *       ]
 *   }
 *
 */
