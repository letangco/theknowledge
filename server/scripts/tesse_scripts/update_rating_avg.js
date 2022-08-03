conn = new Mongo('localhost:27017');
db = conn.getDB("mern-starter");

db.ratings.find().forEach(function(rate) {
	let avgSkillRate = 0, avgServiceRate = 0, divable = 0;
	let agg1 = db.detailratings.aggregate([
		{$match: {rateId: rate._id}},
		{
			$group: {
				_id: '$rateId',
				avgRate: {$avg: "$rate"}
			}
		}
	]);
	if(agg1._batch.length) {
		avgSkillRate = agg1._batch[0].avgRate;		
		divable++;
	}

	let agg2 = db.detailcriterias.aggregate([
		{
			$match: {rateId : rate._id}
		},
		{
			$group: {
				_id: "$rateId",
				avgRate: {$avg: "$rate"}
			}
		}			
	]);
	
	if(agg2._batch.length) {
		avgServiceRate = agg2._batch[0].avgRate;
		divable++;
	}
	if(divable) {
		let avg = (avgSkillRate + avgServiceRate) / divable;
		db.ratings.update({_id: rate._id}, {$set: {avg: avg}});
	}
});
print('done');