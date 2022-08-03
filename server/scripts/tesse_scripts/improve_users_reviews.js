conn = new Mongo('localhost:2017');
db = conn.getDB("tesse");

db.users.find({cuid: cuid}).forEach(function(expert) {
	print(expert.fullName);
	let userRates = db.ratings.find({expertId: expert._id}).map(function(rate) {
		return rate._id;
	});

	var reviews = expert.categories.map(function(cate) {
		let skillIds = [];
		let total_skillRate = 0;
		let divable = 0;
		let details = db.skills.find({categoryID: cate.department.departmentID, _id: {$in: expert.skills}}).map(function(skill) {
			let avgSkill = db.detailratings.aggregate([
				{
					$match: {
						rateId: {$in: userRates},
						skillId: skill._id,
						rate: {$gt: 0}
					}
				},
				{
					$group: {
						_id: "$skillId",
						avgRate: {$avg: "$rate"}
					}
				}
			]);
		//	print(avgSkill);
			skillIds.push(skill._id);
			let detail = {
				skillId: skill._id,
				avgRate: avgSkill._batch.length ? avgSkill._batch[0].avgRate : 0,
				skillName: skill.description[0].name
			};
			total_skillRate += detail.avgRate;
			divable += detail.avgRate > 0 ? 1 : 0;
			return detail;
		});
		details = details.sort(function(a, b) {
			return b.avgRate - a.avgRate;
		});
		let review = {
			cateCuid: cate.department.departmentID,
			cateName: cate.department.title,
			details: details
		};
		let agg = db.detailratings.aggregate([
			{
				$match: {
					rateId: {$in: userRates},
					skillId: {$in: skillIds}
				}
			},
			{
				$group: {
					_id: "$rateId",
					count: {$sum: 1}
				}
			}
		]);
		review.numRate = agg._batch.length;
		review.avgRate = divable > 0 ? total_skillRate / divable : 0;
		return review;
	});
	db.users.update({_id: expert._id}, {$set: {reviews: reviews}});
});
print('done');
