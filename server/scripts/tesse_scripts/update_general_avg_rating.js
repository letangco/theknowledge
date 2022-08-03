conn = new Mongo();
db = conn.getDB("tesse");

db.users.find({expert: 1}).forEach(function(user) {
	print('\n ' + user.fullName);
	let total_divable = 0;
	// calc skill rate
	let skillRateDivable = 0, sum_skill_rate = 0;
	user.reviews.forEach(function(review) {
	  if(review.avgRate > 0) {
	    skillRateDivable++;
	    sum_skill_rate += review.avgRate;
	  }
	});
	let skillRate = skillRateDivable ? sum_skill_rate / skillRateDivable : 0;
	print('skill rate: ' + skillRate);
	if(skillRate) total_divable++;

	// calc service rate
	let serviceRateDivable = 0, sum_service_rate = 0;
	for(let key in user.serviceRating) {
	  if(user.serviceRating[key] > 0 && (key != 'ECRate' && key != 'SADRate' && key != 'ProRate' && key != 'NPRate')) {
	    serviceRateDivable++;
	    sum_service_rate += user.serviceRating[key];
	  }
	}
	let serviceRate = serviceRateDivable ? sum_service_rate / serviceRateDivable : 0;
	print('service rate: ' + serviceRate);
	if(serviceRate) total_divable++;

	let generalRate = total_divable ? (serviceRate + skillRate) / total_divable : 0;
	print('generalRate: ' + generalRate);
//	db.users.update({_id: user._id}, {$set: {rate: generalRate}});
})