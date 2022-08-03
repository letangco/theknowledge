import * as HistoryCartService from '../services/historyCart.service';
import User from '../models/user';
export async function createCart(req, res) {
  try {
    let info = req.body.info;
    let type = req.query.type || 'create';
    if(!info){
      throw {
        status: 400,
        success: false,
        error: 'Invalid Params'
      }
    }
    let options = {
      info,
      user: null
    };
    if (req.headers.token) {
      let user = await User.findOne({token: req.headers.token}).lean();
      options.user = user ? user._id : null;
    }
    if(type === 'create'){
      options.email = req.body.email;
      options.userName = req.body.userName;
      options.address = req.body.address;
      options.phoneNumber = req.body.phoneNumber;
      options.paymentMethod = req.body.paymentMethod;
      options.password = req.body.password || null;
    }
    if (req.body.coupon) {
      options.coupon = req.body.coupon
    }
    let total = await HistoryCartService.getTotalPrice(info, req.headers.lang);
    options.total = total.total;
    options.info = total.info;
    options.currency = req.headers.lang && req.headers.lang === 'vi' ? 'VND' : 'AUD';
    let data = await HistoryCartService.createCart(options, type);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    console.log('err : ',err);
    return res.status(err.status).json(err);
  }
}

export async function getListProductById(req, res) {
  try {
    let courses = req.body.courses || [];
    let memberships = req.body.memberships || [];
    let lang = req.headers.lang || 'vi';
    if (!courses && !memberships) {
      throw {
        status: 400,
        success: false,
        error: "Invalid Params"
      }
    }
    let options = {
      courses,
      memberships,
      lang
    };
    let data = await HistoryCartService.getListProductById(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status).json(err);
  }
}

export async function getListOrder(req, res) {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    let text = req.query.text || '';
    let status = req.query.status || 0;
    let type = req.query.type || '';
    let options = {
      type,
      limit,
      skip
    };
    if(text) {
      options.text = text;
    }
    if(status){
      options.status = status;
    }
    let data = await HistoryCartService.getListOrder(options);
    return res.json({
      success: true,
      total_page: Math.ceil(data[0]/limit),
      total_item: data[0],
      page,
      item_page: data[1].length,
      data: data[1]
    })
  } catch (err) {
    return res.status(err.status).json(err);
  }
}

export async function deleteOrder(req, res) {
  try {
    let id = req.params.id;
    if (!id){
      throw {
        status: 400,
        success: false,
        error: 'Invalid params.'
      }
    }
    let options = {
      id
    };
    let data = await HistoryCartService.deleteOrder(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status).json(err);
  }
}

export async function editOrder(req, res) {
  try {
    let options = req.body;
    let id = req.params.id;
    if (!id){
      throw {
        status: 400,
        success: false,
        error: 'Invalid params.'
      }
    }
    options.id = id;
    let data = await HistoryCartService.editOrder(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status).json(err);
  }
}
