import Request from 'request-promise';
import configs from '../config';
import Nexmo from 'nexmo';
const nexmo = new Nexmo({
  apiKey: 'cd707ca1',
  apiSecret: 'A7WCGx4gp9qmmZ7I',
});
const accountSid = 'AC09d90a3be49e63e70d66ba4509d2140b';
const authToken = 'ca4da26ee7f4f1d47394c302daa73fd5';
const client = require('twilio')(accountSid, authToken);

export async function sendSMS(listPhone, Content) {
  try {
    let promise = listPhone.map(async e => {
      let to = e;
      if(to.indexOf('+84') === -1){
        to = `+84${to.slice(1)}`
      }
      // console.log(to);
      await client.messages.create({
        body: Content,
        from: '+18887665166',
        to: to
      });
    });
    await Promise.all(promise);
    /**
     * Send SMS by Nexmo
     * */
    // let from = 'Tesse Inc';
    // let phone = listPhone.split(',');
    // phone.map(e => {
    //   nexmo.message.sendSms(from, e, Content);
    // });
    /**
     * Send SMS by ESMS
     * */
    // let data = await Request({
    //   uri: `http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get`,
    //   qs:{
    //     Phone: listPhone,
    //     Content: Content,
    //     ApiKey: configs.eSms.apiKey,
    //     SecretKey: configs.eSms.secretKey,
    //     SmsType: 2,
    //     Brandname: configs.eSms.brandName
    //   },
    //   json: true
    // });
    // if(data && parseInt(data.CodeResult) === 100){
    //   return true
    // } else {
    //   console.log(data);
    //   throw {
    //     success: false,
    //     status: 400,
    //     error: 'Invalid Params SMS.'
    //   }
    // }
  }catch (err) {
    console.log('error send sms : ',err);
    throw {
      success: false,
      status: 500,
      error: "Send SMS failed."
    }
  }
}
