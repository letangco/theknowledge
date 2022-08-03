import * as Sheet_Services from '../services/sheet.services';

export async function addSheet(req,res) {
  try{
    let options = req.body;
    let data = await Sheet_Services.addSheet(options);
    return res.json({
      status:data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function createSheet(req,res) {
  try{
    let options = req.body.title;
    let data = await Sheet_Services.createSheet(options);
    return res.json({
      status:data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function readSheet(req,res) {
  try{
    return res.json({
      success:true,
      data: await Sheet_Services.readSheet({user:req.user._id})
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}

export async function updateSheet(req,res) {
  try{
    let data = await Sheet_Services.update({codes:req.body.codes})
    return res.json({
      success:data
    })
  }catch (err){
    return res.status(err.status).json(err);
  }
}
