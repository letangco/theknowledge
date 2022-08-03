import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import Elasticsearch from '../Elasticsearch';
import Category from '../../models/category';
import mem_cache from 'memory-cache';
import ArrayHelper from '../../util/ArrayHelper';

const FIVE_MINS_IN_MS = 300000;

Q.process(globalConstants.jobName.SKILL_SYNC_ELASTIC, 1, async (job, done) => {
  try {
    let skill = job.data;
    if(skill.description && skill.description.length){
      let name = '';
      skill.description.map(e => {
        name += ` ${e.name}`
      });
      let data = {
        id: skill._id.toString(),
        name
      };
      await Elasticsearch.update('skills', data, null, true);
    }
//     let object = {};
//     if(typeof(skill.description) === 'string'){
//       object = {
//         id: skill._id,
//         name: skill.description
//       };
//     } else if(typeof(skill.description) === 'object') {
//       if(skill.description.length > 0 && skill.description[0] && skill.description[0].name)
//       object = {
//         id: skill._id,
//         name: skill.description[0].name
//       };
//     } else {
//       object = {
//         id: skill._id,
//         name: ''
//       };
//     }
//     let cate;
//     let cateModel = await Category.findOne({cuid: skill.categoryID}).lean();
//     if(cateModel){
//       let langIndex = ArrayHelper.findItemByProp(cateModel.description, 'languageID', 'en');
//       cate = {
//         cateId: cateModel._id.toString(),
//         cateName: cateModel.title,
//         cateCuid: cateModel.cuid,
//         slug: cateModel.description[langIndex].slug
//       };
//     }
//     let type = cate ? cate.slug : '';
//     if(cate)
//       delete cate.slug;
//
//
//     object = Object.assign(object, cate);
// console.log(object);
    return done(null);
  } catch (err) {
    console.log('err on job SKILL_SYNC_ELASTIC:', err);
    return done(err);
  }
});
