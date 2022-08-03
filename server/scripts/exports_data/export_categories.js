import json2csv from 'json2csv';
import fs from 'fs'
import execa from 'execa';
import path from 'path'
import Category from "../../models/category";
import Skill from "../../models/skill";

export async function exportCategories() {
  try {
    let field = ['ID', 'Category', 'en', 'vi']
    let data = [];
    let title = 'skills' + '_' + Date.now() + '.csv';
    const skills = await Skill.find({}).lean();
    if (skills) {
      let promises = skills.map( async skill => {
        let res = {
          ID: skill._id
        }
        res.category = '';
        res.en = '';
        res.vi = '';
        let category = await Category.findOne({cuid: skill.categoryID}).lean();
        if(category){
          category.description.map( description => {
            if(description.languageID === 'en'){
              res.category = description.name;
            }
          })
        }
        skill.description.map( description => {
          res[description.languageID] = description.name;
        })
        return res
      });
      data = await Promise.all(promises);
    }
    let dir = path.join(__dirname, '..', '..', '..', 'exports', title);
    if (data.length > 0) {
      let shell_script = 'cd ' + path.join(__dirname, '..', '..', '..', 'exports') + ' && rm -f *.csv';
      await execa.command(shell_script);
      data = json2csv.parse(data, { field });
      await fs.writeFileSync(dir, data);
    } else {
      await fs.writeFileSync(dir, '');
    }
    return title;
  } catch (err) {
    console.log('err exportCategories : ', err);
    return Promise.reject({ status: 500, success: false, error: "Error!!" });
  }
}

export async function exportCategoriesBK() {
  try {
    let field = ['ID', 'en', 'vi']
    let data = [];
    let title = 'categories' + '_' + Date.now() + '.csv';
    const categories = await Category.find({}).lean();
    if (categories) {
      data = categories.map( category => {
        let res = {
          ID: category._id,
          slug: category.slug
        }
        category.description.map( description => {
          res[description.languageID] = description.name;
        })
        return res
      });
    }
    let dir = path.join(__dirname, '..', '..', '..', 'exports', title);
    if (data.length > 0) {
      let shell_script = 'cd ' + path.join(__dirname, '..', '..', '..', 'exports') + ' && rm -f *.csv';
      await execa.command(shell_script);
      data = json2csv.parse(data, { field });
      await fs.writeFileSync(dir, data);
    } else {
      await fs.writeFileSync(dir, '');
    }
    return title;
  } catch (err) {
    console.log('err exportCategories : ', err);
    return Promise.reject({ status: 500, success: false, error: "Error!!" });
  }
}
