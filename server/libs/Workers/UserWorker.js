import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import mem_cache from 'memory-cache';
import User from '../../models/user';

Q.process(globalConstants.jobName.CLEAR_CACHED, 1, (job, done) => {
  mem_cache.clear();
  return done();
});

Q.process(globalConstants.jobName.USER_SYNC_ELASTIC, 1, async (job, done) => {
  try {
    let user = job.data;
    await User.syncToElasticSearch(User, user);
    return done(null);
  } catch (err) {
    console.log('err on job USER_SYNC_ELASTIC:', err);
    return done(err);
  }
});

Q.process(globalConstants.jobName.USER_REMOVE, 1, async (job, done) => {
  try {
    let userId = job.data._id;
    await User.removeFromElasticSearch(userId);
    return done(null);
  } catch (err) {
    console.log('err on job USER_REMOVE:', err);
    return done(err);
  }
});
