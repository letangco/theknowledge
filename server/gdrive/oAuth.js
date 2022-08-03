import {google} from 'googleapis';
import readline from 'readline';
import fs from 'fs';
import config from '../config';
//================Get auth==================
const jsonPath = config.gdrive.clientPath;
const key = require(jsonPath);
const SCOPES = 'https://www.googleapis.com/auth/drive';
const TOKEN_PATH = config.gdrive.tokenPath;
const TOKEN_DIR = config.gdrive.tokenDir;

export function getOAuth(callback) {
  const oauth2Client = new google.auth.OAuth2(key.installed.client_id, key.installed.client_secret, key.installed.redirect_uris[0]);
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback();
    }
  });
  return oauth2Client;
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param callback
 */
function getNewToken(oauth2Client, callback) {
  let authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('GDrive, Authorize this app by visiting this url: ', authUrl);
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    console.log('code:');
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      callback();
      storeToken(token);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), function(err) {
    if ( err ) {
      console.log('Drive token:');
      console.log('Have error when store drive token:', err.message);
    } else {
      console.log('Token stored to:', TOKEN_PATH);
    }
  });
}
