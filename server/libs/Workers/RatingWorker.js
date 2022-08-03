import {Q} from '../Queue';
import User from '../../models/user';
import Rating from '../../models/rating';
import DetailRating from '../../models/detailRating';
import DetailCriteria from '../../models/detailCriteria';
import Criteria from '../../models/criteria';
import Skill from '../../models/skill';
import Category from '../../models/category';
import ArrayHelper from '../../util/ArrayHelper';
import globalConstants from '../../../config/globalConstants';
import execa from 'execa';
import configs from '../../config';

//Q.process(globalConstants.jobName.CALC_RATING_AVG, 10, (job, done) => {
//  let rating = job.data.rating;
//  let details = job.data.details;
//
//  let filteredDetails = details.filter(detail => {
//    return detail.rate > 0;
//  });
//
//  let totalScore = 0;
//  filteredDetails.forEach(detail => {
//    totalScore += detail.rate;
//  });
//  let avg = totalScore / filteredDetails.length;
//
//  Rating.update({_id: rating._id}, {$set: {avg: avg}}).exec()
//    .then(() => done(null))
//    .catch(err => done(err));
//});

Q.process(globalConstants.jobName.SYNC_USER_REVIEWS, 1, async (job, done) => {
  try {
    let user = await User.findOne({cuid: job.data.cuid});
    let ratings = await Rating.find({expertId: user._id});
    let userRates = ratings.map(rate => rate._id);
    let reviewPromises = user.categories.map(async (cate) => {
      let skillIds = [];
      let total_skillRate = 0;
      let divable = 0;
      let details = await Skill.find({categoryID: cate.department.departmentID, _id: {$in: user.skills}});
      let detailPromises = details.map(async (skill) => {
        let avgSkill = await  DetailRating.aggregate([
          {
            $match: {
              rateId: {$in: userRates},
              skillId: skill._id,
              rate: {$gt: 0}
            }
          },
          {
            $group: {
              _id: "$skillId",
              avgRate: {$avg: "$rate"}
            }
          }
        ]);
        //	print(avgSkill);
        skillIds.push(skill._id);
        let detail = {
          skillId: skill._id,
          avgRate: avgSkill.length ? avgSkill[0].avgRate : 0,
          skillName: skill.description[0].name
        };
        total_skillRate += detail.avgRate;
        divable += detail.avgRate > 0 ? 1 : 0;
        return detail;
      });
      details = await Promise.all(detailPromises);
      details = details.sort(function(a, b) {
        return b.avgRate - a.avgRate;
      });
      let review = {
        cateCuid: cate.department.departmentID,
        cateName: cate.department.title,
        details: details
      };
      let reviewIndex = ArrayHelper.findItemByProp(user.reviews, 'cateCuid', review.cateCuid);
      if(reviewIndex !== false) {
        review.numRate = user.reviews[reviewIndex].numRate;
        review.avgRate = user.reviews[reviewIndex].avgRate;
      } else {
        review.numRate = 0;
        review.avgRate = 0;
      }
      let agg = await DetailRating.aggregate([
        {
          $match: {
            rateId: {$in: userRates},
            skillId: {$in: skillIds}
          }
        },
        {
          $group: {
            _id: "$rateId",
            count: {$sum: 1}
          }
        }
      ]);
      review.numRate = agg.length;
      review.avgRate = divable > 0 ? total_skillRate / divable : 0;
      return review;
    });
    user.reviews = await Promise.all(reviewPromises);
    await user.save();
    return done(null);

    // let cuid = job.data.cuid;
    // let shell = `cd ~/ && mongo --eval "var cuid = '${cuid}'" --port ${configs.dbPort} ${configs.uploadFolder}server/scripts/tesse_scripts/improve_users_reviews.js`;
    // console.log('shell:', shell);
    // await execa.command(shell);
    // return done(null);
  } catch (err) {
    return done(err);
  }
});

