'use strict';

import Knowledge from '../../models/knowledge';
import Elasticsearch from '../../libs/Elasticsearch';
import bodybuilder from 'bodybuilder';
import request from 'request-promise';

export default class RemoveKnowledges {
    async start () {
      let results = await Promise.all([
        Knowledge.find({state: 'published'}, {_id: true}).exec(),
        request('http://127.0.0.1:9200/knowledges/_search?size=2000')
      ]);
      let publishedKnowledgeIds = results[0].map(knowledge => {return knowledge._id.toString()});
      let allKnowledges = JSON.parse(results[1]);
      let allKnowledgeIds = allKnowledges?.hits?.hits?.map(knowledge => {return knowledge._id});
      let ids = allKnowledgeIds.filter(id => {
        return publishedKnowledgeIds.indexOf(id) < 0;
      });
      console.log('ids:', ids);
      let promises = ids.map(id => Elasticsearch.delete('knowledges', 'knowledges', id));
      await Promise.all(promises);
      console.log('remove unpublished knowledge done.');
    }
}
