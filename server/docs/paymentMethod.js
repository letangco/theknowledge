/**
 * @api {post} /payment-method/add Add new Payment Method
 * @apiName AddPaymentMethod
 * @apiVersion 1.1.0
 * @apiGroup PaymentMethod
 *
 * @apiParam {String} type Payment Method's type. Only allow `paypal` or `SWIFT`
 * @apiParam {Object} detail Payment Method's detail.
 * @apiParam {Boolean} default (Optional) If `true`, the new Payment Method created will be set to User's default Payment Method.
 *
 * @apiParamExample {json} Request-Example:
 *    {
 *     "type": "paypal",
 *     "detail": {
 *       "email": "rexviet@gmail.com"
 *     }
 *   }
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Object} data The new Payment Method created.
 * @apiSuccess {String} data.user User's id.
 * @apiSuccess {String} data.type Payment Method's type.
 * @apiSuccess {Object} data.detail Payment Method's detail.
 * @apiSuccess {String} data._id Payment Method's id.
 * @apiSuccess {Date} data.dateAdded Payment Method's created date.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "data": {
 *           "__v": 0,
 *           "user": "58e61e310fc0f92c8685b223",
 *           "type": "paypal",
 *           "detail": {
 *               "email": "rexviet@gmail.com"
 *           },
 *           "_id": "59b89d0d0701e3420c34d20d",
 *           "dateAdded": "2017-09-13T02:50:53.525Z"
 *       }
 *   }
 *
 */

/**
 * @api {post} /payment-method/:id/default Set default Payment Method
 * @apiName SetDefaultPaymentMethod
 * @apiVersion 1.1.0
 * @apiGroup PaymentMethod
 *
 * @apiParam {String} id Payment Method's id.
 *
 * @apiParamExample
 * curl -XPOST "https://tesse.io/api/payment-method/59b89d0d0701e3420c34d20d/default"
 *
 * @apiSuccess {Boolean} success The request success or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true
 *   }
 *
 */

/**
 * @api {put} /payment-method/:id/update Update Payment Method's info
 * @apiName UpdatePaymentMethod
 * @apiVersion 1.1.0
 * @apiGroup PaymentMethod
 *
 * @apiParam {String} type Payment Method's type. Only allow `paypal` or `SWIFT`
 * @apiParam {Object} detail Payment Method's detail.
 *
 * @apiParamExample {json} Request-Example:
 *    {
 *     "detail": {
 *       "email": "rexviet2@gmail.com"
 *     }
 *   }
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Object} data The new Payment Method created.
 * @apiSuccess {Date} data.dateUpdated Payment Method's updated date.
 * @apiSuccess {String} data.user User's id.
 * @apiSuccess {String} data.type Payment Method's type.
 * @apiSuccess {Object} data.detail Payment Method's detail.
 * @apiSuccess {String} data._id Payment Method's id.
 * @apiSuccess {Date} data.dateAdded Payment Method's created date.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true,
 *       "data": {
 *           "dateUpdated": "2017-09-13T03:36:03.524Z",
 *           "__v": 0,
 *           "user": "58e61e310fc0f92c8685b223",
 *           "type": "paypal",
 *           "detail": {
 *               "email": "rexviet@gmail.com"
 *           },
 *           "_id": "59b89d0d0701e3420c34d20d",
 *           "dateAdded": "2017-09-13T02:50:53.525Z"
 *       }
 *   }
 *
 */

/**
 * @api {delete} /payment-method/:id/delete Delete Payment Method.
 * @apiName DeletePaymentMethod
 * @apiVersion 1.1.0
 * @apiGroup PaymentMethod
 *
 * @apiParam {String} id Payment Method's id.
 *
 * @apiParamExample
 * curl -XDELETE "https://tesse.io/api/payment-method/59b89d0d0701e3420c34d20d/delete"
 *
 * @apiSuccess {Boolean} success The request success or not.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       "success": true
 *   }
 *
 *   {
 *       "success": false,
 *       "error": "You can not delete default payment method."
 *   }
 *
 */

/**
 * @api {get} /payment-method/ Get all Payment Methods
 * @apiName GetAllPaymentMethod
 * @apiVersion 1.1.0
 * @apiGroup PaymentMethod
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Array} data Array of Payment Methods
 * @apiSuccess {Date} data.dateUpdated Payment Method's updated date.
 * @apiSuccess {String} data.user User's id.
 * @apiSuccess {String} data.type Payment Method's type.
 * @apiSuccess {Object} data.detail Payment Method's detail.
 * @apiSuccess {String} data._id Payment Method's id.
 * @apiSuccess {Date} data.dateAdded Payment Method's created date.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *          "data": [
 *              {
 *                  "_id": "59b78dc19f1c9e3de5ca9b60",
 *                  "user": "58e61e310fc0f92c8685b223",
 *                  "type": "paypal",
 *                  "detail": {
 *                      "email": "rexviet@gmail.com"
 *                  },
 *                  "__v": 0,
 *                  "dateAdded": "2017-09-12T07:33:21.572Z"
 *              }
 *          ]
 *      }
 *
 */

/**
 * @api {get} /payment-method/:id Get Payment Methods By id
 * @apiName GetPaymentMethodById
 * @apiVersion 1.1.0
 * @apiGroup PaymentMethod
 *
 * @apiSuccess {Boolean} success The request success or not.
 * @apiSuccess {Object} data Array of Payment Methods
 * @apiSuccess {Date} data.dateUpdated Payment Method's updated date.
 * @apiSuccess {String} data.user User's id.
 * @apiSuccess {String} data.type Payment Method's type.
 * @apiSuccess {Object} data.detail Payment Method's detail.
 * @apiSuccess {String} data._id Payment Method's id.
 * @apiSuccess {Date} data.dateAdded Payment Method's created date.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *      {
 *          "success": true,
 *          "data": {
 *                  "_id": "59b78dc19f1c9e3de5ca9b60",
 *                  "user": "58e61e310fc0f92c8685b223",
 *                  "type": "paypal",
 *                  "detail": {
 *                      "email": "rexviet@gmail.com"
 *                  },
 *                  "__v": 0,
 *                  "dateAdded": "2017-09-12T07:33:21.572Z"
 *          }
 *      }
 *
 */
