import * as DashBoard_Service from '../services/dashboard_user.services';
const LIMIT = 10;

export async function getChart(req, res) {
  try {
    let month = req.query.month || 0;
    let week = req.query.week || 0;
    let year = req.query.year || 0;
    let options = {
      user: req.user._id,
      year
    };
    if(month){
      options.month = month;
    }
    if(week){
      options.week = week;
    }
    let data = await DashBoard_Service.getChart(options);
    return res.json({
      success: true,
      data
    })
  } catch (err) {
    return res.status(err.status).json(err);
  }
}

export async function getHistoryCourse(req, res) {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || LIMIT;
    let skip = (page - 1) * limit;
    let options = {
      limit,
      skip,
      user: req.user._id
    };
    let data = await DashBoard_Service.getHistoryCourse(options);
    return res.json({
      success: true,
      total_page: Math.ceil(data[0]/limit),
      total_item: data[0],
      page,
      item: data[1].length,
      data: data[1]
    })
  } catch (err) {
    return res.status(err.status).json(err);
  }
}

export async function getHistoryAction(req, res) {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || LIMIT;
    let skip = (page - 1) * limit;
    let options = {
      limit,
      skip,
      user: req.user._id
    };
    let data = await DashBoard_Service.getHistoryAction(options);
    return res.json({
      success: true,
      total_page: Math.ceil(data[0]/limit),
      total_item: data[0],
      page,
      item: data[1].length,
      data: data[1]
    })
  } catch (err) {
    return res.status(err.status).json(err);
  }
}
