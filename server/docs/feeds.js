/**
 * @api {get} /api/feeds Get own's feeds
 * @apiName GetOwnFeeds
 * @apiVersion 1.0.0
 * @apiGroup Feeds
 *
 * @apiParam {String} type Feed's type. Only allow `knowledge` or `question`
 *
 * @apiSuccess {Boolean} success Whether the request success or not.
 * @apiSuccess {Integer} current_page  Current page querying.
 * @apiSuccess {Integer} last_page The last page exist.
 * @apiSuccess {Integer} total_items Total Feeds count.
 * @apiSuccess {Array} data Array Feeds.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200
 *     {
 *       "success": true,
 *       "current_page": 1,
 *       "last_page": 1,
 *       "total_items": 1,
 *       "data": [
 *         {
 *           "_id": "599aa08bd426861223c773d7",
 *           "object": {
 *             "_id": "595e4c34c10a6e0f6a67a3d6",
 *             "description": "Bài published",
 *             "slug": "bai-published",
 *             "title": "Em test thoi nha 2",
 *             "__v": 0,
 *             "language": "pt",
 *             "views": 0,
 *             "state": "published",
 *             "upVotes": 0,
 *             "createdDate": "2017-07-06T12:12:13.114Z",
 *             "tags": [
 *               "INCONTESTABLE CLAUSE "
 *             ],
 *             "thumbnail": [
 *               "https://www.youtube.com/watch?v=PMNFaAUs2mo",
 *               "uploads/knowledge/cj4cwt2250000fiknalvuxm4j/1499341914815-snooze-cat-1366-x768-jpg.jpg"
 *             ],
 *             "department": {
 *               "_id": "58bbff5ec8f8e87c0b2ebd16",
 *               "title": "Banking"
 *             },
 *             "author": {
 *               "_id": "58cb83c6af26811724e555dd",
 *               "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
 *               "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1491458752870.jpeg",
 *               "fullName": "John Smith",
 *               "userName": ""
 *             },
 *             "commentCount": 0,
 *             "upvoted": false,
 *             "bookMark": false
 *           },
 *           "action": "published",
 *           "type": "knowledge",
 *           "__v": 0,
 *           "createdDate": "2017-08-21T08:57:47.365Z"
 *         }
 *       ]
 *    }
 *
 * @apiUse InternalError
 *
 */


/**
 * @api {get} /home-feeds-v2 Get feed for home
 * @apiName Get Home feed
 * @apiVersion 1.0.0
 * @apiGroup Feeds
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200
 *    {
    "success": true,
    "data": [
        {
            "_id": "5a8bbde15fb11e43fa958ea5",
            "description": "...",
            "slug": "httpstesseio",
            "title": "https://tesse.io",
            "authorId": "5959e826bc5834216f1060d2",
            "__v": 0,
            "language": "pt",
            "views": 1,
            "state": "draft",
            "upVotes": 0,
            "createdDate": "2018-02-20T06:19:13.097Z",
            "tags": [],
            "thumbnail": [],
            "departmentId": "ge"
        },
        {
            "_id": "5a77c9197baa500782095041",
            "description": "...",
            "slug": "heweweldadosad",
            "title": "heweweldadosad",
            "authorId": "5959e826bc5834216f1060d2",
            "__v": 0,
            "language": "es",
            "views": 1,
            "state": "published",
            "upVotes": 0,
            "createdDate": "2018-02-05T03:01:45.691Z",
            "tags": [],
            "thumbnail": [],
            "departmentId": "ge"
        },
        {
            "_id": "5a77c83dc825bd43c282a3e7",
            "description": "...",
            "slug": "hello",
            "title": "hello",
            "authorId": "596f8f0295059504b20c2f7e",
            "__v": 0,
            "language": "it",
            "views": 0,
            "state": "published",
            "upVotes": 0,
            "createdDate": "2018-02-05T02:58:05.389Z",
            "tags": [
                {
                    "id": "5840fa4937513ba90b70f4aa",
                    "text": "PHP"
                },
                {
                    "id": "58edd54310584c409e89b91e",
                    "text": "Mathematics Level 1"
                }
            ],
            "thumbnail": [],
            "departmentId": "5a0073c4476e461f80e95855"
        },
        {
            "_id": "5a77c7d9c825bd43c282a3e6",
            "description": "...",
            "slug": "sadfwewgfwf",
            "title": "sádfwewgfwf",
            "authorId": "5959e826bc5834216f1060d2",
            "__v": 0,
            "language": "un",
            "views": 2,
            "state": "published",
            "upVotes": 1,
            "createdDate": "2018-02-05T02:56:25.962Z",
            "tags": [
                {
                    "id": "5840fa4937513ba90b70f4ad",
                    "text": "WordPress"
                }
            ],
            "thumbnail": [],
            "departmentId": "58bbff53c8f8e87c0b2ebd14"
        },
        {
            "_id": "5a77c78bc825bd43c282a3e3",
            "description": "...",
            "slug": "helllo-wowrlelsadlsad",
            "title": "helllo wowrlelsadlsad",
            "authorId": "5959e826bc5834216f1060d2",
            "__v": 0,
            "language": "cy",
            "views": 0,
            "state": "waiting",
            "upVotes": 0,
            "createdDate": "2018-02-05T02:55:07.918Z",
            "tags": [
                {
                    "id": "5840fa4937513ba90b70f4aa",
                    "text": "PHP"
                }
            ],
            "thumbnail": [],
            "departmentId": "58bbff53c8f8e87c0b2ebd14"
        },
        {
            "_id": "5a77c736c825bd43c282a3e1",
            "description": "...",
            "slug": "hello-worrrrrrllldldd-5d3dngi",
            "title": "hello worrrrrrllldldd",
            "authorId": "5959e826bc5834216f1060d2",
            "__v": 0,
            "language": "cy",
            "views": 0,
            "state": "waiting",
            "upVotes": 0,
            "createdDate": "2018-02-05T02:53:42.188Z",
            "tags": [],
            "thumbnail": [],
            "departmentId": "ge"
        }
    ],
    "type": "knowledges"
}
 *
 * @apiUse InternalError
 *
 */
