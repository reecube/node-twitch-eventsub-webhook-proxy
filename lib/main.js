const c = require('./context');
const lib = c.lib;

(async () => {
  c.logger = lib.tools.logger;

  c.app = lib.vendor.express();

  /**
   * @typedef TwitchContext
   * @property {MiddlewareTwitchOauth} oauth
   * @property {MiddlewareTwitchEventsub} eventsub
   */
  c.twitch = {
    oauth: lib.middleware.twitch.oauth(c),
    eventsub: lib.middleware.twitch.eventsub(c),
    callbacks: {
      usertoken: usertoken => {
        c.secret.usertoken = usertoken;
      },
      token: token => {
        c.secret.token = token;
      },
    },
  };

  c.app.listen(lib.env.localPort, async () => {
    c.logger.log(`Listening on ${lib.env.localUrl}`);

    c.tunnelUrl = lib.middleware.tunnel(c);

    c.twitch.callbacks.usertoken(await c.twitch.oauth());

    c.twitch.callbacks.token(await c.twitch.eventsub());

    console.log('TODO: ensure webhooks are registered correctly');

    // TODO: ensure webhooks are registered correctly
  });
})();
