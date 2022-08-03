import Category from '../../models/category';
import Question from '../../models/questions';
import ArrayHelper from '../../util/ArrayHelper';
import Elasticsearch from '../../libs/Elasticsearch';

module.exports = async function () {
  let resources = await Promise.all([
    Category.find({parent: ''}, 'slug cuid').lean(),
    Category.find({parent: {$ne: ''}}, 'cuid title parent').lean(),
    Question.find().lean()
  ]);
  let industries = resources[0], departments = resources[1], questions = resources[2];
  let types = {general: []}, categoryMapper = {};
  industries.map(industry => {
    types[industry.slug] = [];
    categoryMapper[industry._id] = industry.slug;
  });

  departments.forEach(department => {
    let cateIndex = ArrayHelper.findItemByProp(industries, 'cuid', department.parent);
    categoryMapper[department._id] = industries[cateIndex].slug;
  });

  questions.forEach(question => {
    let doc = Question.toESDoc(question);
    if(question.department === 'ge') {
      types.general.push(doc);
    } else {
      // console.log('bbbb');
      // console.log('post.departmentId:', post.departmentId);
      // console.log('co khong vay???', categoryMapper['5828ae7cfbddb053adaf1744']);
      // console.log('map:', categoryMapper[post.departmentId]);
      types[categoryMapper[question.department]].push(doc);
    }
  });

  let promises = [];
  for(let key in types) {
    if(types[key].length) {
      console.log('Elasticsearch index for questions');
      promises.push(Elasticsearch.multiIndex('tesse_questions', types[key], key));
    }
  }

  await Promise.all(promises);
  console.log('migrate question done.');
  return true;
};
