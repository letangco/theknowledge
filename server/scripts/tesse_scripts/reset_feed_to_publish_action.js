conn = new Mongo("localhost:27017");
db = conn.getDB("tesse");

db.knowledges.find({state: 'published'}).forEach(function (knowledge) {
  knowledge = JSON.parse(JSON.stringify(knowledge));
  var oid = ObjectId(knowledge._id['$oid']);
  // print('oid:', oid);

  db.feeds.update({object: oid}, {$set: {actor: oid, action: 'published'}}, {multi: true});
});

db.questions.find().forEach(function (question) {
  question = JSON.parse(JSON.stringify(question));
  var oid = ObjectId(question._id['$oid']);
  db.feeds.update({object: oid}, {$set: {actor: oid, action: 'asked'}}, {multi: true});
});

print('done');
