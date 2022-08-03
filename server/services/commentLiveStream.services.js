import LiveStream from '../models/liveStream';
import CommentLiveStream, { CommentTypes } from '../models/commentLiveStream';
import StringHelper from '../util/StringHelper';

export async function getCommentUploadPermission(streamId, requesterId) {
  try {
    if ( ! StringHelper.isObjectId(streamId) ) {
      return false;
    }

    // Todo: check the requester is have permission to add the comment for stream
    return true;
  } catch (err){
    console.log("err getCommentUploadPermission Services : ", err);
    return Promise.reject({status:500, success:false, err:"Error Services !!!"})
  }
}

/**
 * Add comment type file to live stream
 * @param commentLiveStream
 * @param commentLiveStream.files
 * @param commentLiveStream.liveStream
 * @param commentLiveStream.user
 * @param commentLiveStream.videoTime
 * @returns {Promise.<void>}
 */
export async function addCommentTypeFile(commentLiveStream) {
  try {
    let liveStreamId = commentLiveStream.liveStream;
    if(!StringHelper.isObjectId(liveStreamId)) {
      return res.status(500).json({
        success: false,
        error: 'Invalid Live Stream id.'
      });
    }

    const liveStream = await LiveStream.findById(liveStreamId);
    if(!liveStream) {
      return res.status(404).json({
        success: false,
        error: 'Live Stream not found.'
      });
    }
    const files = commentLiveStream.files;
    if ( ! files instanceof Array || files.length === 0 ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Content.'
      });
    }
    return await CommentLiveStream.create({
      user: commentLiveStream.user,
      liveStream: liveStream._id,
      files: files,
      videoTime: commentLiveStream.videoTime || 0,
      type: CommentTypes.file,
    });
  } catch (error) {
    console.error('addCommentTypeFile');
    console.error(error);
    throw error;
  }
}