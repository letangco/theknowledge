import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import JoinCourse from '../../models/joinCourse';
import LiveStream from '../../models/liveStream';

Q.process(globalConstants.jobName.AFTER_APPROVE_REFUND, 1, async (job, done) => {
  try {
    let refund = job.data;

    // remove user from course's joined list
    if(refund.type === 'course') {
      let joinedCourse = await JoinCourse.findOne({user: refund.user, course: refund.object});
      if(joinedCourse) {
        await joinedCourse.remove();
      }

      let lessons = await LiveStream.find({course: refund.object});
      let promises = lessons.map(lesson => {
        let joinIndex = lesson.privacy.invited.indexOf(refund.user.toString());
        lesson.privacy.invited.splice(joinIndex, 1);
        lesson.markModified('privacy');
        return lesson.save();
      });

      await Promise.all(promises);
    }

    return done(null);
  } catch (err) {
    console.log('err on job AFTER_APPROVE_REFUND:', err);
    return done(err);
  }
});
