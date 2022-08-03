
/**
 * @api {get} /api/membership/setting-promotion Get promotion seting
 * @apiName GetSettingPromotion
 * @apiVersion 1.1.0
 * @apiGroup MemberShip
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Promotion setting.
 * @apiSuccess {String} data.status promotion status.
 * @apiSuccess {String} data.userGroup User group accept promotion.
 * @apiSuccess {String} data.userReceive Group user receive promotion when use invite code.
 * @apiSuccess {Number} data.type Type of Promotion: percent/dates.
 * @apiSuccess {Number} data.percentValue Percent of promotion.
 * @apiSuccess {String} data.timeValue Time user receive when join promotion (day).
 * @apiSuccess {String} data.expireDate Time end promotion.
 * @apiSuccess {String} Link gui when user click link.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
  "success": true,
  "data": {
    "status": "enabled",
    "userGroup": "all",
    "userReceive": "all",
    "type": "time",
    "percentValue": "50",
    "timeValue": "60",
    "expireDate": "2020-12-05",
    "link": "https://tesse.io/promotion"
  }
 }
 *
 * @apiErrorExample get-setting-promotion:
 *     HTTP/1.1 404 Bad Request
 {
    "success": false,
}
 */
/**
 * @api {get} /api/membership/check-promotion/:inviteCode Check promotion code
 * @apiName CheckPromotionCode
 * @apiVersion 1.1.0
 * @apiGroup MemberShip
 *
 * @apiHeader {String} token User's token
 * @apiParam {String} inviteCode {URL param} Invite code User
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {String} error Error code
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
      "type": "time",
      "userReceive": "all",
      "value": "60"
    }
}
 *
 * @apiErrorExample Check-InviteCode-Response:
 *     HTTP/1.1 400 Bad Request
 {
    "success": false,
    "error": "USER_NOT_MEMBERSHIP"
}
 *
 * @apiErrorExample Check-InviteCode-Response:
 *     HTTP/1.1 400 Bad Request
 {
    "success": false,
    "error": "USER_NOT_FOUND"
}
 *
 * @apiErrorExample Check-InviteCode-Response:
 *     HTTP/1.1 400 Bad Request
 {
    "success": false,
    "error": "USER_EXPIRED_MEMBERSHIP"
}
 *
 * @apiErrorExample Check-InviteCode-Response:
 *     HTTP/1.1 400 Bad Request
 {
    "success": false,
    "error": "CODE_NOT_FOUND"
}
 */