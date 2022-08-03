import {google} from 'googleapis';
import config from '../config';
//================Get auth==================
const jsonPath = config.gdrive.authFilePath; // The nodejs application json path
const key = require(jsonPath);
const scopes = 'https://www.googleapis.com/auth/drive';

export function getJWTAuth() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = jsonPath;
  return new google.auth.JWT(key.client_email, null, key.private_key, scopes);
}