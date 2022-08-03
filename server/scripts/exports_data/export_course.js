import json2csv from 'json2csv';
import fs from 'fs'
import execa from 'execa';
import path from 'path'
import * as CourseServices from '../../services/course.services';

const field = ['fullName', 'email', 'phoneNumber', 'ticket', 'dateCreated'];

export async function exportCourseStudent(courseId) {
  try {
    let data = [], joinedCode = [], dataUser;
    let title = 'student' + '_' + Date.now() + '.csv';
    dataUser = await CourseServices.getAuthorCourseStudents(courseId);
    if(dataUser.joined){
      data = dataUser.joined.map(e => {
        const date = new Date(e.created_at).toLocaleString();
        return {
          fullName: e.user.fullName,
          email: e.user.email,
          phoneNumber: e.user.telephone,
          joinedBy: 'Buy',
          dateCreated: date,
        }
      });
    }
    if(dataUser.joinedCode){
      joinedCode = dataUser.joinedCode.map(e => {
        const date = new Date(e.createdDate).toLocaleString();
        return {
          fullName: e.user.fullName,
          email: e.user.email,
          phoneNumber: e.user.telephone,
          joinedBy: 'Code: ' + e.code,
          dateCreated: date,
        }
      });
    }
    data = data.concat(joinedCode);
    let dir = path.join(__dirname, '..', '..', '..', 'exports', title);
    if (data.length > 0) {
      // let shell_script = 'cd ' + path.join(__dirname, '..', '..', '..', 'exports') + ' && rm -f *.csv';
      // await execa.command(shell_script);
      data = json2csv.parse(data, { field });
      await fs.writeFileSync(dir, data);
    } else {
      await fs.writeFileSync(dir, '');
    }
    return title;
  } catch (err) {
    console.log('err exportCourseStudent : ', err);
    return Promise.reject({ status: 500, success: false, error: "Error!!" });
  }
}
