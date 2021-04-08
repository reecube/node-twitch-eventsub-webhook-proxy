/**
 * @module context
 *
 * @property {module:lib} lib
 * @property {e.Express} app
 * @property {Logger} logger
 * @property {string} tunnelUrl
 */
module.exports = {
  lib: require('lib'),
  secret: {
    token: false,
    usertoken: false,
  },
};
