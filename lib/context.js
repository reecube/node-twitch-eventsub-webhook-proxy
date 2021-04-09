/**
 * @module context
 *
 * @property {module:lib} lib
 * @property {e.Express} app
 * @property {Logger} logger
 * @property {string} tunnelUrl
 * @property {TwitchContext} twitch
 */
module.exports = {
  lib: require('./lib'),
  secret: {
    token: false,
    usertoken: false,
  },
};
