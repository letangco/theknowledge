import Category from '../models/category.js';
import User from '../models/user';
import sanitizeHtml from 'sanitize-html';
import cuid from 'cuid';
import { removeSkillByCategoryID } from './skill.controller.js';
import ArrayHelper from '../util/ArrayHelper';
import mongoose from 'mongoose';
import StringHelper from '../util/StringHelper';
import mem_cache from 'memory-cache';
import { exportCategories } from '../scripts/exports_data/export_categories'
import logger from '../util/log';
import { slugBuilder } from '../util/string.helper';

export function formatCategoryByLanguage(categories, langCode) {
  return categories.map(cate => {
    const cloneCate = Object.assign({}, cate);
    let langIndex = ArrayHelper.findItemByProp(cloneCate.description, 'languageID', langCode);
    cloneCate.title = cloneCate.description[langIndex || 0].name;
    cloneCate.slug = cloneCate.description[langIndex || 0].slug;
    delete cloneCate.description;
    return cloneCate;
  });
}

export async function getCategories(req, res) {
  let conditions = {parent: ''};
  let langCode = req.headers.lang || 'en';

  let requesterToken = req.headers && req.headers.token ? req.headers.token : '';
  let requester = await User.findOne({token: requesterToken}, 'role');
  if (!requester || requester.role !== 'admin') {
    conditions.status = '1';
  }

  let key = `cate_${conditions.status}_${langCode}`;
  // console.log('key:', key);
  let cached = mem_cache.get(key);
  let categories = [];
  if (!cached) {
    // console.log('chua cache');
    console.log('conditions: ', conditions)
    categories = await Category.find(conditions).sort({'description.name': 1}).lean();
    categories = formatCategoryByLanguage(categories, langCode);
    mem_cache.put(key, categories);
  } else {
    categories = cached;
  }
  // categories = formatCategoryByLanguage(categories, langCode);

  // res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.json({categories});

//   Category.find(conditions).sort({title: 1}).exec((err, categories) => {
//     if (err) {
//       res.status(500).send(err);
//       return;
//     }
//     /*categories.map(function(category, i){
//
//         CategoryDescription.findOne({categoryID: category.cuid}).exec((err, description) => {
//             if (description) {
//                 categories[i]['description'] = description.title;
//                 console.log( categories[i]);
//             }
//         })
//
//     })*/
//     res.setHeader('Cache-Control', 'public, max-age=3600');
//     res.json({categories});
// });
}

export async function getDepartment(req, res) {
  let langCode = req.headers.lang || 'en';
  let categories = await Category.find({$and: [{age: {$ne: ''}}, {status: 1}]}).sort({'description.name': 1}).lean();
  categories = formatCategoryByLanguage(categories, langCode);

  // res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.json({categories});
  // Category.find({$and: [{age:{$ne:''}}, {status: 1}]}).sort({title: 1}).exec((err, categories) => {
  //     if (err) {
  //         res.status(500).send(err);
  //         return;
  //     }
  //     res.json({categories});
// });
}

export async function getCategoriesByParentID(req, res) {
  let parentID = sanitizeHtml(req.params.catID);
  let conditions = {parent: parentID};
  let langCode = req.headers.lang || 'en';

  let requesterToken = req.headers && req.headers.token ? req.headers.token : '';
  let requester = await User.findOne({token: requesterToken}, 'role');
  if (!requester || requester.role !== 'admin') {
    conditions.status = '1';
  }
  let categories = await Category.find(conditions).sort({'description.name': 1}).lean();
  categories = formatCategoryByLanguage(categories, langCode);


  // res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.json({categories});
  // Category.find(conditions).sort({title: 1}).exec((err, categories) => {
  //   if (err) {
  //     res.status(500).send(err);
  //   }
  //   res.setHeader('Cache-Control', 'public, max-age=3600');
  //   res.json({categories});
  // });
}

/**
 * Get Categories by parent
 * @param catID
 * @param callback
 */

export function getCategoriesByParentIDCallBack(catId, callback) {
  Category.find({$and: [{parent: catId}, {status: 1}]}).exec((err, categories) => {
    if (err) {
      return null;
    }
    var listCategories = [];
    categories.map((category) => {
      listCategories.push(category.cuid);
    });
    callback(listCategories);
  });
}

