import { Q } from '../Queue';
import globalConstants from '../../../config/globalConstants';
import AffiliateHistory from '../../models/affiliateHistory';
import User from '../../models/user';
import configs from '../../config';

const affiliateCommissionChooser = {
  1: configs.affiliateCommission,
  2: configs.affiliateCommission,
  3: configs.webinarCommission,
  4: configs.memberShipsFirstCommission,
  5: configs.memberShipsCommission
};

Q.process(globalConstants.jobName.CREATE_AFF_HISTORY, 1, async (job, done) => {
  try {
    let type = job.data.type;
    let orderObject = job.data.orderObject;
    let affCode = job.data.affCode;
    let userAffiliate = await getUserAffiliate(job.data);
    let affiliater = await AffiliateHistory.find({type,user: userAffiliate}).sort({createdAt:1}).lean();
    let user = await User.findOne({ affiliateCode: affCode }, '_id').lean();
    if (user || (type === 4 && affiliater.length > 0)) {
      let commission = affiliateCommissionChooser[type];
      let aff = {
        type,
        commission,
        code: affCode,
        owner: user ? user._id : null,
        user: userAffiliate,
        orderObject: orderObject._id,
        timestamp: Date.now(),
        value: getValue(job.data, commission)
      };
      if (type === 4 && affiliater.length > 0){
          aff.code = affiliater[0].code;
          aff.owner = affiliater[0].owner;
          aff.commission = affiliateCommissionChooser[5];
          aff.value = getValue(job.data, affiliateCommissionChooser[5]);
      }
      if (aff.owner.toString() !== userAffiliate.toString()) {
        await AffiliateHistory.create(aff);
      }
    }

    return done(null);
  } catch (err) {
    console.log('err on job CREATE_AFF_HISTORY:', err);
    return done(err);
  }
});

async function getUserAffiliate(jobData) {
  try {
    if (jobData.type === 2) {
      let joinedCourse = jobData.orderObject;
      return joinedCourse.user;
    }

    if ([3,4].indexOf(jobData.type)!== -1){
      return jobData.orderObject.user
    }

    let transactionDetail = jobData.orderObject;
    let user = await User.findOne({ cuid: transactionDetail.learnerID }, '_id').lean();
    return user._id;
  } catch (err) {
    throw err;
  }
}

function getValue(jobData, commission) {
  try {
    if (jobData.type === 2) {
      let joinedCourse = jobData.orderObject;
      return joinedCourse.course_price * commission;
    }

    if ([3,4].indexOf(jobData.type)!== -1){
      return jobData.orderObject.total * commission;
    }

    let transactionDetail = jobData.orderObject;
    return transactionDetail.fees * commission;
  } catch (err) {
    throw err;
  }
}

Q.process(globalConstants.jobName.INCREASE_AFF_OWNER_BALANCE, 1, async (job, done) => {
  try {
    let affHistory = job.data;
    let owner = await User.findById(affHistory.owner);
    owner.balance += Number(affHistory.value || 0).valueOf();
    await owner.save();
    //console.log('owner balance:',owner);

    return done();
  } catch (err) {
    return done(err);
  }
});
