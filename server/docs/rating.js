/**
 * @api {post} /api/user/addrating Submit new Rating
 * @apiName SubmitRating
 * @apiVersion 1.1.0
 * @apiGroup Rating
 *
 * @apiParam {String} transactionID Transaction's id after call.
 * @apiParam {String} comment  Rating's comment.
 * @apiParam {Array} skills  Detail rating. `_id` is unique id of skill, `rate` is point from `1` to `5`.
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *       "transactionID": "cizz6d7g00009qdgdbjxih0ws",
 *       "comment": "hay!",
 *       "skills": [{_id: "5840fa4937513ba90b70f499", rate: 5}]
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