conn = new Mongo("localhost:27017");
db = conn.getDB("mern-starter");

db.users.find({}).forEach(function(user) {
	var oldAvt = user.avatar;
	if(oldAvt) {
		var newAvt = oldAvt.replace('/upload', 'upload');
		db.users.update({_id: user._id}, {$set: {avatar: newAvt}});
	}
});


