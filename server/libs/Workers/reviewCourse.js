import {Q} from "../Queue";
import globalConstants from "../../../config/globalConstants";
import Notification from "../../models/notificationNew";
import Course from '../../models/courses';

Q.process(globalConstants.jobName.NOTIFICATION_TEACHER, 1, async (job, done) => {
  try{
    console.log('NOTIFICATION_TEACHER start.');
    let review = job.data;
    let course = await Course.findById(review.course).lean();
    if(course){
      let lectures = course.lectures;
      let promise = lectures.map(async e => {
        let data = {
          to: e,
          object: review._id,
          from: review.user,
          type: 'notification_teacher',
          data: {
            url: `course/${course.slug}`,
            course: `${course.title}`
          }
        };
        await Notification.create(data);
      });
      await Promise.all(promise);
    }
    return done(null)
  }catch (err) {
    console.log('error NOTIFICATION_TEACHER : ',err);
    return done(err);
  }
});
