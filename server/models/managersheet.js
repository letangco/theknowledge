import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ManagerSheet = new Schema({
  slug:{type:String,required:true},
  title:{type:String,required:true},
  spreadsheetId:{type:String, required:true}
});

export default mongoose.model('managersheet', ManagerSheet);
