import { Types } from './data/Types';
import { Scopes } from './data/Scopes';
import { Dictionary } from '../types/base';

class Path {
  private readonly basePathUser = './var';

  readonly user = {
    base: this.basePathUser,
    secret: `${this.basePathUser}/.secret`,
    localcertificate: `${this.basePathUser}/localca.crt`,
  };
}

class TwitchUrlsOauth {
  base = 'https://id.twitch.tv/oauth2';
  authorize = `${this.base}/authorize`;
  token = `${this.base}/token`;
}

class TwitchUrlsApi {
  base = 'https://api.twitch.tv';
  helixUsers = `${this.base}/helix/users`;
  helixEventsub = `${this.base}/helix/eventsub/subscriptions`;
}

class TwitchUrls {
  oauth = new TwitchUrlsOauth();
  api = new TwitchUrlsApi();
}

class TwitchApi {
  types = Types;
  scopes = Scopes;

  makeHeaders(token: string): Dictionary<any> {
    return {
      'Content-Type': 'application/json',
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      'Authorization': 'Bearer ' + token,
    };
  };
}

class Endpoints {
  login = '/login';
  notification = '/notification';
  oauthcallback = '/oauthcallback';
}

export class Config {
  path = new Path();
  twitchUrls = new TwitchUrls();
  twitchApi = new TwitchApi();
  endpoints = new Endpoints();
  broadcasterId!: string;
}
