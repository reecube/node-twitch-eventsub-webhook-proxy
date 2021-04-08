// Based on: https://github.com/twitchdev/eventsub-webhooks-node-sample

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const localtunnel = require('localtunnel');

const paramsToUrl = (params) => Object.entries(params).map(param => `${param[0]}=${param[1]}`).join('&');

const doRequest = (url, options, body) => new Promise(async (resolve) => {
  let responseData = '';

  const callback = (result) => {
    result.setEncoding('utf8');
    result.on('data', (d) => {
      responseData += d;
    }).on('end', () => {
      if (!responseData) {
        resolve();

        return;
      }

      try {
        const responseBody = JSON.parse(responseData);

        resolve(responseBody);
      } catch (e) {
        resolve(responseData);
      }
    });
  };

  const bodyData = (body !== 'undefined') ? JSON.stringify(body) : '';

  if (bodyData) {
    if (!options.headers) options.headers = {};

    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = bodyData.length;
  }

  const request = (url.startsWith('http:'))
    ? http.request(url, options, callback)
    : https.request(url, options, callback);

  request.on('error', (e) => {
    console.log('');
    console.error(e);
  });

  if (bodyData) request.write(bodyData);

  request.end();
});

(async () => {
  const appSecret = process.env.SECRET;
  const oauthState = crypto.randomBytes(20).toString('hex');
  const haWebhookUrl = process.env.HOME_ASSISTANT_WEBHOOK_URL;
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const clientLogin = process.env.TWITCH_CLIENT_LOGIN;
  const ltSubdomain = process.env.LT_SUBDOMAIN;
  const port = process.env.PROXY_PORT;
  const localUrl = `http://localhost:${port}`;
  const endpointLogin = 'login';
  const tokenFile = '.token';
  const usertokenFile = '.usertoken';

  const twitchAuthUrl = 'https://id.twitch.tv/oauth2';
  const twitchApiUrl = 'https://api.twitch.tv';
  const helixUsersPath = '/helix/users';
  const helixEventsubSubscriptionPath = '/helix/eventsub/subscriptions';

  // TODO: extend this to own local file
  const scopes = [
    'analytics:read:extensions', // View analytics data for the Twitch Extensions owned by the authenticated account.
    'analytics:read:games', // View analytics data for the games owned by the authenticated account.
    'bits:read', // View Bits information for a channel.
    'channel:edit:commercial', // Run commercials on a channel.
    'channel:manage:broadcast', // Manage a channel’s broadcast configuration, including updating channel configuration and managing stream markers and stream tags.
    'channel:manage:extensions', // Manage a channel’s Extension configuration, including activating Extensions.
    'channel:manage:redemptions', // Manage Channel Points custom rewards and their redemptions on a channel.
    'channel:manage:videos', // Manage a channel’s videos, including deleting videos.
    'channel:read:editors', // View a list of users with the editor role for a channel.
    'channel:read:hype_train', // View Hype Train information for a channel.
    'channel:read:redemptions', // View Channel Points custom rewards and their redemptions on a channel.
    'channel:read:stream_key', // View an authorized user’s stream key.
    'channel:read:subscriptions', // View a list of all subscribers to a channel and check if a user is subscribed to a channel.
    'clips:edit', // Manage Clips for a channel.
    'moderation:read', // View a channel’s moderation data including Moderators, Bans, Timeouts, and Automod settings.
    'user:edit', // Manage a user object.
    'user:edit:follows', // Edit a user’s follows.
    'user:manage:blocked_users', // Manage the block list of a user.
    'user:read:blocked_users', // View the block list of a user.
    'user:read:broadcast', // View a user’s broadcasting configuration, including Extension configurations.
    'user:read:subscriptions', // View if an authorized user is subscribed to specific channels.
  ];

  // TODO: extend this to own local file
  const types = {
    // 'channel.update': 'update', // Channel Update: A broadcaster updates their channel properties e.g., category, title, mature flag, broadcast, or language.
    'channel.follow': 'follow', // Channel Follow: A specified channel receives a follow.
    'channel.subscribe': 'subscribe', // Channel Subscribe: A notification when a specified channel receives a subscriber. This does not include resubscribes.
    'channel.cheer': 'cheer', // Channel Cheer: A user cheers on the specified channel.
    'channel.raid': 'raid', // Channel Raid: A broadcaster raids another broadcaster’s channel.
    // 'channel.ban': 'ban', // Channel Ban: A viewer is banned from the specified channel.
    // 'channel.unban': 'unban', // Channel Unban: A viewer is unbanned from the specified channel.
    // 'channel.moderator.add': 'moderator_add', // Channel Moderator Add: Moderator privileges were added to a user on a specified channel.
    // 'channel.moderator.remove': 'moderator_remove', // Channel Moderator Remove: Moderator privileges were removed from a user on a specified channel.
    // 'channel.channel_points_custom_reward.add': 'reward_add', // Channel Points Custom Reward Add: A custom channel points reward has been created for the specified channel.
    // 'channel.channel_points_custom_reward.update': 'reward_update', // Channel Points Custom Reward Update: A custom channel points reward has been updated for the specified channel.
    // 'channel.channel_points_custom_reward.remove': 'reward_remove', // Channel Points Custom Reward Remove: A custom channel points reward has been removed from the specified channel.
    'channel.channel_points_custom_reward_redemption.add': 'redeem_add', // Channel Points Custom Reward Redemption Add: A viewer has redeemed a custom channel points reward on the specified channel.
    'channel.channel_points_custom_reward_redemption.update': 'redeem_update', // Channel Points Custom Reward Redemption Update: A redemption of a channel points custom reward has been updated for the specified channel.
    'channel.hype_train.begin': 'hype_train_begin', // Hype Train Begin: A hype train begins on the specified channel.
    'channel.hype_train.progress': 'hype_train_progress', // Hype Train Progress: A hype train makes progress on the specified channel.
    'channel.hype_train.end': 'hype_train_end', // Hype Train End: A hype train ends on the specified channel.
    'stream.online': 'stream_start', // Stream Online: The specified broadcaster starts a stream.
    'stream.offline': 'stream_end', // Stream Offline: The specified broadcaster stops a stream.
    // 'user.authorization.revoke': 'authorization_revoke', // User Authorization Revoke: A user’s authorization has been revoked for your client id.
    // 'user.update': 'user_update', // User Update: A user has updated their account.
  };

  const verifySignature = (messageSignature, messageID, messageTimestamp, body) => {
    const message = messageID + messageTimestamp + body;
    const signature = crypto.createHmac('sha256', appSecret).update(message);
    const expectedSignatureHeader = 'sha256=' + signature.digest('hex');

    return expectedSignatureHeader === messageSignature;
  };

  const tunnel = await localtunnel({
    subdomain: ltSubdomain,
    port: port,
  });

  const tunnelUrl = tunnel.url;

  console.log('');
  console.log(`Tunnel opened for '${tunnelUrl}'`);

  tunnel.on('close', () => {
    console.error('Tunnel closed unexpected!');
    process.exit(1);
  });

  const app = express();

  app.use(bodyParser.json({
    verify: (req, res, buf) => {
      // Small modification to the JSON bodyParser to expose the raw body in the request object
      // The raw body is required at signature verification
      req.rawBody = buf;
    },
  }));

  const initializeWithToken = async (token, usertoken) => {
    const twitchApiAuthHeaders = {
      'Content-Type': 'application/json',
      'Client-ID': clientId,
      'Authorization': 'Bearer ' + token,
    };
    const twitchApiUserAuthHeaders = {
      'Content-Type': 'application/json',
      'Client-ID': clientId,
      'Authorization': 'Bearer ' + usertoken,
    };

    const clearWebhooks = async () => {
      console.log('');
      console.log('Clear webhooks');

      const resultGetWebhooks = await doRequest(`${twitchApiUrl}${helixEventsubSubscriptionPath}`, {
        method: 'GET',
        headers: twitchApiAuthHeaders,
      });

      if (!resultGetWebhooks || !resultGetWebhooks.data || !resultGetWebhooks.data.length) {
        console.log('');
        console.log('No webhooks registered.');

        return;
      }

      console.log('');
      console.log(`Delete existing ${resultGetWebhooks.data.length} webhooks.`);

      for (const webhook of resultGetWebhooks.data) {
        const webhookId = webhook.id;

        console.log(`- delete webhook ${webhookId}`);

        await doRequest(`${twitchApiUrl}${helixEventsubSubscriptionPath}?id=${webhookId}`, {
          method: 'DELETE',
          headers: twitchApiAuthHeaders,
        });

        console.log(`- => webhook ${webhookId} deleted`);
      }
    };

    const createWebhook = (broadcasterId, type) => doRequest(`${twitchApiUrl}${helixEventsubSubscriptionPath}`, {
      method: 'POST',
      headers: twitchApiAuthHeaders,
    }, {
      'type': type,
      'version': '1',
      'condition': {
        'broadcaster_user_id': broadcasterId,
      },
      'transport': {
        'method': 'webhook',
        'callback': tunnelUrl + '/notification',
        'secret': appSecret,
      },
    });

    const createWebhooks = async (broadcasterId, callback) => {
      for (const type of Object.keys(types)) {
        await createWebhook(broadcasterId, type, callback);
      }
    };

    // Get broadcaster id
    const resultGetBroadcasterId = await doRequest(`${twitchApiUrl}${helixUsersPath}?login=${clientLogin}`, {
      method: 'GET',
      headers: twitchApiAuthHeaders,
    });

    if (!resultGetBroadcasterId || !resultGetBroadcasterId.data || !resultGetBroadcasterId.data.length || !resultGetBroadcasterId.data[0].id) {
      console.log('');
      console.error(`No broadcaster found with login '${clientLogin}'!`);

      return;
    }

    await clearWebhooks();

    const broadcasterId = resultGetBroadcasterId.data[0].id;

    console.log('');
    console.error(`Register hooks for user '${clientLogin}' with id '${broadcasterId}'.`);

    await createWebhooks(broadcasterId);

    app.post('/notification', async (req, res) => {
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
        console.log('');
        console.log(`Webhook '${req.body.challenge}' successfully verified.`);

        res.send(req.body.challenge);

        return;
      }

      if (notificationType !== 'notification') {
        console.log('');
        console.error(`Unexpected notification type '${notificationType}'!`, req.body);

        res.send('');

        return;
      }

      if (!req.body) {
        console.log('');
        console.error(`Unexpected notification body!`, req.body);

        res.send('');

        return;
      }

      const subscription = req.body.subscription;
      const event = req.body.event;

      const type = subscription.type;

      // TODO: think about this
      if (type === 'stream.offline') {
        console.log('');
        console.log('Stream went offline');
        console.log('Stop server...');

        await clearWebhooks();

        process.exit(0);

        return;
      }

      await doRequest(haWebhookUrl, {
        method: 'POST'
      }, event);

      console.log('');
      console.log(`Webhook '${type}' called`);

      res.send('');
    });
  };

  app.get('/oauthcallback', (req, res) => {
    res.send(`<script>document.location = '${localUrl}/${endpointLogin}' + document.location.hash.replace('#', '?')</script>`);
  });

  app.get(`/${endpointLogin}`, (req, res) => {
    if (req.query && req.query.access_token) {
      const state = req.query.state;

      if (state !== oauthState) {
        res.status(403);
        res.end();

        return;
      }

      const token = req.query.access_token;

      fs.writeFileSync(usertokenFile, token, 'utf8');

      const successMessage = 'Successfully connected to Twitch. ';

      res.send(successMessage + 'You can close this window now.');
      res.end();

      console.log('');
      console.log(successMessage + 'Please start the server again.');

      process.exit(0);

      return;
    }

    const params = {
      client_id: clientId,
      redirect_uri: `${localUrl}/oauthcallback`,
      response_type: 'token',
      scope: scopes.join('+'),
      state: oauthState,
    };

    res.redirect(`${twitchAuthUrl}/authorize?${paramsToUrl(params)}`);
  });

  app.listen(port, async () => {
    console.log('');
    console.log(`Listening on ${localUrl}`);

    let usertoken = null;

    try {
      usertoken = fs.readFileSync(usertokenFile, 'utf8');
    } catch (err) {
      const loginUrl = `${localUrl}/${endpointLogin}`;

      console.log('');
      console.log('No valid token found, please login with:');
      console.log(loginUrl);

      const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
      require('child_process').exec(start + ' ' + loginUrl);

      return;
    }

    try {
      const tokenDataText = fs.readFileSync(tokenFile, 'utf8');

      const tokenData = JSON.parse(tokenDataText);

      if (tokenData && tokenData.expires && (new Date()).getTime() < tokenData.expires) {
        await initializeWithToken(tokenData.token, usertoken);

        return;
      } else {
        fs.unlinkSync(tokenFile);
      }
    } catch (err) {
      console.log('');
      console.error(err);
    }

    const params = {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: scopes.join('+'),
    };

    const resultGetToken = await doRequest(`${twitchAuthUrl}/token?${paramsToUrl(params)}`, {
      method: 'POST',
    });

    if (!resultGetToken || !resultGetToken.access_token || resultGetToken.token_type !== 'bearer') {
      console.log('');
      console.error('Unexpected result!', resultGetToken);

      return;
    }

    if (resultGetToken.scope.length !== scopes.length) {
      console.log('');
      console.error('Invalid scopes!', resultGetToken.scope);

      return;
    }

    const tokenData = {
      token: resultGetToken.access_token,
      expires: (new Date()).getTime() + resultGetToken.expires_in,
    };

    fs.writeFileSync(tokenFile, JSON.stringify(tokenData), 'utf8');

    console.log('');
    console.log('Token fetched successfully. Please start the server again.');

    process.exit(0);
  });
})();
