/**
 * @param {Vendor} vendor
 */
module.exports = (vendor) => {
  const queryFromParams = (params) => Object.entries(params).map(param => `${param[0]}=${param[1]}`).join('&');

  return {
    queryFromParams,
    make: (url, params) => `${url}?${queryFromParams(params)}`,
    combine: (urlA, urlB) => `${urlA}/${urlB}`,
  };
};
