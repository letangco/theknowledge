import moongose from 'mongoose';

const Schema = moongose.Schema;

const exportSheet = new Schema({
  user:{type:Schema.ObjectId,required:true},
  rows:{type:Number, required:true}
});

export default moongose.model('managerexport', exportSheet);
