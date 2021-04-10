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
      usertoken: async usertoken => {
        c.logger.log('User token received');

        const firstCall = c.secret.usertoken === false;

        c.secret.usertoken = usertoken;

        if (!usertoken || !firstCall) return;

        // 2. Start tunnel server
        c.tunnelUrl = await lib.middleware.tunnel(c);

        // 3. Fetch api token
        await c.twitch.eventsub();
      },
      token: async token => {
        c.logger.log('API token received');

        const firstCall = c.secret.token === false;

        c.secret.token = token;

        if (!token || !firstCall) return;

        // 4. Fetch broadcaster
        c.broadcaster = await c.twitch.fetchBroadcaster(lib.env.twitchClient.login);

        if (!c.broadcaster || !c.broadcaster.hasOwnProperty('id')) {
          process.exit(1);
          return;
        }

        // 5. Ensure all
        await c.twitch.webhooks.ensureAll(c.broadcaster.id);

        c.logger.log('Initialization done. Server is ready now.');
      },
    },
  };

  c.app.listen(lib.env.localPort, async () => {
    c.logger.log(`Listening on ${lib.env.localUrl}`);

    // 1. Fetch oauth token
    await c.twitch.oauth();
  });
})();
