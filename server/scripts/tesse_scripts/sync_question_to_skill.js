conn = new Mongo('localhost:27017');
db = conn.getDB("tesse");

db.questions.find({state: 'published'}).forEach(function(question) {
  let skillIds = [];
  question.tags.forEach(function(tag) {
    if(tag.id !== 'un') skillIds.push(ObjectId(tag.id));
  });
  print('skillIds:', skillIds);
  db.skills.find({_id: {$in: skillIds}}).forEach(function(skill) {
    if(skill.questions)
      skill.questions.push(question._id);
    else
      skill.questions = [question._id];
    db.skills.update({_id: skill._id}, {$set: {questions: skill.questions}});
    print(skill.description[0].name);
  });
});
