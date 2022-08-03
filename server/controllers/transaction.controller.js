import Transaction from '../models/transaction.js';
import TransactionDetails from '../models/transactionDetail';
import sanitizeHtml from 'sanitize-html';
import cuid from 'cuid';
import mongoose from 'mongoose';

const TRANSACTION_PER_PAGE = 30;

export async function getTransactionByUser(req, res) {
  let userID = sanitizeHtml(req.params.userID);
  let learner = await TransactionDetails.aggregate([
    {$match:{learnerID:userID}},
    {$group:
        {
          _id:"$learnerID",
          totalTransaction:{$sum:1},
          totalAmount:{$sum:"$fees"}
        }
    }
  ]);
  let share = await TransactionDetails.aggregate([
    {$match:
        {
          sharers:userID
        }
    },
    {$group:
        {
          _id:"$sharers",
          totalTransaction:{$sum:1},
          totalAmount:{$sum:"$moneyEarnings"}
        }
    }
  ]);
  let sharing = {
    totalTransaction : share[0] ? share[0].totalTransaction : 0,
    totalAmount: share[0] ? share[0].totalAmount.toFixed(2) : 0.00
  };
  let learning = {
    totalTransaction : learner[0] ? learner[0].totalTransaction : 0,
    totalAmount: learner[0] ? learner[0].totalAmount.toFixed(2) : 0.00
  };
  let transactionResult = {
    userID:userID,
    sharing,
    learning
  };
  return res.json({transactionResult});
  // var query = 'getAmountShareAndLearn("' + userID + '")';
  // mongoose.connection.db.eval(query, function (err, transactionResult) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     //console.log('Transaction: ', transactionResult);
  //     res.json({transactionResult});
  //   }
  // });
}
export function addTransaction(transaction) {
  return new Promise((resolve) => {
    let transactionModel = new Transaction(transaction);
    transactionModel.cuid = cuid();
    transactionModel.save((err, transactionAdded) => {
      if (err) {
        resolve(null);
      }
      resolve(transactionAdded);
    });
  });
}

export function updateTransaction(cuid, transaction) {
  return new Promise((resolve)=>{
    Transaction.update({cuid},
      {$set:{
        endTime: transaction.endTime,
        moneyEarnings: transaction.moneyEarnings,
        tax: transaction.tax,
        fees: transaction.fees,
        sharersFunds: transaction.sharersFunds,
        duration: transaction.duration}},
      function (err, numberAffected) {
        if (err) {
          resolve(false);
        }
        resolve(true);
      });
  });
}

export async function adminGetTransactions(req, res) {
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * TRANSACTION_PER_PAGE;
  let conditions = {};

  if(req.query.type) {
    conditions.type = req.query.type;
  }

  let fields = [
    'dateAdded', 'type', 'duration', 'cuid',
    'moneyEarnings', 'tax', 'fees', 'sharersFunds'
  ].join(' ');

  try{
    let results = await Promise.all([
      Transaction.count(conditions),
      Transaction.find(conditions, fields).sort({dateAdded: -1}).skip(skip).limit(TRANSACTION_PER_PAGE).exec()
    ]);

    let total = results[0];
    let transactionPromise = results[1].map(transaction => Transaction.getMetadata(transaction));
    let rs = await Promise.all(transactionPromise);

    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(total / TRANSACTION_PER_PAGE),
      total_items: total,
      data: rs
    });
  } catch (err) {
    console.log('err on adminGetTransactions:', err);
    return res.status(500).json(err);
  }
}
