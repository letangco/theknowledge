import TransactionDetail from '../models/transactionDetail.js';
import cuid from 'cuid'
import {subMoney} from './user.controller';

export function add(req, res){
    let transactionDetail = new TransactionDetail(req.body.transactionDetail);
    let result = {
        key: -10,
        value: ''
    };
    if (typeof transactionDetail === 'undefined') {
        result.key = -1;
        result.value = 'Data empty.';
        res.json({result});
    }

    transactionDetail.save((err, saved) => {
        if (err) {
            result.value = 'System error.';
            res.json({result});
        }
        result.key = 1;
        result.value = 'Save success!!!';
        res.json({result});
    });
}

export function addTransactionDetail(detail){
    let item = new TransactionDetail(detail);
    item.cuid = cuid();
    item.save((error, tran) => {
        if(error){
            console.log('addTransactionDetail error:');
            console.log(error);
        }
        subMoney(detail.learnerID, detail.fees);
    });
}

