import Follow from '../../models/follow';
import {Q} from '../../libs/Queue';

module.exports = async function () {
  console.log('MigrateOldFeedFollow');
  let follows = await Follow.find();
  follows.forEach(follow => Q.create('createFeedAfterFollow', follow).removeOnComplete(true).save());
};
