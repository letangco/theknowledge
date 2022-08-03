import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import ArrayHelper from '../../util/ArrayHelper';
import PaymentHistory from '../../models/history';
import User from '../../models/user';
import Transaction from '../../models/transaction';
import configs from '../../config';
import Courses from '../../models/courses';
import WebinarTicket from '../../models/webinarTicket';

Q.process(globalConstants.jobName.CREATE_PMT_HISTORY, 1, async (job, done) => {
  try {
    let data = job.data;
    // console.log('book_membership: ', data.action);
    switch (data.action) {
      case 'send':
        await handleSendGift(data.detail);
        break;

      case 'trade':
        await handleTradeGift(data.detail);
        break;

      case 'deposit':
        await handleDeposit(data.detail);
        break;

      case 'withdrawal':
        await handleWithdrawal(data.detail);
        break;

      case 'transaction':
        await handleTransaction(data.detail);
        break;

      case 'exchange':
        await handleSellPoint(data.detail);
        break;

      case 'join_course':
        await handleJoinCourse(data.detail);
        break;

      case 'book_webinar_ticket':
        await handleBookingWebinarTicket(data.booked);
        break;
      case 'book_membership':
        await handleBookingMemberShip(data.booked);
        break;
    }

    return done(null);
  } catch (err) {
    console.log('err on job CREATE_PMT_HISTORY:', err);
    return done(err);
  }
});

function handleSendGift(sendGift) {
  // console.log('sendGift:', sendGift);
  let price = configs.gifts[sendGift.gift].ruby * configs.ruby;
  let senderHistory = {
    owner: sendGift.from,
    user: sendGift.to,
    action: 'send',
    change: 0,
    price: '$' + price,
    amount: sendGift.quantity + ' ' + sendGift.gift,
    account: 'balance',
    detail: sendGift
  };
  // console.log('price:', senderHistory.price);
  // console.log('amount:', senderHistory.amount);
  senderHistory.total = '$' + price * sendGift.quantity;
  // console.log('total:', senderHistory.total);

  let receiverHistory = {
    owner: sendGift.to,
    user: sendGift.from,
    action: 'receive',
    change: 1,
    price: '',
    amount: sendGift.points + ' points',
    total: sendGift.points + ' points',
    account: 'points',
    detail: sendGift
  };

  return PaymentHistory.create([senderHistory, receiverHistory]);
}

function handleTradeGift(buyGift) {
  let history = {
    owner: buyGift.user,
    action: buyGift.type,
    change: 1,
    price: buyGift.price,
    amount: buyGift.quantity,
    total: buyGift.total,
    account: buyGift.gift,
    detail: buyGift
  };
  return PaymentHistory.create(history);
}

async function handleDeposit(payment) {
  let user = await User.findOne({cuid: payment.userId}, '_id').lean();

  let history = {
    owner: user ? user._id : '',
    action: 'deposit',
    change: 1,
    price: 1,
    amount: payment.amount,
    total: payment.amount,
    account: 'balance',
    detail: payment
  };
  return PaymentHistory.create(history);
}

function handleWithdrawal(withdrawal) {
  let history = {
    owner: withdrawal.userId,
    action: 'withdrawal',
    change: 0,
    price: 1,
    amount: withdrawal.amount,
    total: withdrawal.amount,
    account: 'balance',
    detail: withdrawal
  };
  return PaymentHistory.create(history);
}

async function handleTransaction(transactionDetail) {
  let resources = await Promise.all([
    User.find({cuid: {$in: [transactionDetail.sharers, transactionDetail.learnerID]}}, '_id cuid').lean(),
    Transaction.findOne({cuid: transactionDetail.transactionID}).lean()
  ]);
  let users = resources[0], transaction = resources[1];
  let mapper = ArrayHelper.toObjectByKey(users, 'cuid');

  let sharerHistory = {
    owner: mapper[transactionDetail.sharers]['_id'],
    user: mapper[transactionDetail.learnerID]['_id'],
    action: 'transaction',
    change: 1,
    price: transaction.price,
    amount: transaction.duration,
    total: transaction.sharersFunds,
    account: 'balance',
    detail: transactionDetail
  };

  let learnerHistory = {
    owner: mapper[transactionDetail.learnerID]['_id'],
    user: mapper[transactionDetail.sharers]['_id'],
    action: 'transaction',
    change: 0,
    price: transaction.price,
    amount: transaction.duration,
    total: transaction.sharersFunds,
    account: 'balance',
    detail: transactionDetail
  };
  return PaymentHistory.create([sharerHistory, learnerHistory]);
}

