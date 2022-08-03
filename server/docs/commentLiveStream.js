/**
 * @api {put} /api/comment-live-stream/:id/update Edit comment live stream
 * @apiName EditCommentLiveStream
 * @apiVersion 1.1.0
 * @apiGroup CommentLiveStream
 *
 * @apiParam {String} id Live Stream's _id
 * @apiParam {String} content Live Stream content
 *
 * @apiParamExample {json}
 *    {
 *     "content": "test live stream comment"
 *   }
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Object} data The Comment of Live Stream.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "__v": 0,
        "user": "58e61e310fc0f92c8685b223",
        "liveStream": "5a5c1ede6cb0bc7b4a48fe61",
        "content": "test comment update",
        "videoTime": 0,
        "_id": "5a5dc90a81f67dc3aaa91d0a",
        "createdAt": "2018-01-16T09:42:34.531Z"
    }
}
 *
 */

/**
 * @api {delete} /api/comment-live-stream/:id/delete Delete comment live stream
 * @apiName DeleteCommentLiveStream
 * @apiVersion 1.1.0
 * @apiGroup CommentLiveStream
 *
 * @apiParam {String} id Live Stream's _id
 *
 * @apiSuccess {Boolean} success The request request or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true
}
 *
 */
