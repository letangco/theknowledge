import Knowledge from '../../models/knowledge';


module.exports = async function () {
  let knowledges = await Knowledge.find({state: 'published'});
  console.log('aaaaa', knowledges.length);
  knowledges.map(async knowledge => {
    let feedOptions = {
      knowledge: knowledge,
      actor: knowledge.authorId,
      action: 'published',
      type: 'knowledge'
    };
    Knowledge.createFeeds(Knowledge, feedOptions);
  })
};
