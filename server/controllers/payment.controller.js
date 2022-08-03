import serverConfig from '../config';
import globalConstances from '../../config/globalConstants';
import User from '../models/user.js';
import UserPaymentMethod from '../models/userPaymentMethod';
import Payment from '../models/payment.js';
import Withdrawal from '../models/withdrawal';
import { getUserSupportState } from '../routes/socket_routes/chat_socket';
import cuid from 'cuid';
import ArrayHelper from '../util/ArrayHelper';
import EmailInivte from '../models/emailInvite';
import * as VtcPay from '../libs/VtcPay';
import { Q } from "../libs/Queue";
import HistoryCart from '../models/historyCart.model';

var OnePay = require('../libs/OnePay');
const PAYMENT_PER_PAGE = 30;
//var stripeTool = ;
var PayPal = require('paypal-express-checkout-dt');
var returnUrl = serverConfig.clientHttpsHost + "/savePaypalToken";
var cancelUrl = serverConfig.clientHttpsHost + "/payment";
const stripe = require("stripe")(serverConfig.stripe.secret_key);
var googleContacts = require('google-contacts-oauth');

import { buyMemberShip, generalCode } from '../services/memberShip.services'

export async function getStripToken(req, res) {
  try {
    let _id = cuid();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: 'price_1IIb8cD8XOPOKKPFAvwiAmYq',
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url: `http://localhost:8002/savePaypalToken?session_id=${_id}`,
      cancel_url: 'http://localhost:8002/cancelPaypalToken',
    });
    res.json({
      sessionId: session.id,
    });
  } catch (e) {
    console.log('error session: ', e)
    res.status(400);
    return res.json({
      error: {
        message: e.message,
      }
    });
  }
}
export async function deleteCreditCard(req, res){
  let { body, user } = req
  let userInfo = await User.findById(user._id).lean();
  if (!userInfo) {
    return res.status(404).json({success: false, error: 'User not found.'});
  }
  if(!userInfo.subscription){
    return res.status(404).json({success: false, error: 'Subscription not found.'});
  }
  const deleted = await stripe.subscriptions.del(
    userInfo.subscription
  );
  return res.json({
    success: true,
    data: deleted
  })
}
export async function rePaymentStripe(req, res){
  let { user } = req
  let userInfo = await User.findById(user._id).lean();
  if (!userInfo) {
    return res.status(404).json({success: false, error: 'User not found.'});
  }
  if(!userInfo.subscription){
    return res.status(404).json({success: false, error: 'Subscription not found.'});
  }
  const data = await stripe.invoices.pay(userInfo.customerInvoice);
  return res.json({
    success: true,
    data
  })
}
export async function stripeChangeCreditCard(req, res){
  try {
    let { body, user } = req
    let userInfo = await User.findById(user._id).lean();
    if (!userInfo) {
      return res.status(404).json({success: false, error: 'User not found.'});
    }
    // await stripe.subscriptions.update('sub_J2F0Hr4Wbo6Ag4', { source: body.card.id });
    await stripe.customers.update(userInfo.customerId, { source: body.card.id });
    await stripe.invoices.pay(
      'in_1IQAWVD8XOPOKKPFSaJe51lY'
    );
    await User.updateOne({
      _id: req.user._id
    }, {
      $set: {
        card: body.card.card.last4
      }
    })
    return res.json({success: true})
  } catch (e) {
    console.log('error session: ', e)
    res.status(400);
    return res.json({
      error: {
        message: e.message,
      }
    });
  }
}
export async function createCheckoutPlan(req, res) {
  try {
    let { body, user } = req
    let userInfo = await User.findById(user._id).lean();
    if (!userInfo) {
      return res.status(404).json({success: false, error: 'User not found.'});
    }
    const customer = await stripe.customers.create({
      payment_method: body.paymentMethod.id,
      email: userInfo.email || '',
      name: userInfo.fullName || '',
      invoice_settings: {
        default_payment_method: body.paymentMethod.id,
      },
    });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        plan: body.id
      }],
      expand: ["latest_invoice.payment_intent"],
    });
    await User.updateOne({
      _id: user._id
    }, {
      $set: {
        customerId: customer.id,
        card: body.paymentMethod.card.last4
      }
    })
    return res.json({
      success: true,
      data: subscription
    })

  } catch (e) {
    console.log('error session: ', e)
    res.status(400);
    return res.json({
      error: {
        message: e.message,
      }
    });
  }
}
export async function createSetupIntent(req, res){
  try {
    let { user } = req
    let userInfo = await User.findById(user._id).lean();
    if (!userInfo) {
      return res.status(404).json({success: false, error: 'User not found.'});
    }
    let result = await stripe.setupIntents.create()
    if(result){
      await User.updateOne({
        _id: user._id
      }, {
        $set: {
          customerIntent: result.id,
        }
      })
    }
      return res.json({
        success: true,
        data: result
    });
  } catch (e) {
    console.log('error session: ', e)
    res.status(400);
    return res.json({
      error: {
        message: e.message,
      }
    });
  }
}
export async function getProductsAndPlans(req, res) {
  try {
    return Promise.all(
      [
        stripe.products.list({}),
        stripe.plans.list({})
      ]
    ).then(stripeData => {
      var products = stripeData[0].data.filter(product => { return product.active === true});
      var plans = stripeData[1].data;

      plans = plans.sort((a, b) => {
        return a.amount - b.amount;
      }).map(plan => {
        return {...plan};
      });
      products.forEach(product => {
        const filteredPlans = plans.filter(plan => {
          return plan.product === product.id;
        });
        product.plans = filteredPlans;
      });
      return res.json({
        success: true,
        data: products
      })
    });
  } catch (e) {
    console.log('error session: ', e)
    res.status(400);
    return res.json({
      error: {
        message: e.message,
      }
    });
  }
}
export async function saveStripe(req, res){
  try {
    const { token } = req.query
    const session = await stripe.checkout.sessions.retrieve(token);
  } catch (e){
    console.log('error saveStripe: ', e)
  }
}
export async function stripeWebhook(req, res){
  let { data, type } = req.body
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.header('Stripe-Signature'),
      serverConfig.stripe.webhook_secret_key
    );
  } catch (err) {
    console.log(err);
    console.log(`⚠️  Webhook signature verification failed.`);
    console.log(
      `⚠️  Check the env file and enter the correct webhook secret.`
    );
  }
  const dataObject = event.data.object;

  // Handle the event
  // Review important events for Billing webhooks
  // https://stripe.com/docs/billing/webhooks
  // Remove comment to see the various objects sent for this sample

  let user = {}
  switch (event.type) {
    case 'setup_intent.setup_failed':
      break;
    case 'setup_intent.succeeded':
      user = await User.findOne({
        customerIntent: dataObject.id
      })
      if(!user) break
      await stripe.paymentMethods.attach(
        dataObject.payment_method,
        { customer: user.customerId }
      );
      await stripe.customers.update(
        user.customerId,
        {
          invoice_settings: {
            default_payment_method: dataObject.payment_method,
          },
        }
      );
      let payment = await Payment.find({userId: user.cuid}).sort({_id: -1}).limit(1).lean()
      payment = payment ? payment[0] : {}
      if(payment && !payment.status) {
        await stripe.invoices.pay(user.customerInvoice);
      }
      break;
    case 'invoice.paid':
      break;
    case 'invoice.payment_succeeded':
      user = await User.findOne({
        customerId: dataObject.customer
      })

      await Payment.remove({
        'paymentInfo.id' : dataObject.id
      }).lean()
      await Payment.create({
        cuid: cuid(),
        userId: user ? user.cuid: '',
        amount: dataObject.total / 100,
        paymentType: 'stripe_monthly',
        paymentInfo: dataObject,
        status: 1
      })
      let time = 0
      if(dataObject && dataObject.lines && dataObject.lines.data && dataObject.lines.data.length){
        time = dataObject.lines.data[0].period.end*1000 + 60*60*1000
      }
      if(user){
        if(user.expert === 1){
          await User.updateOne({
            _id: user._id
          }, {
            $set: {
              teacherMembership: time,
              subscription: dataObject.subscription
            }
          })
        } else {
          await User.updateOne({
            _id: user._id
          }, {
            $set: {
              memberShip: time,
              subscription: dataObject.subscription
            }
          })
        }
      }
      break;
    case 'invoice.payment_failed':
      user = await User.findOne({
        customerId: dataObject.customer
      })
      await Payment.remove({
        'paymentInfo.id' : dataObject.id
      }).lean()
      await Payment.create({
        cuid: cuid(),
        userId: user ? user.cuid: '',
        amount: dataObject.total / 100,
        paymentType: 'stripe_monthly',
        paymentInfo: dataObject,
        status: 0
      })
      let sub = await stripe.subscriptions.retrieve(
        dataObject.subscription
      );
      if(sub && sub.latest_invoice){
        await User.updateOne({
          _id: user._id
        }, {
          $set: {
            customerInvoice: sub.latest_invoice,
            subscription: dataObject.subscription
          }
        })
      }
      break;
    case 'customer.subscription.deleted':
      user = await User.findOne({
        customerId: dataObject.customer
      })
      if(user){
        await User.updateOne({
          _id: user._id
        }, {
          $set: {
            customerId: '',
            card: '',
            subscription: '',
            customerIntent: '',
            customerInvoice: ''
          }
        })
      }
      if (event.request != null) {
        // handle a subscription cancelled by your request
        // from above.
      } else {
        // handle subscription cancelled automatically based
        // upon your subscription settings.
      }
      break;
    case 'customer.subscription.trial_will_end':
      console.log('customer.subscription.trial_will_end: ', dataObject)
      // Send notification to your user that the trial will end
      break;
    default:
      break
  }
  return res.json({received: true})
}
export function saveStripeToken(req, res) {
  var user = req.user;
  stripe.charges.create({
    amount: req.body.paymentInfo.amount * 100,
    currency: "AUD",
    source: req.body.token.id,
  }, function (err, charge) {
    if (err) {
      if (err.code && err.message) {
        res.json({
          success: false,
          err: {
            code: err.code,
            message: err.message
          }
        });
      }
      return;
    }
    if (charge) {
      User.findById(user._id).exec((err, user) => {
        if (err) {
          res.status(500).send(err);
          return;
        }
        if (user) {
          User.update({ cuid: user.cuid }, {
            $inc: { balance: req.body.paymentInfo.amount }
          }, function (err) {
            if (err) {
              res.status(500).send(err);
              return;
            }
          });
          const newPayment = new Payment({
              cuid: cuid(),
              userId: user.cuid,
              paymentType: req.body.type,
              type: 1,
              amount: req.body.paymentInfo.amount,
              detail: charge,
              paymentInfo: req.body.paymentInfo ? req.body.paymentInfo : {},
              status: 1,
            }
          );

          newPayment.save(async (err, saved) => {
            if (err) {
              res.status(500).send(err);
              return;
            }
            if (saved && saved.paymentInfo && saved.paymentInfo.type === 'course') {
              Q.create(globalConstances.jobName.JOIN_COURSE_AFTER_PAY, saved).removeOnComplete(true).save();
            } else if (saved && saved.paymentInfo && saved.paymentInfo.type === 'stream') {
              Q.create(globalConstances.jobName.JOIN_WEBINAR_AFTER_PAY, saved).removeOnComplete(true).save();
            } else if(saved && saved.paymentInfo && saved.paymentInfo.type === 'memberShip'){
              await buyMemberShip(user._id, saved.paymentInfo.data && saved.paymentInfo.data.key ? saved.paymentInfo.data.key : '', saved.paymentInfo.data.contactInfo)
              //Q.create(globalConstances.jobName.JOIN_MEMBERSHIP_AFTER_PAY, saved).removeOnComplete(true).save();
            } else if (saved && saved.paymentInfo && saved.paymentInfo.type === 'order') {
                await User.update({_id: user._id}, { $inc: { balance: saved.amount }});
                let historyCart = await HistoryCart.findById(saved.paymentInfo.orderId);
                if(!historyCart) {
                  return res.json({
                    success: false,
                    status: -104,
                    mess: 'Order not found'
                  });
                }
                await User.update({_id: user._id}, { $inc: { balance: historyCart.total_payment }});
                historyCart.status = 2;
                historyCart.paymentId = saved._id;
                await historyCart.save();
            }
            res.json({
              success: true,
              payment: saved
            });
          });
        }
      }, function (err) {
        if (err) {
          res.status(500).send(err);
          return;
        }
      });
    }
  });
}

