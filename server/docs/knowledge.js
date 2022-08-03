/**
 * @apiDefine PermissionError
 *
 * @apiError PermissionDenied Permission denied.
 *
 * @apiErrorExample Error-PermissionDenied:
 *     HTTP/1.1 403
 *     {
 *       "error": "Permission denied."
 *     }
 */

/**
 * @apiDefine DangerousError
 *
 * @apiError DangerousError Occur when input unallow field.
 *
 * @apiErrorExample Error-DangerousError:
 *     HTTP/1.1 403
 *     {
 *       "error": "Dont hack my app, fucker!"
 *     }
 */

/**
 * @apiDefine NotFoundError
 *
 * @apiError NotFoundError Knowledge not found.
 *
 * @apiErrorExample Error-NotFoundError:
 *     HTTP/1.1 404
 *     {
 *       "error": "No knowledge found."
 *     }
 */

/**
 * @apiDefine MissingFieldError
 *
 * @apiError MissingFieldError Input not enough info.
 *
 * @apiErrorExample Error-MissingFieldError:
 *     HTTP/1.1 400
 *     {
 *       "error": "Please provide full required fields."
 *     }
 */

/**
 * @apiDefine IdMissingError
 *
 * @apiError IdMissingError Not provide "id" field.
 *
 * @apiErrorExample Error-IdMissingError:
 *     HTTP/1.1 400
 *     {
 *       "error": ""id" is required field."
 *     }
 */

/**
 * @apiDefine InternalError
 *
 * @apiError InternalError Server error.
 *
 * @apiErrorExample Error-InternalError:
 *     HTTP/1.1 500
 *     {
 *       "error": "Internal server error."
 *     }
 */

/**
 * @api {post} /api/knowledge Submit new Knowledge
 * @apiName SubmitKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} title Title of the Knowledge.
 * @apiParam {String} content  Content of the Knowledge.
 * @apiParam {String} departmentId  Department's id of the Knowledge.
 * @apiParam {Array} tags  Tag of the Knowledge.
 * @apiParam {String} state State of Knowledge. Only allow `waiting` or `draft`.
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "title": "my first post",
 *		 "content": "meo meo",
 *		 "departmentId": "5828ae7cfbddb053adaf1752",
 *		 "tags": ["TESSE", "TEST"],
 *		 "state": "draft"
 *     }
 *
 * @apiSuccess {String} _id unique ID of the knowledge.
 * @apiSuccess {String} title  Title of the Knowledge.
 * @apiSuccess {String} content  Content of the Knowledge.
 * @apiSuccess {String} state  State of the Knowledge.
 * @apiSuccess {Integer} upVotes  Number up votes of the Knowledge.
 * @apiSuccess {Integer} commentCount  Number comments of the Knowledge.
 * @apiSuccess {Date} createdDate  Created date of the Knowledge.
 * @apiSuccess {Object} department  Department of the Knowledge.
 * @apiSuccess {Array} tags  Tags of the Knowledge.
 * @apiSuccess {Object} author  Author of the Knowledge.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "_id": "5900c27c8d1d1f39e89e5af7",
 *		  "title": "my first post",
 *		  "content": "meo meo",
 *		  "upVotes": 0,
 *		  "commentCount": 0,
 *		  "upvoted": false,
 *		  "createdDate": "2017-04-26T15:53:32.175Z",
 *		  "department": {
 *		    "_id": "5828ae7cfbddb053adaf1752",
 *		    "title": "Web Development"
 *		  },
 *		  "tags": [
 *		    "TESSE", "TEST"
 *		  ],
 *		  "author": {
 *		    "_id": "58cb83c6af26811724e555dd",
 *		    "fullName": "John Smith"
 *		  }
 *		  "state": "draft"
 *		}
 *
 * @apiUse DangerousError
 * @apiUse MissingFieldError
 * @apiUse InternalError
 * 
 */

/**
 * @api {get} /api/knowledge Get All Knowledge
 * @apiName GetAllKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "last_page": 1,
 *  "current_page": 1,
 *  "total_items": 1,
 *  "data": [
 *		{
 *		  "_id": "5900c27c8d1d1f39e89e5af7",
 *		  "title": "my first post",
 *		  "content": "meo meo",
 *		  "upVotes": 0,
 *		  "commentCount": 0,
 *		  "upvoted": false,
 *		  "createdDate": "2017-04-26T15:53:32.175Z",
 *		  "department": {
 *		    "_id": "5828ae7cfbddb053adaf1752",
 *		    "title": "Web Development"
 *		  },
 *		  "tags": [
 *		    "TESSE", "TEST"
 *		  ],
 *		  "author": {
 *		    "_id": "58cb83c6af26811724e555dd",
 *		    "fullName": "John Smith"
 *		  }
 *		  "state": "draft"
 *		},
 *		...
 *  ]
 * }
 *
 * @apiUse InternalError
 * 
*/

