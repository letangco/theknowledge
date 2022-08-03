conn = new Mongo("localhost:27017");
db = conn.getDB("tesse");

db.exports.remove({});

var cates = db.categories.find({parent: {$ne: ''}}, {cuid: 1, title: 1}).map(function (category) {
  return {title: category.title, cuid: category.cuid};
});
cates = cates.map(function (cate) {
  // print('cate:', cate);
  cate.expert_count = db.users.count({expert: 1, 'categories.department.departmentID': cate.cuid});
  return cate;
});

print(JSON.stringify(cates));

db.exports.insert(cates);

print('done');

