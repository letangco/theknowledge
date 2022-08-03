import mongoose from 'mongoose';
import Category from './category';
import User from './user';
import StringHelper from '../util/StringHelper';

const Schema = mongoose.Schema;

const suggestSkillSchema = new Schema({
    industryID: {type: String, required: true},
    departmentID: {type: String, required: true},
    skill: {type: String},
    description: {type: String},
    link: {type: String},
    userID: {type: String},
    status: {type: String, default: 1},
    dateAdded : { type: 'Date', default: Date.now, required: true },
    cuid      : { type: String, required: true }
});

suggestSkillSchema.index({userID: 1, departmentID: 1});

suggestSkillSchema.statics.getMetadata = async function(suggestSkill) {
  let object = JSON.parse(JSON.stringify(suggestSkill));
  let promises = [
    Category.findOne({cuid: suggestSkill.industryID}, 'title'),
    Category.findOne({cuid: suggestSkill.departmentID}, 'title')
  ]

  if(StringHelper.isObjectId(suggestSkill.userID)) {
    promises.push(User.findById(suggestSkill.userID, 'fullName avatar userName cuid'));
  } else {
    promises.push(User.findOne({cuid: suggestSkill.userID}, 'fullName avatar userName cuid'));
  }
  let metadata = await Promise.all(promises);

  object.industry = metadata[0];
  delete object.industryID;

  object.department = metadata[1];
  delete object.departmentID;

  object.requester = metadata[2];
  delete object.userID;

  return object;
}

export default mongoose.model('SuggestSkill', suggestSkillSchema);
