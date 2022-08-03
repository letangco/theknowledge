conn = new Mongo("localhost:27017");
db = conn.getDB("tesse");

var userIds = db.users.find({active: 1}, {_id: true}).map(function (user) {
  return user._id;
});

var invalidAnswerIds = [];
db.questionanswers.find({}).forEach(function (answer) {
  if (userIds.indexOf(answer.user) < 0) invalidAnswerIds.push(answer._id);
});
print('invalid answer:', invalidAnswerIds.length);

var invalidCommentIds = [];
db.comments.find().forEach(function (comment) {
  if (userIds.indexOf(comment.publisherId) < 0) invalidCommentIds.push(comment._id);
});
print('invalid comment:', invalidCommentIds.length);

db.questionanswers.remove({_id: {$in: invalidAnswerIds}});
db.comments.remove({_id: {$in: invalidCommentIds}});

print('done');
