import {Q} from '../Queue';
import globalConstants from '../../../config/globalConstants';
import cheerio from 'cheerio';
import SimpleQuestion from '../../models/simpleQuestions';
import Answer from '../../models/answers';
import Elasticsearch from '../Elasticsearch';
import bodybuilder from 'bodybuilder';
import StringHelper from '../../util/StringHelper';
import ArrayHelper from '../../util/ArrayHelper';
import Category from '../../models/category';

const businessParent = {
  cateId: '58bbfecec8f8e87c0b2ebd05',
  name: 'Business & Finance',
  cuid: 'cizwmr4ts010xi3gdhtgh8ldd'
};

let businessCates = [];

export async function init () {
  let cates = await Category.find({parent: businessParent.cuid});
  businessCates = cates.map(cate => cate._id.toString());
  businessCates.push(businessParent.cateId);
  console.log('crawlerworker init done.');
}

// Q.process(globalConstants.jobName.ADD_QUESTION, 1, async (job, done) => {
//   try {
//     console.log('job.data.tags[]:', job.data['tags[]']);
//     let tags = await mapTagToCategory(job.data['tags[]']);
//     // console.log('tags:', tags);
//
//     let sQuestion = await SimpleQuestion.create({
//       url: job.data.url,
//       question_html: job.data.title,
//       question_text: parseQuestionText(job.data.title),
//       tags: tags
//     });
//
//     // console.log('sQuestion:', sQuestion);
//     await saveComments(sQuestion._id, JSON.parse(job.data.comments));
//     return done(null);
//   } catch (err) {
//     if(err.code !== 11000) {
//       console.log('err on add question worker:', err);
//       return done(err);
//     }
//     return done(null);
//   }
// });

async function mapTagToCategory(tags) {
  if(typeof tags === 'string') {
    tags = [tags];
  }
  let promies = tags.map(async tag => {
    let body = bodybuilder().size(5)
      .orQuery('match', 'name', tag)
      .orQuery('match', 'cateName', tag).build();
    // console.log('body:', JSON.stringify(body));
    let searched_skill = await Elasticsearch.search('skills', body);

    return searched_skill?.hits?.hits?.map(skill => {
      if(skill && skill._score >= 0.8) {
        // console.log('skill:', skill);
        if(businessCates.indexOf(skill['_source'].cateId) >= 0) {
          // console.log('aaa');
          return businessParent;
        }
        // console.log('bbb');
        return {
          cateId: skill['_source'].cateId,
          name: skill['_source'].cateName
        };
      }
    });

  });

  let rs = await Promise.all(promies);
  tags = [];
  rs.forEach(function(arr_child){
    Array.prototype.push.apply(tags, arr_child);
  });
  tags = tags.filter(tag => tag);
  // console.log('tags:', tags);
  tags = ArrayHelper.uniqueValuesInArrayByProp(tags, 'cateId');

  return tags;
}

function parseQuestionText(question_html) {
  // console.log('question_html:', question_html);
  let $ = cheerio.load(question_html);
  return StringHelper.standardize($.text());
}

async function saveComments(questionId, comments) {
  comments = comments.map(comment => {
    if(comment.content) {
      let upvotes = Number(comment.upvote).valueOf();

      return {
        question: questionId,
        content: comment.content,
        upvotes: isNaN(upvotes) ? 0 : upvotes
      };
    }
  });
  // console.log('comments:', comments);
  return Answer.create(comments);
}
