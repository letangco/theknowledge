import GoogleAuth from './GoogleSheet';
import Manager from '../../models/managersheet';
import slug from 'slug';
import { google } from 'googleapis';

async function createSheet(title, auth) {
  let sheets = google.sheets('v4');
  sheets.spreadsheets.create({
    auth: auth,
    resource: {
      properties:{
        title: title
      }
    }
  }, async (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    } else {
      let conditions = {
        spreadsheetId:response.spreadsheetId,
        slug: slug(title),
        title: title
      };
      await Manager.create(conditions);
    }
  });
}

async function insertSheet(values, idsheet, sheetName, auth) {
  let sheets = google.sheets('v4');
  sheets.spreadsheets.values.append({
    auth: auth,
    spreadsheetId: idsheet,
    range: sheetName || 'Sheet1!A2:B2', //Change Sheet1 if your worksheet's name is something else
    valueInputOption: "USER_ENTERED",
    resource: {
      values: values
    }
  }, (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    } else {
      //console.log("Appended");
    }
  });
}
async function readSheet(range, idsheet, auth) {
  return new Promise((resolve, reject)=>{
    let sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
      auth: auth,
      spreadsheetId: idsheet,
      range: range//Change Sheet1 if your worksheet's name is something else
    }, (err, response) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        reject(err);
      }else {
        let rows = response.values;
        //console.log('rows : ',rows);
        if(rows){
          resolve(rows);
        } else {
          resolve([]);
        }
      }
    });
  })
}

async function updateSheet(range,idsheet,values,auth) {
  let sheets = google.sheets('v4');
  sheets.spreadsheets.values.update({
    auth: auth,
    spreadsheetId: idsheet,
    range: range, //Change Sheet1 if your worksheet's name is something else
    valueInputOption: "USER_ENTERED",
    resource: {
      values: values
    }
  }, (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    } else {
      //console.log("Appended");
    }
  });
}

module.exports = {
  create: (title)=>{
    GoogleAuth.authenticate().then((auth)=>{
      createSheet(title,auth);
    })
  },
  insert: (title, idsheet, sheetName = '') =>{
    GoogleAuth.authenticate().then((auth)=>{
      insertSheet(title, idsheet, sheetName, auth);
    })
  },
  read: async (range,idsheet)=>{
    let auth = await GoogleAuth.authenticate();
    if(auth){
      return readSheet(range,idsheet,auth);
    }
    return false;
  },
  update: (range, idsheet, values)=>{
    GoogleAuth.authenticate().then((auth)=>{
      updateSheet(range,idsheet,values,auth);
    });
  }
};

