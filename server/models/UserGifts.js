import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userGiftsSchema = new Schema({
  user: {type: Schema.ObjectId, ref: 'users', unique: true, required: true},
  flowers: {type: Number, default: 0},
  coffee: {type: Number, default: 0},
  cars: {type: Number, default: 0},
  houses: {type: Number, default: 0}
});

export default mongoose.model('UserGifts', userGiftsSchema);
