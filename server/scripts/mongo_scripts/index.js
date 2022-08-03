import fs from 'fs';
import configs from '../../config';
import execa from 'execa';

const fulDir = './server/scripts/mongo_scripts/';
const dir = 'server/scripts/mongo_scripts/';



export default class MongoScripts{
  constructor() {
    this.scripts = fs.readdirSync(fulDir).map(scriptName => {
      let obj = {
        _id: scriptName.split('.').shift(),
        value: fs.readFileSync(fulDir+scriptName, 'utf8')
      };
    //  console.log(obj);
      return obj;
    });
  }

  async init() {
    try {
      let string = "conn = new Mongo('localhost:"+configs.dbPort+"');\n" +
        "db = conn.getDB('"+configs.databaseName+"');\n" +
        "db.system.js.save("+JSON.stringify(this.scripts)+");";
      await fs.writeFile(fulDir + 'import.js', string);

      return "cd ~/ && mongo --port " + configs.dbPort + " " + configs.uploadFolder + dir + "import.js";
    } catch(err) {
      throw err;
    }
  }

  async startImport() {
    try {
      let importShell = await this.init();
      await execa.command(importShell);
      console.log('import mongo scripts done.');
    } catch(err) {
      console.log('err on import mongo scripts:', err);
      process.exit();
    }
  }
};
