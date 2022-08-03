import NotificationNews from '../models/notificationNew';
import ArrayHelper from '../util/ArrayHelper';


export async function Merge(to,e) {
  try {
    //Load Array Object
    let conditions = {
      to:to._id,
      type:e
    };
    let objects = await NotificationNews.find(conditions);
    let arrayObject = [];
    await objects.map(async elm =>{
      if(arrayObject.indexOf(elm.object.toString()) === -1){
        arrayObject.push(elm.object.toString());
      }
    });
    // Merge
    let promises = arrayObject.map(async upvote =>{
      let options = {
        to:to._id,
        object:upvote,
        type:e
      };
      let node = await NotificationNews.find(options).sort({date:-1});
      //console.log(appoint);
      if(node.length>=1) {
        let arrayfrom = await node.map(async e => {
          return e.from.toString();
        });
        arrayfrom = await Promise.all(arrayfrom);
        //console.log("Type : ", e);
        // console.log(arrayfrom);
        arrayfrom = await ArrayHelper.uniqueValuesInArray(arrayfrom);
        //console.log(arrayfrom);
        await NotificationNews.update({_id: node[0]._id}, {$set: {'data.number': arrayfrom.length - 1}});
        for (let i = 1; i < node.length; i++) {
          await NotificationNews.remove({_id: node[i]._id});
          //console.log('da xoa')
        }
      }
    });
    return Promise.all(promises);
  }catch(err) {
    console.log('Error in Merge appointmentComment',err);
  }
}

export async function MergerReply(to,e) {
  try{
    let conditions = {
      to:to._id,
      type:e
    };
    let objects = await NotificationNews.find(conditions);
    let arrayObject = [];
    await objects.map(async elm =>{
      if(checkObjectInArray(elm,arrayObject) === 0){
        arrayObject.push({object:elm.object,parentId:elm.parentId});
      }
    });
    //console.log(arrayObject);
    let promises = arrayObject.map(async upvote =>{
      let options = {
        to:to._id,
        object:upvote.object,
        type:e,
        parentId:upvote.parentId
      };

      let node = await NotificationNews.find(options).sort({date:-1});
      //console.log("Node ------------------------------------ ", node.length);
      //console.log(appoint);
      if(node.length>0){
        let arrayfrom = await node.map(async e => {
          return e.from.toString();
        });
        arrayfrom = await Promise.all(arrayfrom);
        arrayfrom = await ArrayHelper.uniqueValuesInArray(arrayfrom);
        console.log("Type : ", e);
        console.log(arrayfrom);
        await NotificationNews.update({_id:node[0]._id},{$set:{'data.number':arrayfrom.length - 1}});
        for(let i = 1;i<node.length; i++){
          await NotificationNews.remove({_id:node[i]._id});
        }
      }
    });
    return Promise.all(promises);
  }catch (err){
    console.log('Error in Merge appointmentComment',err);
  }
}

function checkObjectInArray(elm,array) {
  for(let i = 0 ; i<array.length ; i++){
    if((array[i].object.toString()===elm.object.toString()) && (array[i].parentId.toString()===elm.parentId.toString())){
      return 1;
    }
  }
  return 0;
}
