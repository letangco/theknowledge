import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  parent: {type: 'String', default: ''},
  description: [{languageID: String, name: String, slug: String}],
  title: {type: 'String'},
  slug: {type: 'String'},
  status: {type: 'String'},
  createdBy: {type: Schema.ObjectId},
  modifiedBy: {type: Schema.ObjectId, default: null},
  dateAdded: {type: 'Date', default: Date.now, required: true},
  dateModified: {type: 'Date', default: Date.now},
  cuid: {type: 'String', required: true, unique: true},
  userID: {type: String},
  view: {type: Boolean, default: false}
});

categorySchema.index({status: 1});
categorySchema.index({parent: 1});
categorySchema.index({title: 1});

export default mongoose.model('Category', categorySchema);
