//Encode & Decode String
const crypto = require('crypto');
const SaltLength = 16;
const SALT_SET = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
const PASSWORD_SET = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ~!@#$%^&*()';
const INVITE_CODE_SET = '0123456789ABCDEFGHIJKLMNOPQURSTUVWXYZ';

function createHash(password) {
    var salt = generateSalt(SaltLength);
    var hash = md5(password + salt);
    return salt + hash;
}

function validateHash(hash, password) {
    var salt = hash.substr(0, SaltLength);
    var validHash = salt + md5(password + salt);
    return hash === validHash;
}

function generateSalt(len) {
  // let setLen = SALT_SET.length, salt = '';
  // for (let i = 0; i < len; i++) {
  //   let p = Math.floor(Math.random() * setLen);
  //   salt += SALT_SET[p];
  // }
  return generateString(SALT_SET, len);
}

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

function generatePassword(len) {
  // let setLen = PASSWORD_SET.length, salt = '';
  // for (let i = 0; i < len; i++) {
  //   let p = Math.floor(Math.random() * setLen);
  //   salt += PASSWORD_SET[p];
  // }
  let salt = generateString(PASSWORD_SET, len);
  return md5(salt);
}
function checkTimeRedelete(userInfo){
    var now = new Date().getTime();
    var myDate = new Date(userInfo.deleteDate);
    var time = myDate.getTime() + 1209600000;
    if(now > time){
        return false; // user nay het xai duoc roi
    } else {
        return true; // user nay con xai duoc
    }
}
function generateInviteCode (length) {
  return generateString(INVITE_CODE_SET, length || 6);
}
function generateCouponCode(length) {
  return generateString(INVITE_CODE_SET, length || 10)
}
function generateString (set, length) {
  let setLen = set.length, salt = '';
  for (let i = 0; i < length; i++) {
    let p = Math.floor(Math.random() * setLen);
    salt += set[p];
  }
  return salt;
}
module.exports = {
    'hash': createHash,
    'validate': validateHash,
    'generatePassword': generatePassword,
    'checkTimeRedelete': checkTimeRedelete,
    'generateInviteCode': generateInviteCode,
    "generateCouponCode": generateCouponCode
};
