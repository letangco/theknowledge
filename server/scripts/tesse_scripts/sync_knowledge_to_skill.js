conn = new Mongo();
db = conn.getDB("mern-starter");

db.knowledges.find({state: 'published'}).forEach(function(knowledge) {
	let skillIds = [];
	knowledge.tags.forEach(function(tag) {
		if(tag.id !== 'un') skillIds.push(ObjectId(tag.id));
	});
	print('skillIds:', skillIds);
	db.skills.find({_id: {$in: skillIds}}).forEach(function(skill) {
		if(skill.knowledges)
			skill.knowledges.push(knowledge._id);
		else
			skill.knowledges = [knowledge._id];
		db.skills.update({_id: skill._id}, {$set: {knowledges: skill.knowledges}});
		print(skill.description[0].name);
	});
});