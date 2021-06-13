import { Support } from './support/Support';

export class Main {
  private readonly s: Support = new Support();

  async run() {
    this.s.logger.log('Setup server...');

    await this.s.setup();

    this.s.logger.log('Start server...');

    await this.s.start();
  }
}
