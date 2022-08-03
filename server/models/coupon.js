import mongoose from 'mongoose'
import {Q} from '../libs/Queue';
const Schema = mongoose.Schema;

const modelCoupon = new Schema({
  code:{
    type: String,
    required: true,
    index: 1
  },
  author:{type:Schema.ObjectId, required:true},
  discount_products: {type:Number, enum:[0,1,2,3,4,5,6,7], default:0},
  membership_to_apply: {type:String},
  courses: [{type:String}],
  webinars: [{type:String}],
  memberships: {type: Array, default: ["all"]}, // loại membership được giảm giá. Enum: ["all", "one-month", "three-month", "six-month", "one-years"]
  role:{
    type:String,
    enum:['admin','creator'],
    required:true
  },
  date_Start:{type:String, required:true},
  date_Finish:{type:String},
  type_discount:{
    type: {type: String, enum:['percent', 'price'], required: true},
    value: {type: Number, default:0},
    maximum: {type: Number},
    user_buy_limit:{type: Number},
    limit_discount:{type: Number},
    apply_products:{
      compare:{type: String, enum:['gt','lt'], default:'gt'},
      value:{type:Number}
    }
  },
  status:{type:Boolean, default:true},
  createAt:{type:Date, default:Date.now},
  updateAt:{type:Date, default:Date.now}
});
/**
 * discount_products:
 * 0 - All
 * 1 - All webinars
 * 2 - All courses
 * 3 - Custom webinars
 * 4 - Custom courses
 * 5 - Hỏi mr.thân
 * 6 - Hỏi mr.thân
 * 7 - Giảm giá memberships
 * */
modelCoupon.pre('save', async function(next) {
  this.wasNew = this.isNew;
  next()
});

modelCoupon.post('save', async function (created, next) {
  try{
    next();
  }catch (err){
   console.log('err model coupon post save : ',err);
   throw err;
  }
});

export default mongoose.model('coupon', modelCoupon);
