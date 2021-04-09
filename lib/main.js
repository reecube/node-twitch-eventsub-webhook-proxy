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
    apiAuthHeaders: lib.middleware.twitch.apiAuthHeaders(c),
    fetchBroadcaster: lib.middleware.twitch.broadcaster(c),
    oauth: lib.middleware.twitch.oauth(c),
    eventsub: lib.middleware.twitch.eventsub(c),
    webhooks: lib.middleware.twitch.webhooks(c),
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

    c.tunnelUrl = await lib.middleware.tunnel(c);

    c.twitch.callbacks.usertoken(await c.twitch.oauth());

    c.twitch.callbacks.token(await c.twitch.eventsub());

    c.broadcaster = await c.twitch.fetchBroadcaster(lib.env.twitchClient.login);

    if (!c.broadcaster || !c.broadcaster.hasOwnProperty('id')) {
      process.exit(1);
      return;
    }

    await c.twitch.webhooks.ensureAll(c.broadcaster.id);

    c.logger.log('Initialization done. Server is ready now.');
  });
})();
