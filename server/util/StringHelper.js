import LanguageDetect from 'languagedetect';
import cheerio from 'cheerio';
import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';
import {generateCouponCode} from '../models/functions';

let languageDetect = {};
const YTB_REGEX = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
const QUESTION_WORDS = ['what', 'who', 'where', 'when', 'why', 'which', 'how', '?'];

export default {
    detectLanguage: (text, format) => {
        if (!format) {
            format = 'iso2';
        }

        if (!languageDetect[format]) {
            languageDetect[format] = new LanguageDetect(format);
        }

        var arrLanguages = languageDetect[format].detect(text, 2);
        var lang = null;
        for (var i = 0; i < arrLanguages.length; i++) {
            lang = arrLanguages[i];
            if ((lang instanceof Array) && lang[0] !== null)
            {
                return lang[0];
            }
        }

        return 'un';
    },

    standardize: (text) => {
        return text.replace(/\s+/g,' ').trim();
    },

    generalCodeUser: (code) => {
      code = code.toString();
      var pad = "000000";
      return 'TE-' + pad.substring(0, pad.length - code.length) + code;
    },

    generalCourseUser: (code) => {
      code = code.toString();
      var pad = "000000";
      return 'CS-' + pad.substring(0, pad.length - code.length) + code;
    },

    generalCodeOrder: (code) => {
      code = code.toString();
      var pad = "000000";
      return 'CO-' + pad.substring(0, pad.length - code.length) + code;
    },
    generalCodeActiveOrder: () => {
      return `ORDER-${generateCouponCode(8)}`;
    },

    // eo biet dat ten tieng anh sao het @@
    xoa_dau: (str) => {
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
        str = str.replace(/Đ/g, "D");
        return str;
    },

    removeSpecialCharacters: (str) => {
        return str.replace(/[^0-9a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/gi, '');
    },

    isObjectId: (str) => {
        if (str instanceof mongoose.Types.ObjectId) {
          return true;
        }
        return !! ( typeof str === 'string' && str.match(/^[0-9a-fA-F]{24}$/) );
    },

    detectKnowledgeThumbnail: (self, html) => {
        html = html.replace(/[\\\\]/g, '');
//        console.log('html:', html);
        let $ = cheerio.load(html);
        let urls = $('figure').map((item, el) => {
            let imgUrl = $(el).children('img').attr('src');
            if(imgUrl) {
//                console.log('co image ne');
                let index = imgUrl.indexOf('/public');
                return imgUrl.substring(index);
            }
//            console.log('co youtube ne');
            let videoUrl = $(el).find('div > iframe').attr('src');
//            let videoId = self.getYoutubeIdFromUrl(videoUrl);
            return videoUrl;
        }).get();

        return urls;
    },

    getYoutubeIdFromUrl: (url) => {
        let matches = url.match(YTB_REGEX);
        return matches[7] && matches[7].length === 11 ? matches[7] : null;
    },

  buildSlug: (_this, title) => {
    try {
      title = _this.xoa_dau(title);
      title = title.replace(/[^a-zA-Z0-9\s]+/g, ' ');
      title = _this.standardize(title);
      let simpleSlug = title.split(' ').join('-').toLowerCase();
      simpleSlug = simpleSlug.replace(/\//g, '-');
      return simpleSlug;
    } catch (err) {
      console.log('err on build slug:', err);
    }
  },

  sanitizeHtml: (string) => {
    let sanitized = sanitizeHtml(string);
    return sanitized != 'undefined' ? sanitized : null;
  },

  isAQuestion: (string) => {
    let i = 0, len = QUESTION_WORDS.length;
    for(i; i<len; i++) {
      if(string.indexOf(QUESTION_WORDS[i]) >= 0) {
        break;
      }
    }
    return i < len;
  },
  upperCaseFirstLetter:(string)=>{
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  roundNumber: (number, round, flag = false) => {
    try{
      let pow = Math.pow(10,round);
      let rs;
      if (flag){
        rs = number.toFixed(round + 1)*pow.toString();
        let split = rs.split('.');
        if (split[1]*1 > 5){
          rs = (rs/pow).toFixed(round)*1;
        }else{
          rs = (number.toFixed(round)*pow + 1)/pow;
        }
      }else {
        rs = number.toFixed(round)*1;
      }
      return rs;
    }catch (err){
      return number.toFixed(round);
    }
  },
  mongoObjectToTime: (string) => {
      if(!this.isObjectId(string)) return 0
    return new Date(new Date(parseInt(string.substring(0, 8), 16) * 1000)).getTime();
  },

};
