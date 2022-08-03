/**
 * @api {post} /refund/:id/approve Admin approve refund
 * @apiName AdminApproveRefund
 * @apiVersion 1.1.0
 * @apiGroup Refund
 *
 * @apiHeader {String} Authorization Admin's JWT
 * @apiParam {String} id {URL param} Course's id
 * @apiParam {String} notes {Body param} Admin's notes
 * @apiParam {String} status {Body param} Admin's notes
 *
 * @apiSuccess {Boolean} success The query success or not
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true
}
 */
