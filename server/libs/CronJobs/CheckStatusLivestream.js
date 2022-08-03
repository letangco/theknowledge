import Livestream from "../../models/liveStream";
import config from "../../config";
import * as liveStream_Services from "../../services/liveStream.services";
var request = require("request")

export async function checkStatusLivestream() {
  try {
    const linkApi = config.antApi;
    console.log('cronJob checkStatusLivestream');
    let liveStreams = await Livestream.find({status: 'living'}, '_id').lean();
    if (liveStreams) {
      liveStreams.map(stream => {
        var url = `${linkApi}/${stream._id}/status`;
        console.log('cronJob url: ', url);
        request({
          url: url,
          json: true
        }, function (error, response, body) {
          if (!error && response.statusCode === 200) {
            if(body && !body.living){
              liveStream_Services.changeStreamStatus(stream._id, 'stopped');
            }
          }
        })
      })
    }
  } catch(err) {
    console.log('err on checkStatusLivestream:', err);
  }
}

export default {
  cronTime: config.checkStatusLivestream,
  onTick: async () => {
    await Promise.all([
      checkStatusLivestream()
    ]);
  },
  start: true
};
