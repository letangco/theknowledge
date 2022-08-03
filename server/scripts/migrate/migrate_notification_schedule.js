import LiveStream from '../../models/liveStream';

module.exports = async function () {
  try{
    let conditions = {
      type:'schedule',
      "time.dateLiveStream":{$gt: Date.now()}
    };
    let livestream = await LiveStream.find(conditions);
    let promise = livestream.map(async e =>{
      await e.save();
    });
    await Promise.all(promise);
    console.log('Migrate notification success!')
  }catch (err){
    console.log("error migrate_notification : ", err);
  }
};