export async function savePaypal(req, res) {

  var token = req.body.user;
  var paypal = PayPal.create(username, password, signature, serverConfig.paymentDebug);
  paypal.getExpressCheckoutDetails(req.body.tokenPP, true, async function (err, data) {
    if (err) {
      return res.json({
        success: false,
        payment: 1
      });
    }
    if (data) {
      let paymentId = data.CUSTOM ? data.CUSTOM.split('|').shift() : '';
      let paymentResult = await Payment.findById(paymentId).lean();
      if (paymentResult) {
        if (paymentResult.status === 1) {
          return res.status(400).json({
            success: false,
            error: 'PaymentID is exist'
          });
        }
        if(data.ACK === 'Success'){
          await User.update({token: token}, { $inc: { balance: paymentResult.amount }});
          await Payment.update({_id : paymentId}, { $set: { status: 1, detail : data}});
          if(paymentResult && paymentResult.paymentInfo && paymentResult.paymentInfo.type === 'course'){

            Q.create(globalConstances.jobName.JOIN_COURSE_AFTER_PAY, paymentResult).removeOnComplete(true).save();

          } else if(paymentResult && paymentResult.paymentInfo && paymentResult.paymentInfo.type === 'stream'){

            Q.create(globalConstances.jobName.JOIN_WEBINAR_AFTER_PAY, paymentResult).removeOnComplete(true).save();

          } else if(paymentResult && paymentResult.paymentInfo && paymentResult.paymentInfo.type === 'memberShip'){

            Q.create(globalConstances.jobName.JOIN_MEMBERSHIP_AFTER_PAY, paymentResult).removeOnComplete(true).save();

          } else if (paymentResult && paymentResult.paymentInfo && paymentResult.paymentInfo.type === 'order') {
            await User.update({token: token}, { $inc: { balance: paymentResult.amount }});
            let historyCart = await HistoryCart.findById(paymentResult.paymentInfo.orderId);
            if(!historyCart) {
              return res.json({
                success: false,
                status: -104,
                mess: 'Không tìm thấy đơn hàng trên hệ thống'
              });
            }
            await User.update({token: token}, { $inc: { balance: historyCart.total_payment }});
            historyCart.status = 2;
            historyCart.paymentId = paymentResult._id;
            await historyCart.save();
          }
          return res.json({
            success: true,
            payment: 1,
            mess: ''
          });
        }
      } else {
        return res.json({
          success: false,
          payment: 1
        });
      }
    } else {
      return res.json({
        success: false,
        payment: 1
      });
    }
  });
}

