/**
 * Entry Script
 */
const path = require('path');

require('dotenv').config({
  path: path.resolve(process.cwd(), '.hook.env'),
});
require('@babel/register');
require('@babel/polyfill');
require('./destroy-hooks');
