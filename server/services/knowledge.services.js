import Knowledge from '../models/knowledge';
import KnowledgeUpvote from '../models/knowledgeUpvote';
import globalConstants from '../../config/globalConstants';

export async function upVoteKnowledge(options) {
  try{
    let knowledge = await Knowledge.findOne({_id:options.knowledgeId,state: globalConstants.knowledgeState.PUBLISHED}).lean();
    if(!knowledge){
      return Promise.reject({status:400, success:false, err:"Knowledge Not Found !!"})
    }
    let voteKnowledge = await KnowledgeUpvote.findOne(options);
    if(voteKnowledge){
      return Promise.reject({status:400, success:false, err:"You did upVote Knowledge !!"})
    }
    await KnowledgeUpvote.create(options);
    knowledge.upvoted = true;
    knowledge.upVotes +=1;
    let feedOptions = {
     knowledge: knowledge,
     actor: options.userId,
     action: 'voted',
     type: 'knowledge'
    };
    await Knowledge.createFeeds(Knowledge, feedOptions);
    return knowledge;
  }catch (err){
    console.log("err upVoteKnowledge Services :", err);
    return Promise.reject({status:500, success:false, err: "Error Services !!!"})
  }
}