export async function postPaypal(req, res) {
  try {
    let token = req.headers.token ? req.headers.token : '';
    if (token) {
      let user = await User.findOne({ 'token': token });
      var paypal = PayPal.create(username, password, signature, serverConfig.paymentDebug);
      paypal.setPayOptions('Tesse, Inc.', null, 'https://tesse.io/public/images/logo.png', '00ff00', 'eeeeee', 0, 1);
      let description = ''
      if (req.body.paymentInfo.type) {
        if (req.body.paymentInfo.type === 'stream') {
          description = 'Book ticket';
        } else {
          description = JSON.stringify(req.body.paymentInfo.data);
        }
        paypal.setProducts([{
          name: req.body.paymentInfo.type,
          description: description,
          quantity: 1,
          amount: req.body.amount
        }]);
      } else {
        paypal.setProducts([{
          name: 'Charge Money',
          description: 'Charge Money',
          quantity: 1,
          amount: req.body.amount
        }]);
      }
      paypal.addPayOption('', '');
      const affCode = req.query.aff || '';

      let paymentInfo = req.body.paymentInfo || {}
      if (paymentInfo && paymentInfo.data && paymentInfo.data.contactInfo && paymentInfo.data.contactInfo.inviteCode){
        let inviteCode = paymentInfo.data.contactInfo.inviteCode;
        let userInvite = await User.findOne({'inviteCode': inviteCode.trim(), memberShip: { '$exists': true }}, 'cuid memberShip').lean();
        if(!userInvite || userInvite.memberShip < new Date().getTime() + 14*24*60*60*1000){
          paymentInfo.data.contactInfo.inviteCode = '';
        }
      }
      const newPayment = new Payment({
        affCode,
        cuid: cuid(),
        userId: user.cuid,
        paymentType: 'paypal',
        amount: req.body.amount,
        type: 1,
        paymentInfo: paymentInfo,
        status: 0
      });
      newPayment.save((err, saved) => {
        if (err) {
          res.status(500).send(err);
          return;
        }
        paypal.setExpressCheckoutPayment(
          '',
          saved._id,
          req.body.amount,
          'Fill out your billing information',
          'USD',
          returnUrl,
          cancelUrl,
          false,
          function (err, data) {
            if (err) {
              res.status(500).send(err);
              return;
            }
            let payment = {
              redirectUrl: data.redirectUrl
            };
            // Regular paid.
            res.json({ payment });
          }
        );
      });
    } else {
      return res.status(500);
    }
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json(err);
  }
}

