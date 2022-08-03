conn = new Mongo("localhost:27017");
db = conn.getDB("tesse");
var newFollows = []; // Use to field data
// Get all old data
db.follows.find().map(function(follow) {
	var userFromCuid = follow.userID;
	var userFrom = db.users.findOne({cuid: userFromCuid});
	var userFromId = userFrom._id; //_id
	var dateAdd = follow.dateAdd;

	follow.following.map(function(userToCuid){
		var userTo = db.users.findOne({cuid: userToCuid}, {_id: 1});
		newFollows.push({
			from: userFromId,
			to: userTo._id,
			dateAdd: dateAdd
		});
	});
});
// Remove old data
db.follows.drop();
// Add new data
db.follows.insertMany(newFollows);