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
- running home assistant server: https://www.home-assistant.io/
- node-red recommended: https://nodered.org/
- Twitch dev account: https://dev.twitch.tv/

## Installation

TODO

## Usage

TODO

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
- [ ] Verify security


## Credits

Initial code was based on: https://github.com/twitchdev/eventsub-webhooks-node-sample

Also thanks a lot to all the developers of node, yarn, home assistant and node-red!
