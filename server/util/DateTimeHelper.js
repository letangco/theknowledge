import moment from 'moment-timezone';

export function dayToDate (dayOfYear) {
  let year = new Date().getFullYear();
  let date = new Date(year, 0); // initialize a date in `year-01-01`
  return new Date(date.setDate(dayOfYear)); // add the number of days
}

Date.prototype.addDays = function(days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

export function getDatesBetweenRange(startDate, endDate, addFn, interval) {
  addFn = addFn || Date.prototype.addDays;
  interval = interval || 1;

  let retVal = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    retVal.push(moment(new Date(current)).tz('Asia/Jakarta').format());
    current = addFn.call(current, interval);
  }

  return retVal;
}

export function formatTimeSecToFullTime(sec) {
  if (sec === 0) {
    return '0';
  }
  // Get the odd second from sec
  let secondOdd = parseInt((sec % 60).toFixed(0));
  // Get the minute from secondOdd
  let minute = parseInt(((sec - secondOdd) / 60).toFixed(0));
  // Get the odd minute from minute
  let minuteOdd = parseInt((minute % 60).toFixed(0));
  // Get the hour from minuteOdd
  let hour = parseInt(((minute - minuteOdd) / 60).toFixed(0));
  // Get the odd hour from hour
  let hourOdd = parseInt((hour % 24).toFixed(0));
  // Get the day from hourOdd
  let day = parseInt(((hour - hourOdd) / 24).toFixed(0));

  let callDurationTime = '';
  if (day > 0) {
    callDurationTime += `${day}d`;
  }
  if (hourOdd > 0) {
    callDurationTime += `${hourOdd}h`;
  }
  if (minuteOdd > 0) {
    callDurationTime += `${minuteOdd}m`;
  }
  if (secondOdd > 0) {
    callDurationTime += `${secondOdd}s`;
  }

  return callDurationTime;
}
