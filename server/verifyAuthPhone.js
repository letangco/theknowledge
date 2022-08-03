import {FirebaseAdmin} from "./libs/firebaseAdmin";

export async function verifyPhone(idToken) {
  try {
    return await FirebaseAdmin.auth().verifyIdToken(idToken);
  }catch (err){
    console.log('error verifyPhone : ', err);
    return false;
  }
}
