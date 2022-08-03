import * as Coupon_Services from '../services/coupon.service';
import StringHelper from '../util/StringHelper';

export async function createCoupon(req,res) {
  try{
    let data = req.body;
    let role = req.params.role;
    if (!data.type_discount || [0,1,2,3,4,5,6].indexOf(data.discount_products)===-1){
      return res.json({status:403, success:false, err:'Please check req.body!'});
    }
    if (data.discount_products.type === 'custom' && (data.webinars.length === 0 && data.courses.length === 0)){
      return res.json({status:400, success:false, err:'Add type custom error!'})
    }
    let options = {
      role: role,
      author:req.user._id,
      discount_products:data.discount_products,
      type_discount: data.type_discount,
      membership_to_apply: data.membership_to_apply,
    };
    if (data.webinars){
      options.webinars =  data.webinars;
    }
    if (data.courses){
      options.courses = data.courses;
    }
    options.date_Start = data.date_Start ? data.date_Start.date + parseInt(data.date_Start.hour) * 3600000 + parseInt(data.date_Start.minute) * 60000 : Date.now();
    if (data.date_Finish){
      options.date_Finish = data.date_Finish.date + parseInt(data.date_Finish.hour) * 3600000 + parseInt(data.date_Finish.minute) * 60000;
    }
    let rs = await Coupon_Services.createCoupon(options);
    return res.json({
      success:true,
      data:rs
    })
  }catch (err){
    console.log(err);
    return res.status(err.status).json(err);
  }
}

export async function updateCoupon(req,res) {
  try{
    let data = req.body;
    let role = req.params.role;
    let couponId = await StringHelper.isObjectId(req.params.id);
    if (!couponId){
      return res.json({status: 400, success:false, err:'Params Invalid!'})
    }
    let options = {
      couponId: req.params.id,
      data,
      role,
      user_req:req.user._id
    };
    options.data.date_Start = data.date_Start ? data.date_Start.date + parseInt(data.date_Start.hour) * 3600000 + parseInt(data.date_Start.minute) * 60000 : Date.now();
    if (data.date_Finish){
      options.data.date_Finish = data.date_Finish.date + parseInt(data.date_Finish.hour) * 3600000 + parseInt(data.date_Finish.minute) * 60000;
    }
    let rs = await Coupon_Services.updateCoupon(options);
    return res.json({
      success:true,
      data:rs
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function reportCoupon(req,res) {
  try{
    let ObjectId = StringHelper.isObjectId(req.params.object);
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || 12).valueOf();
    let skip = (page - 1) * limit;
    if (!ObjectId){
      return res.json({status:400, success:false, error: 'Invalid params!'})
    }
    let options = {
      object: req.params.object,
      user_req: req.user._id,
      skip,
      limit
    };
    let data = await Coupon_Services.reportCoupon(options);
    return res.json({
      status:200,
      success:true,
      total:data[0],
      total_page: Math.ceil(data[0]/limit),
      current_page: page,
      data:data[1]
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}
export async function getCoupons(req,res) {
  try{
    let role = req.query.role || 'author';
    let status = req.query.status;
    let lang = req.headers.lang || 'en';
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || 12).valueOf();
    let skip = (page - 1) * limit;
    let options = {
      role,
      user_req:req.user._id,
      limit,
      skip,
      lang
    };
    if(status){
      options.status = status;
    }
    let data = await Coupon_Services.getCoupons(options);
    return res.json({
      status:200,
      success:true,
      total:data[0],
      total_page: Math.ceil(data[0]/limit),
      current_page: page,
      data:data[1]
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function getCoupon(req,res) {
  try{
    let couponId = StringHelper.isObjectId(req.params.id);
    if (!couponId){
      return res.json({status:400, success:false, error: 'Invalid Params!'})
    }
    let options = {
      user_req:req.user._id,
      couponId: req.params.id
    };
    let data = await Coupon_Services.getCoupon(options);
    return res.json({
      success:true,
      data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function deleteCoupon(req,res) {
  try{
    let couponId = StringHelper.isObjectId(req.params.id);
    if (!couponId){
      return res.json({status:400, success:false, error: 'Invalid Params!'})
    }
    let options = {
      user_req:req.user._id,
      couponId: req.params.id
    };
    let data = await Coupon_Services.deleteCoupon(options);
    return res.json({
      success:data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function getHistoryOfCoupon(req,res) {
  try{
    let couponId = StringHelper.isObjectId(req.params.id);
    if (!couponId){
      return res.json({status:400, success:false, error: 'Invalid Params!'})
    }
    let lang = req.headers.lang || 'en';
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || 12).valueOf();
    let skip = (page - 1) * limit;
    let options = {
      user_req:req.user._id,
      couponId: req.params.id,
      limit,
      skip,
      lang
    };
    let data = await Coupon_Services.getHistoryCoupon(options);
    return res.json({
      status:200,
      success:true,
      total:data[0],
      total_page: Math.ceil(data[0]/limit),
      current_page: page,
      data:data[1]
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function getHistoryCouponOfUser(req,res) {
  try{
    let lang = req.headers.lang || 'en';
    let page = Number(req.query.page || 1).valueOf();
    let limit = Number(req.query.limit || 12).valueOf();
    let skip = (page - 1) * limit;
    let options = {
      user_req:req.user._id,
      limit,
      skip,
      lang
    };
    let data = await Coupon_Services.getHistoryCouponOfUser(options);
    return res.json({
      status:200,
      success:true,
      total:data[0],
      total_page: Math.ceil(data[0]/limit),
      current_page: page,
      data:data[1]
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function updateStatusCoupon(req,res) {
  try{
    let code = StringHelper.isObjectId(req.params.id);
    if (!code){
      return res.json({status:400, success:false, error:'Invalid Params!'})
    }
    let options = {
      code: req.params.id,
      req_user:req.user._id
    };
    let data = await Coupon_Services.updateStatus(options);
    return res.json({
      success:true,
      data
    });
  }catch (err){
    return res.status(err.status).json(err);
  }
}



export async function checkCouponCode(req,res) {
  try{
    let data = await Coupon_Services.checkApplyCoupon(req.body);
    return res.json({
      success:true,
      data
    });
  }catch (err){
    return res.status(err.status).json(err);
  }
}

