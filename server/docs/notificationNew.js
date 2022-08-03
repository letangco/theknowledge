/**
 * @api {post} /Not-API/ follow
 * @apiName follow
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
            "_id": "5b2757234c576227b7637526",
            "to": "58e61e310fc0f92c8685b223",
            "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
            "type": "follow",
            "status": true,
            "seen": true,
            "date": "2018-05-04T02:55:22.273Z",
            "__v": 0
        }
 */

/**
 * @api {post} /Not-API/ appointment
 * @apiName appointment
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d326470731d768ba127"),
    "to" : ObjectId("58d7b88a3d891606ffeb03d6"),
    "object" : ObjectId("59702588120076775cb36a1c"),
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "data" : {
        "content" : "",
        "cuid" : "cj5bvz4cp0000kso95e6mf6d9"
    },
    "type" : "appointment",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-07-20T03:37:44.266Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ appointmentComment
 * @apiName appointmentComment
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d326470731d768ba127"),
    "to" : ObjectId("58d7b88a3d891606ffeb03d6"),
    "object" : ObjectId("59702588120076775cb36a1c"),
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "data" : {
        "content" : "",
        "cuid" : "cj5bvz4cp0000kso95e6mf6d9"
    },
    "type" : "appointmentComment",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-07-20T03:37:44.266Z"),
    "__v" : 0
}
 *
 * */


/**
 * @api {post} /Not-API/ upVoteKnowledge
 * @apiName upVoteKnowledge
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "_id" : ObjectId("5b273d356470731d768ba20f"),
     "to" : ObjectId("5971a26797c27279d8083522"),
     "object" : {description slug title state},
     "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
     "data" : {
         "number" : 0
     },
     "type" : "upVoteKnowledge",
     "status" : true,
     "seen" : true,
     "date" : ISODate("2017-07-21T07:29:44.049Z"),
     "__v" : 0
 }
 *
 * */

/**
 * @api {post} /Not-API/ commentKnowledgeAuthor
 * @apiName commentKnowledgeAuthor
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d356470731d768ba225"),
    "to" : ObjectId("5971a26797c27279d8083522"),
    "object" : {description slug title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "data" : {
        "commentID" : "59e24df91145e202b18b1cb2",
        "content" : "sfdsfsdfsd",
        "number" : 0
    },
    "type" : "commentKnowledgeAuthor",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-10-14T17:48:42.397Z"),
    "__v" : 0
}
 *
 * */


/**
 * @api {post} /Not-API/ commentKnowledgeUserVote
 * @apiName commentKnowledgeUserVote
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d356470731d768ba228"),
    "to" : ObjectId("59734e23b6dba63405da506a"),
    "object" : {description slug title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "data" : {
        "commentID" : "599e8cd3a0455f089dc6077f",
        "content" : "thanthan",
        "number" : 0
    },
    "type" : "commentKnowledgeUserVote",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-08-24T08:22:43.546Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ commentKnowledgeUserComment
 * @apiName commentKnowledgeUserComment
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "_id" : ObjectId("5b273d836470731d768baf90"),
     "to" : ObjectId("58cb9003af26811724e555e4"),
     "object" : {description slug title state},
     "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
     "data" : {
         "commentID" : "599ffc7e5b67b63d8ad881b7",
         "content" : "than test",
         "number" : 0
     },
     "type" : "commentKnowledgeUserComment",
     "status" : true,
     "seen" : true,
     "date" : ISODate("2017-08-25T10:31:27.160Z"),
     "__v" : 0
 }
 *
 * */

/**
 * @api {post} /Not-API/ commentReplyKnowledgeAuthor
 * @apiName commentReplyKnowledgeAuthor
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d376470731d768ba2e3"),
    "to" : ObjectId("5973786ab6dba63405da5223"),
    "object" : {description slug title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "parentId" : {content publisherId upVotes},
    "data" : {
        "commentID" : "5975f62e2b64a91e602ca6a8",
        "content" : "You should have a video to show how to cook that foood",
        "number" : 0
    },
    "type" : "commentReplyKnowledgeAuthor",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-07-24T13:29:18.705Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ commentReplyKnowledgeComment
 * @apiName commentReplyKnowledgeComment
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d3c6470731d768ba5ca"),
    "to" : ObjectId("5959e826bc5834216f1060d2"),
    "object" : {description slug title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "parentId" : {content publisherId upVotes},
    "data" : {
        "commentID" : "59a92085e2bf86262361fcc0",
        "content" : "adfjlkasdf",
        "number" : 0
    },
    "type" : "commentReplyKnowledgeComment",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-09-01T08:55:33.744Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ censorKnowledge
 * @apiName censorKnowledge
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d376470731d768ba342"),
    "to" : ObjectId("58cb9b3baf26811724e55611"),
    "object" : {description slug title state},
    "type" : "censorKnowledge",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-08-31T10:00:16.814Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ adminRejectKnowledge
 * @apiName adminRejectKnowledge
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "_id" : ObjectId("5b273d376470731d768ba342"),
    "to" : ObjectId("58cb9b3baf26811724e55611"),
    "type" : "adminRejectKnowledge",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-08-31T10:00:16.814Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ adminDeleteKnowledge
 * @apiName adminDeleteKnowledge
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "_id" : ObjectId("5b273d376470731d768ba342"),
    "to" : ObjectId("58cb9b3baf26811724e55611"),
    "type" : "adminDeleteKnowledge",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-08-31T10:00:16.814Z"),
    "__v" : 0
}
 *
 * */


