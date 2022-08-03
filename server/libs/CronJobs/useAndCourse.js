import User from '../../models/user';
import Course from '../../models/courses';
import UserToCourse from "../../models/userToCourse";
const timeCheck = '0 */5 * * * *'; // every 2 minutes


export async function migrateReportCourseOfUser() {
  try {
    let courses = await Course.find({status:
        {
          $in: [1, 2, 3]
        }
    });
    courses = courses.map(e => e._id);
    let users = await User.find({active: 1});
    let promise = users.map(async e => {
      e.total_course = await UserToCourse.count({user: e._id});
      e.total_studying = await UserToCourse.count({user: e._id, course: {$in: courses}});
      await e.save();
    });
    await Promise.all(promise);
  } catch (err) {
    console.log('error migrateReportCourseOfUser : ',err);
  }
}

export default {
  cronTime: timeCheck,
  onTick: async () => {
    await migrateReportCourseOfUser()
  },
  start: true
}
