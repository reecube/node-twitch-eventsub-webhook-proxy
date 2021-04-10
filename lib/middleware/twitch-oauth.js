/**
 * @param {module:context} c
 *
 * @typedef {function} MiddlewareTwitchOauth
 */
module.exports = (c) => {
  const lib = c.lib;

  const endpointLogin = 'login';

  const scope = lib.data.scopes.join('+');

  const oauthState = lib.vendor.crypto.randomBytes(20).toString('hex');

  c.app.get('/oauthcallback', (req, res) => {
    res.send(`<script>document.location = '${lib.env.localUrl}/${endpointLogin}' + document.location.hash.replace('#', '?')</script>`);
  });

  c.app.get(`/${endpointLogin}`, async (req, res) => {
    if (req.query && req.query.access_token) {
      const state = req.query.state;

      if (state !== oauthState) {
        res.status(403);
        res.end();

        return;
      }

      const token = req.query.access_token;

      await lib.vendor.fs.promises.writeFile(lib.config.path.usertoken, token, 'utf8');

      const successMessage = 'Successfully connected to Twitch.';

      res.send(successMessage + 'You can close this window now.');
      res.end();

      c.logger.log(successMessage);

      await c.twitch.callbacks.usertoken(token);

      return;
    }

    const params = {
      client_id: lib.env.twitchClient.id,
      redirect_uri: `${lib.env.localUrl}/oauthcallback`,
      response_type: 'token',
      scope: scope,
      state: oauthState,
    };

    res.redirect(lib.tools.url.make(lib.config.twitch.url.oauth.authorize, params));
  });

  return async () => {
    c.logger.log('Fetch user token');

    try {
      const token = await lib.vendor.fs.promises.readFile(lib.config.path.usertoken, 'utf8');

      // TODO: add scope verification here

      await c.twitch.callbacks.usertoken(token);
    } catch (err) {
      const loginUrl = `${lib.env.localUrl}/${endpointLogin}`;

      c.logger.error(`No valid token found, please login with: ${loginUrl}`);

      const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
      require('child_process').exec(start + ' ' + loginUrl);
    }
  };
};
