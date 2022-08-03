/**
 * @api {post} /api/coupon/:role/create Create Coupon
 * @apiName CreateCoupon
 * @apiVersion 1.1.0
 * @apiGroup Coupon
 *
 * @apiParam {Number} discount_products Type discount coupon. (Required)
 * @apiParam {Array} webinars List webinars apply coupon. (Required with discount_products:3)
 * @apiParam {Array} courses List courses apply coupon. (Required with discount_products:4)
 * @apiParam {Object} date_Start Time start. (Optional)
 * @apiParam {Number} date_Start.date Date start
 * @apiParam {Number} date_Start.hour Hour
 * @apiParam {Number} date_Start.minute Minute
 * @apiParam {Object} date_Finish Time start. (Optional)
 * @apiParam {Number} date_Finish.date Date start
 * @apiParam {Number} date_Finish.hour Hour
 * @apiParam {Number} date_Finish.minute Minute
 * @apiParam {String} author Author of webinar or course
 * @apiParam {Object} type_discount Details discount. (Required)
 * @apiParam {Number} type_discount.type Type discount (Required)(percent or price)
 * @apiParam {Number} type_discount.value Value discount (Required)
 * @apiParam {Number} type_discount.user_buy_limit Limit discount.
 * @apiParam {Number} type_discount.maximum Maximum times buy.
 * @apiParam {Number} type_discount.limit_discount Total price can discount. Example: 2$
 * @apiParam {Number} utcOffset UTC Offset. (Required)
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Coupon data
 * @apiSuccess {String} data._id unique ID.
 * @apiSuccess {String} data.author Author coupon.
 * @apiSuccess {Number} data.date_Start Date start
 * @apiSuccess {String} data.date_Finish Date finish
 * @apiSuccess {Number} data.code Code
 * @apiSuccess {Number} data.updateAt Date update
 * @apiSuccess {String} data.createAt Date create
 * @apiSuccess {Object} data.type_discount Type discount
 * @apiSuccess {Array} data.webinars List webinars apply coupon.
 * @apiSuccess {Array} data.courses List courses apply coupon.
 * @apiSuccess {Array} data.discount_products Discount products.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "__v": 0,
        "role": "admin",
        "author": "5959e826bc5834216f1060d2",
        "date_Start": "1537138800000",
        "date_Finish": "1538262000000",
        "code": "95A1LYW5RP",
        "_id": "5ba0db5a7c2bb555018072a4",
        "updateAt": "2018-09-18T11:02:50.120Z",
        "createAt": "2018-09-18T11:02:50.120Z",
        "type_discount": {
            "type": "percent",
            "value": 10,
            "user_buy_limit": 1,
            "maximum": 12,
            "limit_discount": 2
        },
        "webinars": [],
        "courses": [],
        "discount_products": 2
    }
}
 *
 */

