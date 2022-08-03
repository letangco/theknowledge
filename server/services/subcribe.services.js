import SubscribeServices from '../models/subscribe';
import Knowledge from '../models/knowledge';
import Question from '../models/questions';

export async function addSubscribe(options) {
  try {
    return await SubscribeServices.create(options);
  }catch (err){
    console.log("err addSubscribe : ", err);
    return Promise.reject({status:500, success:false, err:"Error Services !!!"})
  }
}