export async function getCategoriesByID(req, res) {
  let langCode = req.headers.lang || 'en';
  let category = await Category.findOne({cuid: req.params.catID}).sort({'description.name': 1}).lean();
  category = formatCategoryByLanguage(categories, langCode);
  return res.json({category});

  // Category.findOne({cuid: req.params.catID}).sort({title: 1}).exec((err, category) => {
  //   if (err) {
  //     res.status(500).send(err);
  //   }
  //   res.json({category});
  // });
}

async function mapDepartmentsToIndustries(industries, langCode) {
  let result = [];
  if (industries instanceof Array) {
    industries.map(function (industry, index) {
      result.push(mapDepartmentToIndustry(industry, langCode));
    });
  }
  return Promise.all(result);
}

async function mapDepartmentToIndustry(industry, langCode) {
  try {
    let departments = await Category.find({parent: industry.cuid}).lean();
    departments = formatCategoryByLanguage(departments, langCode);
    return {
      industry,
      departments
    };
  } catch (error) {
    logger.error('Category controller mapDepartmentToIndustry error:');
    logger.error(error);
    throw error;
  }
}

/**
 * Get industry and department it self
 * @param req
 * @param res
 */
export async function getAllDepartment(req, res) {
  try {
    // Get all industries
    let langCode = req.headers.lang || 'en';
    let industries = await Category.find({parent: '', status: 1}).sort({'description.name': 1}).lean();
    industries = formatCategoryByLanguage(industries, langCode);
    let departmentMappedIndustry = await mapDepartmentsToIndustries(industries, langCode);
    res.json({success: true, data: departmentMappedIndustry});
  } catch (ex) {
    res.json({success: false, data: ex});
  }
}

/**
 * Cache categories by all available language
 * @returns {Promise<*>}
 */
export async function cacheAllCategories() {
  try {
    const categories = await Category.find({status: 1}).sort({'description.name': 1}).lean();
    const industries = {};
    const promises = ['en', 'vi'].map(async (langCode) => {
      let key = `getAllCategories_${langCode}`;
      const categoriesOfLangCode = formatCategoryByLanguage(categories, langCode);

      let industriesOfLangCode = categoriesOfLangCode.filter(cate => !cate.parent);
      let grouped = ArrayHelper.groupByKey(categoriesOfLangCode, 'parent');

      industriesOfLangCode = industriesOfLangCode.map(industry => {
        industry.sub_categories = grouped[industry.cuid];
        return industry;
      });
      await mem_cache.put(key, industriesOfLangCode);
      industries[langCode] = industriesOfLangCode;
    });
    await Promise.all(promises);
    return industries;
  } catch (error) {
    logger.error(`cacheAllCategories error: ${error}`);
    throw error;
  }
}

/**
 * Cache categories by language
 * @param {String} lang, language code
 * @returns {Promise<*>}
 */
export async function cacheCategories(lang) {
  try {
    let key = `getAllCategories_${lang}`;
    let categories = await Category.find({status: 1}).sort({'description.name': 1}).lean();
    categories = formatCategoryByLanguage(categories, lang);

    let industries = categories.filter(cate => !cate.parent);
    let grouped = ArrayHelper.groupByKey(categories, 'parent');

    industries = industries.map(industry => {
      industry.sub_categories = grouped[industry.cuid];
      return industry;
    });
    await mem_cache.put(key, industries);
    return industries;
  } catch (error) {
    logger.error(`cacheCategories error: ${error}`);
    throw error;
  }
}

export async function getAllCategories(req, res) {
  try {
    const lang = req.headers?.lang ?? 'en';
    let key = `getAllCategories_${lang}`;
    let cached = mem_cache.get(key);
    let industries = [];
    if (!cached) {
      industries = await cacheCategories(lang);
    } else {
      industries = cached;
    }

    return res.status(200).json({success: true, data: industries});
  } catch (err) {
    console.log('err on getAllCategories:', err);
    return res.status(500).json({success: false, error: 'Internal error.'});
  }
}

