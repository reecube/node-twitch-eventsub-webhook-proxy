import { Middleware } from '../types/middleware';
import { ExpressRequest, ExpressResponse } from '../types/express';

export class Status extends Middleware {

  async setup(): Promise<void> {
    this.s.app.get('/', this.onStatus.bind(this));
  }

  private async onStatus(req: ExpressRequest, res: ExpressResponse): Promise<void> {
    const now = new Date().getTime();
    const startuptime = this.s.startupTime;

    res.status(200);
    res.send({
      running: true,
      uptime: now - startuptime,
      startuptime,
      now,
    });
  }
}
