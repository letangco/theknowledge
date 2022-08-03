conn = new Mongo("localhost:27017");
db = conn.getDB("mern-starter");

db.suggestskills.find({}).forEach(function(suggestSkill) {
	var user = db.users.findOne({cuid: suggestSkill.userID});
	if(user)
		db.suggestskills.update({_id: suggestSkill._id}, {$set: {"userID": user._id}});
	print('done ' + suggestSkill.skill);
});