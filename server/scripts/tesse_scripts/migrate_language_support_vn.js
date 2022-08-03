conn = new Mongo('localhost:2017');
db = conn.getDB("tesse");

db.users.find({languageSupport: {$ne: []}}).forEach(function (user) {
  user.languageSupport.forEach(function (lang) {
    switch (lang.langLevel) {
      case 'Elementary proficiency':
        lang.langLevel = 'langElementary';
        break;
      case 'Limited working proficiency':
        lang.langLevel = 'langLimitedWorking';
        break;
      case 'Professional working proficiency':
        lang.langLevel = 'langProfessional';
        break;
      case 'Full professional proficiency':
        lang.langLevel = 'langFullProfessional';
        break;
      case 'Native or bilingual proficiency':
        lang.langLevel = 'langNative';
        break;
    }
  });
  db.users.update({_id: user._id}, {$set: {languageSupport: user.languageSupport}});
});
