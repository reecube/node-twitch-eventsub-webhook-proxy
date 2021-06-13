import * as bodyParser from 'body-parser';

import { Middleware } from '../types/middleware';

export class Tools extends Middleware {

  async setup(): Promise<void> {

    // Support JSON responses on express
    this.s.app.use(bodyParser.json({
      verify: (req, res, buf) => {
        // Small modification to the JSON bodyParser to expose the raw body in the request object
        // The raw body is required at signature verification
        (req as any).rawBody = buf;
      },
    }));
  }
}