/**
 * @api {get} /api/knowledge?q= Search Knowledge
 * @apiName SearchKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 
 * @apiParam {String} q Input string of user.
 * @apiParam {Integer} page  Page query (optional) If not provided, it default to 1.
 * @apiParam {Boolean} exac  If `true`, Knowledge results will contain exactly the input string. <br> Default is `false`.
 * @apiParam {Integer} time  `1` is last hour <br> `2` is last day <br> `3` is last week <br> `4` is last month <br> `5` is last year
 * @apiParam {String} sort Sort knowledges by `upvotes` or `views` or `comment`. Default is `upvotes`.
 
 * @apiParamExample {curl} Request-Example:
 *     curl "dev-tesse-demo.finalthemes.com/api/knowledge?q=first+post&page=1&exac=false&time=5&sort=upvotes"
 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "last_page": 1,
 *  "current_page": 1,
 *  "total_items": 1,
 *  "data": [
 *		{
 *		  "_id": "5900c27c8d1d1f39e89e5af7",
 *		  "title": "my first post",
 *		  "content": "meo meo",
 *		  "state": "published",
 *		  "upVotes": 0,
 *		  "commentCount": 0,
 *		  "upvoted": false,
 *		  "createdDate": "2017-04-26T15:53:32.175Z",
 *		  "department": {
 *		    "_id": "5828ae7cfbddb053adaf1752",
 *		    "title": "Web Development"
 *		  },
 *		  "tags": [
 *		    "TESSE", "TEST"
 *		  ],
 *		  "author": {
 *		    "_id": "58cb83c6af26811724e555dd",
 *		    "fullName": "John Smith"
 *		  }
 *		},
 *		...
 *  ]
 * }
 *
 * @apiUse InternalError
 * 
*/

/** @api {get} /api/knowledge/:_id Get Knowledge By Id
 * @apiName GetKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} _id Knowledges unique ID.
 *
 * @apiSuccess {String} _id unique ID of the knowledge.
 * @apiSuccess {String} title  Title of the Knowledge.
 * @apiSuccess {String} content  Content of the Knowledge.
 * @apiSuccess {Boolean} isCensor  Content of the Knowledge.
 * @apiSuccess {Integer} upVotes  Number up votes of the Knowledge.
 * @apiSuccess {Date} createdDate  Created date of the Knowledge.
 * @apiSuccess {Object} department  Department of the Knowledge.
 * @apiSuccess {Array} tags  Tags of the Knowledge.
 * @apiSuccess {Object} author  Author of the Knowledge.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "_id": "5900c27c8d1d1f39e89e5af7",
 *		  "title": "my first post",
 *		  "content": "meo meo",
 *		  "state": "published",
 *		  "upVotes": 0,
 *		  "commentCount": 0,
 *		  "upvoted": true,
 *		  "createdDate": "2017-04-26T15:53:32.175Z",
 *		  "department": {
 *		    "_id": "5828ae7cfbddb053adaf1752",
 *		    "title": "Web Development"
 *		  },
 *		  "tags": [
 *		    "ReactJS"
 *		  ],
 *		  "author": {
 *		    "_id": "58cb83c6af26811724e555dd",
 *		    "fullName": "John Smith"
 *		  }
 *		}
 *
 * @apiUse NotFoundError
 * @apiUse IdMissingError
 * @apiUse InternalError
 * 
 */

