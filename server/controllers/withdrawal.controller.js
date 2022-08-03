import User from '../models/user';
import Withdrawal from '../models/withdrawal';
import {isValidDate} from "../util/DateHelper";

const WITHDRAWAL_PER_PAGE = 30;
const allowTypes = ['single', 'full', 'fullAuto'];
const allowStatuses = ['pending', 'approved', 'rejected', 'canceled', 'paid'];

async function createAutoWithdrawal() {
  let conditions = {
    autoWithdrawl: true,
    balance: {$gt: 10}
  };

  try{
    let users = await User.find(conditions, 'autoWithdrawlMethod balance').exec();

    let withdrawals = users.map(user => {
      return {
        userId: user._id,
        type: 'auto',
        paymentMethod: user.autoWithdrawlMethod,
        amount: user.balance - 10
      };
    });

    return await Withdrawal.create(withdrawals);
  } catch(err) {
    throw err;
  }
}

export async function adminCreateAutoWithdrawals(req, res) {
  try{
    let autoWithdrawals = await createAutoWithdrawal();
    return res.json({
      success: true,
      data: autoWithdrawals || []
    });
  } catch (err) {
    console.log('err on adminCreateAutoWithdrawals:', err);
    return res.status(500).json(err);
  }
}

export async function adminGetWithdrawals(req, res) {
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * WITHDRAWAL_PER_PAGE;
  let conditions = {};

  if(req.query.type) {
    conditions.type = req.query.type;
  }
  if(req.query.method) {
    conditions.paymentMethod = req.query.method;
  }
  if(req.query.status) {
    conditions.status = req.query.status;
  }
  //console.log('conditions:', conditions);

  try {
    let results = await Promise.all([
      Withdrawal.count(conditions).exec(),
      Withdrawal.find(conditions).sort({requestDate: -1}).skip(skip).limit(WITHDRAWAL_PER_PAGE).exec()
    ]);

    let withdrawalPromise = results[1].map(withdrawal => Withdrawal.getMetadata(withdrawal));
    let rs = await Promise.all(withdrawalPromise);

    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(results[0] / WITHDRAWAL_PER_PAGE),
      total_items: results[0],
      data: rs
    });
  } catch(err) {
    console.log('err on adminGetWithdrawals:', err);
    return res.status(500).json(err);
  }
}

export async function adminApproveWithdrawal(req, res) {
  let ids = [];
  if(req.body.ids) {
    ids = req.body.ids;
  } else if(req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide Withdrawal's Id(s) to approve."
    });
  }

  try {
    let withdrawals = await Withdrawal.find({_id: {$in: ids}}, 'userId amount').exec();
    let updateWithdrawalOptions = {
      checkedDate: new Date(),
      adminId: req.user._id,
      status: 'approved'
    };
    let promises = withdrawals.map(async withdrawal => {
      // update withdrawal
      withdrawal.checkedDate = new Date();
      withdrawal.adminId = req.user._id;
      withdrawal.status = 'approved';
      await withdrawal.save();

      // update user
      let user = await User.findById(withdrawal.userId, 'balance').exec();
      user.balance -= withdrawal.amount;
      return user.save();
    });

    await Promise.all(promises);

    return res.json({success: true});
  } catch (err) {
    console.log('err on adminApproveWithdrawal:', err);
    return res.status(500).json(err);
  }
}

export async function adminRejectWithdrawal(req, res) {
  let ids = [];
  if(req.body.ids) {
    ids = req.body.ids;
  } else if(req.body.id) {
    ids = [req.body.id];
  } else {
    return res.status(400).json({
      success: false,
      error: "Please provide Withdrawal's Id(s) to reject."
    });
  }

  let conditions = {_id: {$in: ids}, status: 'pending'};
  let setOptions = {status: 'rejected', adminId: req.user._id};
  try {
    await Withdrawal.update(conditions, {$set: setOptions}, {multi: true}).exec();
    return res.json({success: true});
  } catch (err) {
    console.log('err on adminRejectWithdrawal:', err);
    return res.status(500).json(err);
  }
}


export async function getTotalAmountInMonth(req, res) {
  try {
    let now = new Date();
    let aggregate = await Withdrawal.aggregate([
      {
        $match: {
          status: {$nin: ['canceled', 'rejected']},
          requestDate: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
          },
          userId: req.user._id
        }
      },
      {
        $group: {
          _id: null,
          total_amount: {$sum: '$amount'}
        }
      }
    ]);

    let total_amount = aggregate.length ? aggregate[0].total_amount : 0;

    return res.json({
      success: true,
      data: {
        total_amount: total_amount
      }
    });
  } catch (err) {
    console.log('err on getTotalAmountInMonth:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal error.'
    });
  }
}

export async function getWithdrawals(req, res) {
  try {
    let page = ~~req.query.page || 1, skip = (page - 1) * WITHDRAWAL_PER_PAGE;
    let type = allowTypes.indexOf(req.query.type) >= 0 ? req.query.type : {$ne: null};
    let status = allowStatuses.indexOf(req.query.status) >= 0 ? req.query.status : {$ne: null};
    let now = new Date();
    let from = new Date(Number(req.query.from).valueOf());
    if (!isValidDate(from)) {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    let to = new Date(Number(req.query.to).valueOf());
    if (!isValidDate(to)) {
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    let conditions = {
      userId: req.user._id,
      requestDate: {
        $gte: from,
        $lte: to
      },
      type: type,
      status: status
    };
    // console.log('conditions:', conditions);

    let rs = await Promise.all([
      Withdrawal.count(conditions),
      Withdrawal.find(conditions).sort({requestDate: -1}).skip(skip).limit(WITHDRAWAL_PER_PAGE)
    ]);
    let total = rs[0], withdrawals = rs[1];
    // let total_amount = 0;
    // withdrawals.forEach(withdrawal => {
    //   total_amount += withdrawal.amount;
    // });
    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(total / WITHDRAWAL_PER_PAGE),
      total_items: total,
      // total_amount: total_amount,
      data: withdrawals
    });
  } catch (err) {
    console.log('err on getWithdrawals:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal error.'
    });
  }
}

export async function cancelSingleWithdrawal(req, res) {
  let withdrawal = await Withdrawal.findById(req.params.id);
  if(!withdrawal) {
    return res.status(404).json({
      success: false,
      error: 'Withdrawal not found.'
    });
  }

  if(withdrawal.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Really nigga?'
    });
  }

  if(withdrawal.status !== 'pending') {
    return res.status(403).json({
      success: false,
      error: 'You only able to cancel pending withdrawal.'
    });
  }

  withdrawal.status = 'canceled';
  withdrawal.notes = 'User canceled.';
  withdrawal.canceledDate = new Date();

  await withdrawal.save();
  await User.update({_id: req.user._id}, {$inc: {balance: withdrawal.amount}});

  return res.json({
    success: true
  });
}
