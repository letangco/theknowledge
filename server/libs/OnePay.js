var querystring = require('querystring');
const crypto = require('crypto');
var http = require('http');
var rp = require('request-promise');
var parseString = require('xml2js').parseString;
import configs from '../config';
const onePayConfigs = configs.onePage;
exports.PayPost = (body) => {
  return new Promise((resolve, reject) => {
    let access_key = onePayConfigs.accessKey;
    let secret_key = onePayConfigs.secretKey;
    let transRef = body.transRef;
    // create signature trans to server
    let data = 'access_key=' + access_key
      + '&pin=' + body.pin
      + '&serial=' + body.serial
      + '&transRef=' + transRef
      + '&type=' + body.type;

    //hash SHA256
    let signature = crypto.createHmac('sha256', secret_key).update(data).digest('hex');

    data = querystring.stringify({
      access_key: access_key,
      pin: body.pin,
      serial: body.serial,
      transRef: transRef,
      type: body.type,
      signature: signature
    });


    var options = {
      hostname: 'api.1pay.vn',
      port: 80,
      path: '/card-charging/v5/topup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      },
    };

    var requesta = http.request(options, function (responsive) {
      responsive.setEncoding('utf8');
      responsive.on('data', function (body) {
        try {
          resolve(JSON.parse(body))
        } catch (error) {
          reject(error)
        }
      });
    });
    requesta.on('error', function (e) {
      console.log('problem with request: ' + e.message);
      reject(e.message);
    });
    requesta.write(data);
    requesta.end();
  });
}

export async function getRateUSD() {
  return new Promise((resolve, reject) => {
    rp(configs.rateCurrency)
    .then(function (res) {
      parseString(res, function (err, result) {
        if(result && result.ExrateList && result.ExrateList.Exrate){
          result.ExrateList.Exrate.map(currency => {
            if(currency['$'] && currency['$'].CurrencyCode && currency['$'].CurrencyCode =='USD'){
              resolve(parseInt(currency['$'].Sell));
            }
          });
          resolve(0);
        }
        resolve(0);
      });
    })
    .catch(function (err) {
      reject(err);
    });
  });
}
