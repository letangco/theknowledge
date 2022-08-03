import Follow from '../models/follow.js';
import * as FollowServices from '../services/follow.services';
import User from '../models/user';
import {getUserInfoByObjectId} from './user.controller.js';
import StringHelper from '../util/StringHelper';
import globalConstants from '../../config/globalConstants';
import {Q} from '../libs/Queue';
import {cacheImage} from '../libs/imageCache';
import Notification from '../models/notificationNew'

export async function add(req, res) {
  try {
    let to = await StringHelper.isObjectId(req.body.to);
    if(!to){
      throw  {
        status:400,
        success:false,
        err: 'Data Not Format!'
      }
    }
    let options = {
      from:req.user._id,
      to:req.body.to
    }
    let data = await FollowServices.addFollow(options);
    return res.json({
      success:true,
      data:data
    })
  }catch (err){
    return res.status(err.status).json(err)
  }
}

/**
 * Unfollow
 * @param req
 * @param res
 */
export async function remove(req, res) {
  let userId = req.user._id;
  let userIdUnfollow = req.body.id;
  let options = {
    from: userId,
    to: userIdUnfollow,
    type:'follow'
  }
  await Notification.remove(options);
  let removeResult = await Follow.remove({from: userId, to: userIdUnfollow}).exec();
  if(!removeResult || !removeResult.result || removeResult.result.ok != 1 || removeResult.result.n < 1) {
    res.status(404).send({success: false, details: removeResult});
  } else {
    res.json({success: true, details: removeResult});
  }
}

/**
 * Map user follow to
 * @param follows
 * @returns {Promise}
 */
async function mapFollowToUser(follows) {
  let users = [];
  follows.map(follow => {
    users.push(getUserInfoByObjectId(follow.to)); //
  });
  return Promise.all(users);
}

/**
 * Map user follow from
 * @param follows
 * @returns {Promise}
 */
async function mapFollowFromUser(follows) {
  let users = [];
  follows.map(follow => {
    users.push(getUserInfoByObjectId(follow.from)); //
  });
  return Promise.all(users);
}

const userFields = {
  _id: 1,
  cuid: 1,
  firstName: 1,
  lastName: 1,
  fullName: 1,
  userName: 1,
  avatar: 1,
  categories: 1,
  country:1,
  priceCall:1,
  priceChat:1,
  rate: 1,
  reviews: 1,
  serviceRating: 1,
  totalRate: 1,
  education: 1,
  online: 1
};

/**
 * Get the people following by you
 * @param req
 * @param res
 */
export async function getFollowing(req, res) {
  let userID = req.user._id; // _id
  let skip = isNaN(req.query.skip) ? 0 : parseInt(req.query.skip);
  let limit = isNaN(req.query.limit) ? 10 : parseInt(req.query.limit);
  try {
    let userFollowing = await Follow.aggregate([
      {$match: {from: userID}},
      // Join collections to get count num follow by user
      {
        $lookup: {
          from: 'users',
          localField: 'to', // Of table follows
          foreignField: '_id', // Of table users
          as: 'users'
        }
      },
      {$addFields: {numUserMatch: {$size: "$users"}}},
      {$match: {numUserMatch: {$gt: 0}}},
      {$skip: skip},
      {$limit: limit},
      {$unwind: '$users'},
      {$replaceRoot: {newRoot: '$users'}},
      {$project: userFields}
    ]);
    let obj = JSON.parse(JSON.stringify(userFollowing));
    let promises = obj.map(async user => {
      if(user && user.avatar){
        let data={
          src: user.avatar,
          size: 150
        }
        let thumb = await cacheImage(data);
        user.avatar = thumb;
      }
      return user;
    });
    obj = await Promise.all(promises);
    res.json({success: true, data: obj}).end();
  } catch (ex) {
    res.status(500).send({success: false, data: ex});
  }
}
/**
 * Get the people following you
 * @param req
 * @param res
 */
export async function getFollower(req, res) {
  let userID = req.user._id; // _id
  let skip = isNaN(req.query.skip) ? 0 : parseInt(req.query.skip);
  let limit = isNaN(req.query.limit) ? 10 : parseInt(req.query.limit);
  try {
    let usersFollower = await Follow.aggregate([
      {$match: {to: userID}},
      // Join collections to get count num follow by user
      {
        $lookup: {
          from: 'users',
          localField: 'from', // Of table follows
          foreignField: '_id', // Of table users
          as: 'users'
        }
      },
      {$addFields: {numUserMatch: {$size: "$users"}}},
      {$match: {numUserMatch: {$gt: 0}}},
      {$skip: skip},
      {$limit: limit},
      {$unwind: '$users'},
      {$replaceRoot: {newRoot: '$users'}},
      {$project: userFields}
    ]);

    let obj = JSON.parse(JSON.stringify(usersFollower));
    let promises = obj.map(async user => {
      if(user && user.avatar){
        let data={
          src: user.avatar,
          size: 150
        }
        let thumb = await cacheImage(data);
        user.avatar = thumb;
      }
      return user;
    });
    obj = await Promise.all(promises);
    res.json({success: true, data: obj}).end();
  } catch (ex) {
    res.status(500).send({success: false, data: ex});
  }
}

export async function isFollowing(req, res) {
  let userID = req.user._id; // _id
  let userIdToCheck = req.query.id; // _id
  try {
    let count = await Follow.count({from: userID, to: userIdToCheck}).exec();
    res.json({success: true, isFollowing: count > 0}).end();
  } catch(ex) {
    res.status(500).send({success: false, isFollowing: false, data: ex});
  }
}

/**
 * Use to get all users, that user have userId is following
 * @param userId
 * @returns {Promise}
 */
export async function getFollowingByUserId(userId) {
  return await mapFollowToUser(await Follow.find({from: userId}, 'to').exec());
}

/**
 * Use to get all users, that is following the user have userId
 * @param userId
 * @returns {Promise}
 */
export async function getFollowerByUserId(userId) {
  return await mapFollowFromUser(await Follow.find({to: userId}, 'from'));
}
