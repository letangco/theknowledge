/**
 * @api {post} /api/questions/add Ask a question
 * @apiName AskAQuestion
 * @apiVersion 1.1.0
 * @apiGroup Questions
 *
 * @apiParam {String} title Title of the Question.
 * @apiParam {String} content  Content of the Question.
 * @apiParam {String} department  Department's id of the Question or `ge` for General.
 * @apiParam {Array} tags  Tag of the Question.
 * @apiParam {String} state State of Question. Only allow `published` or `draft`.
 * @apiParam {Boolean} anonymous Anonymous mode.
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *         "title": "test",
 *         "content": "{\"entityMap\":{},\"blocks\":[{\"key\":\"fl036\",\"text\":\"em test thoi ah\",\"type\":\"unstyled\",\"depth\":0,\"inlineStyleRanges\":[],\"entityRanges\":[],\"data\":{}}]}",
 *         "department": "ge",
 *         "tags": [
 *           {
 *             "id": "58edd54310584c409e89b91e",
 *             "text": "Mathematics Level 1"
 *           },
 *           {
 *             "id": "58edcfd410584c409e89b87f",
 *             "text": "Discrete Math"
 *           }
 *         ],
 *         "state": "published",
 *         "anonymous": true
 *     }
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Question's data
 * @apiSuccess {String} data._id unique ID of the Question.
 * @apiSuccess {Object} data.user User ask the Question
 * @apiSuccess {String} data.title  Title of the Question.
 * @apiSuccess {String} data.content  Content of the Question.
 * @apiSuccess {String} data.slug  Slug of the Question.
 * @apiSuccess {String} data.description  description of the Question.
 * @apiSuccess {String} data.state  State of the Question.
 * @apiSuccess {Integer} data.upVotes  Number up votes of the Question.
 * @apiSuccess {Date} data.createdDate  Created date of the Question.
 * @apiSuccess {Object} data.department  Department of the Question.
 * @apiSuccess {Array} tags  Tags of the Question.
 * @apiSuccess {Array} thumbnail  Array images of the Question.
 * @apiSuccess {Boolean} anonymous  Is anonymous question
 * @apiSuccess {String} questionType  Question type
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *          "data": {
 *              "__v": 0,
 *              "user": {
 *                  "avatar": "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg",
 *                  "fullName": "Anonymous"
 *              },
 *              "title": "test",
 *              "content": {
 *                  "blocks": [
 *                      {
 *                          ...
 *                      }
 *                  ],
 *                  "entityMap": {
 *                     ...
 *                  }
 *              },
 *              "slug": "test-l30l1pz",
 *              "description": "em test thoi...",
 *              "_id": "59e10780ef72e735b0e0cd38",
 *              "state": "published",
 *              "upVotes": 0,
 *              "createdDate": "2017-10-13T18:35:44.779Z",
 *              "tags": [
 *                  {
 *                      "text": "Mathematics Level 1",
 *                      "id": "58edd54310584c409e89b91e"
 *                  },
 *                  {
 *                      "text": "Discrete Math",
 *                      "id": "58edcfd410584c409e89b87f"
 *                  }
 *              ],
 *              "thumbnail": [],
 *              "anonymous": true,
 *              "questionType": "normal",
 *              "department": {
 *                  "_id": "ge",
 *                  "title": "General"
 *              }
 *          }
 *      }
 *
 */

/**
 * @api {get} /api/questions/get Get a question
 * @apiName GetAQuestion
 * @apiVersion 1.1.0
 * @apiGroup Questions
 *
 * @apiParam {String} id Question's _id
 * @apiParam {String} slug  Question's slug
 *
 * @apiParamExample {curl} Request-Example:
 * curl "localhost:8001/api/questions/get?slug=test-l30l1pz"
 * curl "localhost:8001/api/questions/get?id=59e10780ef72e735b0e0cd38"
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Question's data
 * @apiSuccess {String} data._id unique ID of the Question.
 * @apiSuccess {Object} data.user User ask the Question
 * @apiSuccess {String} data.title  Title of the Question.
 * @apiSuccess {String} data.content  Content of the Question.
 * @apiSuccess {String} data.slug  Slug of the Question.
 * @apiSuccess {String} data.description  description of the Question.
 * @apiSuccess {String} data.state  State of the Question.
 * @apiSuccess {Integer} data.upVotes  Number up votes of the Question.
 * @apiSuccess {Date} data.createdDate  Created date of the Question.
 * @apiSuccess {Object} data.department  Department of the Question.
 * @apiSuccess {Array} tags  Tags of the Question.
 * @apiSuccess {Array} thumbnail  Array images of the Question.
 * @apiSuccess {Boolean} anonymous  Is anonymous question
 * @apiSuccess {String} questionType  Question type
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *          "data": {
 *              "__v": 0,
 *              "user": {
 *                  "avatar": "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg",
 *                  "fullName": "Anonymous"
 *              },
 *              "title": "test",
 *              "content": {
 *                  "blocks": [
 *                      {
 *                          ...
 *                      }
 *                  ],
 *                  "entityMap": {
 *                     ...
 *                  }
 *              },
 *              "slug": "test-l30l1pz",
 *              "description": "em test thoi...",
 *              "_id": "59e10780ef72e735b0e0cd38",
 *              "state": "published",
 *              "upVotes": 0,
 *              "createdDate": "2017-10-13T18:35:44.779Z",
 *              "tags": [
 *                  {
 *                      "text": "Mathematics Level 1",
 *                      "id": "58edd54310584c409e89b91e"
 *                  },
 *                  {
 *                      "text": "Discrete Math",
 *                      "id": "58edcfd410584c409e89b87f"
 *                  }
 *              ],
 *              "thumbnail": [],
 *              "anonymous": true,
 *              "questionType": "normal",
 *              "department": {
 *                  "_id": "ge",
 *                  "title": "General"
 *              }
 *          }
 *      }
 *
 */

