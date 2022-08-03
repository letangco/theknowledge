export function isValidDate(d) {
  if (!d instanceof Date) {
    d = new Date(d);
  }

  if (Object.prototype.toString.call(d) === "[object Date]") {
    // it is a date
    return !isNaN(d.getTime());
  }
  else {
    // not a date
    return false;
  }
}
