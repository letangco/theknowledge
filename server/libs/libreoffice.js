const libre = require('libreoffice-convert');
const path = require('path');
const fs = require('fs');
const extend = '.pdf'
export async function convertPDFLibs(file) {
  return new Promise((resolve) => {
    const filename = getFile(file)
    if (checkConvert(file)) {
      let dir = path.join(__dirname, '../../' + file)
      const outputPath = path.join(__dirname, '../../' + filename + extend);
      const enterPath = fs.readFileSync(dir);
      libre.convert(enterPath, extend, undefined, async (err, done) => {
        if (err) {
          console.log(`Error converting file: ${err}`);
          resolve(file)
        }
        fs.writeFileSync(outputPath, done);
        fs.unlinkSync(dir)
        let link = checkChangeFormat(file)
        resolve(link)
      });
    } else {
      resolve(file)
    }
  })
}
function getFile(filePath) {
  return filePath.substr(filePath.lastIndexOf('\\') + 1).split('.')[0];
}

function checkConvert(file){
  var reg = /(.*?)\.(docx|doc|ppt|pptx|txt)$/;
  if(!file.match(reg)) return false;
  return true
}

function checkChangeFormat(file){
  file = file.split(".");
  return file[0]+".pdf";
}
