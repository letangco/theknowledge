import Comment from '../models/comment';
import Knowledge from '../models/knowledge';

export async function addComment(options) {
  try {
    let knowledge = await Knowledge.findById(options.knowledgeId);
    if(knowledge){
      return Promise.reject({status:404, success:false, err:"Knowledge Not Found!!"})
    }

    return await Comment.create(options);
  }catch (err){
    console.log("err addComment Services : ", err);
    return Promise.reject({status:500, success:false, err:"Error Services !!!"})
  }
}
