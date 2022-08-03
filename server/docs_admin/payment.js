/**
 * @api {get} /api/admin/payments Admin get Payments
 * @apiName AdminGetPayments
 * @apiVersion 1.0.0
 * @apiGroup Payment
 *
 * @apiParam {Integer} page (Optional) Pagination. If not provided, it defaults to `1`.
 *
 * @apiSuccess {Boolean} success The request request or not.
 * @apiSuccess {Integer} current_page
 * @apiSuccess {Integer} last_page
 * @apiSuccess {Integer} total_items
 * @apiSuccess {Array} data  Array Payments
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *    "success": true,
 *    "current_page": 1,
 *    "last_page": 1,
 *    "total_items": 1,
 *    "data": [
 *       {
 *           "_id": "58ec964c10584c409e89b7b9",
 *           "cuid": "cj1daq82h004gri7m84jdtlq1",
 *           "paymentType": "stripe",
 *           "type": 1,
 *           "detail": {
 *               "id": "ch_1A7KXGLOLd9Cbxehh4y67rZN",
 *               "object": "charge",
 *               "amount": 1000,
 *               "amount_refunded": 0,
 *               "application": null,
 *               "application_fee": null,
 *               "balance_transaction": "txn_1A7KXJLOLd9CbxehHCxMEbcJ",
 *               "captured": true,
 *               "created": 1491899978,
 *               "currency": "usd",
 *               "customer": null,
 *               "description": "Fill out your billing information",
 *               "destination": null,
 *              "dispute": null,
 *               "failure_code": null,
 *               "failure_message": null,
 *               "invoice": null,
 *               "livemode": true,
 *               "on_behalf_of": null,
 *               "order": null,
 *               "outcome": {
 *                   "network_status": "approved_by_network",
 *                   "reason": null,
 *                   "risk_level": "normal",
 *                   "seller_message": "Payment complete.",
 *                   "type": "authorized"
 *               },
 *               "paid": true,
 *               "receipt_email": null,
 *               "receipt_number": null,
 *               "refunded": false,
 *               "refunds": {
 *                   "object": "list",
 *                   "data": [],
 *                   "has_more": false,
 *                   "total_count": 0,
 *                   "url": "/v1/charges/ch_1A7KXGLOLd9Cbxehh4y67rZN/refunds"
 *               },
 *               "review": null,
 *               "shipping": null,
 *               "source": {
 *                   "id": "card_1A7KX9LOLd9CbxehoS4Ra8YP",
 *                   "object": "card",
 *                   "address_city": null,
 *                   "address_country": null,
 *                   "address_line1": null,
 *                   "address_line1_check": null,
 *                   "address_line2": null,
 *                   "address_state": null,
 *                   "address_zip": null,
 *                   "address_zip_check": null,
 *                   "brand": "Visa",
 *                   "country": "VN",
 *                   "customer": null,
 *                   "cvc_check": "pass",
 *                   "dynamic_last4": null,
 *                   "exp_month": 11,
 *                   "exp_year": 2019,
 *                   "fingerprint": "9P6oGsNeTBqmyLr3",
 *                   "funding": "credit",
 *                   "last4": "0342",
 *                   "name": "payment@tesse.io",
 *                   "tokenization_method": null
 *               },
 *               "source_transfer": null,
 *               "statement_descriptor": null,
 *               "status": "succeeded",
 *               "transfer_group": null
 *           },
 *           "__v": 0,
 *           "dateAdded": "2017-04-11T08:39:40.122Z",
 *           "status": 1,
 *           "amount": 10,
 *           "user": {
 *               "_id": "58ec919c10584c409e89b774",
 *               "cuid": "cj1da0ir6003eri7m124mltea",
 *               "avatar": "https://scontent.xx.fbcdn.net/v/t1.0-1/c57.0.606.720/12742747_10153996250293447_1607686989144861309_n.jpg?oh=67bafb3adb3e6400dc9810a92a45b42b&oe=5988FB9E",
 *               "fullName": "Hồ Danh",
 *               "userName": ""
 *           }
 *       }
 *    ]
 * }
 * 
 */