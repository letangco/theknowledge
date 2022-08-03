import * as AffiliateHistoryServices from '../services/affiliateHistory.services';
const LIMIT = 10;

export async function getMyAffiliateHistories(req, res) {
  try {
    let page = Number(req.query.page || 1).valueOf();
    let lang = req.headers.lang || 'vi';
    let result = await AffiliateHistoryServices.getMyAffiliateHistories(req.user._id, page, lang);
    result.success = true;
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json(err);
  }
}

export async function getAllAffiliates(req, res) {
  try{
    let lang = req.headers.lang || 'vi';
    let page = Number(req.query.page || 1).valueOf();
    let type = req.query.type;
    let status = req.query.status || 1;
    let from = req.query.from;
    let to = req.query.to;
    let user = req.query.user;
    let limit = Number(req.query.limit || LIMIT).valueOf();
    let skip = (page - 1) * limit;
    let options = {
      limit,
      skip,
      lang,
      type,
      status,
      user,
      to,
      from
    };
    let data = await AffiliateHistoryServices.getAllAffiliates(options);
    return res.json({
      success:true,
      total:data[0],
      total_page: Math.ceil(data[0]/limit),
      current_page: page,
      report_value: data[2],
      data:data[1]
    })
  }catch (err){
    return res.status(err.status || 500).json(err);
  }
}
export async function approveAffiliate(req, res) {
  try{
    let affiliates = req.body.affiliates;
    let lang = req.headers.lang || 'vi';
    let options = {
      affiliates,
      lang
    };
    let data = await AffiliateHistoryServices.approveAffiliate(options);
    return res.json({
      success:true,
      report:data[0],
      accepted:data[1],
      withdrawaled:data[3],
      rejected:data[2]
    })
  }catch (err){
    return res.status(err.status || 500).json(err);
  }
}
