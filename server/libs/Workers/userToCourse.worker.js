import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import User from '../../models/user';
import Course from '../../models/courses';
import UserToCourse from "../../models/userToCourse";


Q.process(globalConstants.jobName.AFTER_SAVE_OR_REMOVE_USER_TO_COURSE, 1, async function (job, done) {
  try {
    let data = job.data;
    let courses = await Course.find({status:
        {
          $in: [1, 2, 3]
        }
    });
    courses = courses.map(e => e._id);
    let user = await User.findById(data.user);
    if(user){
      user.total_course = await UserToCourse.count({user: data.user});
      user.total_studying = await UserToCourse.count({user: data.user, course: {$in: courses}});
      await user.save();
    }
    return done(null);
  } catch (err) {
    console.log('error AFTER_SAVE_USER_TO_COURSE : ',err);
    return done(err);
  }
});
