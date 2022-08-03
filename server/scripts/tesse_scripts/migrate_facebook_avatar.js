conn = new Mongo('localhost:2017');
db = conn.getDB("tesse");

// migrate http:// -> https://
db.users.find({avatar: /^http:\/\//}).forEach(function (user) {
  let avatar = user.idSocial ? 'https://graph.facebook.com/'+user.idSocial+'/picture?type=large&redirect=true&width=720&height=720' : undefined;
  db.users.update({_id: user._id}, {$set: {avatar: avatar}});
});
print('done migrate http to https');

// migrate https://scontent -> https://graph.facebook.com
db.users.find({avatar: /https:\/\/scontent/}).forEach(function (user) {
  let avatar = user.idSocial ? 'https://graph.facebook.com/'+user.idSocial+'/picture?type=large&redirect=true&width=720&height=720' : undefined;
  db.users.update({_id: user._id}, {$set: {avatar: avatar}});
});
print('done migrate https://scontent to https://graph.facebook.com');