/**
 * @api {put} /coupon/:role/:id Update Coupon
 * @apiName UpdateCoupon
 * @apiVersion 1.1.0
 * @apiGroup Coupon
 *
 * @apiParam {Number} discount_products Type discount coupon. (Required)
 * @apiParam {Array} webinars List webinars apply coupon. (Required with discount_products:3)
 * @apiParam {Array} courses List courses apply coupon. (Required with discount_products:4)
 * @apiParam {Object} date_Start Time start. (Required)
 * @apiParam {Number} date_Start.date Date start (Required)
 * @apiParam {Number} date_Start.hour Hour (Required)
 * @apiParam {Number} date_Start.minute Minute (Required)
 * @apiParam {Object} date_Finish Time start. (Required)
 * @apiParam {Number} date_Finish.date Date start (Required)
 * @apiParam {Number} date_Finish.hour Hour (Required)
 * @apiParam {Number} date_Finish.minute Minute (Required)
 * @apiParam {String} author Author of webinar or course (If role is admin - Required)
 * @apiParam {Object} type_discount Details discount. (Required)
 * @apiParam {Number} type_discount.type Type discount (Required)(percent or price)
 * @apiParam {Number} type_discount.value Value discount (Required)
 * @apiParam {Number} type_discount.user_buy_limit Limit discount.
 * @apiParam {Number} type_discount.maximum Maximum times buy.
 * @apiParam {Number} type_discount.limit_discount Total price can discount. Example: 2$
 * @apiParam {Number} utcOffset UTC Offset. (Required)
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Coupon data
 * @apiSuccess {String} data._id unique ID.
 * @apiSuccess {String} data.author Author coupon.
 * @apiSuccess {Number} data.date_Start Date start
 * @apiSuccess {String} data.date_Finish Date finish
 * @apiSuccess {Number} data.code Code
 * @apiSuccess {Number} data.updateAt Date update
 * @apiSuccess {String} data.createAt Date create
 * @apiSuccess {Object} data.type_discount Type discount
 * @apiSuccess {Array} data.webinars List webinars apply coupon.
 * @apiSuccess {Array} data.courses List courses apply coupon.
 * @apiSuccess {Array} data.discount_products Discount products.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "__v": 0,
        "role": "admin",
        "author": "5959e826bc5834216f1060d2",
        "date_Start": "1537138800000",
        "date_Finish": "1538262000000",
        "code": "95A1LYW5RP",
        "_id": "5ba0db5a7c2bb555018072a4",
        "updateAt": "2018-09-18T11:02:50.120Z",
        "createAt": "2018-09-18T11:02:50.120Z",
        "type_discount": {
            "type": "percent",
            "value": 10,
            "user_buy_limit": 1,
            "maximum": 12,
            "limit_discount": 2
        },
        "webinars": [],
        "courses": [],
        "discount_products": 2
    }
}
 *
 */

/**
 * @api {get} /report-coupon/:object Get report platform
 * @apiName GetReportPlatform
 * @apiVersion 1.1.0
 * @apiGroup Coupon
 *
 * @apiParam {String} object {Params} Object coupon
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Number} status Status response.
 * @apiSuccess {Number} total Total item.
 * @apiSuccess {Number} total_page Total page.
 * @apiSuccess {Number} current_page Current page.
 * @apiSuccess {Object} data Data response.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "total": 2,
    "total_page": 1,
    "current_page": 1,
    "data": [
        {
            "_id": "5ba0cbed628b5939372c6e78",
            "total_price": 12,
            "code": {
                "_id": "5ba07836d2b7dc1f2474d158",
                "role": "admin",
                "author": "58cbd5fbaf26811724e557c7",
                "date_Start": "1537138800000",
                "date_Finish": "1538262000000",
                "code": "WU2GXRPUUH",
                "webinars": [],
                "courses": [],
                "discount_products": 1
            },
            "platform": "webinar",
            "object": null,
            "price_discount": 10,
            "user": {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1525337482267.jpeg",
                "fullName": "Phung Viet",
                "userName": "rexviet"
            },
            "createAt": "2018-09-18T09:57:01.326Z",
            "quantity": 1,
            "__v": 0
        },
        {
            "_id": "5ba0cbcd628b5939372c6e72",
            "total_price": 12,
            "code": {
                "_id": "5ba07836d2b7dc1f2474d158",
                "role": "admin",
                "author": "58cbd5fbaf26811724e557c7",
                "date_Start": "1537138800000",
                "date_Finish": "1538262000000",
                "code": "WU2GXRPUUH",
                "webinars": [],
                "courses": [],
                "discount_products": 1
            },
            "platform": "webinar",
            "object": null,
            "price_discount": 10,
            "user": {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1525337482267.jpeg",
                "fullName": "Phung Viet",
                "userName": "rexviet"
            },
            "createAt": "2018-09-18T09:56:29.180Z",
            "quantity": 1,
            "__v": 0
        }
    ]
}
 */

