import User from '../models/user';
import UserGifts from '../models/UserGifts';
import TradeGifts from '../models/tradeGift';
import SendGifts from '../models/sendGift';
import configs from '../config';
import StringHelper from '../util/StringHelper';

/*
export async function buyPoint(req, res) {
  try {
    let user = await User.findOne({_id: req.user._id});

    let quantity = Number(req.body.quantity).valueOf();
    if(isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity.'
      });
    }
    let total = quantity * configs.pricePoint;

    if(user.balance < total) {
      return res.status(400).json({
        success: false,
        error: 'Your balance is not enough.'
      });
    }

    user.balance -= total;
    user.points += quantity;

    await Promise.all([
      user.save(),
      TradeGifts.create({
        user: req.user._id,
        gift: 'points',
        quantity: quantity,
        price: configs.pricePoint,
        total: total
      })
    ]);

    return res.json({
      success: true,
      data: {
        balance: user.balance,
        points: user.points
      }
    });
  } catch (err) {
    console.log('err on buyPoints:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal error.'
    });
  }
}

const VALID_GIFTS = ['flowers', 'coffee', 'cars', 'houses'];

export async function buyGift(req, res) {
  try {
    if(VALID_GIFTS.indexOf(req.body.gift) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gift.'
      });
    }

    let quantity = Number(req.body.quantity).valueOf();
    if (isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity'
      });
    }
    let options = {
      userId: req.user._id,
      quantity: quantity,
      gift: req.body.gift
    };

    let data = await _buyGift(options);

    return res.json({
      success: true, data: data
    });

  } catch (err) {
    return res.status(err.status).json({
      success: false, error: err.error
    });
  }
}

async function _buyGift(options) {
  // options: {
  //  userId,
  //  quantity
  //  gift
  // }
  try {
    let resources = await Promise.all([
      User.findById(options.userId),
      UserGifts.findOne({user: options.userId})
    ]);
    let user = resources[0], userGifts = resources[1] || await UserGifts.create({user: options.userId});

    let quantity = options.quantity;
    let total = configs.gifts[options.gift].sell * quantity;
    // console.log('price:', total);
    // console.log('points:', user.points);
    if (!user.points || user.points < total) {
      return Promise.reject({
        status: 400,
        error: 'Not enough point.'
      });
    }


    let originPoints = user.points, originGifts = userGifts[options.gift];

    try {
      // decrease user's point
      user.points -= total;
      await user.save();

      // increase user's gift
      userGifts[options.gift] += quantity;
      await userGifts.save();

      await TradeGifts.create({
        user: options.userId,
        type: 'buy',
        gift: options.gift,
        quantity: quantity,
        price: configs.gifts[options.gift].sell,
        total: total
      });
    } catch (err) {
      user.points = originPoints;
      userGifts[options.gift] = originGifts;
      await Promise.all([
        user.save(),
        userGifts.save()
      ]);
      throw err;
    }

    return {
      points: user.points,
      gifts: userGifts
    };
  } catch (err) {
    console.log('err on buyGift:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function sellGift(req, res) {
  try {
    let validGift = !!configs.gifts[req.body.gift.toLowerCase()];
    if(!validGift) {
      return res.status(400).json({success: false, error: 'Invalid gift'});
    }

    let quantity = Number(req.body.quantity).valueOf();
    if (isNaN(quantity)) {
      return res.status(400).json({success: false, error: 'Invalid quantity'});
    }
    let total = configs.gifts[req.body.gift].buy * quantity;

    let resources = await Promise.all([
      User.findById(req.user._id),
      UserGifts.findOne({user: req.user._id})
    ]);
    let user = resources[0], userGifts = resources[1];

    if(!userGifts || !userGifts[req.body.gift] || userGifts[req.body.gift] < quantity) {
      return res.status(400).json({success: false, error: 'Not enough ' + req.body.gift});
    }

    let originPoints = user.points, originGifts = userGifts[req.body.gift];

    try {
      userGifts[req.body.gift] -= quantity;
      await userGifts.save();

      user.points += total;
      await user.save();

      await TradeGifts.create({
        user: req.user._id,
        type: 'sell',
        gift: req.body.gift,
        quantity: quantity,
        price: configs.gifts[req.body.gift].buy,
        total: total
      });
    } catch (err) {
      user.points = originPoints;
      userGifts[options.gift] = originGifts;
      await Promise.all([
        user.save(),
        userGifts.save()
      ]);
      throw err;
    }

    return res.json({
      success: true,
      data: {
        points: user.points,
        gifts: userGifts
      }
    });
  } catch (err) {
    console.log('err on sellGift:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}
*/

export async function getGiftsPrice(req, res) {
  try {
    let totalTCoin;
    if(req.headers.token) {
      let user = await User.findOne({token: req.headers.token}, 'balance');
      if(user) totalTCoin = user.balance / configs.ruby;
    }

    let gifts = [];
    for(let k in configs.gifts) {
      let gift = Object.assign({}, configs.gifts[k]);
      gift.max = totalTCoin ? Math.floor(totalTCoin / gift.ruby) : undefined;
      gifts.push(gift);
    }
    return res.json({
      success: true,
      data: {
        ruby: configs.ruby,
        points: {
          price: configs.pricePoint,
          exchangeFee: configs.feeExchangePoint
        },
        gifts: gifts
      }
    });
  } catch (err) {
    console.log('err on getGiftsPrice:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

export async function sendGift(req, res) {
  try {
    let validGift = !!configs.gifts[req.body.gift];
    if(!validGift) {
      return res.status(400).json({success: false, error: 'Invalid gift.', code: 'IVLGIFT'});
    }

    if(!StringHelper.isObjectId(req.body.to)) {
      return res.status(404).json({success: false, error: 'User not found.', code: 'UNOTFOUND'});
    }

    let users = await User.find({_id: {$in: [req.user._id, req.body.to]}});
    let sender, receiver;
    if(req.user._id.toString() === users[0]._id.toString()) {
      sender = users[0]; receiver = users[1];
    } else {
      sender = users[1]; receiver = users[0];
    }

    if(!receiver) {
      return res.status(404).json({success: false, error: 'User not found.', code: 'UNOTFOUND'});
    }

    let sendAmount = Number(req.body.amount).valueOf();
    if(!sendAmount || isNaN(sendAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount.',
        code: 'IVLAMNT'
      });
    }

    let points = sendAmount * configs.gifts[req.body.gift].points;
    let total = points * configs.pricePoint;
    if(sender.balance < total) {
      return res.status(400).json({success: false, error: 'Not enough balance.', code: 'NEB'});
    }

    // let receiverGift = await UserGifts.findOne({user: req.body.to}) || await UserGifts.create({user: req.body.to});
    let senderOriginBalance = sender.balance, receiverOriginPoints = receiver.points;

    try {
      sender.balance -= total;
      await sender.save();
      // console.log('sender gift:', userGift[req.body.gift]);
      receiver.points += points;
      // console.log('receiver gift:', receiverGift[req.body.gift]);
      await receiver.save();

      await SendGifts.create({
        from: req.user._id,
        to: req.body.to,
        liveStream: req.body.liveStream,
        gift: req.body.gift,
        quantity: sendAmount,
        points: points
      });
    } catch (err) {
      sender.balance = senderOriginBalance;
      receiver.points = receiverOriginPoints;
      await Promise.all([
        sender.save(),
        receiver.save()
      ]);
      throw err;
    }
    return res.json({
      success: true,
      data: {
        balance: sender.balance
      }
    });
  } catch (err) {
    console.log('err on sendGift:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}
