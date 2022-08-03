conn = new Mongo();
db = conn.getDB("holla");
db.categories.update({}, {$set: {"owners": []}}, false, true);

db.users.find().forEach(function(user) {
	db.categories.update({_id: {$in: user.categories}}, {
		$push: {owners: user._id}
	}, {multi: true});
});