/**
 * @api {get} /coupons Get list coupon
 * @apiName GetCoupons
 * @apiVersion 1.1.0
 * @apiGroup Coupon
 *
 * @apiParam {String} role {Query param} Role request (admin or null)
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Number} status Status response.
 * @apiSuccess {Number} total Total item.
 * @apiSuccess {Number} total_page Total page.
 * @apiSuccess {Number} current_page Current page.
 * @apiSuccess {Object} data Data response.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "total": 1,
    "total_page": 1,
    "current_page": 1,
    "data": [
        {
            "_id": "5ba217eb6efb092a70c3c74d",
            "role": "admin",
            "author": {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1525337482267.jpeg",
                "fullName": "Phung Viet",
                "userName": "rexviet"
            },
            "date_Start": "1537349610830",
            "code": "HQW8K6TZFY",
            "updateAt": "2018-09-19T09:33:31.002Z",
            "createAt": "2018-09-19T09:33:31.002Z",
            "status": true,
            "type_discount": {
                "type": "percent",
                "value": 10,
                "user_buy_limit": 1,
                "maximum": 120,
                "limit_discount": 5
            },
            "webinars": [],
            "courses": [],
            "discount_products": 0,
            "__v": 0,
            "user_used": 0,
            "total_balance": "0.00",
            "total_balance_recive": "0.00",
            "total_fee": "0.00"
        }
    ]
}
 */


/**
 * @api {get} /get-coupon/:id Get details coupon
 * @apiName GetDetailsCoupons
 * @apiVersion 1.1.0
 * @apiGroup Coupon
 *
 * @apiParam {String} id {Params} ID Coupon
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Object} data Data response.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "success": true,
    "data": {
        "_id": "5ba217eb6efb092a70c3c74d",
        "role": "admin",
        "author": {
            "_id": "58e61e310fc0f92c8685b223",
            "cuid": "cj16ab8360031sm7mhs2wekuk",
            "expert": 1,
            "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1525337482267.jpeg",
            "fullName": "Phung Viet",
            "userName": "rexviet"
        },
        "date_Start": "1537349610830",
        "code": "HQW8K6TZFY",
        "updateAt": "2018-09-19T09:33:31.002Z",
        "createAt": "2018-09-19T09:33:31.002Z",
        "status": true,
        "type_discount": {
            "type": "percent",
            "value": 10,
            "user_buy_limit": 1,
            "maximum": 120,
            "limit_discount": 5
        },
        "webinars": [],
        "courses": [],
        "discount_products": 0,
        "__v": 0
    }
}
 */