Q.process(globalConstants.jobName.SYNC_USER_RATING, 1, async (job, done) => {
  try {
    let rating = job.data.rating;
    let details = job.data.details;
    let user = await User.findById(rating.expertId).exec();
    let skillIds = details.map(detail => {return detail.skillId});
    let skills = await Skill.find({_id: {$in: skillIds}}, 'categoryID description');

    let cateCuids = [];
    skills.forEach(skill => {
      if(cateCuids.indexOf(skill.categoryID) < 0) {
        cateCuids.push(skill.categoryID);
      }
    });

    let catePromises = cateCuids.map(async cateCuid => {
      let reviewIndex = ArrayHelper.findItemByProp(user.reviews, 'cateCuid', cateCuid);

      if(reviewIndex !== false) {
        user.reviews[reviewIndex].numRate++;
        return null;
      } else {
        let category = await Category.findOne({cuid: cateCuid}, 'title');
        let details = skills.filter(skill => {return skill.categoryID == cateCuid});
        details = details.map(skill => {
          return {
            skillId: skill._id,
            avgRate: 0,
            skillName: skill.description[0].name
          };
        });
        user.reviews.push({
          cateCuid: cateCuid,
          cateName: category.title,
          details: details,
          numRate: 1,
          avgRate: 0
        });

        return null;
      }
    });
    await Promise.all(catePromises);

    let userRates = await Rating.find({expertId: user._id}, '_id').exec();
    let rateIds = userRates.map(userRate => {return userRate._id});
//    console.log('before:', JSON.stringify(user.reviews));
    let reviewPromises = user.reviews.map(async review => {
      let skills = await Skill.find({
        _id: {$in: user.skills},
        categoryID: review.cateCuid
      }).exec();
      let totalSkillAvg = 0;
      let skillPromises = skills.map(async skill => {
        let conditions = {
          rateId: {$in: rateIds},
          skillId: skill._id,
          rate: {$gt: 0}
        };
  //      console.log('conditions:', conditions);
        let groupBy = {
          _id: "$skillId",
          avgRate: {$avg: '$rate'}
        };
        let aggregated = await DetailRating.aggregate([
          { $match: conditions },
          { $group: groupBy }
        ]).exec();

        if(aggregated.length) {
          totalSkillAvg += aggregated[0].avgRate;
          return {
            skillId: skill._id,
            skillName: skill.description[0].name,
            avgRate: aggregated[0].avgRate
          };
        }
        return {
          skillId: skill._id,
          skillName: skill.description[0].name,
          avgRate: 0
        };
      });
      let details = await Promise.all(skillPromises);
      details = ArrayHelper.sortByProp(details, 'avgRate', 'desc');
      let divableLength = 0;
      details.forEach(detail => {
        if(detail.avgRate > 0) {
          divableLength++;
        }
      });
      return {
        cateCuid: review.cateCuid,
        cateName: review.cateName,
        avgRate: totalSkillAvg / divableLength,
        numRate: review.numRate,
        details: details
      };
    });
//    let rateDivable = 0, sum_rate = 0;
//    user.reviews.forEach(review => {
//      if(review.avgRate > 0) {
//        rateDivable++;
//        sum_rate += review.avgRate;
//      }
//    });
//    user.rate = sum_rate / rateDivable;
    user.reviews = await Promise.all(reviewPromises);
//    console.log('after:', JSON.stringify(user.reviews));
//    user.markModified('reviews');
    await User.update({_id: user._id}, {$set: {reviews: user.reviews}});
    return done(null);
  } catch(err) {
    return done(err);
  }
});

Q.process(globalConstants.jobName.SYNC_USER_SERVICE_RATING, 1, async (job, done) => {
  try {
    let rating = job.data.rating;
    let detailCriterias = job.data.detailCriterias;
    let promiseResults = await Promise.all([
      User.findById(rating.expertId).exec(),
      Criteria.find().exec()
    ]);
    let user = promiseResults[0];
    let criterias = promiseResults[1];
    let criteriaMapper = {};
    criterias.forEach(criteria => {
      switch(criteria.key) {
        case 'pro':
          criteriaMapper[criteria._id] = 'professional';
          break;
        case 'npr':
          criteriaMapper[criteria._id] = 'notProlong';
          break;
        case 'exc':
          criteriaMapper[criteria._id] = 'expertCommunication';
          break;
        case 'sad':
          criteriaMapper[criteria._id] = 'serviceAsDescribed';
          break;
      }
    });

    let userRates = await Rating.find({expertId: user._id}, '_id').exec();
    let rateIds = userRates.map(userRate => {return userRate._id});

    let totalRateAgg = await DetailCriteria.aggregate([
      { $match: {rateId: {$in: rateIds}} },
      { $group: { _id: "$rateId", count: { $sum: 1 } } }
    ]).exec();
    user.serviceTotalRate = totalRateAgg.length;

    let serviceRatingAgg = await DetailCriteria.aggregate([
      { $match: {rateId: {$in: rateIds}} },
      { $group: { _id: "$criteriaId", avgRate: {$avg: "$rate"} } }
    ]);
    serviceRatingAgg.forEach(serviceRating => {
      user.serviceRating[criteriaMapper[serviceRating._id]] = serviceRating.avgRate;
    });
    await User.update({_id: user._id}, {
      $set: {
        serviceTotalRate: user.serviceTotalRate,
        serviceRating: user.serviceRating
      }
    });
    return done(null);
  } catch (err) {
    console.log('err:', err);
    return done(err);
  }
});
