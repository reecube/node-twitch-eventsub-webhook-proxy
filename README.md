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
```

As an alternative to the file you could just use environment variables.


## Usage

To start the proxy server call this command:

```
yarn start
```

We recommend to use `pm2` (https://pm2.keymetrics.io/) for server deployments:

```
pm2 start index.js --name "twitch-eventsub-proxy"
```

With the following command you can restart the instance after updating the code:

```
pm2 restart twitch-eventsub-proxy
```

And to make your server running persistently, use following command:

```
pm2 startup
```

## Roadmap

- [ ] Implement redemption support: https://dev.twitch.tv/docs/api/reference#update-redemption-status
- [ ] Enforce env local tunnel id
- [ ] Alive-webhook ping to ensure this server is still running
- [ ] Auto-fetch tokens
- [ ] Implement scope verification
- [ ] Implement config to remove unknown webhooks
- [ ] Complete readme file
- [ ] Implement health check
- [ ] Implement status page
- [ ] Implement doctor command to support with the setup process
- [ ] Use vendor logger
- [ ] Clean up files and file structure
- [ ] Improve architecture
- [ ] Implement JSDoc or TypeScript
- [ ] Notification spam protection against outside
- [ ] Verify security


## Credits

Initial code was based on: https://github.com/twitchdev/eventsub-webhooks-node-sample

Also thanks a lot to all the developers of node, yarn, home assistant and node-red!
