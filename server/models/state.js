import mongoose from 'mongoose';
import slug from 'slug';

const Schema = mongoose.Schema;

const StateSchema = new Schema({
  name: { type: String },
  IOS2: { type: String },
  IOS3: { type: String },
  searchString: { type: String },
  countryId: { type: Schema.Types.ObjectId, ref: 'Country' },
  status: { type: Boolean, default: true },
});

StateSchema.pre('save', function (next) {
  this.searchString = slug(`${this.name}`, ' ');
  return next();
});

export default mongoose.model('State', StateSchema);