export async function postVtcPay(req, res) {
  if (!req.body.amount) {
    return res.status(400).json({ success: false, error: 'Amount is required.' });
  }
  try {
    let paymentInfo = req.body.paymentInfo || {}
    if (paymentInfo && paymentInfo.data && paymentInfo.data.contactInfo && paymentInfo.data.contactInfo.inviteCode){
      let inviteCode = paymentInfo.data.contactInfo.inviteCode;
      let userInvite = await User.findOne({'inviteCode': inviteCode.trim(), memberShip: { '$exists': true }}, 'cuid memberShip').lean();
      if(!userInvite || userInvite.memberShip < new Date().getTime() + 14*24*60*60*1000){
        paymentInfo.data.contactInfo.inviteCode = '';
      }
    }
    if (req.headers.token) {
      let token = req.headers.token ? req.headers.token : '';
      let user = await User.findOne({ 'token': token });
      if (user) {
        let amount = parseInt(req.body.amount);
        let currency = 'USD';
        let rate = 1;
        if (req.body.currency && req.body.currency == 'VND') {
          amount = amount / parseInt(serverConfig.moneyExchangeRate.vi);
          currency = req.body.currency;
          rate = serverConfig.moneyExchangeRate.vi;
        }
        let payment = {
          _id: cuid(),
          amount: parseInt(req.body.amount),
          currency: currency,
          rate: rate,
          type: req.body.type,
          bank: req.body.bank
        };
        let rs = await VtcPay.createOrder(user, payment, serverConfig.paymentDebug);
        const newPayment = new Payment({
            affCode: req.query.aff || '',
            cuid: payment._id,
            userId: user.cuid,
            paymentType: 'vtcPay',
            type: 1,
            amount: amount,
            currency: {
              currency: currency,
              rate: rate
            },
            paymentInfo: paymentInfo,
            status: 0
          }
        );
        newPayment.save((err, saved) => {
          if (err) {
            res.status(500).send(err);
            return;
          }
          return res.json({
            success: true,
            url: rs
          });
        });
      } else {
        //Payment with user not login
        let amount = parseInt(req.body.amount);
        let currency = 'USD';
        let rate = 1;
        if (req.body.currency && req.body.currency == 'VND') {
          currency = req.body.currency;
          rate = serverConfig.moneyExchangeRate.vi;
        }
        let payment = {
          _id: cuid(),
          amount: parseInt(req.body.amount),
          currency: currency,
          rate: rate,
          type: req.body.type,
          bank: req.body.bank
        };
        let rs = await VtcPay.createOrder({}, payment, serverConfig.paymentDebug);
        const newPayment = new Payment({
            affCode: req.query.aff || '',
            cuid: payment._id,
            userId: '',
            paymentType: 'vtcPay',
            type: 1,
            amount: amount,
            currency: {
              currency: currency,
              rate: rate
            },
            paymentInfo: paymentInfo,
            status: 0
          }
        );
        newPayment.save((err, saved) => {
          if (err) {
            res.status(500).send(err);
            return;
          }
          return res.json({
            success: true,
            url: rs
          });
        });
      }
    } else {
      //Payment with
      let amount = parseInt(req.body.amount);
      let currency = 'USD';
      let rate = 1;
      if (req.body.currency && req.body.currency == 'VND') {
        currency = req.body.currency;
        rate = serverConfig.moneyExchangeRate.vi;
      }
      let payment = {
        _id: cuid(),
        amount: parseInt(req.body.amount),
        currency: currency,
        rate: rate,
        type: req.body.type,
        bank: req.body.bank
      };
      let rs = await VtcPay.createOrder({}, payment, serverConfig.paymentDebug);
      const newPayment = new Payment({
          affCode: req.query.aff || '',
          cuid: payment._id,
          userId: '',
          paymentType: 'vtcPay',
          type: 1,
          amount: amount,
          currency: {
            currency: currency,
            rate: rate
          },
          paymentInfo: paymentInfo,
          status: 0
        }
      );
      newPayment.save((err, saved) => {
        if (err) {
          res.status(500).send(err);
          return;
        }
        return res.json({
          success: true,
          url: rs
        });
      });
    }
  } catch(err) {
    console.log('err:', err);
    return res.status(500).json(err);
  }
}

