/**
 * @api {get} /api/admin/suggest_skills Admin get list suggest skills
 * @apiName AdminGetSuggestSkills
 * @apiVersion 1.0.0
 * @apiGroup Skill
 *
 * @apiParam {Integer} page (Optional) Page to query. If not provided, it's default is `1`.
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Integer} current_page
 * @apiSuccess {Integer} last_page
 * @apiSuccess {Integer} total_items
 * @apiSuccess {Array} data  Array Suggest Skills
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
 *            "_id": "58a018212663691f4890c2ce",
 *            "skill": "React Native",
 *            "description": "JavaScript Library ",
 *            "dateAdded": "2017-02-12T08:09:05.053Z",
 *            "industry": {
 *                "_id": "5828ae7cfbddb053adaf1744",
 *                "title": "Computers & Programming"
 *            },
 *            "department": {
 *                "_id": "5828ae7cfbddb053adaf1749",
 *                "title": "Mobile Programming"
 *            }
 *        }
 *    ]
 * }
 * 
 */

/**
 * @api {post} /api/admin/suggest_skills/approve Admin approve Suggest Skill
 * @apiName AdminApproveSuggestSkill
 * @apiVersion 1.0.0
 * @apiGroup Skill
 *
 * @apiParam {String} id (For single Skill) Skill's id.
 * @apiParam {Array} ids (For multiple Skills) Skill's ids.
 *
 * @apiExample Example single Skill usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 * 
 * @apiExample Example multiple Skill usage:
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
 * @api {post} /api/admin/suggest_skills/reject Admin reject Suggest Skill
 * @apiName AdminRejectSuggestSkill
 * @apiVersion 1.0.0
 * @apiGroup Skill
 *
 * @apiParam {String} id (For single Skill) Skill's id.
 * @apiParam {Array} ids (For multiple Skills) Skill's ids.
 *
 * @apiExample Example single Skill usage:
 * body:
 * {
 *    "id": "594becb364ca120bdff64371"
 * }
 * 
 * @apiExample Example multiple Skill usage:
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