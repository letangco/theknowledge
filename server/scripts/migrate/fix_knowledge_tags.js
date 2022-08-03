'use strict';
import Skill from '../../models/skill';
import Knowledge from '../../models/knowledge';
import es from '../../libs/Elasticsearch';
import bodybuilder from 'bodybuilder';

export default class ScriptFixKnowledgeTags {
  async start() {
    let knowledges = await Knowledge.find().exec();
    let promises = knowledges.map(async knowledge => {
      let tagPromises = knowledge.tags.map(async tag => {
        let body = bodybuilder().query('match', 'name', tag).build();
        let skills = await es.search('skills', body);
        let skill = skills?.hits?.hits[0];
        if(skill) {
//          console.log('skill:', skill);
          return {id: skill._id, name: skill._source.name};
        } else {
          return {id: 'un', name: tag};
        }
      });
      let tags = await Promise.all(tagPromises);
      knowledge.tags = tags.filter(tag => {return tag});
      console.log('knowledge.tags:', knowledge.tags);
      await knowledge.save();
      if(knowledge.state === 'published') {
        let feedOptions = {
          knowledge: knowledge,
          actor: knowledge.authorId,
          action: 'published',
          type: 'knowledge'
        };
        return Knowledge.createFeeds(Knowledge, feedOptions);
      }
    });
    await Promise.all(promises);
    console.log('done.');
  }
};