/** @api {put} /api/knowledge/:_id Update Knowledge By Id
 * @apiName UpdateKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} _id Knowledges unique ID. (required)
 * @apiParam {String} title Title of the Knowledge. (optional)
 * @apiParam {String} content  Content of the Knowledge. (optional)
 * @apiParam {String} departmentId  Department's id of the Knowledge. (optional)
 * @apiParam {Array} tags  Tag's ids of the Knowledge. (optional)
 *
 * @apiParamExample {curl} Request-Example:
 *     curl -X PUT -H "Content-Type: application/json" -d '{"title":"new title", "content": "new content"}' "dev-tesse-demo.finalthemes.com:8000/api/knowledge/1"
 *
 * @apiSuccess {String} _id unique ID of the knowledge.
 * @apiSuccess {String} title  Title of the Knowledge.
 * @apiSuccess {String} content  Content of the Knowledge.
 * @apiSuccess {Boolean} isCensor  Content of the Knowledge.
 * @apiSuccess {Integer} upVotes  Number up votes of the Knowledge.
 * @apiSuccess {Date} createdDate  Created date of the Knowledge.
 * @apiSuccess {Object} department  Department of the Knowledge.
 * @apiSuccess {Array} tags  Tags of the Knowledge.
 * @apiSuccess {Object} author  Author of the Knowledge.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "_id": "5900c27c8d1d1f39e89e5af7",
 *		  "title": "new title",
 *		  "content": "new content",
 *		  "state": "published",
 *		  "upVotes": 0,
 *		  "commentCount": 0,
 *		  "upvoted": true,
 *		  "createdDate": "2017-04-26T15:53:32.175Z",
 *		  "department": {
 *		    "_id": "5828ae7cfbddb053adaf1752",
 *		    "title": "Web Development"
 *		  },
 *		  "tags": [
 *		    "ReactJS"
 *		  ],
 *		  "author": {
 *		    "_id": "58cb83c6af26811724e555dd",
 *		    "fullName": "John Smith"
 *		  }
 *		}
 *
 * @apiUse NotFoundError
 * @apiUse IdMissingError
 * @apiUse DangerousError
 * @apiUse PermissionError
 * @apiUse InternalError
 * 
 */

 /** @api {delete} /api/knowledge/:_id Delete Knowledge By Id
 * @apiName DeleteKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} _id Knowledges unique ID.
 *
 * @apiParamExample {curl} Request-Example:
 *     curl -X DELETE "dev-tesse-demo.finalthemes.com:8000/api/knowledge/1"
 *
 * @apiSuccess {Boolean} success delete knowledge state.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true
 *		}
 *
 * @apiUse NotFoundError
 * @apiUse PermissionError
 * @apiUse IdMissingError
 * @apiUse InternalError
 * 
 */

 /** @api {post} /api/knowledge/:_id/censor Censor Knowledge By Id
 * @apiName CensorKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} _id Knowledges unique ID.
 *
 * @apiParamExample {curl} Request-Example:
 *     curl -X PATCH "dev-tesse-demo.finalthemes.com:8000/api/knowledge/1/censor"
 *
 * @apiSuccess {String} _id unique ID of the knowledge.
 * @apiSuccess {String} title  Title of the Knowledge.
 * @apiSuccess {String} content  Content of the Knowledge.
 * @apiSuccess {Boolean} isCensor  Content of the Knowledge.
 * @apiSuccess {Integer} upVotes  Number up votes of the Knowledge.
 * @apiSuccess {Date} createdDate  Created date of the Knowledge.
 * @apiSuccess {Object} department  Department of the Knowledge.
 * @apiSuccess {Array} tags  Tags of the Knowledge.
 * @apiSuccess {Object} author  Author of the Knowledge.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "_id": "5900c27c8d1d1f39e89e5af7",
 *		  "title": "new title",
 *		  "content": "new content",
 *		  "state": "published",
 *		  "upVotes": 0,
 *		  "commentCount": 0,
 *		  "upvoted": true,
 *		  "createdDate": "2017-04-26T15:53:32.175Z",
 *		  "department": {
 *		    "_id": "5828ae7cfbddb053adaf1752",
 *		    "title": "Web Development"
 *		  },
 *		  "tags": [
 *		    "ReactJS"
 *		  ],
 *		  "author": {
 *		    "_id": "58cb83c6af26811724e555dd",
 *		    "fullName": "John Smith"
 *		  }
 *		}
 *
 * @apiUse NotFoundError
 * @apiUse PermissionError
 * @apiError CensoredBefore This knowledge has been censored before..
 * @apiUse InternalError
 * 
 * @apiErrorExample Error-CensoredBefore:
 *     HTTP/1.1 400 CensoredBefore
 *     {
 *       "error": "This knowledge has been censored before."
 *     }
 */

 /** @api {post} /api/knowledge/:_id/upvote Up Vote Knowledge By Id
 * @apiName UpVoteKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} _id Knowledges unique ID.
 *
 * @apiParamExample {curl} Request-Example:
 *     curl -X POST "dev-tesse-demo.finalthemes.com:8000/api/knowledge/1/upvote"
 *
 * @apiSuccess {String} _id unique ID of the knowledge.
 * @apiSuccess {String} title  Title of the Knowledge.
 * @apiSuccess {String} content  Content of the Knowledge.
 * @apiSuccess {Boolean} isCensor  Content of the Knowledge.
 * @apiSuccess {Integer} upVotes  Number up votes of the Knowledge.
 * @apiSuccess {Date} createdDate  Created date of the Knowledge.
 * @apiSuccess {Object} department  Department of the Knowledge.
 * @apiSuccess {Array} tags  Tags of the Knowledge.
 * @apiSuccess {Object} author  Author of the Knowledge.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "_id": "5900c27c8d1d1f39e89e5af7",
 *		  "title": "my first post",
 *		  "content": "meo meo",
 *		  "isCensor": true,
 *		  "upVotes": 1,
 *		  "createdDate": "2017-04-26T15:53:32.175Z",
 *		  "department": {
 *		    "_id": "5828ae7cfbddb053adaf1752",
 *		    "title": "Web Development"
 *		  },
 *		  "tags": [
 *		    {
 *		      "_id": "5840fa4937513ba90b70f4ab",
 *		      "name": "ReactJS"
 *		    }
 *		  ],
 *		  "author": {
 *		    "_id": "58cb83c6af26811724e555dd",
 *		    "fullName": "John Smith",
 *		    "avatar": ""
 *		  }
 *		}
 *
 * @apiUse NotFoundError
 * @apiUse PermissionError
 * @apiUse InternalError
 * 
 */

