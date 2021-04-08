module.exports = {
  queryFromParams: (params) => Object.entries(params).map(param => `${param[0]}=${param[1]}`).join('&'),
  make: (url, params) => `${url}?${this.queryFromParams(params)}`,
};
