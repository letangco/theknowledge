import Feed from '../../models/feeds';

module.exports = async function () {
  try{
    let count = await Feed.count({type:'live_stream'});
    if (count>0){
      await Feed.remove({type:'live_stream'})
    }
    console.log('Remove ' + count + ' feed live_stream success!');
  }catch (err){
    console.log("err remove feed live : ", err);
  }
};