/**
 * @api {post} /Not-API/ adminDeleteKnowledge
 * @apiName adminDeleteKnowledge
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "_id" : ObjectId("5b273d376470731d768ba342"),
    "to" : ObjectId("58cb9b3baf26811724e55611"),
    "type" : "adminDeleteKnowledge",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-08-31T10:00:16.814Z"),
    "__v" : 0
}
 *
 * */


/**
 * @api {post} /Not-API/ approvedExpert
 * @apiName approvedExpert
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
{
  "_id" : ObjectId("5b273d336470731d768ba147"),
  "to" : ObjectId("58d0ebf6af26811724e56386"),
  "type" : "approvedExpert",
  "status" : false,
  "seen" : true,
  "date" : ISODate("2017-08-07T08:11:25.067Z"),
  "__v" : 0
}
 *
 * */



/**
 * @api {post} /Not-API/ rejectExpert
 * @apiName rejectExpert
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d376470731d768ba537"),
    "to" : ObjectId("58cb9b3baf26811724e55611"),
    "type" : "rejectExpert",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2018-06-01T11:38:23.942Z"),
    "__v" : 0
}
 *
 * */


/**
 * @api {post} /Not-API/ unsetExpertByAdmin
 * @apiName unsetExpertByAdmin
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d276470731d768ba01d"),
    "to" : ObjectId("58cb83c6af26811724e555dd"),
    "type" : "unsetExpertByAdmin",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2018-06-12T07:47:04.907Z"),
    "__v" : 0
}
 *
 * */


/**
 * @api {post} /Not-API/ appointmentComment
 * @apiName adminApproveSuggestSkill
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d276470731d768b9fb9"),
    "to" : ObjectId("58cb83c6af26811724e555dd"),
    "type" : "adminApproveSuggestSkill",
    "data" : {
        "content" : "BBBB"
    },
    "status" : true,
    "seen" : true,
    "date" : ISODate("2018-04-26T07:21:16.252Z"),
    "__v" : 0
}
 *
 * */



/**
 * @api {post} /Not-API/ answerQuestionUserVote
 * @apiName answerQuestionUserVote
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d3c6470731d768ba668"),
    "to" : ObjectId("5959e826bc5834216f1060d2"),
    "object" : {description slug anonymous title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "data" : {
        "anonymous" : false,
        "content" : ":o",
        "answerId" : "5a2515a1f1565c7b7810ea5f",
        "number" : 0
    },
    "type" : "answerQuestionUserVote",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-12-04T09:30:11.053Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ answerQuestionUserAnswer
 * @apiName answerQuestionUserAnswer
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d3c6470731d768ba5df"),
    "to" : ObjectId("5959e826bc5834216f1060d2"),
    "object" : {description slug anonymous title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "data" : {
        "anonymous" : false,
        "content" : "huhu",
        "answerId" : "59f458ce90ac6a0de45bb4a4",
        "number" : 0
    },
    "type" : "answerQuestionUserAnswer",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-10-28T10:15:43.526Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ answerQuestionAuthor
 * @apiName answerQuestionAuthor
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d3c6470731d768ba619"),
    "to" : ObjectId("5959e826bc5834216f1060d2"),
    "object" : {description slug anonymous title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "data" : {
        "anonymous" : false,
        "content" : "hallo",
        "answerId" : "5a1b8e63ebb26f2c58c10d03",
        "number" : 0
    },
    "type" : "answerQuestionAuthor",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-11-27T04:02:44.653Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ upVoteQuestion
 * @apiName upVoteQuestion
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d3c6470731d768ba734"),
    "to" : ObjectId("5959e826bc5834216f1060d2"),
    "object" : {description slug anonymous title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "data" : {
        "number" : 0
    },
    "type" : "upVoteQuestion",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2018-03-26T04:26:28.452Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ answerReplyQuestionUserVote
 * @apiName answerReplyQuestionUserVote
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d836470731d768bafc8"),
    "to" : ObjectId("59bb7ad3d71876766901775a"),
    "object" : {description slug anonymous title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "parentId" : {content user anonymous upVotes},
    "data" : {
        "anonymous" : false,
        "content" : "abcabcabc",
        "answerId" : "59ed91df656d4b0b2c60f474",
        "number" : 0
    },
    "type" : "answerReplyQuestionUserVote",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-10-23T06:53:20.090Z"),
    "__v" : 0
}
 *
 * */
