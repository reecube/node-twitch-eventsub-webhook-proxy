/**
 * @param {module:context} c
 */
module.exports = (c) => {
  const lib = c.lib;

  const callbackUrl = () =>
    lib.tools.url.combine(c.tunnelUrl, lib.config.endpoints.notification);

  const getWebhooks = async () => {
    let result = await lib.tools.request(lib.config.twitch.url.api.helixEventsub, {
      method: 'GET',
      headers: c.twitch.apiAuthHeaders.token(),
    });

    if (!result) result = {
      error: 'Empty',
      status: '<empty>',
    };

    if (result.error) {
      c.logger.error(`${result.status} ${result.error}: ${result.message}`);
    }

    if (!result.data || !result.data.length) {
      c.logger.log('No webhooks registered.');

      return [];
    }

    return result.data;
  };

  const remove = async (webhookId) => {
    c.logger.log(`- delete webhook ${webhookId}`);

    await lib.tools.request(lib.tools.url.make(lib.config.twitch.url.api.helixEventsub, { id: webhookId }), {
      method: 'DELETE',
      headers: c.twitch.apiAuthHeaders.token(),
    });

    c.logger.log(`- => webhook ${webhookId} deleted`);
  };

  const clear = async () => {
    c.logger.log('Clear webhooks');

    const webhooks = await getWebhooks();

    c.logger.log(`Delete existing ${webhooks.length} webhooks.`);

    for (const webhook of webhooks) {
      await remove(webhook.id);
    }
  };

  const create = (broadcasterId, type) => lib.tools.request(lib.config.twitch.url.api.helixEventsub, {
    method: 'POST',
    headers: c.twitch.apiAuthHeaders.token(),
  }, {
    'type': type,
    'version': '1',
    'condition': {
      'broadcaster_user_id': broadcasterId,
    },
    'transport': {
      'method': 'webhook',
      'callback': callbackUrl(),
      'secret': lib.env.appSecret,
    },
  });

  const createAll = async (broadcasterId) => {
    c.logger.log('Register all webhooks');

    for (const type of lib.data.types) {
      let result = await create(broadcasterId, type);

      if (!result) result = {
        error: 'Empty',
        status: '<empty>',
      };

      if (result.error) {
        c.logger.error(`${result.status} ${result.error}: ${result.message}`);
      }
    }
  };

  const ensureAll = async (broadcasterId) => {
    c.logger.log('Ensure all webhooks');

    const cbUrl = callbackUrl();

    const webhooks = (await getWebhooks()).filter(webhook => {
      if (!webhook) return false;

      if (!webhook.condition) return false;

      if (webhook.condition.broadcaster_user_id !== broadcasterId) {
        // TODO: add config to remove these

        c.logger.warn('Unknown broadcaster id.', webhook);

        return false;
      }

      if (!webhook.transport) return false;

      if (webhook.transport.method !== 'webhook') return false;

      if (webhook.transport.callback !== cbUrl) {
        // TODO: add config to remove these

        c.logger.warn('Unknown callback url.', webhook);

        return false;
      }

      return true;
    });

    if (webhooks.length <= 0) {
      await createAll(broadcasterId);

      return;
    }

    const validWebhooks = [];

    for (const webhook of webhooks) {
      if (lib.data.types.includes(webhook.type)) {
        validWebhooks.push(webhook);

        continue;
      }

      await remove(webhook.id);
    }

    if (validWebhooks.length <= 0) {
      await createAll(broadcasterId);

      return;
    }

    const missingTypes = [];

    const actualTypes = webhooks.map(webhook => webhook.type);

    for (const type of lib.data.types) {
      if (actualTypes.includes(type)) {
        continue;
      }

      missingTypes.push(type);
    }

    if (missingTypes.length <= 0) {
      c.logger.log('All webhooks are found and valid. No updates required.');

      return;
    }

    for (const type of missingTypes) {
      let result = await create(broadcasterId, type);

      if (!result) result = {
        error: 'Empty',
        status: '<empty>',
      };

      if (result.error) {
        c.logger.error(`${result.status} ${result.error}: ${result.message}`);
      }
    }
  };

  return {
    remove,
    clear,
    create,
    createAll,
    ensureAll,
  };
};
