import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import config from '../../config';
import path from 'path';
import googleAuth from 'google-auth-library';

const OAuth2Client = google.auth.OAuth2;
let SCOPES = ['https://www.googleapis.com/auth/spreadsheets']; //you can add more scopes according to your permission need. But in case you chang the scope, make sure you deleted the ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json file
const TOKEN_DIR = path.join(__dirname,'..','..','..','server');//the directory where we're going to save the token
const TOKEN_PATH = TOKEN_DIR + '/drive_token.json'; //the file which will contain the token
const TOKEN_CREDENTIALS = TOKEN_DIR + '/client_secret.json';
class Authentication {
  // authenticate(){
  //   return new Promise((resolve, reject)=>{
  //     let credentials = this.getClientSecret();
  //     this.authorize(credentials,(err, auth)=>{
  //       if(err){
  //         reject();
  //       } else {
  //         resolve(auth);
  //       }
  //     });
  //   });
  // }
  // getClientSecret(){
  //   return require('../../../config/credentials.json');
  // }
  // authorize(credentials, callback) {
  //   console.log(TOKEN_PATH);
  //   let clientSecret = credentials.installed.client_secret;
  //   let clientId = credentials.installed.client_id;
  //   let redirectUrl = credentials.installed.redirect_uris[0];
  //   let auth = new googleAuth();
  //   let oauth2Client =  auth.OAuth2(clientId, clientSecret, redirectUrl);
  //   fs.readFile(TOKEN_PATH, (err, token) => {
  //     if (err) {
  //       this.getNewToken(oauth2Client, callback);
  //     } else {
  //       oauth2Client.credentials = JSON.parse(token);
  //       callback(oauth2Client);
  //     }
  //   });
  // }
  // getNewToken(oauth2Client, callback) {
  //   let authUrl = oauth2Client.generateAuthUrl({
  //     access_type: 'offline',
  //     scope: SCOPES
  //   });
  //   console.log('Authorize this app by visiting this url: ', authUrl);
  //   let rl = readline.createInterface({
  //     input: process.stdin,
  //     output: process.stdout
  //   });
  //   rl.question('Enter the code from that page here: ', (code) => {
  //     rl.close();
  //     oauth2Client.getToken(code, (err, token) => {
  //       if (err) {
  //         console.log('Error while trying to retrieve access token', err);
  //         return;
  //       }
  //       oauth2Client.credentials = token;
  //       this.storeToken(token);
  //       callback(oauth2Client);
  //     });
  //   });
  // }
  // storeToken(token) {
  //   try {
  //     fs.mkdirSync(TOKEN_DIR);
  //   } catch (err) {
  //     if (err.code != 'EEXIST') {
  //       throw err;
  //     }
  //   }
  //   fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  //   console.log('Token stored to ' + TOKEN_PATH);
  // }

  authenticate(){
    return new Promise((resolve, reject)=>{
      fs.readFile(TOKEN_CREDENTIALS, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        this.authorize(JSON.parse(content), (err,auth)=>{
          if(err){
            reject()
          }else {
            resolve(auth)
          }
        });
      });
    });
  }

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
  authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        return this.getNewToken(oAuth2Client, callback);
      } else {
        oAuth2Client.get
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(err, oAuth2Client);
      }
    });
  }

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
  getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      console.log('asdasdasdsads');
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        oAuth2Client.credentials = token;
        this.storeToken(token);
        callback(oAuth2Client);
      });
    });
  }

  storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
  }
}

module.exports = new Authentication();
