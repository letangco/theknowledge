import request from 'request-promise';
import sha256 from 'sha256';
import configs from '../config';

const vtpPayConfigs = configs.vtpPay;

function getDefaultRequestOptions(debug) {
  return {
    method: 'GET',
    uri: debug ? vtpPayConfigs.apiEndPointSandbox : vtpPayConfigs.apiEndPoint,
    body: {},
    json: true
  };
}

function getChecksum(payload) {
  let payloadClone = Object.assign({}, payload);

  let keys = Object.keys(payloadClone);
  let values = keys.map(key => {
    return payloadClone[key];
  });
  let string = values.join('') + webmoneyConfigs.merchantCode + webmoneyConfigs.passcode;
  let hash = crypto.createHmac('sha1', webmoneyConfigs.secretKey).update(string).digest('HEX').toUpperCase();
  return hash;
}

export function checkResultsPay(payment) {
  let string = payment.amount + "|" + payment.message + "|" + payment.payment_type + "|" + payment.reference_number + "|" + payment.status + "|" + payment.trans_ref_no + "|" + payment.website_id + "|" + vtpPayConfigs.secretKey;
  let hash = sha256(string);
  hash = hash.toUpperCase();
  if(hash == payment.signature) return true;
  return false;
}
function getHashText(payment){
  let paymentType = '';
  if(payment.type == 'vtcpay'){
    paymentType = 'VTCPay';
  } else if(payment.type == 'vtcpayVisa'){
    paymentType = 'InternationalCard';
  } else if(payment.type == 'vtcpayBank'){
    if(payment.bank){
      paymentType = payment.bank;
    } else {
      paymentType = 'DomesticBank';
    }
  }
  let dataArray = [payment.amount, payment.currency,paymentType , vtpPayConfigs.accountName, payment._id, '', vtpPayConfigs.webId, vtpPayConfigs.secretKey]
   let string = dataArray.join('|');
  //let string = '10000|VND||0963465816|121212121212121212121||22084|%a-$Z6mse7SnjNKW.LJa2dA';
  let hash = sha256(string);
  hash = hash.toUpperCase();
  return hash;
}
export async function createOrder(user = {}, payment, debug) {
  let sign = await getHashText(payment);
  let paymentType = '';
  if(payment.type == "vtcpay"){
    paymentType = 'VTCPay';
  } else if(payment.type == 'vtcpayVisa'){
    paymentType = 'InternationalCard';
  } else if(payment.type == 'vtcpayBank'){
    if(payment.bank){
      paymentType = payment.bank;
    } else {
      paymentType = 'DomesticBank';
    }
  }
  let dataRequest =  debug ? vtpPayConfigs.apiEndPointSandbox : vtpPayConfigs.apiEndPoint;

  //               "?website_id=22084&currency=VND&reference_number=121212121212121212121&amount=10000&receiver_account=0963465816&url_return=&signature=3271DAD518D9BCE7442E1F8F84FC5D8E84DDCFAB5140A43FFAD6D17C28C4130E&payment_type="
  dataRequest += "?website_id=" + vtpPayConfigs.webId + "&currency=" + payment.currency +  "&reference_number=" + payment._id + "&amount=" + payment.amount +  "&receiver_account=" + vtpPayConfigs.accountName + "&url_return=&signature=" + sign + '&payment_type=' + paymentType;
 // dataRequest += "&bill_to_surname=" + user.firstName + '&bill_to_forename=' + user.lastName + "&bill_to_email=" + user.email + "&language=vi";
  return dataRequest;
}

export function viewOrder(paymentId) {
  let payload = {mTransactionID: paymentId};
  payload.checksum = getChecksum(payload);
  let reqOptions = getDefaultRequestOptions();
  reqOptions.uri += 'view-order';
  reqOptions.body = payload;

  return request(reqOptions);
}