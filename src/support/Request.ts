import * as http from 'http';
import * as https from 'https';

import { BaseSupport } from './BaseSupport';
import { Dictionary } from '../types/base';

export interface RequestOptions {
  ca?: string
  headers?: Dictionary<any>
  method?: string
}

export class Request extends BaseSupport {

  private localCa: string = '';

  async loadCertificate() {
    const path = this.s.c.path.user.localcertificate;

    if (!(await this.s.fs.exists(path))) {
      this.localCa = '';

      return;
    }

    this.localCa = await this.s.fs.readText(path);
  }

  request(
    url: string,
    options: RequestOptions = {},
    body: any = undefined,
    useLocalCa: boolean = false,
  ): Promise<any> {
    return new Promise(((resolve, reject) => {
      if (!url) throw Error('Invalid url!');

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
