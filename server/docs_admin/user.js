/**
 * @api {get} /api/admin/users Admin get Users
 * @apiName AdminGetUsers
 * @apiVersion 1.0.0
 * @apiGroup User
 *
 * @apiParam {String} status (Required) Filter by status. Only allow `pending`, `user`, `deactive`, `pending_delete`, `deleted`, `pending_expert`, `expert`, `banned`.
 *
 * @apiExample Example get experts:
 * curl "http://localhost:8001/api/admin/users?status=expert"
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Integer} current_page
 * @apiSuccess {Integer} last_page
 * @apiSuccess {Integer} total_items
 * @apiSuccess {Array} data  Array Users
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "current_page": 1,
 *    "last_page": 8,
 *    "total_items": 74,
 *    "data": [
 *       {
 *           "_id": "58cb83c6af26811724e555dd",
 *           "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
 *           "avatar": "/uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1491458752870.jpeg",
 *           "fullName": "John Smith"
 *       },
 *       ...
 *    ]
 * }
 *
 */

/**
 * @api {post} /api/admin/users/approve_expert Admin approve Users become expert
 * @apiName AdminApproveExpert
 * @apiVersion 1.0.0
 * @apiGroup User
 *
 * @apiParam {String} id (For single User) User's id.
 * @apiParam {Array} ids (For multiple Users) User's ids.
 *
 * @apiExample Example single User usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 *
 * @apiExample Example multiple Users usage:
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
 * @api {post} /api/admin/users/reject_expert Admin reject Users become expert
 * @apiName AdminRejectExpert
 * @apiVersion 1.0.0
 * @apiGroup User
 *
 * @apiParam {String} id (For single User) User's id.
 * @apiParam {Array} ids (For multiple Users) User's ids.
 *
 * @apiExample Example single User usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 *
 * @apiExample Example multiple Users usage:
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
 * @api {post} /api/admin/users/unset_expert Admin unset Expert
 * @apiName AdminUnsetExpert
 * @apiVersion 1.0.0
 * @apiGroup User
 *
 * @apiParam {String} id (For single User) User's id.
 * @apiParam {Array} ids (For multiple Users) User's ids.
 *
 * @apiExample Example single User usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 *
 * @apiExample Example multiple Users usage:
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
 * @api {post} /api/admin/users/ban Admin ban Users
 * @apiName AdminBanUser
 * @apiVersion 1.0.0
 * @apiGroup User
 *
 * @apiParam {String} id (For single User) User's id.
 * @apiParam {Array} ids (For multiple Users) User's ids.
 *
 * @apiExample Example single User usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 *
 * @apiExample Example multiple Users usage:
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
 * @api {post} /api/admin/users/unban Admin unban Users
 * @apiName AdminUnBanUser
 * @apiVersion 1.0.0
 * @apiGroup User
 *
 * @apiParam {String} id (For single User) User's id.
 * @apiParam {Array} ids (For multiple Users) User's ids.
 *
 * @apiExample Example single User usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 *
 * @apiExample Example multiple Users usage:
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
 * @api {delete} /api/admin/users/delete Admin delete Users
 * @apiName AdminDeleteUser
 * @apiVersion 1.0.0
 * @apiGroup User
 *
 * @apiParam {String} id (For single User) User's id.
 * @apiParam {Array} ids (For multiple Users) User's ids.
 *
 * @apiExample Example single User usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 *
 * @apiExample Example multiple Users usage:
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
 * @api {get} /api/admin/me Admin own info
 * @apiName AdminOwnInfo
 * @apiVersion 1.0.0
 * @apiGroup User
 *
 * @apiExample Example get experts:
 * curl "http://localhost:8001/api/admin/me"
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data Admin info
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *      "success": true,
 *      "data": {
 *          ...
 *      }
 *  }
 *
 */

/**
 * @api {get} /api/admin/user-chart Admin get data to draw chart
 * @apiName AdminGetChart
 * @apiVersion 1.0.0
 * @apiGroup User
 *
 * @apiParam {Integer} from The number of milliseconds of date from. (getTime)
 * @apiParam {Integer} to The number of milliseconds of date to. (getTime)
 * @apiParam {String} fields The fields to drawl line chart, seperated by `,` Only allow `dateAdded`, `activeDate`, `becomeExpertRequest`, `becomeExpert`
 *
 * @apiExample Example get experts:
 * curl "http://localhost:8001/api/admin/user-chart?from=1489708800000&to=1504569600000&fields=dateAdded,activeDate,meomeo,becomeExpertRequest,becomeExpert"
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data Admin info
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    [
 *     {
 *        "name": "2017-03-17",
 *        "dateAdded": 97
 *      },
 *      {
 *        "name": "2017-03-18",
 *        "dateAdded": 64
 *      },
 *      {
 *        "name": "2017-03-19",
 *        "dateAdded": 15
 *      },
 *      {
 *        "name": "2017-03-20",
 *        "dateAdded": 0
 *      }
 *      ,
 *      ...
 *    ]
 *
 */
