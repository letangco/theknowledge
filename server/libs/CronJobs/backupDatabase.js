import configs from "../../config";
import execa from "execa";
import {drive, getRootFolder} from "../../gdrive/GDrive";
import fs from "fs";

export async function BackUpDataToGDrive() {
  try {
    let fileName = await backupDataAndImages();
    let folderBackup = await getRootFolder(configs.gdrive.rootFolder.backupFolder.property, configs.gdrive.rootFolder.backupFolder.name);
    let res = await drive.files.create({
      resource: {
        name: fileName,
        parents: [folderBackup]
      },
      media: {
        body: fs.createReadStream('./server/'+fileName)
      },
      fields: 'id'
    });
    if (res.status === 200) {
      let url = 'https://drive.google.com/drive/folders/' + folderBackup;
      await deleteLocalBackupFiles(url, fileName);
    } else {
      console.log(res.statusText);
    }
  } catch (error) {
    console.log('error Backup Database : ',error);
  }
}

async function backupDataAndImages() {
  let fileName = '';
  let now = new Date();
//          let yesterday = new Date(new Date().setDate(now.getDate() - 1));
  let time = '' + now.getDate() + (now.getMonth() + 1) + now.getFullYear();
//          let time_old = '' + yesterday.getDate() + (yesterday.getMonth() + 1) + yesterday.getFullYear();

  let dump_shell = 'cd ~ && mongodump --forceTableScan --port '+configs.dbPort+' -d '+configs.databaseName+' --username '+ configs.dbUser +' --password '+ configs.dbPassword +' --out ' + configs.backupFolder;
  let copy_shell = 'cd '+configs.uploadFolder+' && cp -R uploads/ '+configs.backupFolder+'uploads/';
  let copy_cache = `cd ${configs.uploadFolder} && cp -R cache/ ${configs.backupFolder}cache/`;
  let zip_shell = 'cd '+configs.backupFolder+' && zip '+time+'.zip ./'+ configs.databaseName +' -r';
  let copy_zip_shell = 'cd '+configs.backupFolder+' && cp '+time+'.zip '+configs.uploadFolder+'/server/';
//          let del_shell = 'cd '+configs.backupFolder+' && rm -rf -R ' + configs.databaseName + ' && rm -rf ' + configs.databaseName + '_' + time_old + '.zip';

//      console.log(dump_shell);
//      console.log(copy_shell);
//      console.log(zip_shell);
//      console.log(copy_zip_shell);

  await execa.command(dump_shell);
  console.log('dump db complete. (20%)');

  await execa.command(copy_shell);
  console.log('copy uploads folder to backup folder complete. (30%)');

  await execa.command(copy_cache);
  console.log('copy cache folder to backup folder complete. (40%)');

  await execa.command(zip_shell);
  console.log('zip all data complete. (60%)');

  await execa.command(copy_zip_shell);
  console.log('copy zip file to project directory complete (80%)');

  fileName = time+'.zip';
  return fileName;
}

async function deleteLocalBackupFiles(url, fileName) {
  console.log('upload to drive complete, url:', url, '(90%)');
  let del_shell = 'cd '+configs.backupFolder+' && rm -rf * && cd '+configs.uploadFolder+'/server && rm -rf ' + fileName;
  await execa.command(del_shell);
  console.log('delete local backup complete (100%)');
  console.log('Backup complete.');
}

export default {
  cronTime: configs.backupTime,
  onTick: () => {
    console.log('start cron job backup.');
    Promise.all([
      BackUpDataToGDrive()
    ]).then(() => {
      console.log('cron job backup done.');
    }).catch(err => console.log(err));
  },
  start: true
};
