import User from '../../models/user';
import Payment from '../../models/payment';
import json2csv from 'json2csv';
import fs from 'fs'
import execa from 'execa';
import path from 'path'
import sanitizeHtml from "sanitize-html";
import globalConstants from "../../../config/globalConstants";
import moment from "moment";

const field = ['fullName', 'email', 'telephone', 'memberShip'];
const field01 = ['fullName', 'email', 'telephone', 'memberShip', 'Course'];

export async function reportMembership(options) {
  try {
    let data = [], dataUser;
    let title = 'membership' + '_' + options.status + '_' + Date.now() + '.csv';
    let fields = "fullName email telephone dateAdded memberShip";
    if(options.status === 'trialMembership'){
      dataUser = await Payment.find({'paymentInfo.data.memberShip.key':'DATE'}).lean();
      let emails = [];
      dataUser.map(e => {
        if(!emails.includes(e.paymentInfo.data.contactInfo.email) && e.paymentInfo.data.contactInfo.phoneNumber){
          let info = e.paymentInfo.data.contactInfo

          if(e.userId){
            info.active = 'Active'
          }
          info.dateAdded = new Date(e.dateAdded);
          emails.push(info.email);
          data.push(info);
        }
      });
    } else {
      let condition = [];
      let conditions = {};
      const textSearch = options.textSearch ? sanitizeHtml(options.textSearch) : '';
      const from = options.from ? new Date(req.query.from).getTime() : 0;
      const to = options.to ? new Date(options.to).getTime() : 0;
      const sort = options.sort ? parseInt(options.sort) : -1;
      if (textSearch) {
        condition.push({ 'fullName': { $regex: textSearch.trim(), $options: "$i" } });
        condition.push({ 'email': { $regex: textSearch.trim(), $options: "$i" } });
        condition.push({ 'telephone': { $regex: textSearch.trim(), $options: "$i" } });
      }
      if(from && to){
        condition.push({'dateAdded': {
            $gte: new Date(from),
            $lte: new Date(to)
          }});
      } else if(from){
        condition.push({'dateAdded':{$gte: new Date(from)}});
      }else if(to){
        condition.push({'dateAdded': {$lte: new Date(to)}});
      }
      switch (options.status) {
        case globalConstants.userStatus.PENDING:
          conditions.active = 0;
          break;
        case globalConstants.userStatus.USER:
          conditions.active = 1;
          conditions.expert = 0;
          break;
        case globalConstants.userStatus.DEACTIVE:
          conditions.expert = -1;
          break;
        case globalConstants.userStatus.PENDING_DEL:
          conditions.active = -2;
          conditions.deleteDate = {
            $gt: moment().subtract(14, 'days').toDate()
          }
          break;
        case globalConstants.userStatus.DELETED:
          conditions.active = -1;
          conditions.deleteDate = {
            $lte: moment().subtract(14, 'days').toDate()
          }
          break;
        case globalConstants.userStatus.PENDING_EXPERT:
          conditions.expert = 2;
          break;
        case globalConstants.userStatus.EXPERT:
          conditions.expert = 1;
          conditions.active = 1;
          break;
        case globalConstants.userStatus.BANNED:
          conditions.active = -2;
          conditions.deleteDate = null;
          break;
        case globalConstants.userStatus.MEMBERSHIP:
          conditions.memberShip = { $exists: true };
          const { membershipState } = options;
          switch (membershipState) {
            case 'expired': {
              conditions.memberShip = {
                $lt: Date.now()
              };
              break;
            }
            case 'almostExpired': { // near expired
              const threeDays = 3600 * 24 * 3 * 1000;
              conditions.memberShip = {
                $lt: Date.now() + threeDays,
                $gt: Date.now()
              };
              break;
            }
            case 'still': {
              conditions.memberShip = {
                $gt: Date.now()
              };
              break;
            }
            default: {
            }
          }
          break;
        default:
          break;
      }
      switch (options.status) {
        case "all":
          dataUser = await User.find({ memberShip: { $exists: true } }, fields).lean();
          break;
        case "still":
          dataUser = await User.find({ memberShip: { $gt: (Date.now() + 3 * 24 * 60 * 60 * 1000) } }, fields).lean();
          break;
        case "almostExpired":
          dataUser = await User.find({
            memberShip: {
              $gt: Date.now(),
              $lt: (Date.now() + 3 * 24 * 60 * 60 * 1000)
            }
          }, fields).lean();
          break;
        case "expired":
          dataUser = await User.find({ memberShip: { $lt: Date.now() } }, fields).lean();
          break;
        case "trialMembership":
          dataUser = await Payment.find({'paymentInfo.data.memberShip.key':'DATE'}).lean();
          break;
        default:
          break;
      }
      let query = [];
      if (conditions){
        query.push(conditions);
      }
      if (condition.length > 0){
        query.push({ $or: condition});
      }
      dataUser = await  User.find({$and: query}, fields).sort({dateAdded: sort}).lean().exec()
      data = dataUser.map(e => {
        const date = new Date(e.memberShip);
        let month = (date.getMonth() + 1).toString();
        let day = date.getDate().toString();
        if (month.length === 1) month = `0${month}`;
        if (day.length === 1) day = `0${day}`;
        e.memberShip = `${day}/${month}/${date.getFullYear()}`;
        return e;
      });
    }

    let dir = path.join(__dirname, '..', '..', '..', 'exports', title);
    if (data.length > 0) {
      // let shell_script = 'cd ' + path.join(__dirname, '..', '..', '..', 'exports') + ' && rm -f *.csv';
      // await execa.command(shell_script);
      data = json2csv.parse(data, { field });
      await fs.writeFileSync(dir, data);se
    } else {
      fs.writeFileSync(dir, '');
    }
    return title;
  } catch (err) {
    console.log('err reportMembership : ', err);
    return Promise.reject({ status: 500, success: false, error: "Error!!" });
  }
}

export async function reportMembershipByMonth(data) {

  let title = 'membership'+ Date.now() + '.csv';
  try {
    let dir = path.join(__dirname, '..', '..', '..', 'exports', title);
    if (data.length > 0) {
      // let shell_script = 'cd ' + path.join(__dirname, '..', '..', '..', 'exports') + ' && rm -f *.csv';
      // await execa.command(shell_script);
      data = json2csv.parse(data, { field01 });
      await fs.writeFileSync(dir, data);
    } else {
      fs.writeFileSync(dir, '');
    }
    return title;
  } catch (err) {
    console.log('err reportMembership : ', err);
    return Promise.reject({ status: 500, success: false, error: "Error!!" });
  }
}
