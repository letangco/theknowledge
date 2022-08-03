/**
 * @api {get} /api/country/get-countries?keyword=ha Get list country and search autocomplete
 * @apiName GetCountries
 * @apiVersion 1.1.0
 * @apiGroup Country - State
 *
 * @apiParam {String} keyword Search keyword country (on query)
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Integer} current_page Current page query.
 * @apiSuccess {Integer} last_page Last page exist.
 * @apiSuccess {Integer} total_items Total answers
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
 * @api {get} /api/country/get-states/:id?keyword=ha Get list state by country and search autocomplete
 * @apiName GetStateByCountries
 * @apiVersion 1.1.0
 * @apiGroup Country - State
 *
 * @apiParam {String} id Id of country
 * @apiParam {String} keyword Search keyword state (on query)
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Integer} current_page Current page query.
 * @apiSuccess {Integer} last_page Last page exist.
 * @apiSuccess {Integer} total_items Total answers
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