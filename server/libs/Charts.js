import * as DateTimeHelper from '../util/DateTimeHelper';
import ArrayHelper from '../util/ArrayHelper';
import DailyTracking from '../models/dailyTracking';
import User from '../models/user';
import globalConstants from '../../config/globalConstants';
import moment from 'moment-timezone';

async function getTotalUsersLineChart(startDate, endDate, expert) {
  let arrDates = DateTimeHelper.getDatesBetweenRange(startDate, endDate);
  arrDates = arrDates.map(date => date.split('T').shift());
  // console.log('arrDates:', arrDates);
  let key = expert ? globalConstants.trackingKeys.TOTAL_EXPERTS : globalConstants.trackingKeys.TOTAL_USERS;
  let conditions = {
    createdDate: {
      $gte: startDate,
      $lte: endDate
    },
    key:  key
  };
  let tracks = await DailyTracking.find(conditions, 'key createdDate val').sort({createdDate: 1});

  let data = tracks.map(track => {
    let rs = {
      name: moment(track.createdDate).tz("Asia/Jakarta").format().split('T').shift()
    };
    rs[track.key] = track.val;
    return rs;
  });

  arrDates.forEach(date => {
    let index = ArrayHelper.findItemByProp(data, 'name', date);
    if(index === false) {
      let obj = {name: date};
      obj[key] = 0;
      data.push(obj);
    }
  });

  data = data.map(dt => {
    dt.date = new Date(dt.name);
    return dt;
  });
  ArrayHelper.sortByProp(data, 'date', 'asc');
  return data;
}

export async function getUserActionsLineChart(actions, from, to) {
  try {
    let arrDates = DateTimeHelper.getDatesBetweenRange(from, to);
    // console.log('arrDates:', arrDates);
    let data = arrDates.map(date => {
      // date = new Date(date.setDate(date.getDate() + 1));
      let name = date.split('T').shift();
      return {name: name};
    });
    let promises = actions.map(async action => {
      data = data.map(dt => {
        dt[action] = 0;
        return dt;
      });

      let conditions = {};
      conditions[action] = {
        $gte: from,
        $lte: to
      };
      // console.log('conditions:', conditions);
      let users = await User.find(conditions);
      // console.log('user count:', users.length);
      users.forEach(user => {
        let date = user[action].toISOString().split('T').shift();
        // console.log('date:', date);
        let index = ArrayHelper.findItemByProp(data, 'name', date);
        if (index) {
          data[index][action]++;
        }
      });
    });
    await Promise.all(promises);
    return data;
    // return data.splice(1, data.length - 2);
  } catch (err) {
    console.log('err:', err);
    return [];
  }
}

export async function getTotalCharts(fields, from, to) {
  let promises = [];

  fields.forEach(field => {
    switch (field) {
      case globalConstants.trackingKeys.TOTAL_USERS:
        promises.push(getTotalUsersLineChart(from, to));
        break;
      case globalConstants.trackingKeys.TOTAL_EXPERTS:
        promises.push(getTotalUsersLineChart(from, to, true));
        break;
    }
  });

  let rs = await Promise.all(promises);

  return ArrayHelper.mergeArrayOfArrays(rs);
}
