/**
 * @api {get} /api/admin/knowledges Admin get Knowledges
 * @apiName AdminGetKnowledges
 * @apiVersion 1.0.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} state (Optional) Filter by state. Only allow `draft`, `waiting`, `rejected`, `published`. If not provided, it will get all Knowledges.
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Integer} current_page
 * @apiSuccess {Integer} last_page
 * @apiSuccess {Integer} total_items
 * @apiSuccess {Array} data  Array Knowledge
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "current_page": 1,
 *    "last_page": 1,
 *    "total_items": 1,
 *    "data": [
 *        {
 *            "_id": "59606970412dad12aa344a2b",
 *            "title": "Test hinh 08/07",
 *            "state": "draft",
 *            "createdDate": "2017-07-08T05:11:12.487Z",
 *            "author": {
 *                "_id": "58cb83c6af26811724e555dd",
 *                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
 *                "avatar": "/uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1491458752870.jpeg",
 *                "fullName": "John Smith",
 *                "userName": ""
 *            }
 *        }
 *    ]
 * }
 * 
 */

/**
 * @api {post} /api/admin/knowledges/approve Admin approve publish Knowledge
 * @apiName AdminApprovePublishKnowledge
 * @apiVersion 1.0.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} id (For single Knowledge) Knowledge's id.
 * @apiParam {Array} ids (For multiple Knowledges) Knowledge's ids.
 *
 * @apiExample Example single Knowledge usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 * 
 * @apiExample Example multiple Knowledge usage:
 * body:
 * {
 *    "ids": ["594becb364ca120bdff64371", "59606970412dad12aa344a2b"]
 * }
 * 
 * @apiSuccess {Boolean} success The request request or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true
 * }
 * 
 */

/**
 * @api {post} /api/admin/knowledges/reject Admin reject publish Knowledge
 * @apiName AdminRejectPublishKnowledge
 * @apiVersion 1.0.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} id (For single Knowledge) Knowledge's id.
 * @apiParam {Array} ids (For multiple Knowledges) Knowledge's ids.
 *
 * @apiExample Example single Knowledge usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 * 
 * @apiExample Example multiple Knowledge usage:
 * body:
 * {
 *    "ids": ["594becb364ca120bdff64371", "59606970412dad12aa344a2b"]
 * }
 * 
 * @apiSuccess {Boolean} success The request request or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true
 * }
 * 
 */

/**
 * @api {delete} /api/admin/knowledges/delete Admin delete Knowledge
 * @apiName AdminDeleteKnowledge
 * @apiVersion 1.0.0
 * @apiGroup Knowledge
 *
 * @apiParam {String} id (For single Knowledge) Knowledge's id.
 * @apiParam {Array} ids (For multiple Knowledges) Knowledge's ids.
 *
 * @apiExample Example single Knowledge usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 * 
 * @apiExample Example multiple Knowledge usage:
 * body:
 * {
 *    "ids": ["594becb364ca120bdff64371", "59606970412dad12aa344a2b"]
 * }
 * 
 * @apiSuccess {Boolean} success The request request or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true
 * }
 * 
 */