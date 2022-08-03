import Category from '../../models/category';

module.exports = async function () {
  let categories = await Category.find({_id: {$ne: '5828ae7cfbddb053adaf1744'}});

  let promises = categories.map(cate => {
    cate.description.push({
      languageID: 'en',
      name: cate.title,
      slug: cate.slug
    });
    cate.markModified('description');
    cate.name = undefined; cate.slug = undefined;
    return cate.save();
  });

  await Promise.all([promises]);
  console.log('migrate category done');
};
