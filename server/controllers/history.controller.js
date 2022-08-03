import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';
import TransactionDetail from '../models/transactionDetail';
import History from '../models/history';
import {cacheImage} from '../libs/imageCache';

const HISTORY_LIMIT = 20;

const projectFields = {
    _id: 1,
    cuid: 1,
    priceChat: 1,
    priceCall: 1,
    education: 1,
    reviews: 1,
    categories: 1,
    serviceRating: 1,
    rate: 1,
    totalRate: 1,
    online: 1,
    country:1,
    avatar: 1,
    fullName: 1,
    lastName: 1,
    firstName: 1,
    userName: 1,
    amount: 1
};
/**
 * Get user that you had learn from
 * @param req
 * @param res
 */
export async function getLearning(req, res) {
    let userId = req.user._id; // _id
    let userCuid = req.user.cuid; // cuid
    let skip = isNaN(req.query.skip) ? 0 : parseInt(req.query.skip);
    let limit = isNaN(req.query.limit) ? 0 : parseInt(req.query.limit);
    let interFields = projectFields;
    interFields.follows = {
        $filter: {
            input: "$follows",
            as: "follow",
            cond: {$eq: [ "$$follow.from", userId]}
        }
    };
    try {
        let users = await TransactionDetail
            .aggregate([
                {$match: {learnerID: userCuid}}, // Get transaction that you had learn
                {$group: {_id: '$sharers', amount: {$sum: '$fees'}}},
                {$skip: skip},
                {$limit: limit},
                // Join collections to get count num follow by user
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id', // User you learn from
                        foreignField: 'cuid', // Of table users
                        as: 'user'
                    }
                },
                {$unwind: '$user'},
                {$addFields: {'user.amount': '$amount'}},
                {$replaceRoot: {newRoot: '$user'}},
                // Join collections to get count num follow by user
                {
                    $lookup: {
                        from: 'follows',
                        localField: '_id',
                        foreignField: 'to', // Of table follows
                        as: 'follows'
                    }
                },
                {$project: interFields},
                {$addFields: {'following': {$size: '$follows'}}},
                {$project: {follows: 0}} // Unset field follows
            ]);
        let obj = JSON.parse(JSON.stringify(users));
        let promise = obj.map(async user => {
          if(user && user.avatar){
            let data={
              src: user.avatar,
              size: 100
            }
            let thumb = await cacheImage(data);
            user.avatar = thumb;
          }
          return user;
        });
        obj = await Promise.all(promise);
        res.json({success: true, data: obj}).end();
    } catch (ex) {
        res.status(500).send({success: false, data: ex});
    }
}

/**
 * Get users that you share your knowledge to
 * @param req
 * @param res
 */
export async function getSharing(req, res) {
    let userId = req.user._id; // _id
    let userCuid = req.user.cuid; // cuid
    let skip = isNaN(req.query.skip) ? 0 : parseInt(req.query.skip);
    let limit = isNaN(req.query.limit) ? 0 : parseInt(req.query.limit);
    let interFields = projectFields;
    interFields.follows = {
        $filter: {
            input: "$follows",
            as: "follow",
            cond: {$eq: [ "$$follow.from", userId]}
        }
    };
    try {
        let users = await TransactionDetail
            .aggregate([
                {$match: {sharers: userCuid}}, // Get transaction that you had teach
                {$group: {_id: '$learnerID', amount: {$sum: '$fees'}}},
                {$skip: skip},
                {$limit: limit},
                // Join collections to get count num follow by user
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id', // User you teach to
                        foreignField: 'cuid', // Of table users
                        as: 'user'
                    }
                },
                {$unwind: '$user'},
                {$addFields: {'user.amount': '$amount'}},
                {$replaceRoot: {newRoot: '$user'}},
                // Join collections to get count num follow by user
                {
                    $lookup: {
                        from: 'follows',
                        localField: '_id',
                        foreignField: 'to', // Of table follows
                        as: 'follows'
                    }
                },
                {$project: interFields},
                {$addFields: {'following': {$size: '$follows'}}},
                {$project: {follows: 0}} // Unset field follows
            ]);
      let obj = JSON.parse(JSON.stringify(users));
      let promise = obj.map(async user => {
        if(user && user.avatar){
          let data={
            src: user.avatar,
            size: 100
          }
          let thumb = await cacheImage(data);
          user.avatar = thumb;
        }
        return user;
      });
      obj = await Promise.all(promise);
        res.json({success: true, data: obj}).end();
    } catch (ex) {
        res.status(500).send({success: false, data: ex});
    }
}

// export function getHistory(req, res){
//     var userID = sanitizeHtml(req.params.userID);
//     var collection = sanitizeHtml(req.params.collection);
//     var skip = sanitizeHtml(req.params.skip);
//     var limit = sanitizeHtml(req.params.limit);
//     var query = 'getHistory("' + userID + '", "' + collection + '", ' + skip + ', ' + limit + ')';
//     mongoose.connection.db.eval(query, function(err, result) {
//         if (err) {
//         } else {
//             res.json({result});
//         }
//     });
// }

// export function getFullHistory(req, res){
//     var userCuid = sanitizeHtml(req.params.userCuid);
//     var userId = sanitizeHtml(req.params.userId);
//     var skip = sanitizeHtml(req.params.skip);
//     var limit = sanitizeHtml(req.params.limit);
//     var query = `getFullHistory("${userCuid}", "${userId}", ${skip}, ${limit})`;
//     // console.log('query', query);
//     mongoose.connection.db.eval(query, function(err, result) {
//         if (err) {
//             res.json({err});
//         } else {
//             //console.log('getFullHistory: ', result);
//             res.json({result});
//         }
//     });
// }

export async function getAllHistory(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let skip = (page - 1) * HISTORY_LIMIT;

    let conditions = {owner: req.user._id};
    if(req.query.action) conditions.action = req.query.action.toLowerCase();
    if(req.query.change) conditions.change = Number(req.query.change).valueOf() || {$ne: null};
    if(req.query.account) conditions.account = req.query.account.toLowerCase();

    let resources = await Promise.all([
      History.count(conditions),
      History.find(conditions).sort({createdDate: -1}).skip(skip).limit(HISTORY_LIMIT).lean()
    ]);

    let data = await History.getMetadata(resources[1]);
    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(resources[0] / HISTORY_LIMIT),
      total_items: resources[0],
      data
    });
  } catch (err) {
    console.log('err on getAllHistory:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}
