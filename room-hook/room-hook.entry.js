/**
 * Entry Script
 */
const path = require('path');
console.log('room-hook/.env:', path.resolve(process.cwd(), 'room-hook/.env'));
require('dotenv').config({
  path: path.resolve(process.cwd(), 'room-hook/.env'),
});
require('@babel/register');
require('@babel/polyfill');
require('./index');