export async function postTransferPay(req, res) {
  if(!req.body.amount){
    return res.status(400).json({success: false, error: 'Amount is required.'});
  }
  try {
    let token = req.headers.token ? req.headers.token : '';
    let user = {};
    if(token) {
      user = await User.findOne({'token': token});
    }
    let amount = parseInt(req.body.amount);
    if(req.body.currency && req.body.currency == 'VND'){
      amount = amount / parseInt(serverConfig.moneyExchangeRate.vi);
    }
    let paymentInfo = req.body.paymentInfo || {}
    if (paymentInfo && paymentInfo.data && paymentInfo.data.contactInfo && paymentInfo.data.contactInfo.inviteCode){
      let inviteCode = paymentInfo.data.contactInfo.inviteCode;
      let userInvite = await User.findOne({'inviteCode': inviteCode.trim(), memberShip: { '$exists': true }}, 'cuid memberShip').lean();
      if(!userInvite || userInvite.memberShip < new Date().getTime() + 14*24*60*60*1000){
        paymentInfo.data.contactInfo.inviteCode = '';
      }
    }
    const newPayment = new Payment({
        cuid: cuid(),
        affCode: paymentInfo.data && paymentInfo.data.aff ? paymentInfo.data.aff : '',
        userId: user && user.cuid ? user.cuid : '',
        paymentType : req.body.type,
        type : 1,
        amount : amount,
        currency: {
          currency: 'VND',
          rate: serverConfig.moneyExchangeRate.vi
        },
        paymentInfo : paymentInfo,
        status : 0
      }
    );
    newPayment.save((err, saved) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      if(saved && saved.paymentInfo && saved.paymentInfo.type === 'memberShip'){
        var dataSendMail = {
          type: 'transferPay',
          language: 'vi',
          data: {
            fullName: saved.paymentInfo.data.contactInfo.fullName,
            email: saved.paymentInfo.data.contactInfo.email,
            telephone: saved.paymentInfo.data.contactInfo.phoneNumber,
            address:  saved.paymentInfo.data.contactInfo.address || '',
            paymentType: saved.paymentType === 'QRpay' ? 'Thanh toán qua ZaloPay, Momo' :
              saved.paymentType === 'transferBank' ? 'Chuyển khoản ngân hàng' :
              saved.paymentType === 'Cod' ? 'Thanh toán khi nhận mã kích hoạt' : ''

          }
        };
        Q.create(globalConstances.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
      }
      res.json({
        success: true,
        payment: saved
      });
    });

  } catch (err) {
    console.log('err:', err);
    return res.status(500).json(err);
  }
}

export async function postOnePay(req, res) {
  try {
    let token = req.headers.token ? req.headers.token : '';
    if (token) {
      let user = await User.findOne({ 'token': token });
      if (user) {
        let _id = cuid();
        let body = {
          transRef: _id,
          type: req.body.type,
          pin: req.body.pin,
          serial: req.body.serial,
        }
        var resultPay = await OnePay.PayPost(body);
        if (resultPay && resultPay.status) {
          const affCode = req.query || '';
          if (resultPay.status == '00') {
            let amountPay = parseInt(resultPay.amount) / parseFloat(onePayConfig.vat);
            amountPay = amountPay * parseFloat(onePayConfig.discount[req.body.type]) / 100;
            resultPay.type = req.body.type;
            resultPay.pin = req.body.pin;
            resultPay.serial = req.body.serial;
            let amount = 0;
            let rate = await OnePay.getRateUSD();
            if (rate) {
              amount = (parseFloat(amountPay) / parseInt(rate)).toFixed(2);
              await User.update({ token: token }, { $inc: { balance: amount } });
              const newPayment = new Payment({
                affCode,
                cuid: _id,
                userId: user.cuid,
                paymentType: 'onePay',
                type: 1,
                amount: amount,
                status: 1,
                detail: resultPay,
                paymentInfo: req.body.paymentInfo ? req.body.paymentInfo : {}
              });
              newPayment.save((err, saved) => {
                if (err) {
                  res.status(500).send(err);
                  return;
                }
                return res.json({
                  success: true,
                  mess: 'Giao dịch thành công'
                });
              });
            } else {
              const newPayment = new Payment({
                affCode,
                cuid: _id,
                userId: user.cuid,
                paymentType: 'onePay',
                type: 1,
                amount: amount,
                status: 0,
                detail: resultPay
              });
              newPayment.save((err, saved) => {
                if (err) {
                  res.status(500).send(err);
                  return;
                }
                return res.json({
                  success: true,
                  mess: 'Giao dịch thành công, tuy nhiên tiền chưa được cộng vào tài khoản của bạn. Chúng tôi sẽ xem lại'
                });
              });
            }
          } else {
            switch (resultPay.status) {
              case '01':
                var mess = 'Địa chỉ IP truy cập API bị từ chối';
                break;
              case '02':
                var mess = 'Tham số gửi chưa chính xác';
                break;
              case '03':
                var mess = 'Merchant không tồn tại hoặc merchant đang bị khóa kết nối';
                break;
              case '04':
                var mess = 'Mật khẩu hoặc chữ ký xác thực không chính xác';
                break;
              case '05':
                var mess = 'Trùng mã giao dịch';
                break;
              case '06':
                var mess = 'Mã giao dịch không tồn tại hoặc sai định dạng';
                break;
              case '07':
                var mess = 'Thẻ đã được sử dụng, hoặc thẻ sai.';
                break;
              case '08':
                var mess = 'Thẻ bị khóa';
                break;
              case '09':
                var mess = 'Thẻ hết hạn sử dụng';
                break;
              case '10':
                var mess = 'Thẻ chưa được kích hoạt hoặc không tồn tại.';
                break;
              case '11':
                var mess = 'Mã thẻ sai định dạng.';
                break;
              case '12':
                var mess = 'Sai số serial của thẻ.';
                break;
              case '13':
                var mess = 'Mã thẻ và số serial không khớp.';
                break;
              case '14':
                var mess = 'Thẻ không tồn tại';
                break;
              case '15':
                var mess = 'Thẻ không sử dụng được.';
                break;
              case '16':
                var mess = 'Số lần thử (nhập sai liên tiếp) của thẻ vượt quá giới hạn cho phé';
                break;
              case '17':
                var mess = 'Hệ thống đơn vị phát hành (Telco) bị lỗi hoặc quá tải, thẻ chưa bị trừ.';
                break;
              case '18':
                var mess = 'Hệ thống đơn vị phát hành (Telco) bị lỗi hoặc quá tải, thẻ có thể bị trừ. Chúng tôi sẽ kiểm tra lại';
                break;
              case '19':
                var mess = 'Đơn vị phát hành không tồn tại';
                break;
              case '20':
                var mess = 'Đơn vị phát hành không hỗ trợ nghiệp vụ này';
                break;
              case '21':
                var mess = 'Không hỗ trợ loại card này';
                break;
              case '22':
                var mess = 'Kết nối tới hệ thống đơn vị phát hành (Telco) bị lỗi, thẻ chưa bị trừ, do lỗi kết nối với Telco.';
                break;
              case '23':
                var mess = 'Lỗi kết nối với đơn vị cung cấp thẻ, thẻ chưa bị trừ.';
                break;
              case '99':
                var mess = 'Lỗi chưa xác định được nguyên nhân';
                break;
              default:
                var mess = '';
                break;
            }
            const newPayment = new Payment({
              affCode,
              cuid: _id,
              userId: user.cuid,
              paymentType: 'onePay',
              type: 1,
              amount: 0,
              status: 0,
              detail: resultPay
            });
            newPayment.save((err, saved) => {
              if (err) {
                res.status(500).send(err);
                return;
              }
              return res.json({
                success: false,
                mess: mess
              });
            });
          }
        } else {
          return res.json({
            success: false,
            mess: 'Lỗi chưa xác định được nguyên nhân'
          });
        }
      } else {
        return res.status(500);
      }
    } else {
      return res.status(500);
    }
  } catch (err) {
    console.log('err: ', err);
    return res.status(500).json(err);
  }
}

