import UserToCourse from '../../models/userToCourse';
import SupportCourse from '../../models/supportCourse';

export async function migrateNote() {
  try {
    let userToCoures = await UserToCourse.find({}).lean();
    let promise = userToCoures.map(async e => {
      if(e.note && e.note.length){
        let promise_note = e.note.map(async note => {
          let options = {
            content: note.content,
            date: note.date,
            creator: e.evaluater || '58cba2adaf26811724e55669',
            user: e.user,
            course: e.course
          }
          let check = await SupportCourse.findOne(options);
          if(!check){
            await SupportCourse.create()
          }
        });
        await Promise.all(promise_note);
      }
    });
    await Promise.all(promise);
    console.log('Migrate Done.')
  } catch (err) {
    console.log('error migrateNote : ',err)
  }
}
