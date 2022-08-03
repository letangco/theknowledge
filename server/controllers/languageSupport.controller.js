import LanguageSupport from '../models/languageSupport.js';
import User from '../models/user.js';
import cuid from 'cuid';


export function getLanguageSupport(req, res){
    LanguageSupport.find().sort({name: 1}).exec((err, languageSupport) => {
        if(err){
            res.status(500).send(err);
        }
        res.json({languageSupport});
    });
}

///////////////////////////////////////////////ADMIN PAGE///////////////////////////////////////
function add(languageSupport, index){
    return new Promise((resolve) => {
        LanguageSupport.findOne({name: languageSupport.name}).exec((err, lang) => {
            if(err){
                resolve(`LanguageSupport [${index}] error.`);
            }else{
                if(lang === null){
                    //Insert country.
                    var dataInsert = new LanguageSupport(languageSupport);
                    dataInsert.cuid = cuid();
                    dataInsert.save((err) => {
                        if(err){
                            resolve(`Insert LanguageSupport [${index}] error.`);
                        }else{
                            resolve(`Insert LanguageSupport [${index}] success.`);
                        }
                    });
                }else{
                    //Country already exist.
                    resolve(`LanguageSupport [${index}] already exist.`);
                }
            }
        });
    });
}

export function importlanguageSupport(req, res){
    var listLanguageSupport = req.body.listLanguageSupport;
    var result = {
        key: -10,
        message: '',
        data: null
    };
    if(typeof listLanguageSupport !== 'undefined' && listLanguageSupport.length > 0){
        var length = listLanguageSupport.length;
        Promise.all(listLanguageSupport.map((item, index) => {
            //Insert skill.
            length--;
            return (add(item, index));
        })).then((data) => {
            //allLog = allLog.concat(data);
            if(length == 0){
                result.key = 1;
                result.message = 'Success';
                result.data = data;
                res.json({result});
            }
        });

    }else{
        result.key = -5;
        result.message = 'Data empty.';
        res.json({result});
    }
}

export function getList(req, res){
    var result = {
        key: -10,
        message: '',
        data: null
    };
    LanguageSupport.find({}).sort({name: 1}).exec((err, languageSupport) => {
        if(err){
            result.key = -2;
            result.message = 'System error.';
            res.json({result});
        }else{
            result.key = 1;
            result.message = 'Success.';
            result.data = languageSupport;
            res.json({result});
        }
    });
}
export function getListExpert(req, res){
    var result = {
        key: -10,
        message: '',
        data: null
    };
    User.aggregate([
        { $match:{$and : [{ 'expert': 1},{ 'active': 1}]}},
        {$unwind: '$languageSupport'},
        {'$group': {
            '_id': {'country': '$languageSupport.langCode'},
            'count': {'$sum': 1},
            'itemsSold': { $push:  { langCode: "$languageSupport.langCode", langName: "$languageSupport.langName"} }
        }},
        {$unwind: '$itemsSold'},
        {'$group': {
            '_id': {'country': '$itemsSold'}
        }},
        { $sort : { '_id.country.langName' : 1} },
        {$replaceRoot: {newRoot: '$_id.country'}},
    ]).exec((err, languageSupport) => {
        if(err){
            result.key = -2;
            result.message = 'System error.';
            res.json({result});
        }else{
            result.key = 1;
            result.message = 'Success.';
            result.data = languageSupport;
            res.json({result});
        }
    });
}
///////////////////////////////////////////////ADMIN PAGE///////////////////////////////////////

