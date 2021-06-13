import { Middleware } from '../types/middleware';

export class TwitchBroadcaster extends Middleware {

  async setup(): Promise<void> {
    // Do nothing
  }

  async started(): Promise<void> {
    await super.started();

    this.s.c.broadcasterId = await this.fetchId(process.env.TWITCH_CLIENT_LOGIN);
  }

  async fetchId(login: string): Promise<string> {
    const getBroadcasterIdUrl = this.s.h.url.make(this.s.c.twitchUrls.api.helixUsers, { login: login });

    const result = await this.s.r.request(getBroadcasterIdUrl, {
      method: 'GET',
      headers: await this.s.secret.makeUserAuthHeaders(),
    });


    if (result && result.error) {
      switch (result?.status) {
        default:
          throw new Error(`${result.status} ${result.error}: ${result.message}`);
      }
    }

    if (!result || !result.data || !result.data.length || !result.data[0].id) {
      this.s.logger.error(`No broadcaster found with login '${login}'!`);

      return '';
    }

    return result.data[0];
  }
}
