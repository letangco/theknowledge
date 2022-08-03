import Webinar from '../../models/liveStream';
import Elasticsearch from '../../libs/Elasticsearch';
import * as Livestream_Service from '../../services/liveStream.services';

module.exports = async function () {
  try{
    let conditions = {
      type:'schedule',
      "time.dateLiveStream":{$gt:Date.now()}
    };
    let courses = await Webinar.find(conditions).lean();
    if(!courses || !courses.length) {
      return console.log('no webinar to sync');
    }
    let promise = courses.map(async e => {
      return await Livestream_Service.buildElasticDoc(e)
    });
    let courseDoc = await Promise.all(promise);
    await Elasticsearch.multiIndex('webinars', courseDoc);
    console.log('sync webinar to elasticsearch done.');
    return true;
  }catch (err){
    console.log('err migrate webinars : ',err);
  }
};
