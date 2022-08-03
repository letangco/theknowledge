import likeStream from '../models/likelivestream';
import LiveStream from '../models/liveStream';
import StringHelper from '../util/StringHelper';

export async function addLike(req,res) {
  try {
      let streamid = StringHelper.isObjectId(req.params.id);
      if(!streamid){
        return res.json({
          status:400,
          success:false,
          err:'Not Format ObjectId'
        })
      }
      let Stream = await LiveStream.findById(req.params.id);
      if(!Stream){
        return res.json({status:404, success:false, err:'Steam not exisist!'});
      }
      let options = {
        from: req.user._id,
        stream: req.params.id
      };
      let like_Stream = await likeStream.findOne(options);
      if(like_Stream){
        await like_Stream.remove();
        return res.json({success:true,voted:false});
      }else {
        await likeStream.create(options);
        return res.json({success:true,voted:true})
      }
  } catch (err) {
    console.log('err on LikeStream:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}
