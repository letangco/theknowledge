

export async function numberRound(number, fix) {
  try{
    number = Math.ceil(number);
    return (Math.ceil(number/fix))*fix;
  } catch (err) {

  }
}

export async function roundNumber(number, round, flag = false) {
  try{
    let pow = Math.pow(10,round);
    let rs;
    if (number.toFixed(round)*pow === 0){
      return 0;
    }
    if (flag){
      rs = number.toFixed(round + 1)*pow.toString();
      let split = rs.split('.');
      if (split[1]*1 > 5){
        rs = (rs/pow).toFixed(round)*1;
      }else{
        rs = (number.toFixed(round)*pow + 1)/pow;
      }
    }else {
      rs = number.toFixed(round)*1;
    }
    return rs;
  }catch (err){
    console.log('err RoundNumber : ',err);
  }
}
