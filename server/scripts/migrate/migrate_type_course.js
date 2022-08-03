import Course from '../../models/courses';
import LiveStream from '../../models/liveStream';

export async function migrateTypeCourse() {
  try{
    let courses = await Course.find({});
    let promise = courses.map(async e => {
      let lessons = await LiveStream.find({course: e._id}).sort({"time.dateLiveStream": -1}).lean();
      let type = 'video';
      if(lessons.length) {
        for(let i = 0; i< lessons.length; i++){
          if(lessons[i].type !== 'video'){
            type = 'live_stream';
            break;
          }
        }
        await Course.update({
          _id: e._id
        },{
          $set:{
            type
          }
        });
      } else {
        let date = new Date(e.created_at).getTime();
        if(date < Date.now()){
          await Course.update({
            _id: e._id
          },{
            $set:{
              status: 6,
            },
            $unset: {
              type: ''
            }
          });
        } else {
          await Course.update({
            _id: e._id
          },{
            $set:{
              status: 5
            },
            $unset: {
            type: ''
            }
          });
        }
      }
    });
    await Promise.all(promise);
    console.log('Migrate type course done.')
  }catch (err) {
    console.log('error migrateTypeCourse : ', err);
  }
}
