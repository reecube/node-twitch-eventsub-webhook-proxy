/**
 * @param {module:context} c
 */
module.exports = (c) => {
  const lib = c.lib;

  const scope = lib.data.scopes.join('+');

  c.app.use(lib.vendor.bodyParser.json({
    verify: (req, res, buf) => {
      // Small modification to the JSON bodyParser to expose the raw body in the request object
      // The raw body is required at signature verification
      req.rawBody = buf;
    },
  }));

  const verifySignature = (messageSignature, messageID, messageTimestamp, body) => {
    const message = messageID + messageTimestamp + body;
    const signature = crypto.createHmac('sha256', lib.env.secret).update(message);
    const expectedSignatureHeader = 'sha256=' + signature.digest('hex');

    return expectedSignatureHeader === messageSignature;
  };

  c.app.post('/notification', async (req, res) => {
    if (!verifySignature(
      req.header('Twitch-Eventsub-Message-Signature'),
      req.header('Twitch-Eventsub-Message-Id'),
      req.header('Twitch-Eventsub-Message-Timestamp'),
      req.rawBody,
    )) {

      // Reject requests with invalid signatures
      res.status(403).send('Forbidden');

      return;
    }

    const notificationType = req.header('Twitch-Eventsub-Message-Type');

    if (notificationType === 'webhook_callback_verification') {
      c.logger.log(`Webhook '${req.body.challenge}' successfully verified.`);

      res.send(req.body.challenge);

      return;
    }

    if (notificationType !== 'notification') {
      c.logger.error(`Unexpected notification type '${notificationType}'! ${req.body}`);

      res.send('');

      return;
    }

    if (!req.body) {
      c.logger.error(`Unexpected notification body! ${req.body}`);

      res.send('');

      return;
    }

    const subscription = req.body.subscription;
    const event = req.body.event;

    const type = subscription.type;

    await lib.tools.request(lib.env.webhookUrl, {
      method: 'POST',
    }, event, true);

    c.logger.log(`Webhook '${type}' called`);

    res.send('');
  });

  return async () => {
      try {
        const tokenDataText = lib.vendor.fs.readFileSync(lib.config.path.token, 'utf8');

        const tokenData = JSON.parse(tokenDataText);

        if (tokenData && tokenData.expires && (new Date()).getTime() < tokenData.expires) {
          return tokenData.token;
        } else {
          lib.vendor.fs.unlinkSync(lib.config.path.token);
        }
      } catch (err) {
        c.logger.error(err);
      }

      const params = {
        client_id: lib.env.twitchClient.id,
        client_secret: lib.env.twitchClient.secret,
        grant_type: 'client_credentials',
        scope: scope,
      };

      const resultGetToken = await lib.tools.request(lib.tools.url.make(lib.config.twitch.url.oauth.token, params), {
        method: 'POST',
      });

      if (!resultGetToken || !resultGetToken.access_token || resultGetToken.token_type !== 'bearer') {
        c.logger.error(`Unexpected result! ${resultGetToken}`);

        return;
      }

      if (resultGetToken.scope.length !== lib.data.scopes.length) {
        c.logger.error(`Invalid scopes! ${resultGetToken.scope}`);

        return;
      }

      const tokenData = {
        token: resultGetToken.access_token,
        expires: (new Date()).getTime() + resultGetToken.expires_in,
        // TODO: add scope verification here
      };

      lib.vendor.fs.writeFileSync(lib.config.path.token, JSON.stringify(tokenData), 'utf8');

      c.logger.log('Token fetched successfully.');

      process.exit(0);
  };
};
