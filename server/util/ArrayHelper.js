import _ from 'lodash';

module.exports = {
  findItemByProp: (arr_obj, prop_name, prop_val) => {
    let item = null;
    for (let i = 0, length = arr_obj.length; i < length; i++) {
      item = arr_obj[i];
      if (item[prop_name] == prop_val) {
        return i;
      }
    }
    return false;
  },

  sortByProp: (arr_obj, prop, order) => {
    return arr_obj.sort((a, b) => {
      if (!prop in a) {
        a[prop] = 0;
      }
      if (!prop in b) {
        b[prop] = 0;
      }
      if (order === 'desc') {
        return b[prop] - a[prop];
      }
      return a[prop] - b[prop];
    });
  },
  multiChainSort: (arr, options) => {
    return arr.sort((a, b) => {
      for (let key in options) {
        if (options[key] === 'desc') {
          if (a[key] < b[key]) return 1;
          if (a[key] > b[key]) return -1;
        } else {
          if (a[key] < b[key]) return -1;
          if (a[key] > b[key]) return 1;
        }
      }
      return 0;
    })
  },

  uniqueValuesInArray: (arr) => {
    return arr.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  },

  uniqueValuesInArrayByProp: (arr, prop) => {
    return _.uniqBy(arr, item => {
      return item[prop];
    });
  },

  chunk: (arr, size) => {
    return _.chunk(arr, size);
  },

  cloneArray: (arr) => {
    return arr.slice(0);
  },

  mergeArrayOfArrays: (arr) => {
    return arr.reduce((a, b) => {
      let temp = [];
      for (let i = 0, max = a.length; i < max; i++) {
        temp.push(Object.assign({}, a[i], b[i]));
      }
      return temp;
    });
  },

  getRandomItem: (arr) => {
    return _.sample(arr);
  },

  toObjectByKey: (arr, key) => {
    return _.reduce(arr, function (result, val) {
      result[val[key]] = val;
      return result;
    }, {});
  },

  toObjectWithKey: (arr) => {
    return _.reduce(arr, function (result, val) {
      result[val] = val;
      return result;
    }, {});
  },
  selectRandomEleNoDup: (arr, amount) => {
    if (arr.length <=amount){
      return arr;
    }
    return _.sampleSize(arr, amount);
  },

  groupByKey: (arr, key) => {
      return _.groupBy(arr, (obj) => obj[key]);
  },

  sortByBelongProp: (arr_obj, prop1, prop2, order) => {
    return arr_obj.sort((a, b) => {
      if (!prop1 in a) {
        a[prop1] = {};
        a[prop1][prop2] = 0;
      }
      if (!prop1 in b) {
        b[prop1] = {};
        b[prop1][prop2] = 0;
      }
      if (order === 'desc') {
        return b[prop1][prop2] - a[prop1][prop2];
      }
      return a[prop1][prop2] - b[prop1][prop2];
    });
  },
};
