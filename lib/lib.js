/**
 * @module lib
 */
module.exports = {
  vendor: {
    fs: require('fs'),
    express: require('express'),
    bodyParser: require('body-parser'),
    crypto: require('crypto'),
    localtunnel: require('localtunnel'),
  },
  env: {
    secret: process.env.SECRET,
    webhookUrl: process.env.HOME_ASSISTANT_WEBHOOK_URL,
    twitchClient: {
      id: process.env.TWITCH_CLIENT_ID,
      secret: process.env.SECRET,
      login: process.env.TWITCH_CLIENT_LOGIN,
    },
    localPort: process.env.PROXY_PORT,
    localUrl: `http://localhost:${this.localPort}`,
    tunnel: {
      subdomain: process.env.LT_SUBDOMAIN,
    },
  },
  config: {
    path: {
      token: '.token',
      usertoken: '.usertoken',
    },
    twitch: {
      url: {
        oauth: {
          base: 'https://id.twitch.tv/oauth2',
          authorize: `${this.base}/authorize`,
          token: `${this.base}/token`,
        },
        api: {
          base: 'https://api.twitch.tv',
          helixUsers: `${this.base}/helix/users`,
          helixEventsub: `${this.base}/helix/eventsub/subscriptions`,
        },
      },
    },
  },
  tools: {
    request: require('./tools/request'),
    url: require('./tools/url'),
    logger: require('./tools/logger'),
  },
  middleware: {
    tunnel: require('./middleware/tunnel'),
    twitch: {
      oauth: require('./middleware/twitch-oauth'),
      eventsub: require('./middleware/twitch-eventsub'),
    },
  },
  data: {
    scopes: require('./data/scopes'),
    types: require('./data/types'),
  },
};
