import cuid from 'cuid';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import {Q} from '../libs/Queue';
import globalConstants from '../../config/globalConstants';
import Knowledge from './knowledge';
import {formatSkillByLanguage} from "../controllers/skill.controller";

const skillSchema = new Schema({
    categoryID : {type: String},
    description : [{languageID : String, name: String}],
    dateAdded : { type: 'Date', default: Date.now, required: true },
    cuid: { type: String, default: cuid, required: true },
    userID : {type: String},
    owners: {type: [Schema.ObjectId], ref: 'users'},
    interester: {type: [Schema.ObjectId], ref: 'users'}, // Array user object id interested this skill @Nhan note for feed
    knowledges: {type: [Schema.ObjectId], ref: 'knowledges'},
    questions: {type: [Schema.ObjectId], ref: 'questions'},
    tagged: {type: Number, default: 0},
    view: {type: Boolean, default: false},
    dateModified:{type:Date},
    modifiedBy:{type:Schema.ObjectId, refs: 'users'}
//    feeds: {type: [Schema.ObjectId], ref: 'feeds'},
});

skillSchema.index({tagged: -1});
skillSchema.index({view: 1});

skillSchema.post('save', (created, next) => {
  Q.create(globalConstants.jobName.SKILL_SYNC_ELASTIC, created).removeOnComplete(true).save();
  return next();
});

skillSchema.statics.createFeeds = async function(_this, feedOptions) {
  let skills = await _this.find({_id: {$in: feedOptions.skillIds}}, 'knowledges');
  let knowledgeIds = [];
  skills.forEach(skill => {
    Array.prototype.push.apply(knowledgeIds, skill.knowledges);
  });
  let knowledges = await Knowledge.find({_id: {$in: knowledgeIds}, state: 'published'});
  knowledges.forEach((knowledge) => {
    let opt = Object.assign({
      object: knowledge._id,
      actor: knowledge.authorId,
      action: 'published',
      type: 'knowledge'
    }, feedOptions);
    Q.create(globalConstants.jobName.CREATE_FEED, opt).removeOnComplete(true).save();
  })
}

skillSchema.statics.formatSuggestData = async function(_this, skillIds, langCode) {
  if(!langCode) langCode = 'en';
  let skills = await _this.find({_id: {$in: skillIds}}).lean();
  skills = formatSkillByLanguage(skills, langCode);
  return skills.map(skill => skill.description.name);
};

export default mongoose.model('Skill', skillSchema);
