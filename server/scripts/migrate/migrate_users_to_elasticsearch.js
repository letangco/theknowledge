import User from '../../models/user';
import Elasticsearch from '../../libs/Elasticsearch';

module.exports = async function () {
  let users = await User.find({active: 1}).lean();
  let userDoc = users.map(user => User.buildElasticDoc(user));
  await Elasticsearch.multiIndex('users', userDoc);
  console.log('sync user to elasticsearch done.');
  return true;
};
