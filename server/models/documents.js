import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const documentSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', index: true},
  address: {type: String},
  title: {type: String},
  createdDate: {type: Date, default: Date.now},
  lesson: {type: Schema.ObjectId, ref: 'livestreams', index: true},
  course: {type: Schema.ObjectId, ref: 'courses', index: true},
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
    index: true
  },
  fileName:{type:String},
  type: {
    type: String,
    enum: ['file', 'link'],
    index: true
  },
  fileId: {type: String}, // GDrive file Id, todo: enable required = true when migrate old done
});

documentSchema.index({createdDate: -1});

export default mongoose.model('Document', documentSchema);
