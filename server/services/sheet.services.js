import Manager from '../models/managersheet';
import ManagerExport from '../models/managerExportSheet';
import GoogleSheet from '../libs/GoogleSheet/Sheet';
import config from '../config';

export async function addSheet(options) {
  try{
    let manager = await Manager.findOne({slug:options.slug}).lean();
    // if(!manager){
    //   return Promise.reject({status:400, success:false, error:'Sheet not found.'})
    // }
    let date = new Date();
    let data = [[options.username, options.telephone, options.email, date, options.note]];
    await GoogleSheet.insert(data, manager ? manager.spreadsheetId : config.google.idSheet);
    return true;
  }catch (err){
    console.log('err addSheet : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!'})
  }
}

export async function addSheetMemberShipTrial(options) {
  try{
    let manager = await Manager.findOne({slug:options.slug}).lean();
    // if(!manager){
    //   return Promise.reject({status:400, success:false, error:'Sheet not found.'})
    // }
    let date = new Date();
    let data = [[options.fullName, options.phoneNumber, options.email, date]];
    await GoogleSheet.insert(data, manager ? manager.spreadsheetId : config.google.idSheet, 'Sheet3!A2:B2');
    return true;
  }catch (err){
    console.log('err addSheet : ',err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!'})
  }
}


export async function createSheet(title) {
  try{
    GoogleSheet.create(title);
    return true;
  }catch (err){
    return Promise.reject({status:500, success:false, error:'Internal Server Error!'})
  }
}

export async function readSheet(options) {
  try{
    let managerexport = await ManagerExport.findOne({user:options.user});
    let range;
    if(managerexport){
      range = config.google.name + `A${managerexport.rows}:F`
    } else {
      managerexport = await ManagerExport.create({
        user:options.user,
        rows:2
      });
      range = config.google.name + 'A2:F';
    }
    let data = await GoogleSheet.read(range, config.google.idSheetLeadDK);
    if(data.length === 0){
      return Promise.reject({status:400, success:false, error:'Not Yet Data!'})
    }
    data = data.map((e,i)=>{
      return {
        fullName:e[0],
        email:e[1],
        provine:e[2],
        address:e[3],
        telephone:e[4],
        time:e[5],
        location:managerexport.rows + i
      }
    });
    managerexport.rows += data.length;
    await managerexport.save();
    return data;
  }catch (err){
    console.log(err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!'})
  }
}

export async function update(options) {
  try{
    options.codes.map(e=>{
      let range = config.google.name + `G${e.location}`;
      let values = [[e.code]];
      GoogleSheet.update(range, config.google.idSheetLeadDK, values)
    });
    return true;
  }catch (err){
    console.log(err);
    return Promise.reject({status:500, success:false, error:'Internal Server Error!'})
  }
}
