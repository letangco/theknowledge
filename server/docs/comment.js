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
 * @apiError NotFoundError Comment not found.
 *
 * @apiErrorExample Error-NotFoundError:
 *     HTTP/1.1 404
 *     {
 *       "error": "No comment found."
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


/** @api {put} /api/comment/:_id Update Comment By Id
 * @apiName UpdateComment
 * @apiVersion 1.1.0
 * @apiGroup Comment
 *
 * @apiParam {String} _id Comment unique ID. 
 * @apiParam {String} content Content of the Comment. 
 *
 * @apiParamExample {curl} Request-Example:
 *     curl -X PUT -H "Content-Type: application/json" -d '{"content": "new content"}' "dev-tesse-demo.finalthemes.com:8000/api/comment/1"
 *
 * @apiSuccess {String} _id unique ID of the Comment.
 * @apiSuccess {String} knowledgeId  _id of the Knowledge.
 * @apiSuccess {String} content  Content of the Comment.
 * @apiSuccess {Date} publishedDate  Published date of the Comment.
 * @apiSuccess {Object} publisher  Publisher's information.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *          "_id": "5900b76920d8fe105fdab821",
 *          "knowledgeId": "58fe263f337ccc0f2d28166d",
 *          "content": "new content",
 *          "publishedDate": "2017-04-26T15:06:17.847Z",
 *          "publisher": {
 *              "_id": "58e2447aae18f30e6233dd7d",
 *              "avatar": "",
 *              "fullName": "Viet Phung"
 *          }
 *       }
 *
 * @apiUse NotFoundError
 * @apiUse IdMissingError
 * @apiUse MissingFieldError
 * @apiUse DangerousError
 * @apiUse InternalError
 * @apiUse PermissionError
 * 
 */

/** @api {delete} /api/comment/:_id Delete Comment By Id
 * @apiName DeleteComment
 * @apiVersion 1.1.0
 * @apiGroup Comment
 *
 * @apiParam {String} _id Comment unique ID. 
 *
 * @apiParamExample {curl} Request-Example:
 *     curl -X DELETE "dev-tesse-demo.finalthemes.com:8000/api/comment/1"
 *
 * @apiSuccess {Boolean} success delete comment state.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *		{
 *		  "success": true
 *		}
 *
 * @apiUse NotFoundError
 * @apiUse IdMissingError
 * @apiUse PermissionError 
 * @apiUse InternalError
 * 
 */

/** @api {post} /api/comment/:_id/replies Reply To A Comment
 * @apiName ReplyToComment
 * @apiVersion 1.1.0
 * @apiGroup Comment
 *
 * @apiParam {String} _id Comment unique ID. 
 * @apiParam {String} content Reply's content.
 *
 * @apiParamExample {curl} Request-Example:
 *     curl -X POST -H "Content-Type: application/json" -d '{"content":"Day la reply tren comment ne nha"}' "dev-tesse-demo.finalthemes.com:8000/api/comment/1/replies"
 *
 * @apiSuccess {Boolean} success delete comment state.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "knowledgeId": "58fe263f337ccc0f2d28166d",
 *  "parentId": "1",
 *  "content": "reply nua ne",
 *  "_id": "5918460e34af280fd5058704",
 *  "publishedDate": "2017-05-14T11:57:02.569Z",
 *  "publisher": {
 *    "_id": "58e2447aae18f30e6233dd7d",
 *    "avatar": "",
 *    "fullName": "Viet Phung"
 *  }
 * }
 *
 * @apiUse NotFoundError
 * @apiUse IdMissingError
 * @apiUse PermissionError 
 * @apiUse InternalError
 * @apiUse MissingFieldError
 * 
 */

/** @api {get} /api/comment/:_id/replies Get Replies of a Comment
 * @apiName GetCommentReplies
 * @apiVersion 1.1.0
 * @apiGroup Comment
 *
 * @apiParam {String} _id Comment unique ID. 
 * @apiParam {Integer} page Page query (optional). If not provided, it defaults to 1.
 *
 * @apiSuccess {Integer} current_page current page querying.
 * @apiSuccess {Integer} last_page  Last page exist.
 * @apiSuccess {Integer} total_items  Total Comment's replies count.
 * @apiSuccess {Array} data  Array replies.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *  "last_page": 1,
 *  "current_page": 1,
 *  "total_items": 5,
 *  "data": [
 *    {
 *      "knowledgeId": "58fe263f337ccc0f2d28166d",
 *      "parentId": "1",
 *      "content": "reply nua ne",
 *      "_id": "5918460e34af280fd5058704",
 *      "publishedDate": "2017-05-14T11:57:02.569Z",
 *      "publisher": {
 *      "_id": "58e2447aae18f30e6233dd7d",
 *      "avatar": "",
 *      "fullName": "Viet Phung"
 *    },
 *    ...
 *  ]
 * }
 *
 * @apiUse NotFoundError
 * @apiUse IdMissingError
 * @apiUse PermissionError 
 * @apiUse InternalError
 * @apiUse MissingFieldError
 * 
 */