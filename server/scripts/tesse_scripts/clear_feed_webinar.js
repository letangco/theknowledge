import Webinars from '../../models/liveStream';
import Feed from '../../models/feeds';

module.exports = async function () {
  try{
    let conditions = {
      "time.dateLiveStream":{$lt:Date.now() + 12*60*60*1000},
      type:'schedule'
    };
    let webinars = await Webinars.find(conditions).lean();
    let count = 0;
    let promises = webinars.map(async e =>{
      count += await Feed.count({type:'schedule', object:e._id});
      await Feed.remove({type:'schedule', object:e._id});
    });
    await Promise.all(promises);
    console.log('Clear '+count+' feed schedule old.')
  }catch (err){
    console.log('err clear feed webinars : ',err);
  }
}
