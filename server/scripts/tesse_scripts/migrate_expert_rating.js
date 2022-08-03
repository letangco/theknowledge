conn = new Mongo();
db = conn.getDB("tesse");

db.ratings.remove({});
db.createCollection('detailratings');
db.detailratings.remove({});

db.users.find({expert: 1}).forEach(function(expert) {
	print(expert.fullName);
	var departmentIds = expert.categories.map(function(cate) {
		return cate.department.departmentID;
	});
	expert.rating.forEach(function(rating) {
		var user = db.users.findOne({cuid: rating.cuid});
		var newRating = {
			_id: rating._id,
			from: user._id,
			expertId: expert._id,
			createdDate: rating.date,
			comment: rating.cmt
		};
		db.ratings.insert(newRating);
		var details = [];

		
		rating.skills.forEach(function(skill) {
			var sk = db.skills.findOne({
				"description.name": skill.skill_ID,
				"categoryID": {$in: departmentIds}
			});
			if(sk) {
				details.push({
					rateId: rating._id,
					skillId: sk._id,
					rate: skill.rate
				});
			}
			// print(rating._id.toString());
			// if(rating._id.toString() === 'ObjectId("58e3bcb45bb2065955501c1c")') {
			// 	print(sk);
			// }
		});

		db.detailratings.insert(details);
	});
});

// var details = db.detailratings.aggregate([
// 	// {
// 	// 	$match: {
// 	// 		rateId: {$in: [1, 2]},
// 	// 		skillId: {$in: ["a", "d"]}
// 	// 	}
// 	// },
// 	{
// 		$group: {
// 			_id: null, 
// 			sum_rate: {$sum: "$rate"}
// 		}
// 	},
// 	{$sort: {sum_rate: -1}}
// ]);

// print(JSON.stringify(details));
