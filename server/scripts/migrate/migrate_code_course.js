import Course from '../../models/courses';

export async function generalCodeCourse() {
  try {
    let courses = await Course.find({}).sort({created_at: 1}).lean();
    let promise = courses.map(async (e, index) => {
      await Course.update({
        _id: e._id
      }, {
        $set: {
          code: index
        }
      })
    });
    await Promise.all(promise);
    console.log('Generate code course done.')
  } catch (err) {
    console.log('error generalCodeCourse : ', err)
  }
}