// Page Admin
export function addCategory(req, res) {
  var cat = new Category(req.body.category);
  var result = {
    key: -10,
    message: '',
    data: null
  };
  if (cat.title == '') {
    result.message = 'Title is empty.';
    res.json({result});
    return false;
  }
  if (cat.parent == '') {
    //Industry
    Category.findOne({title: cat.title}).exec((err, catResult) => {
      if (err) {
        result.message = 'System error';
        res.json({result});
        return false;
      } else {
        if (catResult === null) {
          //Category not exists.
          if (cat.cuid == '') {
            //Insert
            cat.cuid = cuid();
            cat.save((err, catInsert) => {
              if (err) {
                result.message = 'System error.';
                res.json({result});
                return false;
              } else {
                result.key = 1;
                result.message = 'Success';
                result.data = catInsert;
                res.json({result});
                return false;
              }
            });
          } else {
            //Update
            Category.update({cuid: cat.cuid}, {$set: {title: cat.title, userID: cat.userID}}).exec((err) => {
              if (err) {
                result.message = 'System error.';
                res.json({result});
                return false;
              } else {
                result.message = 'Success';
                result.key = 1;
                result.data = cat;
                res.json({result});
                return true;
              }
            });
          }

        } else {
          //Category already exists.(update industry)
          result.key = -6;
          result.message = 'Category already exists.';
          res.json({result});
          return false;
        }
      }
    });
  } else {
    //Department
    Category.findOne({title: cat.title, parent: cat.parent}).exec((err, depResult) => {
      if (err) {
        result.message = 'System error';
        res.json({result});
        return false;
      } else {
        if (depResult === null) {
          //Department not exists.
          if (cat.cuid == '') {
            //Add
            cat.cuid = cuid();
            cat.save((err, depInsert) => {
              if (err) {
                result.message = 'System error.';
                res.json({result});
                return false;
              } else {
                result.key = 1;
                result.message = 'Success';
                result.data = depInsert;
                res.json({result});
                return true;
              }
            });
          } else {
            //Update
            Category.update({cuid: cat.cuid}, {
              $set: {
                title: cat.title,
                parent: cat.parent,
                userID: cat.userID
              }
            }).exec((err) => {
              if (err) {
                result.message = 'System error';
                res.json({result});
                return false;
              } else {
                result.key = 1;
                result.message = 'Success';
                result.data = cat;
                res.json({result});
                return true;
              }
            });
          }

        } else {
          //Department already exists.
          result.key = -6;
          result.message = 'Category already exists.';
          res.json({result});
          return false;
        }
      }
    });
  }
}

export function deleteCategory(req, res) {
  var catID = req.body.catID;
  var parentID = req.body.parent;
  var result = {
    key: -10,
    message: '',
    data: null
  };
  if (parentID == '') {
    //remove industry. ==> remove all child categories.
    // Remove skill --> department(parent != '') --> industry(parent = '')
    //removeSkillByCategoryID
    Category.find({parent: catID}).exec((err, listCat) => {
      //Remove skill by department.
      if (!err) {
        if (listCat !== null) {
          listCat.map((item, index) => {
            removeSkillByCategoryID(item.cuid);
          });
        }
      } else {
        result.key = -2;
        result.message = 'System error.';
      }
    });
    Category.remove({$or: [{cuid: catID}, {parent: catID}]}).exec(async (err) => {
      if (err) {
        result.key = -2;
        result.message = 'System error';
        return res.json({result});
      } else {
        // Update cache
        await cacheAllCategories();
        result.key = 1;
        result.message = 'Success';
        return res.json({result});
      }
    });
  } else {
    //remove department. ==> remove all skill in department.
    Promise.resolve(removeSkillByCategoryID(catID)).then(() => {
      Category.remove({cuid: catID}).exec(async (err) => {
        if (err) {
          result.key = -2;
          result.message = 'System error';
          return res.json({result});
        } else {
          result.key = 1;
          result.message = 'Success.';
          // Update cache
          await cacheAllCategories();
          return res.json({result});
        }
      });
    });
  }
}

export async function getAllCategoriesAdmin(req, res) {
  try {
    const field = 'cuid parent title description slug';
    const categories = await Category.find({parent: ''}, field).lean();
    let data = [];
    if (categories) {
      data = categories.map(async (category) => {
        category.child = await Category.find({parent: category.cuid}, field).lean();
        return category;
      });
      return res.json({
        success: true,
        data: await Promise.all(data)
      })
    } else {
      return res.json({
        success: false,
        error: 'Cannot find any category'
      })
    }
  } catch (err) {
    console.log('err in get all category for admin', err);
    res.json({
      success: false,
      error: 'Internal error'
    })
  }
}