/**
 * @api {get} /get-history-of-coupon/:id Get historys coupon
 * @apiName GetHistorysCoupons
 * @apiVersion 1.1.0
 * @apiGroup Coupon
 *
 * @apiParam {String} id {Params} ID Coupon
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Number} status Status response.
 * @apiSuccess {Number} total Total item.
 * @apiSuccess {Number} total_page Total page.
 * @apiSuccess {Number} current_page Current page.
 * @apiSuccess {Object} data Data response.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
    "status": 200,
    "success": true,
    "total": 3,
    "total_page": 1,
    "current_page": 1,
    "data": [
        {
            "_id": "5ba0a95a774820772ea088e9",
            "code": {
                "_id": "5ba07836d2b7dc1f2474d158",
                "role": "admin",
                "author": "58cbd5fbaf26811724e557c7",
                "date_Start": "1537138800000",
                "date_Finish": "1538262000000",
                "code": "WU2GXRPUUH",
                "webinars": [],
                "courses": [],
                "discount_products": 1
            },
            "object": {
                "_id": "5b9f23bcfc460778ff3edee2",
                "title": "Khoa hoc thang 9",
                "creator": "5959e826bc5834216f1060d2",
                "language": "cj0ah7g3c0047yz7m0ff4f38y",
                "price": 1,
                "thumbnail": "uploads/courses/khoa-hoc-thang-9//1537156222047-cja-3-n7l-3-l00045ukn-0-temym-2-f-1517035397873-250x250.jpeg",
                "description": {
                    "general": "Khoa hoc thang 9",
                    "yourKnowledge": "Khoa hoc thang 9",
                    "attendees": "Khoa hoc thang 9",
                    "purpose": "Khoa hoc thang 9"
                },
                "lectures": [
                    "5b4dbe8b14c2130d0fd57574",
                    "5959e826bc5834216f1060d2"
                ]
            },
            "total_price": 1,
            "platform": "course",
            "price_discount": 1,
            "user": {
                "_id": "5a339bbc7a7675444f31c63e",
                "cuid": "cjb7ql5xk002nhrkncenyndrn",
                "expert": 0,
                "avatar": "https://lh6.googleusercontent.com/-ns9p6MqJQJI/AAAAAAAAAAI/AAAAAAAAAqA/WCBxM-qG1uU/s96-c/photo.jpg",
                "fullName": "Nam rick kid",
                "userName": "nam"
            },
            "createAt": "2018-09-18T07:29:30.180Z",
            "quantity": 1,
            "__v": 0
        },
        {
            "_id": "5ba0cbcd628b5939372c6e72",
            "total_price": 12,
            "code": {
                "_id": "5ba07836d2b7dc1f2474d158",
                "role": "admin",
                "author": "58cbd5fbaf26811724e557c7",
                "date_Start": "1537138800000",
                "date_Finish": "1538262000000",
                "code": "WU2GXRPUUH",
                "webinars": [],
                "courses": [],
                "discount_products": 1
            },
            "platform": "webinar",
            "object": {
                "_id": "5b92083a2924260c3af49cc5",
                "user": "58cbd5fbaf26811724e557c7",
                "title": "1231",
                "description": "1231",
                "thumbnail": "uploads/schedule-thumb/58cbd5fbaf26811724e557c7/1536297018876-img_-49467-jpg.jpg",
                "language": "un",
                "privacy": {
                    "to": "ticket",
                    "invited": [],
                    "ticket_info": [
                        {
                            "quantity": "23",
                            "price": "12"
                        }
                    ]
                },
                "status": "new"
            },
            "price_discount": 10,
            "user": {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1525337482267.jpeg",
                "fullName": "Phung Viet",
                "userName": "rexviet"
            },
            "createAt": "2018-09-18T09:56:29.180Z",
            "quantity": 1,
            "__v": 0
        },
        {
            "_id": "5ba0cbed628b5939372c6e78",
            "total_price": 12,
            "code": {
                "_id": "5ba07836d2b7dc1f2474d158",
                "role": "admin",
                "author": "58cbd5fbaf26811724e557c7",
                "date_Start": "1537138800000",
                "date_Finish": "1538262000000",
                "code": "WU2GXRPUUH",
                "webinars": [],
                "courses": [],
                "discount_products": 1
            },
            "platform": "webinar",
            "object": {
                "_id": "5b92083a2924260c3af49cc5",
                "user": "58cbd5fbaf26811724e557c7",
                "title": "1231",
                "description": "1231",
                "thumbnail": "uploads/schedule-thumb/58cbd5fbaf26811724e557c7/1536297018876-img_-49467-jpg.jpg",
                "language": "un",
                "privacy": {
                    "to": "ticket",
                    "invited": [],
                    "ticket_info": [
                        {
                            "quantity": "23",
                            "price": "12"
                        }
                    ]
                },
                "status": "new"
            },
            "price_discount": 10,
            "user": {
                "_id": "58e61e310fc0f92c8685b223",
                "cuid": "cj16ab8360031sm7mhs2wekuk",
                "expert": 1,
                "avatar": "uploads/avatar/cj16ab8360031sm7mhs2wekuk-1525337482267.jpeg",
                "fullName": "Phung Viet",
                "userName": "rexviet"
            },
            "createAt": "2018-09-18T09:57:01.326Z",
            "quantity": 1,
            "__v": 0
        }
    ]
}
 */