/**
 * @api {post} /Not-API/ answerReplyQuestionUserReply
 * @apiName answerReplyQuestionUserReply
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d836470731d768bafc9"),
    "to" : ObjectId("59bb7ad3d71876766901775a"),
    "object" : {description slug anonymous title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "parentId" : {content user anonymous upVotes},
    "data" : {
        "anonymous" : false,
        "content" : "comment nguoc nef",
        "answerId" : "59ed9213656d4b0b2c60f47c",
        "number" : 0
    },
    "type" : "answerReplyQuestionUserReply",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-10-23T06:54:12.385Z"),
    "__v" : 0
}
 *
 * */
/**
 * @api {post} /Not-API/ answerReplyQuestionAuthor
 * @apiName answerReplyQuestionAuthor
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d3c6470731d768ba644"),
    "to" : ObjectId("5959e826bc5834216f1060d2"),
    "object" : {description slug anonymous title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "parentId" : {content user anonymous upVotes},
    "data" : {
        "anonymous" : false,
        "content" : "aa",
        "answerId" : "5a1e5aab4f9a490fc09d047a",
        "number" : 0
    },
    "type" : "answerReplyQuestionAuthor",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-11-29T06:58:52.552Z"),
    "__v" : 0
}
 *
 * */
/**
 * @api {post} /Not-API/ replyQuestionAnswer
 * @apiName replyQuestionAnswer
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d3c6470731d768ba644"),
    "to" : ObjectId("5959e826bc5834216f1060d2"),
    "object" : {description slug anonymous title state},
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "parentId" : {content user anonymous upVotes},
    "data" : {
        "anonymous" : false,
        "content" : "aa",
        "answerId" : "5a1e5aab4f9a490fc09d047a",
        "number" : 0
    },
    "type" : "replyQuestionAnswer",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-11-29T06:58:52.552Z"),
    "__v" : 0
}
 *
 * */
/**
 * @api {post} /Not-API/ adminNotification
 * @apiName adminNotification
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d116470731d768b9df0"),
    "to" : ObjectId("591c38b0a9b218250f44d838"),
    "data" : {
        "link" : "",
        "content" : ""
    },
    "type" : "adminNotification",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2018-01-03T11:20:33.385Z"),
    "__v" : 0
}
 *
 * */
/**
 * @api {post} /Not-API/ userInviteCode
 * @apiName userInviteCode
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d3c6470731d768ba60c"),
    "to" : ObjectId("5959e826bc5834216f1060d2"),
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "type" : "userInviteCode",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-11-21T03:07:35.466Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ userInvited
 * @apiName userInvited
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d3c6470731d768ba618"),
    "to" : ObjectId("5959e826bc5834216f1060d2"),
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "type" : "userInvited",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-11-22T09:54:23.873Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ userUsedInvited
 * @apiName userUsedInvited
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d3c6470731d768ba618"),
    "to" : ObjectId("5959e826bc5834216f1060d2"),
    "type" : "userUsedInvited",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2017-11-22T09:54:23.873Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ followCourses
 * @apiName followCourses
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
           "_id": "5b2757234c576227b7637525",
           "to": "58e61e310fc0f92c8685b223",
           "from": {
               "fullName": "Pham Than",
               "avatar": "uploads/avatar/cja3n7l3l00045ukn0temym2f-1528100231243.jpeg",
               "cuid": "cja3n7l3l00045ukn0temym2f",
               "_id": "5a0e9dbc5ac67d29520ddd66"
           },
           "data": {
               "url": "course/test-notify",
               "coursesId": "5aead7d26160831ca4a5d1a6"
           },
           "type": "followCourses",
           "status": true,
           "seen": true,
           "date": "2018-06-18T06:54:27.458Z",
           "__v": 0
       }
 *
 * */