/** @api {post} /api/knowledge/:_id/comments Submit comment to knowledge
 * @apiName CommentToKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 * 
 * @apiParam {String} _id Knowledges unique ID.
 * @apiParam {String} content Comment's content.
 * 
 * @apiParamExample {curl} Request-Example:
 *      curl -X POST -H "Content-Type: application/json" -d '{"content":"Day la comment ne may anh oi"}' "dev-tesse-demo.finalthemes.com:8000/api/knowledge/1/comments"
 *      
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *          "_id": "5900b76920d8fe105fdab821",
 *          "knowledgeId": "1",
 *          "content": "Day la comment ne may anh oi",
 *          "publishedDate": "2017-04-26T15:06:17.847Z",
 *          "publisher": {
 *              "_id": "58e2447aae18f30e6233dd7d",
 *              "avatar": "",
 *              "fullName": "Viet Phung"
 *          }
 *       }
 *  
 *  @apiUse IdMissingError
 *  @apiUse NotFoundError
 *  @apiUse MissingFieldError
 *  @apiUse InternalError
 *  
 */

/** @api {get} /api/knowledge/:_id/comments Get comments by Knowledge's id
 * @apiName GetKnowledgeComment
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} _id Knowledges unique ID.
 * @apiParam {Integer} page Page query (optional) If not provided, it default to 1.
 *
 * @apiParamExample {curl} Request-Example:
 *     curl -X GET "dev-tesse-demo.finalthemes.com:8000/api/knowledge/1/comments"
 *
 * @apiSuccess {Integer} current_page current page querying.
 * @apiSuccess {Integer} last_page  Last page exist.
 * @apiSuccess {Integer} total_items  Total Knowledge's comments count.
 * @apiSuccess {Array} data  Array comments.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "last_page": 1,
 *  "current_page": 1,
 *  "total_items": 5,
 *  "data": [
 *    {
 *      "_id": "591833aaa71ec60e507e0a43",
 *      "knowledgeId": "58fe263f337ccc0f2d28166d",
 *      "content": "comment moi ne",
 *      "publishedDate": "2017-05-14T10:38:34.899Z",
 *      "publisher": {
 *        "_id": "58e2447aae18f30e6233dd7d",
 *        "avatar": "",
 *        "fullName": "Viet Phung"
 *      },
 *      "replyCount": 0
 *    },
 *    {
 *      "_id": "5900b76920d8fe105fdab821",
 *      "knowledgeId": "58fe263f337ccc0f2d28166d",
 *      "content": "hay!!",
 *      "publishedDate": "2017-04-26T15:06:17.847Z",
 *      "publisher": {
 *        "_id": "58e2447aae18f30e6233dd7d",
 *        "avatar": "",
 *        "fullName": "Viet Phung"
 *      },
 *      "replyCount": 1
 *    },
 *    ...
 *  ]
 * }
 *
 * @apiUse NotFoundError
 * @apiUse IdMissingError
 * @apiUse InternalError
 * 
 */

/** @api {post} /api/knowledge/:_id/bookmark Bookmark Knowledge By Id
 * @apiName BookmarkKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} _id Knowledges unique ID.
 *
 * @apiParamExample {curl} Request-Example:
 *     curl -X POST "dev-tesse-demo.finalthemes.com:8000/api/knowledge/1/bookmark"
 *
 * @apiSuccess {Boolean} success  Whether the request success or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *      success: true
 *		}
 *
 * @apiUse NotFoundError
 * @apiUse PermissionError
 * @apiUse InternalError
 * 
 */

/** @api {post} /api/knowledge/:_id/remove-bookmark Remove Bookmark Knowledge By Id
 * @apiName RemoveBookmarkKnowledge
 * @apiVersion 1.1.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} _id Knowledges unique ID.
 *
 * @apiParamExample {curl} Request-Example:
 *     curl -X POST "dev-tesse-demo.finalthemes.com:8000/api/knowledge/1/remove-bookmark"
 *
 * @apiSuccess {Boolean} success  Whether the request success or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *      success: true
 *		}
 *
 * @apiUse NotFoundError
 * @apiUse PermissionError
 * @apiUse InternalError
 * 
 */