/**
 * @api {post} /api/questions/:questionId/answers Post an answer
 * @apiName PostAnswer
 * @apiVersion 1.1.0
 * @apiGroup Questions
 *
 * @apiParam {String} questionId Question's _id
 * @apiParam {String} content Answer's content
 * @apiParam {Boolean} anonymous (Optional) Anonymous mode
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Answer's data
 * @apiSuccess {String} data._id unique ID of the Answer.
 * @apiSuccess {String} data.user _id of User answer.
 * @apiSuccess {String} data.content  Content of the Answer.
 * @apiSuccess {Date} data.publishedDate  Created date of the Answer.
 * @apiSuccess {Boolean} anonymous  Is anonymous question
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *          "data": {
 *              "__v": 0,
 *              "user": "58e61e310fc0f92c8685b223",
 *              "question": "59e10780ef72e735b0e0cd38",
 *              "content": "bbb",
 *              "_id": "59e1f6e2db2f783cecd1e72d",
 *              "anonymous": true,
 *              "upVotes": 0,
 *              "publishedDate": "2017-10-14T11:37:06.482Z"
 *          }
 *      }
 *
 */

/**
 * @api {get} /api/questions/:questionId/answers Get question's answers
 * @apiName GetQuestionAnswer
 * @apiVersion 1.1.0
 * @apiGroup Questions
 *
 * @apiParam {String} questionId Question's _id
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

/**
 * @api {put} /api/questions/:id/edit Edit a question
 * @apiName EditAQuestion
 * @apiVersion 1.1.0
 * @apiGroup Questions
 *
 * @apiParam {String} id Question's _id
 * @apiParam {String} title (Optional) New title
 * @apiParam {String} content (Optional) New content
 * @apiParam {Array} tags (Optional) New tags
 * @apiParam {String} department (Optional) New department id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Question's data
 * @apiSuccess {String} data._id unique ID of the Question.
 * @apiSuccess {Object} data.user User ask the Question
 * @apiSuccess {String} data.title  Title of the Question.
 * @apiSuccess {String} data.content  Content of the Question.
 * @apiSuccess {String} data.slug  Slug of the Question.
 * @apiSuccess {String} data.description  description of the Question.
 * @apiSuccess {String} data.state  State of the Question.
 * @apiSuccess {Integer} data.upVotes  Number up votes of the Question.
 * @apiSuccess {Date} data.createdDate  Created date of the Question.
 * @apiSuccess {Object} data.department  Department of the Question.
 * @apiSuccess {Array} tags  Tags of the Question.
 * @apiSuccess {Array} thumbnail  Array images of the Question.
 * @apiSuccess {Boolean} anonymous  Is anonymous question
 * @apiSuccess {String} questionType  Question type
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *          "data": {
 *              "__v": 0,
 *              "user": {
 *                  "avatar": "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg",
 *                  "fullName": "Anonymous"
 *              },
 *              "title": "test",
 *              "content": {
 *                  "blocks": [
 *                      {
 *                          ...
 *                      }
 *                  ],
 *                  "entityMap": {
 *                     ...
 *                  }
 *              },
 *              "slug": "test-l30l1pz",
 *              "description": "em test thoi...",
 *              "_id": "59e10780ef72e735b0e0cd38",
 *              "state": "published",
 *              "upVotes": 0,
 *              "createdDate": "2017-10-13T18:35:44.779Z",
 *              "tags": [
 *                  {
 *                      "text": "Mathematics Level 1",
 *                      "id": "58edd54310584c409e89b91e"
 *                  },
 *                  {
 *                      "text": "Discrete Math",
 *                      "id": "58edcfd410584c409e89b87f"
 *                  }
 *              ],
 *              "thumbnail": [],
 *              "anonymous": true,
 *              "questionType": "normal",
 *              "department": {
 *                  "_id": "ge",
 *                  "title": "General"
 *              }
 *          }
 *      }
 *
 */

/**
 * @api {delete} /api/questions/:id/delete Delete a question
 * @apiName DeleteAQuestion
 * @apiVersion 1.1.0
 * @apiGroup Questions
 *
 * @apiParam {String} id Question's _id
 *
 * @apiSuccess {Boolean} success The query success or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true
 *      }
 *
 */

/**
 * @api {post} /api/questions/:id/upvotes Upvote a question
 * @apiName UpvoteAQuestion
 * @apiVersion 1.1.0
 * @apiGroup Questions
 *
 * @apiParam {String} id Question's _id
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Boolean} upvoted The upvote state between current user and question
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *          "upvoted": true
 *      }
 *
 */
