import Rating from '../models/rating';
import Criteria from '../models/criteria';
import DetailRating from '../models/detailRating';
import DetailCriteria from '../models/detailCriteria';
import TransactionDetail from '../models/transactionDetail';
import Transaction from '../models/transaction';
import User from '../models/user';
import cuid from 'cuid';
import sanitizeHtml from 'sanitize-html';
import {Q} from '../libs/Queue';
import RatingWorker from '../libs/Workers/RatingWorker';
import mongoose from 'mongoose';
import globalConstants from '../../config/globalConstants';

const RATING_PER_PAGE = 10;

export function postRating(req, res) {
  let ratingModel = new Rating(req.body.rating);
  ratingModel.cuid = cuid();
  ratingModel.save((err, saved) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json({rating:saved });
  });
}

function isValidRating(req) {
  if((!req.body.comment || req.body.comment == 'null' || req.body.comment == 'undefined')
    && (!req.body.skills || !req.body.skills instanceof Array || !req.body.skills.length)
    && (!req.body.criterias || !req.body.criterias instanceof Array || !req.body.criterias.length))
    {
      return false;
    }
  return true;
}

export function getCriterias(req, res) {
  Criteria.find({}, '_id name key').exec((err, criterias) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json({criterias});
  });
}

export async function postRatingV2(req, res) {
  if(!isValidRating(req)) {
    return res.json({success: true});
  }
  try {
    let transId = sanitizeHtml(req.body.transactionID) || '';
    if(!transId|| transId == 'null' || transId == 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Transaction.'
      });
    }

    let transaction = await Transaction.findOne({cuid: transId}, 'isRated sharers');
    if(!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found.'
      });
    }

    if(transaction.isRated) {
      return res.status(403).json({
        success: false,
        error: 'This transaction has been rated before.'
      });
    }

    let results = await Promise.all([
      User.findOne({cuid: transaction.sharers}, '_id').exec(),
      TransactionDetail.findOne({
        transactionID: transId
      }, 'learnerID').exec()
    ]);
    let expertId = results[0]._id;
    let transactionDetail = results[1];

    if(req.user.cuid !== transactionDetail.learnerID) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied.'
      });
    }

    let waitJobs = 0, doneJobs = 0;
    if(req.body.skills.length > 0) {
      waitJobs++;
    }
    if(req.body.criterias.length > 0) {
      waitJobs++;
    }
//    console.log('waitJobs:', waitJobs);
    /*
     * sum skill rating, if > 0, create detail rate and add job
     * for worker sync skill rating to user.
     */
    let sum_skill_rate = 0, skill_divable = 0;
    let detailRates = req.body.skills.map(skill => {
      let detailRate = {
//        rateId: rating._id,
        skillId: skill._id,
        rate: 0
      };
      if(skill.rate && skill.rate > 0) {
        detailRate.rate = skill.rate;
        skill_divable++;
      }
      sum_skill_rate += detailRate.rate;
      return detailRate;
    });
    let avgSkillRate = skill_divable ? sum_skill_rate / skill_divable : 0;
    /*
     * sum service rating, if > 0, create detail criterias and add job
     * for worker sync sercice rating to user.
     */
    let sum_service_rate = 0, service_divable = 0;
    let criterias = req.body.criterias.map(criteria => {
      let detailCriteria = {
//        rateId: rating._id,
        criteriaId: criteria._id,
        rate: 0
      };
      if(criteria.rate && criteria.rate > 0) {
        detailCriteria.rate = criteria.rate;
        service_divable++;
      }
      sum_service_rate += detailCriteria.rate;
      return detailCriteria;
    });
    let avgServiceRate = service_divable ? sum_service_rate / service_divable : 0;

    let divable = 0;
    if(avgSkillRate) divable++;
    if(avgServiceRate) divable++;

    let rating = await new Rating({
      from: req.user._id,
      expertId: expertId,
      comment: sanitizeHtml(req.body.comment),
      avg: divable ? (avgSkillRate + avgServiceRate) / divable : 0
    }).save();

    if(sum_skill_rate) {
      detailRates = detailRates.map(detailRate => {
        detailRate.rateId = rating._id;
        return detailRate;
      });
      let details = await DetailRating.create(detailRates);
      let options = {
        rating: rating,
        details: details
      };
//      Q.create(globalConstants.jobName.CALC_RATING_AVG, options).save();
      let skillRate = Q.create(globalConstants.jobName.SYNC_USER_RATING, options).removeOnComplete(true).save();
      skillRate.on('complete', () => {
        doneJobs++;
//        console.log('doneJobs:', doneJobs);
        if(doneJobs === waitJobs) {
          User.upadteGeneralRating(User, expertId);
        }
      })
    }


    if(sum_service_rate) {
      criterias = criterias.map(criteria => {
        criteria.rateId = rating._id;
        return criteria;
      });
      let detailCriterias = await DetailCriteria.create(criterias);
      let options = {
        rating: rating,
        detailCriterias: detailCriterias
      };
      let serviceRate = Q.create(globalConstants.jobName.SYNC_USER_SERVICE_RATING, options).removeOnComplete(true).save();
      serviceRate.on('complete', () => {
        doneJobs++;
//        console.log('doneJobs:', doneJobs);
        if(doneJobs === waitJobs) {
          User.upadteGeneralRating(User, expertId);
        }
      })
    }

    return res.json({success: true});
  } catch (err) {
    console.log('err on postRatingV2:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal error.'
    });
  }
}

export async function test(req, res) {
  let conditions = {
    rateId: {$in: [mongoose.Types.ObjectId('58e3bcb45bb2065955501c1c'), mongoose.Types.ObjectId('58e3c28b5bb2065955501c50'), mongoose.Types.ObjectId('58e3d23ab4899d6d488c62d2')]},
    skillId: mongoose.Types.ObjectId('5840fa4937513ba90b70f49e'),
    rate: {$gt: 0}
  };
  let groupBy = {
    _id: "$skillId",
    avgRate: {$avg: '$rate'}
  };
  let aggregated = await DetailRating.aggregate([
    { $match: conditions },
    { $group: groupBy }
  ]).exec();
  console.log('aggregated:', aggregated);
  return res.json(aggregated);
}

export async function getUserComment(req, res) {
  let page = ~~req.query.page || 1;
  let skip = (page - 1) * RATING_PER_PAGE;
  let conditions = {expertId: req.params.userId};
  try {
    let results = await Promise.all([
      Rating.count(conditions).exec(),
      Rating.find(conditions).sort({createdDate: -1}).skip(skip).limit(RATING_PER_PAGE).exec()
    ]);
    let total = results[0];
    let promises = results[1].map(rating => Rating.getMetadata(rating));

    let ratings = await Promise.all(promises);

    return res.json({
      success: true,
      current_page: page,
      last_page: Math.ceil(total / RATING_PER_PAGE),
      total_items: total,
      data: ratings
    });
  } catch (err) {
    console.log('err on getUserComment:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal error'
    });
  }
}
