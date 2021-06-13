import { Middleware } from '../types/middleware';

export class TwitchWebhooks extends Middleware {

  private callbackUrl!: string;

  async setup(): Promise<void> {
    this.callbackUrl = this.s.h.url.combine(
      process.env.EXTERNAL_URL,
      this.s.c.endpoints.notification,
    );
  }

  async started(): Promise<void> {
    await super.started();

    await this.ensureAll(this.s.c.broadcasterId);
  }

  private async getWebhooks() {
    let result = await this.s.r.request(this.s.c.twitchUrls.api.helixEventsub, {
      method: 'GET',
      headers: this.s.secret.makeApiAuthHeaders(),
    });

    if (!result) result = {
      error: 'Empty',
      status: '<empty>',
    };

    if (result.error) {
      this.s.logger.error(`${result.status} ${result.error}: ${result.message}`);
    }

    if (!result.data || !result.data.length) {
      this.s.logger.log('No webhooks registered.');

      return [];
    }

    return result.data;
  };

  async remove(webhookId) {
    this.s.logger.log(`- delete webhook ${webhookId}`);

    await this.s.r.request(this.s.h.url.make(this.s.c.twitchUrls.api.helixEventsub, { id: webhookId }), {
      method: 'DELETE',
      headers: this.s.secret.makeApiAuthHeaders(),
    });

    this.s.logger.log(`- => webhook ${webhookId} deleted`);
  };

  async clear() {
    this.s.logger.log('Clear webhooks');

    const webhooks = await this.getWebhooks();

    this.s.logger.log(`Delete existing ${webhooks.length} webhooks.`);

    for (const webhook of webhooks) {
      await this.remove(webhook.id);
    }
  };

  async create(broadcasterId, type) {
    return this.s.r.request(this.s.c.twitchUrls.api.helixEventsub, {
      method: 'POST',
      headers: this.s.secret.makeApiAuthHeaders(),
    }, {
      'type': type,
      'version': '1',
      'condition': {
        'broadcaster_user_id': broadcasterId,
      },
      'transport': {
        'method': 'webhook',
        'callback': this.callbackUrl,
        'secret': process.env.SECRET,
      },
    });
  };

  async createAll(broadcasterId) {
    this.s.logger.log('Register all webhooks');

    for (const type of this.s.c.twitchApi.types) {
      let result = await this.create(broadcasterId, type);

      if (!result) result = {
        error: 'Empty',
        status: '<empty>',
      };

      if (result.error) {
        this.s.logger.error(`${result.status} ${result.error}: ${result.message}`);
      }
    }
  };

  async ensureAll(broadcasterId) {
    if (!broadcasterId) throw new Error('Invalid broadcaster id passed!');

    this.s.logger.log('Ensure all webhooks');

    const webhookIdsForCleanup = [];

    const webhooks = (await this.getWebhooks()).filter(webhook => {
      if (!webhook) return false;

      if (webhook.id && (webhook.status !== 'enabled')) {
        webhookIdsForCleanup.push(webhook.id);

        return false;
      }

      if (!webhook.condition) return false;

      if (webhook.condition.broadcaster_user_id !== broadcasterId) {
        // TODO: add config to remove these

        this.s.logger.warn('Unknown broadcaster id.', webhook);

        return false;
      }

      if (!webhook.transport) return false;

      if (webhook.transport.method !== 'webhook') return false;

      if (webhook.transport.callback !== this.callbackUrl) {
        // TODO: add config to remove these

        this.s.logger.warn('Unknown callback url.', webhook);

        return false;
      }

      return true;
    });

    for (const webhookId of webhookIdsForCleanup) {
      await this.remove(webhookId);
    }

    if (webhooks.length <= 0) {
      await this.createAll(broadcasterId);

      return;
    }

    const validWebhooks = [];

    for (const webhook of webhooks) {
      if (this.s.c.twitchApi.types.includes(webhook.type)) {
        validWebhooks.push(webhook);

        continue;
      }

      await this.remove(webhook.id);
    }

    if (validWebhooks.length <= 0) {
      await this.createAll(broadcasterId);

      return;
    }

    const missingTypes = [];

    const actualTypes = webhooks.map(webhook => webhook.type);

    for (const type of this.s.c.twitchApi.types) {
      if (actualTypes.includes(type)) {
        continue;
      }

      missingTypes.push(type);
    }

    if (missingTypes.length <= 0) {
      this.s.logger.log('All webhooks are found and valid. No updates required.');

      return;
    }

    for (const type of missingTypes) {
      let result = await this.create(broadcasterId, type);

      if (!result) result = {
        error: 'Empty',
        status: '<empty>',
      };

      if (result.error) {
        this.s.logger.error(`${result.status} ${result.error}: ${result.message}`);
      }
    }
  };
}
