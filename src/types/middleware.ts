import { BaseSupport } from '../support/BaseSupport';

export abstract class Middleware extends BaseSupport {

  abstract setup(): Promise<void>;

  async start(): Promise<void> {
    // OPTIONAL: Do nothing
  }

  async started(): Promise<void> {
    // OPTIONAL: Do nothing
  }
}
