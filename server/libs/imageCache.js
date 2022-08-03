import validUrl from 'valid-url';
import request from 'request-promise';
import configs from '../config';
var fs = require('fs');
var Jimp = require("jimp");

const purgeCacheFileOptions = {
  method: 'DELETE',
  uri: `https://api.cloudflare.com/client/v4/zones/${configs.cloudFlare.zoneId}/purge_cache`,
  body: {
    files: []
  },
  headers: {
    'X-Auth-Email': configs.cloudFlare.authEmail,
    'X-Auth-Key': configs.cloudFlare.authKey
  },
  json: true // Automatically stringifies the body to JSON
};

function clearCachePath(paths) {
  if(! (paths instanceof Array) ) {
    paths = [paths];
  }

  let urls = paths.map(path => `${configs.clientHttpsHost}/${path}`);
  let options = Object.assign({}, purgeCacheFileOptions);
  options.body.files = urls;

  return request(options);
}

export async function cacheImage(data) {
  try {
    let type = data.src.split('.').pop();
    if(['jpg', 'jpeg', 'png'].indexOf(type) === -1){
      return data.src
    }
    data.src = data.src.replace(/^\//, '');
    if(!validUrl.isUri(data.src)){
      if(fs.existsSync(data.src)) {
        let newName = data.src.replace(/^.*[\\\/]/, '').replace(/\.[^/.]+$/, "") + '-'
          + data.size + 'x' + data.size + '.' + data.src.split('.').pop();
        let fileName = data.src.replace(/^.*[\\\/]/, '');
        let cachePath = data.src.replace(/uploads/, "cache").replace(fileName, newName);
        if (!fs.existsSync(cachePath)) {
          Jimp.read(data.src, async function (err, image) {
            if (err){
              return data.src
            }
            if(image){
              image.resize(data.size, Jimp.AUTO)
                .quality(60)
                .write(cachePath, async () => {
                  //await clearCachePath(cachePath);
                });
              return data.src
            } else {
              return data.src
            }
          });
          return data.src
        } else {
          return cachePath
        }
      } else {
        return data.src
      }
    } else {
      return data.src
    }
  } catch (e) {
    return data.src
  }
}

// export async function cacheImage(data) {
//   try {
//     let type = data.src.split('.').pop();
//     if(type[1]){
//       return data.src
//     }
//     if(['jpg', 'jpeg', 'png'].indexOf(type) === -1){
//       type = 'png';
//     }
//     data.src = data.src.replace('//','/');
//     if(!validUrl.isUri(data.src)){
//       if(fs.existsSync(data.src)) {
//         let newName = data.src.replace(/^.*[\\\/]/, '').replace(/\.[^/.]+$/, "") + '-'
//           + data.size + 'x' + data.size + '.' + type;
//         let fileName = data.src.replace(/^.*[\\\/]/, '');
//         let cachePath = data.src.replace(/uploads/, "cache").replace(fileName, newName);
//         let arrayPath = cachePath.split('/');
//         let dir = arrayPath[0];
//         for (let i = 1; i < arrayPath.length - 1; i++) {
//           dir +=`/${arrayPath[i]}`
//         }
//         if(!fs.existsSync(dir)){
//           await mkdir(dir);
//         }
//         if (!fs.existsSync(cachePath)) {
//           await Sharp(data.src).resize(data.size).toFile(cachePath);
//           return cachePath;
//         } else {
//           return cachePath;
//         }
//       } else {
//         return data.src;
//       }
//     } else {
//       return data.src;
//     }
//   } catch (err) {
//     console.log('Data ', data);
//     console.log('err cacheImage : ', err);
//     return data.src;
//   }
// }
