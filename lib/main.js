// Based on: https://github.com/twitchdev/eventsub-webhooks-node-sample

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const crypto = require('crypto');
const localtunnel = require('localtunnel');

const doRequest = (params, callback, body) => {
  let responseData = '';

  const request = https.request(params, (result) => {
    result.setEncoding('utf8');
    result.on('data', (d) => {
      responseData = responseData + d;
    }).on('end', (listenerResult) => {
      if (!responseData) return;

      const responseBody = JSON.parse(responseData);
      if (callback) callback(responseBody, listenerResult);
    });
  });

  request.on('error', (e) => {
    console.error(e);
  });

  if (typeof body !== 'undefined') request.write(JSON.stringify(body));

  request.end();
};

(async () => {
  const appSecret = process.env.SECRET;
  const oauthState = crypto.randomBytes(20).toString('hex');
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const clientLogin = process.env.TWITCH_CLIENT_LOGIN;
  const ltSubdomain = process.env.LT_SUBDOMAIN;
  const port = process.env.PROXY_PORT;
  const localUrl = `http://localhost:${port}`;
  const endpointLogin = 'login';
  const tokenFile = '.token';
  const usertokenFile = '.usertoken';

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

  const initializeWithToken = (token, usertoken) => {
    const twitchApi = 'api.twitch.tv';
    const helixUsersPath = 'helix/users';
    const helixEventsubSubscriptionPath = 'helix/eventsub/subscriptions';
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

    // Get webhooks
    doRequest({
      host: twitchApi,
      path: helixEventsubSubscriptionPath,
      method: 'GET',
      headers: twitchApiAuthHeaders,
    }, (result) => {
      if (!result || !result.data || !result.data.length) {
        console.log('');
        console.log('No webhooks registered.');

        return;
      }

      console.log('');
      console.log(`Delete existing ${result.data.length} webhooks.`);

      for (const webhook of result.data) {
        const webhookId = webhook.id;

        console.log(`- delete webhook ${webhookId}`);

        doRequest({
          host: twitchApi,
          path: `${helixEventsubSubscriptionPath}?id=${webhookId}`,
          method: 'DELETE',
          headers: twitchApiAuthHeaders,
        }, (result) => {
          console.log('');
          console.log(result);
          console.log(`Webhook ${webhookId} deleted`);
        });
      }
    });

    const createWebhook = (broadcasterId, type, callback) => doRequest({
      host: twitchApi,
      path: helixEventsubSubscriptionPath,
      method: 'POST',
      headers: twitchApiAuthHeaders,
    }, callback, {
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

    const createWebhooks = (broadcasterId, callback) => {
      const types = [
        'channel.update', // Channel Update: A broadcaster updates their channel properties e.g., category, title, mature flag, broadcast, or language.
        'channel.follow', // Channel Follow: A specified channel receives a follow.
        'channel.subscribe', // Channel Subscribe: A notification when a specified channel receives a subscriber. This does not include resubscribes.
        'channel.cheer', // Channel Cheer: A user cheers on the specified channel.
        'channel.raid', // Channel Raid: A broadcaster raids another broadcaster’s channel.
        'channel.ban', // Channel Ban: A viewer is banned from the specified channel.
        'channel.unban', // Channel Unban: A viewer is unbanned from the specified channel.
        'channel.moderator.add', // Channel Moderator Add: Moderator privileges were added to a user on a specified channel.
        'channel.moderator.remove', // Channel Moderator Remove: Moderator privileges were removed from a user on a specified channel.
        'channel.channel_points_custom_reward.add', // Channel Points Custom Reward Add: A custom channel points reward has been created for the specified channel.
        'channel.channel_points_custom_reward.update', // Channel Points Custom Reward Update: A custom channel points reward has been updated for the specified channel.
        'channel.channel_points_custom_reward.remove', // Channel Points Custom Reward Remove: A custom channel points reward has been removed from the specified channel.
        'channel.channel_points_custom_reward_redemption.add', // Channel Points Custom Reward Redemption Add: A viewer has redeemed a custom channel points reward on the specified channel.
        'channel.channel_points_custom_reward_redemption.update', // Channel Points Custom Reward Redemption Update: A redemption of a channel points custom reward has been updated for the specified channel.
        'channel.hype_train.begin', // Hype Train Begin: A hype train begins on the specified channel.
        'channel.hype_train.progress', // Hype Train Progress: A hype train makes progress on the specified channel.
        'channel.hype_train.end', // Hype Train End: A hype train ends on the specified channel.
        'stream.online', // Stream Online: The specified broadcaster starts a stream.
        'stream.offline', // Stream Offline: The specified broadcaster stops a stream.
        'user.authorization.revoke', // User Authorization Revoke: A user’s authorization has been revoked for your client id.
        'user.update', // User Update: A user has updated their account.
      ];

      for (const type of types) {
        createWebhook(broadcasterId, type, callback);
      }
    };

    // Get broadcaster id
    doRequest({
      host: twitchApi,
      path: `${helixUsersPath}?login=${clientLogin}`,
      method: 'GET',
      headers: twitchApiAuthHeaders,
    }, (result) => {
      if (!result || !result.data || !result.data.length || !result.data[0].id) {
        console.log('');
        console.error(`No broadcaster found with login '${clientLogin}'!`);

        return;
      }

      const broadcasterId = result.data[0].id;

      console.log('');
      console.error(`Register hooks for user '${clientLogin}' with id '${broadcasterId}'!`);

      createWebhooks(broadcasterId);
    });

    const verifySignature = (messageSignature, messageID, messageTimestamp, body) => {
      const message = messageID + messageTimestamp + body;
      const signature = crypto.createHmac('sha256', appSecret).update(message);
      const expectedSignatureHeader = 'sha256=' + signature.digest('hex');

      return expectedSignatureHeader === messageSignature;
    };

    app.post('/notification', (req, res) => {
      if (!verifySignature(req.header('Twitch-Eventsub-Message-Signature'),
        req.header('Twitch-Eventsub-Message-Id'),
        req.header('Twitch-Eventsub-Message-Timestamp'),
        req.rawBody)) {
        res.status(403).send('Forbidden'); // Reject requests with invalid signatures
        return;
      }

      const notificationType = req.header('Twitch-Eventsub-Message-Type');

      if (notificationType === 'webhook_callback_verification') {
        res.send(req.body.challenge);
        return;
      }

      console.log(`Notification received '${notificationType}'`, req.body.challenge);

      switch (notificationType) {
        case 'notification':
          console.log(req.body.event);
          res.send('');
          break;
        default:
          console.log('Not implemented', req.body);
          res.send('');
          break;
      }
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

    const url = 'https://id.twitch.tv/oauth2/authorize?' + Object.entries(params).map(param => `${param[0]}=${param[1]}`).join('&');

    res.redirect(url);
  });

  app.listen(port, () => {
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
        initializeWithToken(tokenData.token, usertoken);

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
      scope: encodeURIComponent(scopes.join(' ')),
    };

    doRequest({
      host: 'id.twitch.tv',
      path: '/oauth2/token?' + Object.entries(params).map(param => `${param[0]}=${param[1]}`).join('&'),
      method: 'POST',
    }, (result) => {
      if (!result || !result.access_token || result.token_type !== 'bearer') {
        console.log('');
        console.error('Unexpected result!', result);

        return;
      }

      if (result.scope.length !== scopes.length) {
        console.log('');
        console.error('Invalid scopes!', result.scope);

        return;
      }

      const tokenData = {
        token: result.access_token,
        expires: (new Date()).getTime() + result.expires_in,
      };

      fs.writeFileSync(tokenFile, JSON.stringify(tokenData), 'utf8');

      console.log('');
      console.log('Token fetched successfully. Please start the server again.');

      process.exit(0);
    });
  });
})();