/**
 * @api {get} /get-coupon-of-user Get coupon of user have used
 * @apiName GetCouponsUserUsed
 * @apiVersion 1.1.0
 * @apiGroup Coupon
 *
 * @apiSuccess {Boolean} success The query success or not.
 * @apiSuccess {Number} status Status response.
 * @apiSuccess {Number} total Total item.
 * @apiSuccess {Number} total_page Total page.
 * @apiSuccess {Number} current_page Current page.
 * @apiSuccess {Object} data Data response.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 {
     "status": 200,
     "success": true,
     "total": 2,
     "total_page": 1,
     "current_page": 1,
     "data": [
         {
             "_id": "5ba34e8d5cd85d5a283bc3e3",
             "total_price": 2,
             "code": {
                 "_id": "5ba217eb6efb092a70c3c74d",
                 "role": "admin",
                 "author": "58e61e310fc0f92c8685b223",
                 "date_Start": "1537349610830",
                 "code": "HQW8K6TZFY",
                 "webinars": [],
                 "courses": [],
                 "discount_products": 0
             },
             "platform": "webinar",
             "object": {
                 "_id": "5ba310d68112a8428a5e181f",
                 "user": "5959e826bc5834216f1060d2",
                 "title": "Than 123321",
                 "description": "than thanh than",
                 "thumbnail": "uploads/schedule-thumb/5959e826bc5834216f1060d2/1537413334201-screenshot_-1536924892-png.png",
                 "language": "en",
                 "privacy": {
                     "invited": [],
                     "to": "ticket"
                 },
                 "status": "new"
             },
             "price_discount": 1.4,
             "user": {
                 "_id": "5b9f2e54fc460778ff3edf12",
                 "cuid": "cjm5smje50000wfkng2gqqsvp",
                 "expert": 0,
                 "avatar": "",
                 "fullName": "Than Pham",
                 "userName": ""
             },
             "createAt": "2018-09-20T07:38:53.327Z",
             "quantity": 2,
             "__v": 0,
             "paymentId": {
                 "_id": "5ba34e8d5cd85d5a283bc3df",
                 "webinar": "5ba310d68112a8428a5e181f",
                 "ticket": "5ba310d68112a8428a5e1833",
                 "amount": 2,
                 "price": 1,
                 "total": 1.4,
                 "contactInfo": {
                     "fullName": "Than Pham",
                     "email": "1@1.111",
                     "phoneNumber": "121212111"
                 },
                 "priceRate": 1,
                 "currency": "USD",
                 "creator_receive": 0.98,
                 "fee": 0.42,
                 "tax": 0,
                 "uniqueCode": [
                     "MHNFHQDP",
                     "S13L21G7"
                 ]
             }
         },
         {
             "_id": "5ba34bcbbdf5d859ea10ce51",
             "total_price": 4,
             "code": {
                 "_id": "5ba217eb6efb092a70c3c74d",
                 "role": "admin",
                 "author": "58e61e310fc0f92c8685b223",
                 "date_Start": "1537349610830",
                 "code": "HQW8K6TZFY",
                 "webinars": [],
                 "courses": [],
                 "discount_products": 0
             },
             "platform": "webinar",
             "object": {
                 "_id": "5ba310d68112a8428a5e181f",
                 "user": "5959e826bc5834216f1060d2",
                 "title": "Than 123321",
                 "description": "than thanh than",
                 "thumbnail": "uploads/schedule-thumb/5959e826bc5834216f1060d2/1537413334201-screenshot_-1536924892-png.png",
                 "language": "en",
                 "privacy": {
                     "invited": [],
                     "to": "ticket"
                 },
                 "status": "new"
             },
             "price_discount": 2.8,
             "user": {
                 "_id": "5b9f2e54fc460778ff3edf12",
                 "cuid": "cjm5smje50000wfkng2gqqsvp",
                 "expert": 0,
                 "avatar": "",
                 "fullName": "Than Pham",
                 "userName": ""
             },
             "createAt": "2018-09-20T07:27:07.652Z",
             "quantity": 1,
             "__v": 0,
             "paymentId": {
                 "_id": "5ba34e8d5cd85d5a283bc3df",
                 "webinar": "5ba310d68112a8428a5e181f",
                 "ticket": "5ba310d68112a8428a5e1833",
                 "amount": 2,
                 "price": 1,
                 "total": 1.4,
                 "contactInfo": {
                     "fullName": "Than Pham",
                     "email": "1@1.111",
                     "phoneNumber": "121212111"
                 },
                 "priceRate": 1,
                 "currency": "USD",
                 "creator_receive": 0.98,
                 "fee": 0.42,
                 "tax": 0,
                 "uniqueCode": [
                     "MHNFHQDP",
                     "S13L21G7"
                 ]
             }
         }
     ]
 }
 */
