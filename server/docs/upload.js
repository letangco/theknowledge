/**
 * @api {post} /upload/upload-news API Upload image news
 * @apiName API upload image news with form-data
 * @apiVersion 1.1.0
 * @apiGroup Upload
 *
 * @apiParam {File} image send form-data
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {String} fileName The name file upload
 * @apiSuccess {String} fileUrl The url file upload
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "fileName": "1622010994095-screenshot-from-2021-05-15-01-26-09.png",
 *       "fileUrl": "https://theknowledgeai.tesse.io/uploads/news-image/1622010994095-screenshot-from-2021-05-15-01-26-09.png"
 *   }
 *
 */