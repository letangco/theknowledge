import User from '../../models/user';
import DailyTracking from '../../models/dailyTracking';
import configs from '../../config';
import globalConstants from '../../../config/globalConstants';

async function trackingActiveUsers(trackingTime, expert) {
  let conditions = {active: 1};
  let key = globalConstants.trackingKeys.TOTAL_USERS;
  if(expert) {
    conditions.expert = 1;
    key = globalConstants.trackingKeys.TOTAL_EXPERTS;
  }
  let count = await User.count(conditions);
  let created = await DailyTracking.create({
    key: key,
    val: count,
    createdDate: trackingTime
  });
  //console.log('tracking done:', created);
}


export default {
  cronTime: configs.dailyTrackingTime,
  onTick: async () => {
    let now = new Date();
    // let trackingTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0);
    let trackingTime = now;
    
    await Promise.all([
      trackingActiveUsers(trackingTime),
      trackingActiveUsers(trackingTime, true),
    ]);
  },
  start: true
};
