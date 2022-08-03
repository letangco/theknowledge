import configs from '../config';
import request from 'request-promise';
import querystring from 'querystring';

const defaultResponse = "I'm Tess Bot from Tesse Inc.";
const baseUrl = `http://api.simsimi.com/request.p?lc=${configs.simsimi.lc}&ft=${configs.simsimi.ft}&text=`;
const baseQuery = {
  key: configs.simsimi.key,
  lc: configs.simsimi.lc,
  ft: configs.simsimi.ft
};
const STOPWORDS_REGEX = new RegExp(/(fuck|fck|bitch|dick|cock|boop|sex|make love|shut up|đm|dm|đụ|địt|đéo|cặc|lồn|lìn|kẹc|cẹc|vãi|cứt|má mày|má mầy|mẹ mày|mẹ mầy)/g);

let keys = [
  'f25140ee-054a-489d-b5c8-e82cb16a8cda',
  '73cc00c9-1857-45c1-b96b-bbea0b7a4c6e',
  'fc161809-b0ba-4b7d-b1c9-864829ab2370',
  'b3d605ec-e8d0-4343-a59b-7f64ac67cef8',
  '4caa18a4-1274-4c15-a12c-d00adb493232',
  'b3a7d74d-fc32-4306-945f-4657d1d95263'
];
module.exports = {
  chat: async (text) => {
    try {
      let queryOptions = Object.assign({}, baseQuery);
      queryOptions.text = text;
      let query = querystring.stringify(queryOptions);
      let url = configs.simsimi.baseUrl + query;
      // console.log('url:', url);
      let rs = await request(url);
      rs = JSON.parse(rs);
      // console.log('rs:', rs);
      if (rs.result === 100) {
        let content = rs.response.replace(/(simsimi|Simsimi|Simi|simi|Sim|sim)/g, 'Tess Bot');
        if(STOPWORDS_REGEX.test(content.toLowerCase())) {
          return "Let's smile then say yes";
        }
        return content;
      }

      // console.log('df');
      return defaultResponse;
    } catch (err) {
      console.log('err:', err);
      return defaultResponse;
    }
  }
};
