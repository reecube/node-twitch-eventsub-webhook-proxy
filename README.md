# Home Assistant Twitch Server

Home Assistant Twitch Server written on node.

This server forwards Twitch events to the home assistant server to trigger custom actions.

## Features

- [x] Support for Twitch oauth and api tokens.
- [x] Support for self signed certificates on your home assistant server.
- [x] Proxy Twitch events from EventSub to your home assistant server.

## Prerequisites

- node: https://nodejs.org/
- yarn: https://yarnpkg.com/
- Twitch dev account: https://dev.twitch.tv/

### Optional: Our implementation

We are working with the following environment for best support:
- running home assistant server: https://www.home-assistant.io/
- node-red recommended: https://nodered.org/

## Installation

First you need to checkout the git project.

For a **production deployment** we highly recommend to work with **git tags** only.

Then you need to install the project dependencies with yarn:

```
yarn install
```

Now you have to setup the `.env` file on root with your configuration:

```
SECRET=

HOME_ASSISTANT_WEBHOOK_URL=

TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
TWITCH_CLIENT_LOGIN=

LT_SUBDOMAIN=

PROXY_PORT=
PROXY_URL=http://localhost:
```

As an alternative to the file you could just use environment variables.


## Usage

To start the proxy server call this command:

```
yarn dev
```

We recommend to use `pm2` (https://pm2.keymetrics.io/) for server deployments:

TODO: `pm2 install typescript`

```
yarn start
```

With the following command you can restart the instance after updating the code:

```
yarn restart
```

With the following command you can stop the instance from pm:

```
yarn stop
```

With the following command you can delete the instance from pm:

```
yarn delete
```

And to make your server running persistently, use following command:

```
pm2 startup
```

and to store the current configuration you can use:

```
pm2 save
```

## Roadmap

- [x] ~~Enforce env local tunnel id~~
- [x] ~~Clean up files and file structure~~
- [x] ~~Implement JSDoc or TypeScript~~
- [x] ~~Improve logger~~
- [x] ~~Improve architecture~~
- [ ] Implement status middleware: show server status and health
- [ ] Implement heartbeat middleware: Alive-webhook ping to ensure this server is still running
- [ ] Implement twitch chat middleware: enable bot support
- [ ] Auto-fetch tokens
- [ ] Implement redemption support: https://dev.twitch.tv/docs/api/reference#update-redemption-status
- [ ] Implement scope verification
- [ ] Implement config to remove unknown webhooks
- [ ] Complete readme file
- [ ] Implement doctor command to support with the setup process
- [ ] Notification spam protection against outside
- [ ] Graceful start and stop support: https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
- [ ] Implement file logger
- [ ] Verify security


## Credits

Initial code was based on: https://github.com/twitchdev/eventsub-webhooks-node-sample

Also thanks a lot to all the developers of node, yarn, home assistant and node-red!
