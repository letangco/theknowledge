function (){db.users.find({}).toArray().map(function(a){db.users.update({cuid:a.cuid},{$set:{userName:""}})})}