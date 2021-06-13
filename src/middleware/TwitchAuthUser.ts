import { Middleware } from '../types/middleware';

export class TwitchAuthUser extends Middleware {

  async setup(): Promise<void> {
    // TODO: implement this
  }

  async start(): Promise<void> {
    await super.start();

    // TODO: implement this
  }

  async started(): Promise<void> {
    await super.started();

    await this.fetchToken();

    // TODO: implement this
  }

  async fetchToken(): Promise<void> {
    // TODO: implement this
  }
}
