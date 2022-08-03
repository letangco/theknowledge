import Course from '../../models/courses';
import CourseUsedPassword from '../../models/courseUsedPassword';
import JoinCourse from '../../models/joinCourse';
import CourseCode from '../../models/courseCode';
import userToCourse from "../../models/userToCourse";

export async function useToCourse() {
  try{
    let courses = await Course.find({}).lean();
    let promise = courses.map(async e => {
      let users = await userToCourse.find({course: e._id}).lean();
      let nin = users.map(e => e.user);
      let total = [];
      let userUsePw = await CourseUsedPassword.find({
        userId: {
          $nin: nin
        },
        courseId: e._id
      }).lean();
      userUsePw = userUsePw.map(e => e.userId);
      total = total.concat(userUsePw);
      nin = nin.concat(userUsePw);
      let userUseCode = await CourseCode.find({
        userUsedId: {
          $nin: nin,
          $exists: true
        },
        courseId: e._id,
      }).lean();
      userUseCode = userUseCode.map(e => e.userUsedId);
      total = total.concat(userUseCode);
      nin = nin.concat(userUseCode);
      let joins = await JoinCourse.find({
        user: {
          $nin: nin
        },
        course: e._id
      });
      joins = joins.map(e => e.user);
      total = total.concat(joins);
      let promise_user = total.map(async user => {
        let check = await userToCourse.findOne({
          user: user,
          course: e._id
        });
        if(!check){
          await userToCourse.create({
            user: user,
            course: e._id
          });
        }
      });
      await Promise.all(promise_user);
    });
    await Promise.all(promise);
    console.log('Migrate User To Course Done.')
  }catch (err) {
    console.log('error Migrate use to course : ',err);
  }
}
