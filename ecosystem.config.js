module.exports = {
  apps: [{
    // https://pm2.keymetrics.io/docs/usage/application-declaration/#control-flow
    name: 'twitch-eventsub-proxy',
    script: './index.ts',
    watch: ['src'],
    watch_delay: 1000,
    max_restarts: 2,
    min_uptime: 10000,
    cron_restart: '0 10 * * *',
  }],
};
