import Follow from '../models/follow';
import User from '../models/user';

export async function addFollow(options) {
  try{
    let to = await User.findById(options.to);
    if(!to){
      return Promise.reject({status:404, success:false, err:"User.to Not Found!"});
    }
    let follow = {
      from:options.from,
      to:options.to,
    };
    let data = await Follow.findOne(follow);
    if(data){
      return Promise.reject({status:400, success:false, err:"Follow Da Ton Tai!!"});
    }
    return await Follow.create(follow);
  }catch (err){
    console.log("err in AddFollow : ", err);
    return Promise.reject({status:500, success:false, err:"Error!!"});
  }
}
