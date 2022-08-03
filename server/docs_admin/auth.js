/**
 * @api {post} /api/admin/login Admin Login
 * @apiName AdminLogin
 * @apiVersion 1.0.0
 * @apiGroup Auth
 *
 * @apiParam {String} email Admin's email
 * @apiParam {String} password Admin's password
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data  Response data
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "data": {
 *        "_id": "594becb364ca120bdff64371",
 *        "cuid": "cj48mndxj0000cfemeibpnjup",
 *        "avatar": "",
 *        "fullName": "Viet Phung",
 *        "userName": "rexviet"
 *    },
 *    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OTRiZWNiMzY0Y2ExMjBiZGZmNjQzNzEiLCJpYXQiOjE1MDAwMTU2ODAsImV4cCI6MTUwMDAxOTI4MH0.t9eqN3tgOykgfEF574ANgelU1b5UTjGM6CE0enwN38M"
 * }
 * 
 */