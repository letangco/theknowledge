conn = new Mongo('localhost:2017');
db = conn.getDB("tesse");

db.feeds.find({}).forEach(function (feed) {
  db.feeds.update({_id: feed._id}, {$set: {updatedDate: feed.createdDate}});
});
