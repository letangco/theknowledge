import {Q} from '../Queue';
import Knowledge from '../../models/knowledge';
import Feed from '../../models/feeds';
import Elasticsearch from '../Elasticsearch';
import globalConstants from '../../../config/globalConstants';

Q.process(globalConstants.jobName.KLGE_SYNC_ELASTIC, 1, async (job, done) => {
//  console.log('job:', job);
  if(job.data.action === 'remove') {
      Elasticsearch.delete('knowledges', job.data.id)
      .then(() => done(null))
      .catch(err => done(err));
  } else {
      let knowledgeESDoc = await Knowledge.toESDoc(Knowledge, job.data.knowledge);
      let type = knowledgeESDoc.type;
      delete knowledgeESDoc.type;
    //  console.log('knowledgeESDoc:', knowledgeESDoc);
      if(job.data.action === 'censor') {
        Elasticsearch.index('knowledge', knowledgeESDoc, type)
          .then(() => done(null))
          .catch(err => done(err));
      } else {
        Elasticsearch.update('knowledge', knowledgeESDoc, type)
          .then(() => done(null))
          .catch(err => done(err));
      }
  }
});

Q.process(globalConstants.jobName.KLGE_REMOVE, 1, (job, done) => {
  Feed.remove({object: job.data.knowledgeId})
    .then(() => done(null))
    .catch(err => done(err));
});
