conn = new Mongo();
db = conn.getDB("tesse");
db.skills.update({}, {$set: {"owners": []}}, false, true);
db.users.update({}, {$set: {"skills": []}}, false, true);

db.users.find({expert: 1}).forEach(function(expert) {
	if(expert.fullName !== 'Tesse Support' && expert.fullName !== 'Customer Support') {
		print(expert.fullName);
		var skillIds = [];
		expert.categories.forEach(function(cate) {
			var cuid = cate.department.departmentID;
			print('cuid:', cuid);
			var names = cate.skills.map(function(skill) {
				return skill.skill_ID;
			});
			db.skills.find({
				description: {$elemMatch: {name: {$in: names}}}, 
				categoryID: cuid
			}).forEach(function(skill) {
				print(skill);
				skillIds.push(skill._id);
			});
		});
		 db.users.update({_id: expert._id}, {$set: {"skills": skillIds}});
		print(skillIds.length);

		db.skills.find({_id: {$in: skillIds}}).forEach(function(skill) {
			var expertIds = skill.owners;			
			expertIds.push(expert._id);
			db.skills.update({_id: skill._id}, {$set: {"owners": expertIds}});
		});
	}
});

// db.users.find({skills: {$in: [ObjectId("5840fa4937513ba90b70f4aa")]}}, {fullName: 1}).forEach(function(user) {
// 	print(JSON.stringify(user));
// });