/**
 * @api {post} /Not-API/ joinCourses
 * @apiName joinCourses
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b2756d64c576227b763671c"),
    "to" : ObjectId("596f8f0295059504b20c2f7e"),
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "object" : ObjectId("5a1110498fff0b3e829aea6d"),
    "data" : {
        "url" : "course/1111111"
    },
    "type" : "joinCourses",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2018-06-18T06:53:10.705Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ joinCoursesToAuthor
 * @apiName joinCoursesToAuthor
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "_id" : ObjectId("5b273d276470731d768b9fd0"),
    "to" : ObjectId("58cb83c6af26811724e555dd"),
    "from": {
                "fullName": "Tam Test",
                "avatar": "uploads/avatar/cj0dgaoip000bkk7mnrhdw7ow-1522233788174.jpeg",
                "cuid": "cj0dgaoip000bkk7mnrhdw7ow",
                "_id": "58cb83c6af26811724e555dd"
            },
    "object" : ObjectId("5a1110498fff0b3e829aea6d"),
    "data" : {
        "url" : "course/1111111"
    },
    "type" : "joinCoursesToAuthor",
    "status" : true,
    "seen" : true,
    "date" : ISODate("2018-06-18T05:03:35.465Z"),
    "__v" : 0
}
 *
 * */

/**
 * @api {post} /Not-API/ RemindSchedule
 * @apiName RemindSchedule
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
          "_id": "5b2757234c576227b7637511",
          "to": "5ad5d98a1a96392266636443",
          "data": {
              "url": "courses/123-bb5anuq",
              "courseId": "5addb3955bb75a5275c184dd"
          },
          "type": "RemindSchedule",
          "status": true,
          "seen": true,
          "date": "2018-06-18T06:54:27.318Z",
          "__v": 0
      }
 *
 * */

/**
 * @api {post} /Not-API/ InviteCourses
 * @apiName InviteCourses
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
            "_id": "5b2757234c576227b7637517",
            "to": "58e61e310fc0f92c8685b223",
            "object":"5ae28f82d269fd03c5b92305",
            "from": {
                "fullName": "Mayowa Adewole",
                "cuid": "cj0dstr5f004wkk7mpxs92o5c",
                "_id": "58cbd5fbaf26811724e557c7"
            },
            "data": {
                "url": "course/123-gx2qnk5"
            },
            "type": "InviteCourses",
            "status": true,
            "seen": true,
            "date": "2018-06-18T06:54:27.456Z",
            "__v": 0
        }
 *
 * */

/**
 * @api {post} /Not-API/ RemindScheduleAuthor
 * @apiName RemindScheduleAuthor
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
          "_id": "5b2757234c576227b7637511",
          "to": "5ad5d98a1a96392266636443",
          "data": {
              "url": "courses/123-bb5anuq",
              "courseId": "5addb3955bb75a5275c184dd"
          },
          "type": "RemindScheduleAuthor",
          "status": true,
          "seen": true,
          "date": "2018-06-18T06:54:27.318Z",
          "__v": 0
      }
 *
 * */
/**
 * @api {post} /Not-API/ AuthorCourses
 * @apiName AuthorCourses
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
           "_id": "5b2757234c576227b7637529",
           "to": "58e61e310fc0f92c8685b223",
           "data": {
               "url": "course/test-upload-files"
           },
           "type": "AuthorCourses",
           "status": true,
           "seen": true,
           "date": "2018-06-18T06:54:27.458Z",
           "__v": 0
 }
 *
 * */
/**
 * @api {post} /Not-API/ inviteLiveLesson
 * @apiName inviteLiveLesson
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
            "_id": "5b2757234c576227b7637518",
            "to": "58e61e310fc0f92c8685b223",
            "from": {
                "fullName": "Mayowa Adewole",
                "cuid": "cj0dstr5f004wkk7mpxs92o5c",
                "_id": "58cbd5fbaf26811724e557c7"
            },
            "data": {
                "url": "cj0dstr5f004wkk7mpxs92o5c/videos/5ae28f82d269fd03c5b92306"
            },
            "type": "inviteLiveLesson",
            "status": true,
            "seen": true,
            "date": "2018-06-18T06:54:27.457Z",
            "__v": 0
        }
 *
 * */


/**
 * @api {post} /Not-API/ answerQuestionAnonymous
 * @apiName answerQuestionAnonymous
 * @apiVersion 1.1.0
 * @apiGroup New Notification
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
            "_id": "5b275c044c576227b7637580",
            "to": "58e61e310fc0f92c8685b223",
            "object": {
                "_id": "59e6b2578388a64be2b5c2fe",
                "title": "ềafdfdfdfdgsdgdsgsdgdsg",
                "slug": "eafdfdfdfdgsdgdsgsdgdsg",
                "description": "...",
                "state": "published",
                "anonymous": false
            },
            "data": {
                "anonymous": true,
                "answerId": "59e704e8e649da602b0e2269",
                "content": "fb.com",
                "number": 2
            },
            "type": "answerQuestionAnonymous",
            "status": false,
            "seen": false,
            "date": "2018-06-18T07:15:16.993Z",
            "__v": 0,
            "img": "https://pbs.twimg.com/profile_images/824716853989744640/8Fcd0bji.jpg"
        }
 * */





