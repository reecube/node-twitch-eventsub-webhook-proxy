module.exports = {
  apps: [{
    name: 'twitch-eventsub-proxy',
    script: './index.js',
    watch: ['lib'],
    watch_delay: 1000,
    cron_restart: '0 10 * * *',
  }],
};
