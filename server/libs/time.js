export async function getNumberTimeZone(timeZone) {
  try{
    if(timeZone !== ""){
      let timezone = timeZone.slice(1,4);
      return parseInt(timezone);
    }else {
      console.log("Param Null!");
    }
  }catch (err){
    console.log("getNumberTimeZone ",err);
  }
}
