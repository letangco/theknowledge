import firebase_admin from 'firebase-admin';
const serviceAccount = require('../../config/tesse_firebase');
export const FirebaseAdmin = firebase_admin.initializeApp({
  credential: firebase_admin.credential.cert(serviceAccount),
  databaseURL: 'https://tessefcm.firebaseio.com',
}, 'messenger');
