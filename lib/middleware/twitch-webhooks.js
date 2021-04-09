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

  const clear = async () => {
    console.log('');
    console.log('Clear webhooks');

    const resultGetWebhooks = await lib.tools.request(lib.config.twitch.url.api.helixUsers, {
      method: 'GET',
      headers: getTwitchApiAuthHeaders(),
    });

    if (!resultGetWebhooks || !resultGetWebhooks.data || !resultGetWebhooks.data.length) {
      console.log('');
      console.log('No webhooks registered.');

      return;
    }

    console.log('');
    console.log(`Delete existing ${resultGetWebhooks.data.length} webhooks.`);

    for (const webhook of resultGetWebhooks.data) {
      const webhookId = webhook.id;

      console.log(`- delete webhook ${webhookId}`);

      await lib.tools.request(lib.tools.url.make(lib.config.twitch.url.api.helixEventsub, { id: webhookId }), {
        method: 'DELETE',
        headers: getTwitchApiAuthHeaders(),
      });

      console.log(`- => webhook ${webhookId} deleted`);
    }
  };

  const create = (broadcasterId, type) => lib.tools.request(lib.config.twitch.url.api.helixEventsub, {
    method: 'POST',
    headers: getTwitchApiAuthHeaders(),
  }, {
    'type': type,
    'version': '1',
    'condition': {
      'broadcaster_user_id': broadcasterId,
    },
    'transport': {
      'method': 'webhook',
      'callback': c.tunnelUrl + '/notification',
      'secret': process.env.SECRET,
    },
  });

  const createAll = async (broadcasterId, callback) => {
    for (const type of lib.data.types) {
      await create(broadcasterId, type, callback);
    }
  };

  return {
    clear,
    create,
    createAll,
  };
};
