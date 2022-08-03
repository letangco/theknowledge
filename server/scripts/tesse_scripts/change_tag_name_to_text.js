conn = new Mongo('localhost:27017');
db = conn.getDB("mern-starter");

db.knowledges.find().forEach(function(knowledge) {
	let newTags = knowledge.tags.map(function(tag) {
		return {id: tag.id, text: tag.name};
	});
	db.knowledges.update({_id: knowledge._id}, {$set: {tags: newTags}});
});