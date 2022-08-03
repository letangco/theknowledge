conn = new Mongo("localhost:27017");
db = conn.getDB("mern-starter");

print("Total skills num:", db.skills.count());
var index = 0;
var wrongFormatCount = 0;
db.skills.find().map(function(skill) {
	if(skill.dateAdded instanceof Date == false) {
		var dateString = skill.dateAdded.slice(9, 33);
		var newDate = new Date(dateString);
		var finalDate = newDate.toISOString();
		print("skill _id", skill._id);
		print("skill before mirgate", skill.dateAdded);
		db.skills.update({_id: skill._id}, {$set: {dateAdded: newDate}});
		wrongFormatCount++;
	}
	index++;
});
print('Total skill wrong date format:', wrongFormatCount);
print("Finish");