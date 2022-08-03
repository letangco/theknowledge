import Skill from '../../models/skill';
import Category from '../../models/category';
import ArrayHelper from '../../util/ArrayHelper';
import Elasticsearch from '../../libs/Elasticsearch';
import {Q} from "../../libs/Queue";
import globalConstants from "../../../config/globalConstants";

module.exports = async function () {
  let skills = await Skill.find({}).lean();
  let promise = skills.map(async  e => {
    Q.create(globalConstants.jobName.SKILL_SYNC_ELASTIC, e).removeOnComplete(true).save();
  });
  await Promise.all(promise);
  console.log('done sync skills.');
  return true;
};
