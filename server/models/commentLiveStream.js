import mongoose from 'mongoose';
import User from './user';
import ArrayHelper from '../util/ArrayHelper';
import AMPQ from '../../rabbitmq/ampq';
import globalConstants from '../../config/globalConstants';

export const CommentTypes = {
  normal: 1,
  file: 2,
};
const Schema = mongoose.Schema;

const commentLiveStreamSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', required: true, index: true},
  liveStream: {type: Schema.ObjectId, ref: 'livestreams', required: true, index: true},
  content: {type: String},
  createdAt: {type: Date, default: Date.now, required: true},
  videoTime: {type: Number, required: true, default: 0},
  type: {type: Number, enum: Object.values(CommentTypes), required: true, default: CommentTypes.normal},
  files: [{
    id: {type: String, required: true},
    name: {type: String},
  }],
});

commentLiveStreamSchema.index({createdAt: -1});
commentLiveStreamSchema.index({videoTime: -1});

commentLiveStreamSchema.pre('save', function(next) {
  this.wasNew = this.isNew;
  next();
});

commentLiveStreamSchema.post('save', async function (commentCreated, next) {
  if (this.wasNew) {
    let user = await User.findById({_id: commentCreated.user});
    commentCreated.user = user;
    if ( commentCreated instanceof mongoose.Model ) {
      commentCreated = commentCreated.toObject();
    }
    // Reformat the file url
    const files = commentCreated.files;
    if ( files instanceof Array ) {
      files.map(file => {
        file.url = `cloud/files/stream-comment/${commentCreated._id.toString()}/${file.id}/${file.name}`;
        delete file.id;
        delete file._id;
      });
    }
    commentCreated.files = files;
    // Add to worker

    AMPQ.sendDataToQueue(globalConstants.jobName.LIVESTREAM_ACTION, {type:'comment', obj: commentCreated});
  }

  return next();
});

commentLiveStreamSchema.statics.getMetadata = async function(comments) {
  if(! (comments instanceof Array)) comments = [comments];

  let userIds = comments.map(comment => comment.user);
  let users = await User.formatBasicInfo(User, userIds);

  let userMapper = ArrayHelper.toObjectByKey(users, '_id');

  return comments.map(comment => {
    comment.user = userMapper[comment.user];
    // Reformat the file url
    const files = comment.files;
    if ( files instanceof Array ) {
      files.map(file => {
        file.url = `cloud/files/stream-comment/${comment._id.toString()}/${file.id}/${file.name}`;
        delete file.id;
        delete file._id;
      });
    }
    comment.files = files;
    return comment;
  });
};

export default mongoose.model('CommentLiveStream', commentLiveStreamSchema);
