import request from 'request';
var HttpsProxyAgent = require('https-proxy-agent');
import cheerio from 'cheerio';
import StringHelper from '../../util/StringHelper';
import SimpleQuestion from '../../models/simpleQuestions';
import URL from 'url';
import https from 'https';
var xhr = require("xhr");

const proxy_port = 1808;
const host = 'proxy-6.vietpn.com';
const user = 'vietphung';
const pass = 'abc123!';
// let  agent = new HttpsProxyAgent(proxy);

function buildAuthHeader(user, pass) {
  return 'Basic ' + new Buffer(user + ':' + pass).toString('base64');
}


const proxy = 'vietphung:abc123!@proxy-6.vietpn.com';

export async function crawl(url) {

  var options = {
    url: 'http://dantri.com.vn/',
    proxy : {
      'host' : host,
      'port': proxy_port,
      'auth' : `${user}:${pass}`,
      'protocol' : 'https:'
    }
  };



  request(options, (error, response, body) => {
    console.log('err:', error);
    if (!error && response.statusCode == 200) {
      console.log(body);
    }
  });

  // let options = {
  //   url: 'https://quora.com/Why-Node-js-Whats-so-special-about-it',
  //   proxy: {
  //     host: 'proxy-6.vietpn.com',
  //     port: 1808,
  //     auth: 'vietphung:abc123!'
  //   }
  //   // agent: new HttpsProxyAgent(proxy),
  //   // followRedirect: true
  //   // headers: {}
  // };
  // let body = await request(options);
  //
  //
  //
  // // console.log('body:', body);
  // let $ = cheerio.load(body);
  // let question = parseQuestion($);
  // let tags = parseTags($);
  // console.log('question:', question);
  // console.log('tags:', tags);
  // await SimpleQuestion.create({
  //   question: question,
  //   tags: tags
  // });
  //
  // xhr.get(url, (err, response, body) => {
  //   console.log('body:', body);
  // });
}

function parseQuestion($) {
  let question = $('.rendered_qtext').eq(0).text();
  question = StringHelper.standardize(question);

  return question;
}

function parseTags($) {
  let tags = $('.TopicNameSpan').map((i, elm) => {
    return $(elm).text();
  }).get();
  return tags;
}
