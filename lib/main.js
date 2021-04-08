const c = require('./context');
const lib = c.lib;

(async () => {
  c.logger = lib.tools.logger();

  c.app = lib.vendor.express();

  c.twitch = {
    oauth: lib.middleware.twitch.oauth(c),
    eventsub: lib.middleware.twitch.eventsub(c),
  };

  c.app.listen(lib.env.localPort, async () => {
    c.logger.log(`Listening on ${lib.env.localUrl}`);

    c.tunnelUrl = lib.middleware.tunnel(c);

    // TODO: fetch token and start app

    // TODO: ensure webhooks are registered correctly
  });
})();
