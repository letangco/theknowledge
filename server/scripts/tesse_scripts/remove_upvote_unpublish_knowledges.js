conn = new Mongo("localhost:2017");
db = conn.getDB("tesse");

var ids = db.knowledges.find({state: {$ne: 'published'}}).map(function(knowledge) {
	return knowledge._id;
});

print('ids:', ids);

db.knowledgeupvotes.remove({knowledgeId: {$in: ids}});
db.knowledges.update({_id: {$in: ids}}, {$set: {upVotes: 0}}, {multi: true});
print('done.');