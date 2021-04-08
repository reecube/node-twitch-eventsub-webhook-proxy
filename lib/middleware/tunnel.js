/**
 * @param {module:context} c
 * @return {Promise<string>}
 */
module.exports = async (c) => {
  const lib = c.lib;

  const tunnel = await lib.vendor.localtunnel({
    subdomain: lib.env.tunnel.subdomain,
    port: process.env.PROXY_PORT,
  });

  const tunnelUrl = tunnel.url;

  c.logger.log(`Tunnel opened for '${tunnelUrl}'`);

  tunnel.on('close', () => {
    c.logger.error('Tunnel closed unexpected!');

    process.exit(1);
  });

  return tunnelUrl;
};
