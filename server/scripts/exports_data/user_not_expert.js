import json2csv from 'json2csv';
import fs from 'fs'
import execa from 'execa';
import path from 'path'
const fields = ['fullName','email','telephone','country','categories'];
import User from '../../models/user'
const filename = [
  'vietnam-expert',
  'vietnam-user',
  'other-expert',
  'other-user'
];

async function exportUser(users) {
  try{
    let user = users.map(e =>{
      e.country = e.country ? e.country.name : '';
      let categories = e.categories ? e.categories.map(e => {
        return e.industry.title;
      }) : [];
      e.categories = categories.toString();
      return e;
    });
    return json2csv.parse(user,{fields});
  }catch (err){
    console.log('err exportUserNotExpert ',err);
    return Promise.reject({status:500, success:false, err:"Error!!"})
  }
}

module.exports = async function () {
  try{
    let shell_script = 'cd '+path.join(__dirname,'..','..','..','exports')+' && rm -f *.csv';
    await execa.command(shell_script);
    console.log('Removed file in folder exports success!');
    let conditions = [
      {
        expert: 1,
        active: 1,
        "country.ISO2":'VN',
      },
      {
        expert: {$ne:1},
        active: 1,
        "country.ISO2":'VN'
      },
      {
        expert: 1,
        active: 1,
        "country.ISO2": {$ne:'VN'},
      },
      {
        expert: {$ne:1},
        active: 1,
        "country.ISO2":{$ne:'VN'}
      }
    ];
    let array_user = await Promise.all([
      User.find(conditions[0],('fullName email telephone country categories')).lean(),
      User.find(conditions[1],('fullName email telephone country categories')).lean(),
      User.find(conditions[2],('fullName email telephone country categories')).lean(),
      User.find(conditions[3],('fullName email telephone country categories')).lean()
    ]);
    let promise = array_user.map(async e =>{
      return await exportUser(e);
    });
    array_user = await Promise.all(promise);
    array_user.forEach((e, index) =>{
      let dir = path.join(__dirname,'..','..','..','exports',filename[index]+'-'+Date.now()+'.csv');
      fs.writeFileSync(dir,e);
    });
  }catch (err){
    console.log(err)
  }
};





