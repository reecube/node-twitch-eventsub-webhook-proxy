/**
 * @typedef Logger
 * @property {function} log
 * @property {function} error
 */

/**
 * @param {Vendor} vendor
 * @return {Logger}
 */
module.exports = (vendor) => {
  const beautify = item => JSON.stringify(item, null, '  ');

  return {
    log: (...messages) => {
      console.log('');
      console.log.apply(this, messages.map(message => {
        if (typeof message !== 'string') return beautify(message);

        return message;
      }));
    },
    error: (...messages) => {
      console.log('');
      console.error.apply(this, messages.map(message => {
        if (typeof message !== 'string') return beautify(message);

        return message;
      }));
    },
  };
};
