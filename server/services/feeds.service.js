import Feed from '../models/feeds';


export async function getUserFeed(_id,amount){
  return await Feed.find({owner:_id, type:'knowledge'}).sort({updatedDate: -1, priority: -1}).limit(amount);
}
