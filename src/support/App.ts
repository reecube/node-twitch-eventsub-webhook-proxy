import * as http from 'http';
import * as https from 'https';

import { FileSystem } from './FileSystem';
import { Config } from './Config';

export class Request {

  private readonly c: Config;

  private readonly fs: FileSystem;

  private localCa!: string;

  constructor(c: Config, fs: FileSystem) {
    this.c = c;
    this.fs = fs;
  }

  async loadCertificate() {
    this.localCa = await this.fs.readText(this.c.path.user.localcertificate);
  }

  request(url, options, body, useLocalCa): Promise<any> {
    return new Promise(((resolve, reject) => {
      if (!url) throw Error('Invalid url!');

      if (!options) options = {};

      if (useLocalCa && this.localCa) options.ca = this.localCa;

      const callback = (result) => {
        let responseData = '';

        result.setEncoding('utf8');
        result.on('data', (d) => {
          responseData += d;
        }).on('end', () => {
          if (!responseData) {
            resolve(undefined);

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
    }));
  }
}
