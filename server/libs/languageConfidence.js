import config from '../config';
const fetch = require('node-fetch');
export async function fetchResultLanguageConfidence(id, base64, script) {
  try {
    return fetch(config.languageconfidence.api, {
      method: 'post',
      body: JSON.stringify({
        format: 'mp3',
        content: script,
        audioBase64: base64
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.languageconfidence.key
      },
    })
      .then(response => response.json().then(json => ({json, response})))
      .then(({json, response}) => {
        if (!response.ok) {
          return Promise.reject(json);
        }
        return json;
      })
      .then(
        response => response,
        error => error
      );
  }catch (err){
    console.log("fetchResultLanguageConfidence ",err);
  }
}
