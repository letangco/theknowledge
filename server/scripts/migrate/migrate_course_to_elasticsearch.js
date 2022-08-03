import Course from '../../models/courses';
import Elasticsearch from '../../libs/Elasticsearch';
import * as Course_Service from '../../services/course.services';

module.exports = async function () {
  let courses = await Course.find({}).lean();
  if(!courses || !courses.length) {
    return console.log('no course to sync');
  }
  let promise = courses.map(async e => {
    return await Course_Service.buildElasticDoc(e)
  });
  let courseDoc = await Promise.all(promise);
  await Elasticsearch.multiIndex('courses', courseDoc);
  console.log('sync courses to elasticsearch done.');
  return true;
};
