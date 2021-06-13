import * as express from 'express';

import { Config } from './Config';
import { Logger } from './Logger';
import { Helper } from './Helper';
import { FileSystem } from './FileSystem';
import { Request } from './Request';
import { Secret } from './Secret';
import { BaseSupport } from './BaseSupport';
import { Middleware } from '../types/middleware';
import { TwitchAuthUser } from '../middleware/TwitchAuthUser';
import { TwitchEventsub } from '../middleware/TwitchEventsub';
import { TwitchChat } from '../middleware/TwitchChat';
import { Heartbeat } from '../middleware/Heartbeat';
import { Status } from '../middleware/Status';
import { Tools } from '../middleware/Tools';

class SupportMiddleware extends BaseSupport {
  tools = new Tools(this.s);
  status = new Status(this.s);
  heartbeat = new Heartbeat(this.s);
  twitchAuthUser = new TwitchAuthUser(this.s);
  twitchEventsub = new TwitchEventsub(this.s);
  twitchChat = new TwitchChat(this.s);

  readonly all: Middleware[] = [
    this.tools,
    this.status,
    this.heartbeat,
    this.twitchAuthUser,
    this.twitchEventsub,
    this.twitchChat,
  ];
}

export class Support {
  startupTime = new Date().getTime();

  readonly c = new Config();
  readonly logger = new Logger(process.env.NODE_ENV === 'development');
  readonly h = new Helper();
  readonly fs = new FileSystem(this);
  readonly r = new Request(this);
  readonly secret = new Secret(this);
  readonly app = express();
  readonly middleware = new SupportMiddleware(this);

  async setup() {
    await this.r.loadCertificate();

    await this.secret.loadFromFile();

    for (const entry of this.middleware.all) {
      await entry.setup();
    }
  }

  async start() {
    for (const entry of this.middleware.all) {
      await entry.start();
    }

    this.app.listen(process.env.SERVER_PORT, async () => {
      this.logger.log(`Listening on port ${process.env.SERVER_PORT}`);

      for (const entry of this.middleware.all) {
        await entry.started();
      }
    });
  }
}
