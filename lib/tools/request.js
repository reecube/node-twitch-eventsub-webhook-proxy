const fs = require('fs');

const localCaPath = './localca.crt';
const localCa = fs.existsSync(localCaPath) ? fs.readFileSync(localCaPath).toString() : '';

module.exports = (url, options, body, useLocalCa) => new Promise(async (resolve, reject) => {
  if (!url) throw Error('Invalid url!');

  if (!options) options = {};

  if (useLocalCa && localCa) options.ca = localCa;

  const callback = (result) => {
    let responseData = '';

    result.setEncoding('utf8');
    result.on('data', (d) => {
      responseData += d;
    }).on('end', () => {
      if (!responseData) {
        resolve();

        return;
      }

      try {
        const responseBody = JSON.parse(responseData);

        resolve(responseBody);
      } catch (e) {
        resolve(responseData);
      }
    });
  };

  const bodyData = (body !== 'undefined') ? JSON.stringify(body) : '';

  if (bodyData) {
    if (!options.headers) options.headers = {};

    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = bodyData.length;
  }

  const request = (url.startsWith('http:'))
    ? http.request(url, options, callback)
    : https.request(url, options, callback);

  request.on('error', (e) => reject(e));

  if (bodyData) request.write(bodyData);

  request.end();
});
