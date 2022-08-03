import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const mondelHistoryCoupon = new Schema({
  code:{type:String, required:true, index:1},
  object:{type:Schema.ObjectId, index:1},
  quantity: {type:Number, default: 1},
  paymentId: {type:Schema.ObjectId},
  total_price: {type:Number, required:true},
  platform:{type:String,enum:['webinar','course', 'membership'], required:true},
  code_cart: {type: String},
  price_discount: {type:Number, required:true},// toFixed(2)
  user:{type:Schema.ObjectId, ref: 'users', index:1},
  createAt:{type:Date, default:Date.now}
});

export default mongoose.model('historyCoupon',mondelHistoryCoupon);