export async function exportAllCategories(req, res) {
  try {
    let data = await exportCategories();
    return res.json({
      success: true
    })
  } catch (err) {
    console.log('err in get all category for admin', err);
    res.json({
      success: false,
      error: 'Internal error'
    })
  }
}

export function extractInfoFromBody(body) {
  const enTitle = sanitizeHtml(body.enTitle).trim();
  const parentCuid = sanitizeHtml(body.parentCuid).trim();
  const enSlug = slugBuilder(enTitle);
  const viTitle = sanitizeHtml(body.viTitle).trim();
  const viSlug = slugBuilder(viTitle);

  return {
    enTitle,
    viTitle,
    enSlug,
    viSlug,
    parentCuid,
  }
}

function buildDescriptionCondition(enSlug, viSlug) {
  return (
    {
      $elemMatch:
        {
          $or:
            [
              {slug: enSlug},
              {slug: viSlug}
            ]
        }
    })
}


export async function addCategoryV2(req, res) {
  try {
    const {
      enTitle,
      viTitle,
      enSlug,
      viSlug,
      parentCuid,
    } = extractInfoFromBody(req.body);
    const admin = req.user;
    if (enTitle && enSlug && viTitle && viSlug) {
      const category = await Category.findOne(
        {
          description:buildDescriptionCondition(enSlug,viSlug)
        }
      ).lean();
      if (category) {
        return res.json({success: false, error: 'Category existed'});
      } else {
        //build description
        const description = [
          {
            languageID: 'en',
            name: enTitle,
            slug: enSlug
          },
          {
            languageID: 'vi',
            name: viTitle,
            slug: viSlug
          }
        ];

        const newCategory = new Category({
          title: enTitle,
          description,
          status: '1',
          cuid: cuid(),
          slug: enSlug,
          parent: parentCuid,
          createdBy: mongoose.Types.ObjectId(admin._id),
        });

        newCategory.save(async (err, saved) => {
          if (err) {
            return res.json({
              success: false,
              error: err,
            });
          }
          // Update cache
          await cacheAllCategories();
          return res.json({
            success: true,
            data: saved,
          });
        })
      }
    } else {
      return res.json({success: false, error: 'Title is not acceptable'})
    }
  } catch (err) {
    console.log('err in add category v2', err);
    return res.status(500).json({
      success: false,
      error: 'Internal error'
    })
  }
}

export async function updateCategory(req, res) {
  try {
    const {
      enTitle,
      viTitle,
      enSlug,
      viSlug
    } = extractInfoFromBody(req.body);
    const admin = req.user;
    const _id = req.body.categoryId;
    const idValid = mongoose.Types.ObjectId.isValid(_id);
    if (idValid && enTitle && enSlug && viTitle && viSlug) {
      const existed = await Category.findOne({
        _id: {$ne: mongoose.Types.ObjectId(_id)},
        description:
          {
            $elemMatch:
              {
                $or:
                  [
                    {slug: enSlug},
                    {slug: viSlug}
                  ]
              }
          }
      });

      if (existed) {
        return res.json({
          success: false,
          error: 'Slug existed'
        })
      }
      const updatedCategory = await Category.findOneAndUpdate(
        {_id: mongoose.Types.ObjectId(_id)},
        {
          $set: {
            title: enTitle,
            slug: enSlug,
            modifiedBy: mongoose.Types.ObjectId(admin._id),
            dateModified: Date.now(),
            'description.0': {
              name: enTitle,
              slug: enSlug,
              languageID:'en'
            },
            'description.1': {
              name: viTitle,
              slug: viSlug,
              languageID:'vi'
            }
          }
        },
        {new: true}
      );
      if (updatedCategory) {
        // Update cache
        await cacheAllCategories();
        res.json({
          success: true,
          data: updatedCategory
        });
      } else {
        res.json({
          success: false,
          error: 'Error updating category'
        });
      }
    } else {
      res.json({
        success: false,
        error: 'Missing property or title is not approriate'
      });
    }
  } catch
    (err) {
    console.log('err in update category', err);
    res.status(500).json({
      success: false,
      error: 'Internal error'
    })
  }
}


export async function getCategoriesByCuids(cuids, langCode) {
  langCode = langCode || 'en';
  let categories = await Category.find({cuid: {$in: cuids}}).lean();
  categories = formatCategoryByLanguage(categories, langCode);
  return categories;
}
