conn = new Mongo('localhost:2017');
db = conn.getDB("tesse");

db.skills.find({}).forEach(function (skill) {
  if(skill.knowledges.length)
    db.skills.update({_id: skill._id}, {$set: {tagged: skill.knowledges.length}});
});
