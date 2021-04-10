module.exports = {
  apps: [{
    name: 'twitch-eventsub-proxy',
    script: './index.js',
    watch: ['lib'],
    watch_delay: 1000,
  }],
};
