import Country from '../models/country.js';
import User from '../models/user.js';
import cuid from 'cuid';
import State from '../models/state';
import { commonGetQuery } from '../virtual_agent/query.js';
import slug from 'slug';

/////////////////////////////////////////    PAGE ADMIN   //////////////////////////////////

export function getCountries(req, res) {
    var result = {
        key: -10,
        message: '',
        data: null
    };
    const options = commonGetQuery(req);
    const conditionAll = {};
    if (options?.keyword) {
        conditionAll.name = { $regex: slug(options.keyword, ' '), $options: '$i' };
    }
    Country.find(conditionAll, '-__v -dateAdded -dateModified').sort({name: 1}).exec((err, countries) => {
        if (err) {
            result.key = 1;
            result.message = 'System error.';
            res.json({result});
        }else{
            result.key = 1;
            result.message = 'Success';
            result.data = countries;
            res.json({result});
        }
    });
}

export function getCountry(req, res) {
    var result = {
        key: -10,
        message: '',
        data: null
    };
    Country.findOne({cuid:req.params.cuid}).exec((err, country) => {
        if (err) {
            result.key = 1;
            result.message = 'System error.';
            res.json({result});
        }else{
            result.key = 1;
            result.message = 'Success';
            result.data = country;
            res.json({result});
        }
    });
}

export function getCountriesExpert(req, res) {
    var result = {
        key: -10,
        message: '',
        data: null
    };
    User.aggregate([
        { $match:{$and : [{ 'expert': 1},{ 'active': 1}]}},
        {'$group': {
            '_id': {'country': '$country'},
            'count': {'$sum': 1}
        }},
        {$unwind: '$_id.country'},
        {$replaceRoot: {newRoot: '$_id.country'}},
        { $sort : { 'name' : -1} },
        {'$group': {
            '_id': {'cuid': '$cuid','ISO2' : '$ISO2', 'ISO3' : '$ISO3', 'name' : '$name'}
        }},
        {$replaceRoot: {newRoot: '$_id'}}
    ]).exec((err, countries) => {
        if (err) {
            result.key = 1;
            result.message = 'System error.';
            res.json({result});
        }else{
            result.key = 1;
            result.message = 'Success';
            result.data = countries;
            res.json({result});
        }
    });
}

function addCountry(country, index){
    return new Promise((resolve) => {
        Country.findOne({name: country.name}).exec((err, coun) => {
            if(err){
                resolve(`Country [${index}] error`);
            }else{
                if(coun === null){
                    //Insert country.
                    var dataInsert = new Country(country);
                    dataInsert.cuid = cuid();
                    dataInsert.save((err) => {
                        if(err){
                            resolve(`Insert country [${index}] error`);
                        }else{
                            resolve(`Insert country [${index}] success.`);
                        }
                    });
                }else{
                    //Country already exist.
                    resolve(`Country [${index}] already exist.`);
                }
            }
        });
    });
}


export function importCountries(req, res){
    var listCountries = req.body.listCountries;
    var result = {
        key: -10,
        message: '',
        data: []
    };

    if(typeof listCountries !== 'undefined' && listCountries.length > 0){
        var length = listCountries.length;
        Promise.all(listCountries.map((item, index) => {
            //Insert skill.
            length--;
            return (addCountry(item, index));
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

export async function getListStateByCountry(req, res) {
    try {
        const { id } = req.params;
        const options = commonGetQuery(req);
        const conditionAll = {};
        conditionAll.countryId = id;
        if (options?.keyword) {
            conditionAll.searchString = { $regex: slug(options.keyword, ' '), $options: '$i' };
        }
        const promise = await Promise.all([
            Country.findOne({ _id: id }),
            State.find(conditionAll, '-__v -status -countryId -searchString')
            .sort({ name: "desc" })
        ]);
        if (!promise[0]) res.status(404).json({
            status: 404,
            success: false,
            err: "Country not found."
        });
        res.json({
            status: 200,
            success: true,
            data: promise[1]
        });
    } catch (error) {
        res.status(500).json({status:500 , success:false , err:"Internal Server Error."});
    }
}

//////////////////////////////////////////////////////// END PAGE ADMIN ////////////////////////////////////
