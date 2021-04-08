/**
 * @param {module:context} c
 */
module.exports = (c) => {
  const lib = c.lib;

  const getTwitchApiAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Client-ID': lib.env.twitchClient.id,
      'Authorization': 'Bearer ' + c.secret.token,
    };
  };

  return async () => {
    // Get broadcaster id
    const resultGetBroadcasterId = await lib.tools.request(lib.tools.url.make(lib.config.twitch.url.api.helixUsers, { login: lib.env.twitchClient.login }), {
      method: 'GET',
      headers: getTwitchApiAuthHeaders(),
    });

    if (!resultGetBroadcasterId || !resultGetBroadcasterId.data || !resultGetBroadcasterId.data.length || !resultGetBroadcasterId.data[0].id) {
      c.logger.error(`No broadcaster found with login '${lib.env.twitchClient.login}'!`);

      return null;
    }

    return resultGetBroadcasterId.data[0];
  };
};
