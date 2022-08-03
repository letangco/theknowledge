import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import {sendMail} from '../EmailDispatcher';

Q.process(globalConstants.jobName.SEND_MAIL, 1, async (job, done) => {
  try {
    await sendMail(job.data);
    return done(null);
  } catch (err) {
    console.log('err on job SEND_MAIL:', err);
    return done(err);
  }
});
