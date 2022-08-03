conn = new Mongo('localhost:27017');
db = conn.getDB("mern-starter");
db.detailcriterias.remove({});

let mapper = {}, mapper2 = {};

db.criterias.find().forEach(function(criteria) {
	switch(criteria.key) {
		case 'pro':
			mapper.professional = criteria._id;
			mapper2[criteria._id] = 'professional';
			break;
		case 'npr':
			mapper.notProlong = criteria._id;
			mapper2[criteria._id] = 'notProlong';
			break;
		case 'exc':
			mapper.expertCommunication = criteria._id;
			mapper2[criteria._id] = 'expertCommunication';
			break;
		case 'sad':
			mapper.serviceAsDescribed = criteria._id;
			mapper2[criteria._id] = 'serviceAsDescribed';
			break;
	}
});
print('mapper:', mapper);
print('mapper2:', JSON.stringify(mapper2));

db.users.find({expert: 1}).forEach(function(expert) {
	let rateIds = [];
	expert.rating.forEach(function(rate) {
		let detailServiceRatings = [];
		rate.skills.forEach(function(skill) {
			let criteriaId = mapper[skill.skill_ID];
			if(criteriaId) {
				detailServiceRatings.push({
					rateId: rate._id,
					criteriaId: criteriaId,
					rate: skill.rate
				});
			}
		});
		
		db.detailcriterias.insert(detailServiceRatings);
		if(detailServiceRatings.length) {
			rateIds.push(rate._id);
		}
	});

	if(rateIds.length) {
		let agg = db.detailcriterias.aggregate([
			{
				$match: {rateId : {$in: rateIds}}
			},
			{
				$group: {
					_id: "$rateId",
					count: {$sum: 1}
				}
			}
		]);
		expert.serviceTotalRate = agg._batch.length;
		db.users.update({_id: expert._id}, {$set: {serviceTotalRate: expert.serviceTotalRate}});

		let agg2 = db.detailcriterias.aggregate([
			{
				$match: {rateId : {$in: rateIds}}
			},
			{
				$group: {
					_id: "$criteriaId",
					avgRate: {$avg: "$rate"}
				}
			}			
		]);
		agg2._batch.forEach(function(item) {
			let critId = item._id;
			print('critId:', critId);
			expert.serviceRating[mapper2[critId]] = item.avgRate;			
		});
		if('undefined' in expert.serviceRating) {
			delete expert.serviceRating['undefined'];
		}
		db.users.update({_id: expert._id}, {$set: {serviceRating: expert.serviceRating}});
	}

	print(expert.fullName);
});