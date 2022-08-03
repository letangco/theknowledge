/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';
import skillModel from '../../models/skill';
import cateModel from '../../models/category';

export default class ScriptFixSkill {
    start() {
        let count = 0;
        skillModel.find({}, 'categoryID', (err, skills) => {
            if(err) throw err;
            skills.forEach(skill => {
                cateModel.findOne({cuid: skill.categoryID}, {_id: 1}, (err, cate) => {
                    if(err) throw err;
                    skill.categoryID = cate._id.toString();
                    skill.save(err => {
                        if(err) throw err;
                        console.log('migrated:', ++count);
                    })
                })
            });
            
        });
    }
};


