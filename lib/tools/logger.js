/**
 * @typedef Logger
 * @property {function} log
 * @property {function} error
 */

/**
 * @return {Logger}
 */
module.exports = () => {
  return {
    log: message => {
      console.log('');
      console.log(message);
    },
    error: message => {
      console.log('');
      console.error(message);
    },
  };
};
