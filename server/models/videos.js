import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const videoSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', index: true},
  address: {type: String},
  title: {type: String},
  createdDate: {type: Date, default: Date.now},
  lesson: {type: Schema.ObjectId, ref: 'livestreams', index: true},
  course: {type: Schema.ObjectId, ref: 'courses', index: true},
  fileName:{type:String},
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'private',
    index: true
  },
  type: {
    type: String,
    index: true
  },
  fileId: {type: String}, // GDrive file Id, todo: enable required = true when migrate old done
});

videoSchema.index({createdDate: -1});

export default mongoose.model('Video', videoSchema);
