import Knowledege from '../../models/knowledge';
import Feed from '../../models/feeds';
import request from 'request-promise';
import Elasticsearch from '../../libs/Elasticsearch';
import ArrayHelper from '../../util/ArrayHelper';

module.exports = async function () {
  try {
    // let agg = await Feed.aggregate([
    //   {
    //     $group: {_id: '$object', count: {$sum: 1}}
    //   }
    // ]);
    // let knowledgeIds = agg.map(ag => ag._id);
    //
    // let unFeedKnowledge = await Knowledege.find({_id: {$nin: knowledgeIds}, state: 'published'}).lean();
    // console.log('chua tao feed:', unFeedKnowledge.length);
    //
    // // let unFeedKnowledgeIds = unFeedKnowledge.map(knowledge => knowledge._id);
    // // await findKnowledgeInElastic(unFeedKnowledgeIds);
    //
    // unFeedKnowledge.forEach(knowledge => {
    //   let option = {
    //     knowledge: knowledge,
    //     actor: knowledge.authorId,
    //     action: 'published',
    //     type: 'knowledge',
    //   };
    //   Knowledege.createFeeds(Knowledege, option);
    // });
    await cleanUnPublishedKnowledge();
    console.log('cleaning done.');
  } catch (err) {
    console.log('err:', err);
  }
};

async function findKnowledgeInElastic(knowledgeIds) {
  let options = {
    method: 'POST',
    uri: 'http://138.197.28.84:9200/knowledge/_search',
    body: {
      query: {
        ids: {
          values: knowledgeIds
        }
      }
    },
    json: true // Automatically stringifies the body to JSON
  };

  let data = await request(options);
  // console.log('data:', data);
  // data = JSON.parse(data);

  console.log('elastic synced:', data.hits.total);
}

async function syncToElasticsearch(unFeedKnowledge) {
  let promises = unFeedKnowledge.map(knowledge => Knowledege.toESDoc(Knowledege, knowledge));
  let knowledgeESDoc = await Promise.all(promises);

  let grouped = ArrayHelper.groupByKey(knowledgeESDoc, 'type');
  // console.log('grouped:', grouped);

  let types = Object.keys(grouped);
  let elasticPromises = types.map(type => Elasticsearch.multiIndex('knowledge', grouped[type], type));
  await Promise.all(elasticPromises);
}

async function cleanUnPublishedKnowledge() {
  let unPublishedKnowledge = await Knowledege.find({state: {$ne: 'published'}}, '_id').lean();
  let knowledgeIds = unPublishedKnowledge.map(knowledge => knowledge._id);
  await Feed.remove({object: {$in: knowledgeIds}});
}
