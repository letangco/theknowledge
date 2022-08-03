conn = new Mongo("localhost:27017");
db = conn.getDB("tesse");

db.exports.remove({});

var industry = db.categories.find({parent: ''}, {cuid: 1, title: 1}).map(function (category) {
  return {title: category.title, cuid: category.cuid};
});

// print(JSON.stringify(industry));

industry = industry.map(function (parent) {
  var count = 0;
  db.categories.find({parent: parent.cuid}, {cuid: 1}).map(function (category) {
    count += db.users.count({expert: 1, 'categories.department.departmentID': category.cuid});
  });
  parent.count = count;

  // print('parent:', JSON.stringify(parent));
  return parent;
});
//
// var cates = db.categories.find({parent: {$ne: ''}}, {cuid: 1, title: 1}).map(function (category) {
//   return {title: category.title, cuid: category.cuid};
// });
// cates = cates.map(function (cate) {
//   // print('cate:', cate);
//   cate.expert_count = db.users.count({expert: 1, 'categories.department.departmentID': cate.cuid});
//   return cate;
// });

// print(JSON.stringify(industry));

db.exports.insert(industry);

print('done');

