import CommentLiveStream from '../models/commentLiveStream';
import StringHelper from '../util/StringHelper';

export async function updateComment(req, res) {
  try {
    let commentId = req.params.id;
    if(!StringHelper.isObjectId(commentId)) {
      return res.status(400).json({
        success: false, error: 'Invalid id.'
      });
    }

    let comment = await CommentLiveStream.findById(commentId);
    if(!comment) {
      return res.status(404).json({
        success: false, error: 'Comment not found.'
      });
    }

    if(comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, error: 'Permission denied.'
      });
    }

    let content = StringHelper.sanitizeHtml(req.body.content);
    if(!content) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Content.'
      });
    }

    comment.content = content;

    await comment.save();

    return res.json({
      success: true, data: comment
    });
  } catch (err) {
    console.log('err on updateComment:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}

export async function deleteComment(req, res) {
  try {
    let commentId = req.params.id;
    if(!StringHelper.isObjectId(commentId)) {
      return res.status(400).json({
        success: false, error: 'Invalid id.'
      });
    }

    let comment = await CommentLiveStream.findById(commentId);
    if(!comment) {
      return res.status(404).json({
        success: false, error: 'Comment not found.'
      });
    }

    if(comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, error: 'Permission denied.'
      });
    }

    await comment.remove();

    return res.json({
      success: true
    });
  } catch (err) {
    console.log('err on updateComment:', err);
    return res.status(500).json({
      success: false, error: 'Internal error.'
    });
  }
}
