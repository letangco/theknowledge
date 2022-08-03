conn = new Mongo('localhost:27017');
db = conn.getDB("tesse");

db.users.find().forEach(function(user) {
  let options = {  
  };
  if(user.email) {
    options.email = user.email.toLowerCase()
  }
  if(user.userName) {
    options.userName = user.userName.toLowerCase()
  }
  db.users.update({_id: user._id}, {$set: options});
});
