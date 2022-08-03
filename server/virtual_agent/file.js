function trim(str, strSplit) {
  return str.replace(strSplit, '');
}

export const updateUrlImage = (data, strSplit) => (trim(data, `${strSplit}`));
export const getUrlImage = (host, data) => (host.toString() + data.toString());