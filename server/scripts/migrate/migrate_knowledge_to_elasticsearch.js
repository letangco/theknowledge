import Category from '../../models/category';
import Knowledge from '../../models/knowledge';
import ArrayHelper from '../../util/ArrayHelper';
import Elasticsearch from '../../libs/Elasticsearch';

module.exports = async function () {
  let resources = await Promise.all([
    Category.find({parent: ''}, 'slug cuid').lean(),
    Category.find({parent: {$ne: ''}}, 'cuid title parent').lean(),
    Knowledge.find({state: 'published'}).lean()
  ]);
  let industries = resources[0], departments = resources[1], knowledge = resources[2];
  let types = {general: []}, categoryMapper = {};
  industries.map(industry => {
    types[industry.slug] = [];
    categoryMapper[industry._id] = industry.slug;
  });

  departments.forEach(department => {
    let cateIndex = ArrayHelper.findItemByProp(industries, 'cuid', department.parent);
    categoryMapper[department._id] = industries[cateIndex].slug;
  });

  knowledge.forEach(post => {
    let doc = Knowledge.toESDoc(Knowledge, post);
    if(post.departmentId === 'ge') {
      types.general.push(doc);
    } else {
      // console.log('bbbb');
      // console.log('post.departmentId:', post.departmentId);
      // console.log('co khong vay???', categoryMapper['5828ae7cfbddb053adaf1744']);
      // console.log('map:', categoryMapper[post.departmentId]);
      types[categoryMapper[post.departmentId]].push(doc);
    }
  });

  let promises = [];
  for(let key in types) {
    console.log('industry:', key);
    console.log('item count:', types[key].length);
    if(types[key].length) {
      console.log('Elasticsearch index for knowledge');
      promises.push(Elasticsearch.multiIndex('knowledge', types[key], key));
    }
  }

  await Promise.all(promises);
  console.log('migrate knowledge done.');
  return true;
};
