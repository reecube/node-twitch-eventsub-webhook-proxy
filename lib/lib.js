const localPort = process.env.PROXY_PORT;
const localUrl = process.env.PROXY_URL;

const twitchUrls = {
  oauth: {
    base: 'https://id.twitch.tv/oauth2',
  },
  api: {
    base: 'https://api.twitch.tv',
  },
};

twitchUrls.oauth.authorize = `${twitchUrls.oauth.base}/authorize`;
twitchUrls.oauth.token = `${twitchUrls.oauth.base}/token`;

twitchUrls.api.helixUsers = `${twitchUrls.api.base}/helix/users`;
twitchUrls.api.helixEventsub = `${twitchUrls.api.base}/helix/eventsub/subscriptions`;

/**
 * @typedef Vendor
 */
const vendor = {
  fs: require('fs'),
  http: require('http'),
  https: require('https'),
  express: require('express'),
  bodyParser: require('body-parser'),
  crypto: require('crypto'),
  localtunnel: require('localtunnel'),
};

/**
 * @module lib
 */
module.exports = {
  vendor,
  env: {
    appSecret: process.env.SECRET,
    webhookUrl: process.env.HOME_ASSISTANT_WEBHOOK_URL,
    twitchClient: {
      id: process.env.TWITCH_CLIENT_ID,
      secret: process.env.TWITCH_CLIENT_SECRET,
      login: process.env.TWITCH_CLIENT_LOGIN,
    },
    localPort: localPort,
    localUrl,
    tunnel: {
      subdomain: process.env.LT_SUBDOMAIN,
    },
  },
  config: {
    path: {
      token: '.token',
      usertoken: '.usertoken',
    },
    endpoints: {
      notification: 'notification',
    },
    twitch: {
      url: twitchUrls,
    },
  },
  tools: {
    request: require('./tools/request')(vendor),
    url: require('./tools/url')(vendor),
    logger: require('./tools/logger')(vendor),
  },
  middleware: {
    tunnel: require('./middleware/tunnel'),
    twitch: {
      broadcaster: require('./middleware/twitch-broadcaster'),
      apiAuthHeaders: require('./middleware/twitch-api-auth-headers'),
      oauth: require('./middleware/twitch-oauth'),
      eventsub: require('./middleware/twitch-eventsub'),
      webhooks: require('./middleware/twitch-webhooks'),
    },
  },
  data: {
    scopes: require('./data/scopes'),
    types: require('./data/types'),
  },
};
