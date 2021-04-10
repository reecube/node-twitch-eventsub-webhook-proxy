/**
 * @typedef Logger
 * @property {function} log
 * @property {function} warn
 * @property {function} error
 */

/**
 * @param {Vendor} vendor
 * @return {Logger}
 */
module.exports = (vendor) => {
  const beautify = item => JSON.stringify(item, null, '  ');

  const doDefault = (type, messages) => {
    messages.unshift(type.padEnd(7));

    messages.unshift((new Date()).toISOString());
  };

  return {
    log: (...messages) => {
      if (!messages.length) return;

      doDefault('INFO', messages);

      console.log.apply(this, messages.map(message => {
        if (typeof message !== 'string') return beautify(message);

        return message;
      }));
    },
    warn: (...messages) => {
      if (!messages.length) return;

      doDefault('WARN', messages);

      console.log.apply(this, messages.map(message => {
        if (typeof message !== 'string') return beautify(message);

        return message;
      }));
    },
    error: (...messages) => {
      if (!messages.length) return;

      doDefault('ERROR', messages);

      console.error.apply(this, messages.map(message => {
        if (typeof message !== 'string') return beautify(message);

        return message;
      }));
    },
  };
};
