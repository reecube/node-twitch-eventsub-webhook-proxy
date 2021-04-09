/**
 * @param {module:context} c
 */
module.exports = (c) => {
  const lib = c.lib;

  const makeHeaders = token => {
    return {
      'Content-Type': 'application/json',
      'Client-ID': lib.env.twitchClient.id,
      'Authorization': 'Bearer ' + token,
    };
  };

  return {
    usertoken: () => makeHeaders(c.secret.usertoken),
    token: () => makeHeaders(c.secret.token),
  };
};
