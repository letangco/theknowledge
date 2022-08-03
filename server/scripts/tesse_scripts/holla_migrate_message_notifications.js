conn = new Mongo('localhost:27017');
db = conn.getDB("mern-starter");

db.chatgroups.find().forEach(function(chatgroup) {
	let messNotis = chatgroup.users.map(function(user) {
		return {
			owner: user.cuid ? user.cuid : user,
			chatGroup: chatgroup._id,
			lastMessageTime: chatgroup.lastMessage && chatgroup.lastMessage.time ? chatgroup.lastMessage.time : null
		};
	});
	db.messagenotifications.insert(messNotis);
});
