/**
 * @param {module:context} c
 */
module.exports = (c) => {
  const lib = c.lib;

  return async (login) => {
    // Get broadcaster id
    const result = await lib.tools.request(lib.tools.url.make(lib.config.twitch.url.api.helixUsers, { login: login }), {
      method: 'GET',
      headers: c.twitch.apiAuthHeaders.usertoken(),
    });

    if (!result || !result.data || !result.data.length || !result.data[0].id) {
      c.logger.error(`No broadcaster found with login '${login}'!`);

      return null;
    }

    return result.data[0];
  };
};