export async function saveVtcPay(req, res) {
  try {
    let token = req.headers.token ? req.headers.token : '';
    if (token && req.body.payment) {
      let checkPayment = await VtcPay.checkResultsPay(req.body.payment);
      let user = await User.findOne({ 'token': token });
      if (checkPayment) {
        Payment.findOne({ cuid: req.body.payment.reference_number }).exec(async (err, paymentResult) => {
          if (err) {
            return res.json({
              success: false,
              status: -104,
              mess: 'Không tìm thấy giao dịch trên hệ thống'
            });
          }
          if (paymentResult.status == 1) {
            return res.json({
              success: false,
              status: -102,
              mess: 'Giao dịch đã hoàn tất trước đó.'
            });
          } else {
            if(req.body.payment.status == '1'){
              await Payment.update({cuid : req.body.payment.reference_number}, { $set: { status: 1, detail : req.body.payment}});
              let paymentInfo = await Payment.findOne({cuid : req.body.payment.reference_number}).lean();
              if(paymentInfo && paymentInfo.paymentInfo && paymentInfo.paymentInfo.type === 'course'){
                await User.update({token: token}, { $inc: { balance: paymentResult.amount }});
                Q.create(globalConstances.jobName.JOIN_COURSE_AFTER_PAY, paymentInfo).removeOnComplete(true).save();
              } else if(paymentInfo && paymentInfo.paymentInfo && paymentInfo.paymentInfo.type === 'stream'){
                await User.update({token: token}, { $inc: { balance: paymentResult.amount }});
                Q.create(globalConstances.jobName.JOIN_WEBINAR_AFTER_PAY, paymentInfo).removeOnComplete(true).save();
              } else if(paymentInfo && paymentInfo.paymentInfo && paymentInfo.paymentInfo.type === 'memberShip'){
                if(user){
                  let balance = user.balance <= paymentResult.amount ? 0 : parseFloat(user.balance - paymentResult.amount);
                  await User.update({token: token}, { $set: { balance: balance }});
                  Q.create(globalConstances.jobName.JOIN_MEMBERSHIP_AFTER_PAY, paymentInfo).removeOnComplete(true).save();
                } else {
                  await Payment.update({cuid : req.body.payment.reference_number}, { $set: { status: 2}});
                  let paymentData = await generalCode({paymentId: paymentInfo._id});
                  if(!paymentData){
                    return res.json({
                      success: false,
                      status: -1,
                      mess: 'Giao dịch đã hoàn tất, chúng tôi chưa thể tạo mã kích hoạt membership, vui lòng liên hệ để được hỗ trợ.'
                    });
                  }
                  let contact = paymentData.paymentInfo.data.contactInfo;
                  var dataSendMail = {
                    type: 'memberCodeVTCPay',
                    language: 'vi',
                    data: {
                      fullName: contact.fullName,
                      email: contact.email,
                      code: paymentData.memberCode
                    }
                  };
                  Q.create(globalConstances.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();
                  return res.json({
                    success: true,
                    payment: 1,
                    data: paymentData,
                    mess: ''
                  });
                }
              } else if (paymentInfo && paymentInfo.paymentInfo && paymentInfo.paymentInfo.type === 'order') {
                // Send email
                // Add membership
                await User.update({token: token}, { $inc: { balance: paymentResult.amount }});
                let historyCart = await HistoryCart.findById(paymentInfo.paymentInfo.orderId);
                if(!historyCart) {
                  return res.json({
                    success: false,
                    status: -104,
                    mess: 'Không tìm thấy đơn hàng trên hệ thống'
                  });
                }
                await User.update({token: token}, { $inc: { balance: historyCart.total_payment }});
                historyCart.status = 2;
                historyCart.paymentId = paymentInfo._id;
                await historyCart.save();
              } else {
                await User.update({token: token}, { $inc: { balance: paymentResult.amount }});
              }
              return res.json({
                success: true,
                payment: 1,
                mess: ''
              });
            } else {
              await Payment.update({ cuid: req.body.payment.reference_number }, { $set: { detail: req.body.payment } });
              switch (req.body.payment.status) {
                case '7':
                  var mess = 'Thẻ ngân hàng thanh toán của khách hàng đã bị trừ tiền nhưng được thêm vào Tesse. Bộ phận quản trị thanh toán của VTC sẽ duyệt để quyết định giao dịch thành công hay thất bại';
                  break;
                case '-1':
                  var mess = 'Giao dịch thất bại';
                  break;
                case '-3':
                  var mess = 'Hệ thống thanh toán đã hủy giao dịch';
                  break;
                case '-4':
                  var mess = 'Thẻ/tài khoản không đủ điều kiện giao dịch (Đang bị khóa, chưa đăng ký thanh toán online …)';
                  break;
                case '-5':
                  var mess = 'Số dư thẻ/tài khoản khách hàng không đủ để thực hiện giao dịch';
                  break;
                case '-6':
                  var mess = 'Lỗi giao dịch của hệ thống thanh toán';
                  break;
                case '-7':
                  var mess = 'Khách hàng nhập sai thông tin thanh toán ( Sai thông tin tài khoản hoặc sai OTP)';
                  break;
                case '-8':
                  var mess = 'Quá hạn mức giao dịch trong ngày';
                  break;
                case '-9':
                  var mess = 'Bạn đã hủy giao dịch';
                  break;
                case '-21':
                  var mess = 'Trùng mã giao dịch';
                  break;
                case '-22':
                  var mess = 'Số tiền thanh toán đơn hàng quá nhỏ';
                  break;
                case '-23':
                  var mess = 'WebsiteID không tồn tại';
                  break;
                case '-24':
                  var mess = 'Đơn vị tiền tệ thanh toán đơn hàng không hợp lệ';
                  break;
                case '-25':
                  var mess = 'Tài khoản VTC Pay nhận tiền của Merchant không tồn tại.';
                  break;
                case '-28':
                  var mess = 'Thiếu tham số bắt buộc phải có trong một đơn hàng thanh toán online';
                  break;
                case '-29':
                  var mess = 'Tham số request không hợp lệ';
                  break;
                case '-99':
                  var mess = 'Lỗi chưa rõ nguyên nhân và chưa biết trạng thái giao dịch. Cần kiểm tra để biết giao dịch thành công hay thất bại';
                  break;
                default:
                  var mess = '';
                  break;
              }
              let paymentInfo = await Payment.findOne({cuid : req.body.payment.reference_number}).lean();
              if(paymentInfo && paymentInfo.paymentInfo && paymentInfo.paymentInfo.type === 'order'){
                let historyCart = await HistoryCart.findById(paymentInfo.paymentInfo.orderId);
                if(!historyCart) {
                  return res.json({
                    success: false,
                    status: -104,
                    mess: 'Không tìm thấy đơn hàng trên hệ thống'
                  });
                }
                historyCart.status = 3;
                await historyCart.save();
              }
              return res.json({
                success: false,
                status: req.body.payment.status,
                payment: 0,
                mess: mess
              });
            }
          }
        });
      } else {
        return res.json({
          success: false,
          status: -100,
          mess: 'Giao dịch không hợp lệ.',
        });
      }
    } else {
      return res.status(500);
    }
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json(err);
  }
}

export async function checkEmailInvite(req, res) {
  if (req.params && req.params.email) {
    let user = await User.count({ email: req.params.email }).exec();
    let invite = await EmailInivte.count({ user: req.user._id, emails: req.params.email }).exec();
    res.json({
      success: true,
      data: {
        user: !!user,
        invite: !!invite
      }
    });
  } else {
    res.json({ success: false, data: {} });
  }
}

export async function gmailContact(req, res) {
  if (JSON.stringify(req.body.tokenObj) != '{}') {
    await User.update({ _id: req.user._id }, { $set: { tokenGoogleObj: req.body.tokenObj } }).exec();
  }
  let user = await User.findById(req.user._id).exec();
  if (user && user.tokenGoogleObj) {
    var opts = {
      token: user.tokenGoogleObj.access_token
    };
    let array_emails = await googleContactsReq(opts);
    let emails = array_emails.map(mail => {
      return mail.email
    });
    let dataUsers = await User.find({ email: { $in: emails } }).lean();
    let dataEmailInvite = await EmailInivte.findOne({ user: req.user._id }).lean();
    let mapper = ArrayHelper.toObjectByKey(dataUsers, 'email');
    let mapper2 = ArrayHelper.toObjectWithKey(dataEmailInvite ? dataEmailInvite.emails : []);
    let data = array_emails.map(mail => {
      return {
        'email': mail.email,
        'name': mail.name,
        'user': !!mapper[mail.email],
        'invite': !!mapper2[mail.email],
      }
    });
    res.json({ success: true, data: data });
  } else {
    res.json({ success: false, data: null });
  }
}

export function googleContactsReq(opts) {
  return new Promise(resolve => {
      googleContacts(opts, function (err, dataEmails) {
        if (err) {
          resolve([]);
        } else {
          resolve(dataEmails);
        }
      })
    }
  );
}

export async function createWithdrawal(req, res) {
  try {
    let now = new Date();
    let onlineState = getUserSupportState(req.user.cuid);

    // if(onlineState === globalConstances.userState.OFFLINE) {
    //   return res.status(401).json({
    //     success: false, error: 'You can not withdrawal while still offline.'
    //   });
    // }

    if (onlineState === globalConstances.userState.BUSY) {
      return res.status(403).json({
        success: false, error: 'You can not withdrawal while still in session.'
      });
    }
    let user = await User.findById(req.user._id).exec();
    if (req.body.paymentType === 'full' || req.body.paymentType === 'fullAuto') {
      if (user.fullWithdrawl) {
        return res.status(400).json({
          success: false,
          error: 'You just can create only ONE Full Withdrawl in a month.'
        });
      }
    }

    let newWithdrawal = {
      userId: req.user._id,
      type: req.body.paymentType,
      amount: req.body.paymentType === 'single' ? Number(req.body.amount).valueOf() : null
    };

    if ('paymentMethodId' in req.body) {
      newWithdrawal.paymentMethod = await UserPaymentMethod.findById(req.body.paymentMethodId);
    } else if ('paymentmethod' in req.body) {
      newWithdrawal.paymentMethod = await UserPaymentMethod.addNew(UserPaymentMethod, user, req.body.paymentmethod);
    }

    if (!Withdrawal.isValidWithdrawal(newWithdrawal)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal.'
      });
    }

    if (newWithdrawal.type === 'single' && newWithdrawal.amount > (user.balance - 10)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount.'
      });
    }

    let promises = [];
    // If Single Withdrawal, minus user's balance
    if (newWithdrawal.type === 'single') {
      user.balance -= newWithdrawal.amount;
      promises.push(user.save());
      promises.push(Withdrawal.create(newWithdrawal));
    } else {
      if (newWithdrawal.type === 'fullAuto') {
        user.autoWithdrawl = true;
      }
      user.fullWithdrawl = newWithdrawal;
      user.markModified('fullWithdrawl');
      promises.push(user.save());
    }

    await Promise.all(promises);
    return res.json({ success: true });


  } catch (err) {
    if (err.err === 'added') {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    console.log('err on createWithdrawal:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

export async function cancelFullWithdrawal(req, res) {
  try {
    let user = await User.findById(req.user._id, 'fullWithdrawl');
    if (!user.fullWithdrawl) {
      return res.status(400).json({
        success: false,
        error: 'You have not set any Full Withdrawal yet.'
      });
    }

    user.fullWithdrawl = undefined;
    user.markModified('fullWithdrawl');
    if (user.autoWithdrawl) {
      user.autoWithdrawl = false;
    }

    await user.save();
    return res.json({ success: true });

    // if (req.body.type !== 'full' && req.body.type !== 'fullAuto') {
    //   return res.status(400).json({success: false, error: 'Invalid type.'});
    // }
    // let promises = [
    //   Withdrawal.update({userId: req.user._id, status: 'pending', type: req.body.type}, {
    //     $set: {
    //       status: 'canceled',
    //       canceledDate: new Date(),
    //       notes: 'User canceled.'
    //     }
    //   })
    // ];
    // if (req.body.type === 'fullAuto') {
    //   promises.push(User.update({_id: req.user._id}, {$set: {autoWithdrawl: false}}));
    // }
    //
    // await Promise.all(promises);
    // return res.json({success: true});
  } catch (err) {
    console.log('err on cancelWithdrawal:', err);
    return res.status(500).json({ success: false, error: 'Internal error.' });
  }
}

// export function getWithdrawal(req, res){
//   let now = new Date();
//    Withdrawal.find({
//     userId: req.user._id,
//     requestDate: {
//       $gte: new Date(now.getFullYear(), now.getMonth(), 1),
//       $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
//     },
//     type: req.query.type || 'single'
//   }).exec((err, withdrawal) => {
//      if (err) {
//        res.status(500).send(err);
//        return;
//      }
//      res.json(withdrawal);
//    });
// }
export async function adminGetPayments(req, res) {
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * PAYMENT_PER_PAGE;

  try {
    let results = await Promise.all([
      Payment.count().exec(),
      Payment.find().skip(skip).limit(PAYMENT_PER_PAGE).sort({ dateAdded: -1 }).exec()
    ]);

    let total = results[0];
    let paymentPromise = results[1].map(payment => Payment.getMetadata(payment));
    let rs = await Promise.all(paymentPromise);

    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(total / PAYMENT_PER_PAGE),
      total_items: total,
      data: rs
    });
  } catch (err) {
    console.log('err on adminGetPayments:', err);
    return res.status(500).json(err);
  }
}

export async function getFullWithdrawalStatus(req, res) {
  let user = await User.findById(req.user._id, 'fullWithdrawl');

  if (!user.fullWithdrawl) {
    return res.json({ success: true, data: {} });
  }

  return res.json({ success: true, data: user.fullWithdrawl });
}

function checkJSON(text) {
  if (typeof text !== "string") {
    return false;
  }
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
  }
}
export async function getPaymentHistory(req, res) {
  try {
    const userId = req.user._id || '';
    const user = await User.findById(userId).lean()
    if(!user){
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    let page = ~~req.query.page || 1;
    let skip = (page - 1) * PAYMENT_PER_PAGE;
    try {
      let results = await Promise.all([
        Payment.count({userId: user.cuid}).exec(),
        Payment.find({userId: user.cuid}).skip(skip).limit(PAYMENT_PER_PAGE).sort({ dateAdded: -1 }).exec()
      ]);

      let total = results[0];
      let paymentPromise = results[1].map(payment => Payment.getMetadata(payment));
      let rs = await Promise.all(paymentPromise);

      return res.json({
        success: true,
        current_page: page,
        last_page: Math.ceil(total / PAYMENT_PER_PAGE),
        total_items: total,
        data: rs
      });
    } catch (err) {
      console.log('err on getPaymentHistory:', err);
      return res.status(500).json(err);
    }
  } catch (err) {
    console.log('err on getPaymentHistory:', err);
    return res.status(500).json(err);
  }
}
