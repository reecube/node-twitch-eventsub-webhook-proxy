import * as crypto from 'crypto';

import { Middleware } from '../types/middleware';
import { ExpressRequest, ExpressResponse } from '../types/express';
import { Token } from '../support/Secret';

export class TwitchEventsub extends Middleware {

  private readonly scopes = this.s.c.twitchApi.scopes;
  private readonly scopesString = this.scopes.join('+');

  async setup(): Promise<void> {
    this.s.app.post(this.s.c.endpoints.notification, this.onNotification);
  }

  async fetchToken(): Promise<Token> {
    this.s.logger.log('Fetch api token');

    const params = {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: this.scopesString,
    };

    const url = this.s.h.url.make(this.s.c.twitchUrls.oauth.token, params);

    const resultGetToken = await this.s.r.request(url, {
      method: 'POST',
    });

    if (!resultGetToken || !resultGetToken.access_token || resultGetToken.token_type !== 'bearer') {
      this.s.logger.error(`Unexpected result!`, resultGetToken);

      return;
    }

    if (resultGetToken.scope.length !== this.scopes.length) {
      this.s.logger.error(`Invalid scopes!`, resultGetToken.scope);

      return;
    }

    return {
      token: resultGetToken.access_token,
      expires: (new Date()).getTime() + resultGetToken.expires_in,
      // TODO: add scope verification here
    };
  }

  private static verifySignature(
    messageSignature: string,
    messageID: string,
    messageTimestamp: string,
    body: string,
  ): boolean {
    const message = messageID + messageTimestamp + body;
    const signature = crypto.createHmac('sha256', process.env.SECRET).update(message);
    const expectedSignatureHeader = 'sha256=' + signature.digest('hex');

    return expectedSignatureHeader === messageSignature;
  };

  private async onNotification(req: ExpressRequest, res: ExpressResponse): Promise<void> {
    const reqIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    this.s.logger.log(`Notification received from ${reqIp}.`);

    const rawBody = req && (req as any).rawBody;

    if (!rawBody) {
      res.status(400).send('Bad request');

      this.s.logger.warn('Invalid notification received!', reqIp);

      return;
    }

    if (!TwitchEventsub.verifySignature(
      req.header('Twitch-Eventsub-Message-Signature'),
      req.header('Twitch-Eventsub-Message-Id'),
      req.header('Twitch-Eventsub-Message-Timestamp'),
      rawBody,
    )) {

      // Reject requests with invalid signatures
      res.status(403).send('Forbidden');

      return;
    }

    const notificationType = req.header('Twitch-Eventsub-Message-Type');

    if (notificationType === 'webhook_callback_verification') {
      this.s.logger.log(`Webhook '${rawBody.challenge}' successfully verified.`);

      res.send(rawBody.challenge);

      return;
    }

    if (notificationType !== 'notification') {
      this.s.logger.error(`Unexpected notification type '${notificationType}'!`, req.body);

      res.send('');

      return;
    }

    if (!req.body) {
      this.s.logger.error(`Unexpected notification body!`, req.body);

      res.send('');

      return;
    }

    const subscription = req.body.subscription;
    const event = req.body.event;

    const type = subscription.type;

    await this.s.r.request(process.env.HOME_ASSISTANT_WEBHOOK_URL, {
      method: 'POST',
    }, {
      subscription,
      event,
    }, true);

    this.s.logger.log(`Webhook '${type}' called`);

    res.send('');
  }
}