function handleSellPoint(exchangePoint) {
  let balanceHistory = {
    owner: exchangePoint.user,
    action: 'exchange',
    change: 1,
    price: '$' + exchangePoint.fee,
    amount: '$' + (exchangePoint.amount * configs.pricePoint).toFixed(2),
    total: '$' + exchangePoint.total,
    account: 'balance',
    detail: exchangePoint
  };

  let pointHistory = {
    owner: exchangePoint.user,
    action: 'exchange',
    change: 0,
    price: '$' + configs.pricePoint,
    amount: exchangePoint.amount + ' points',
    total: exchangePoint.amount + ' points',
    account: 'points',
    detail: exchangePoint
  };

  return PaymentHistory.create([balanceHistory, pointHistory]);
}

async function handleJoinCourse(joinCourse) {
  let course = await Courses.findById(joinCourse.course);

  let buyerHistory = {
    owner: joinCourse.user,
    user: configs.tesseBank._id,
    action: 'join_course',
    change: 0,
    price: '$' + course.price,
    amount: '1',
    total: '$' + course.price,
    account: 'balance',
    detail: joinCourse
  };
  if(joinCourse.currency === configs.currency['vi']) {
    buyerHistory.price = (course.price * joinCourse.priceRate) + ' ' + joinCourse.currency;
    buyerHistory.total = buyerHistory.price;
  }

  let bankerHistory = {
    owner: configs.tesseBank._id,
    user: course.creator,
    action: 'join_course',
    change: 1,
    price: '$' + course.price,
    amount: '1',
    total: '$' + course.price,
    account: 'balance',
    detail: joinCourse
  };

  return PaymentHistory.create([buyerHistory, bankerHistory]);
}

async function handleBookingWebinarTicket(bookingWebinar) {
  // let groupedBooking = ArrayHelper.groupByKey(bookingWebinars, 'ticket');
  // let ticketIds = Object.keys(groupedBooking);
  let ticket = await WebinarTicket.findById(bookingWebinar.ticket).lean();

  let histories = [];
  // tickets.forEach(ticket => {
    let amount = bookingWebinar.amount;
    // let detail = Object.assign({}, ticket);
    // detail.booked = groupedBooking[ticket._id];

    let buyerHistory = {
      owner: bookingWebinar.user,
      user: configs.tesseBank._id,
      action: 'book_webinar_ticket',
      change: 0,
      price: '$' + ticket.price,
      amount: amount + '',
      total: '$' + amount * ticket.price,
      account: 'balance',
      detail: bookingWebinar
    };
    if(bookingWebinar.currency === configs.currency['vi']) {
      let price = (ticket.price * bookingWebinar.priceRate);
      buyerHistory.price = price + ' ' + bookingWebinar.currency;
      buyerHistory.total = price * amount + ' ' + bookingWebinar.currency;
    }
    histories.push(buyerHistory);

    let bankerHistory = {
      owner: configs.tesseBank._id,
      user: bookingWebinar.user,
      action: 'book_webinar_ticket',
      change: 1,
      price: '$' + ticket.price,
      amount: amount + '',
      total: '$' + amount * ticket.price,
      account: 'balance',
      detail: bookingWebinar
    };
    histories.push(bankerHistory);
  // });

  return PaymentHistory.create(histories);
}

async function handleBookingMemberShip(memberShip) {
  let buyerHistory = {
    owner: memberShip.user,
    user: configs.tesseBank._id,
    action: 'book_membership',
    change: 0,
    price:  '$' + memberShip.total,
    amount: '1',
    total:  '$' + memberShip.total,
    account: 'balance',
    detail: memberShip
  };
  if(memberShip.currency === configs.currency['vi']) {
    buyerHistory.price = (memberShip.total * memberShip.priceRate) + ' ' + memberShip.currency;
    buyerHistory.total = buyerHistory.price;
  }

  let bankerHistory = {
    owner: configs.tesseBank._id,
    user: memberShip.user,
    action: 'book_membership',
    change: 1,
    price: '$' + memberShip.total,
    amount: '1',
    total: '$' + memberShip.total,
    account: 'balance',
    detail: memberShip
  };

 return PaymentHistory.create([buyerHistory, bankerHistory]);
}
