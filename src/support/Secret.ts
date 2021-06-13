import { BaseSupport } from './BaseSupport';

export interface Token {
  token: string
  expires: number
}

interface SecretFile {
  api: Token
  user: Token
}

export class Secret extends BaseSupport {
  private readonly fetchVerifyCalls = 100;
  private readonly fetchVerifyDelay = 100;

  private apitoken: Token = null;
  private usertoken: Token = null;

  private static verifyToken(token: Token): boolean {
    if (token === null) return false;

    const now = new Date().getTime();

    return token.expires >= now;
  }

  async getApiToken(): Promise<string> {
    const name = 'api';
    const initialToken = this.apitoken;

    if (initialToken !== null) {
      if (Secret.verifyToken(initialToken)) {
        return initialToken.token;
      }

      this.s.logger.warn(`Memory ${name} token expired!`);
    } else {
      this.s.logger.log(`Fetch empty ${name} token.`);
    }

    this.apitoken = null;

    const token = await this.s.middleware.twitchEventsub.fetchToken();

    if (!Secret.verifyToken(token)) {
      throw new Error(`Twitch auth returned an invalid ${name} token! ${JSON.stringify(token)}`);
    }

    this.apitoken = token;

    await this.writeToFile();

    return token.token;
  }

  async getUserToken(): Promise<string> {
    const name = 'user';
    const initialToken = this.usertoken;

    if (initialToken !== null) {
      if (Secret.verifyToken(initialToken)) {
        return initialToken.token;
      }

      this.s.logger.warn(`Memory ${name} token expired!`);
    } else {
      this.s.logger.log(`Fetch empty ${name} token.`);
    }

    this.usertoken = null;

    await this.s.middleware.twitchAuthUser.fetchToken();

    let newToken: Token = null;

    for (let i = 0; i < this.fetchVerifyCalls; i++) {
      await this.s.h.delay(this.fetchVerifyDelay);

      newToken = this.usertoken;

      if (newToken !== null) break;
    }

    if (Secret.verifyToken(newToken)) {
      throw new Error(`Twitch auth returned no or an invalid ${name} token! ${JSON.stringify(newToken)}`);
    }

    return newToken.token;
  }

  setUserToken(token: Token): void {
    this.usertoken = token;
  }

  async loadFromFile(): Promise<void> {
    const path = this.s.c.path.user.secret;

    if (!(await this.s.fs.exists(path))) {
      this.s.logger.error('Secret file does not exist!');

      this.apitoken = null;
      this.usertoken = null;

      return;
    }

    const data: SecretFile = await this.s.fs.readObject(path);

    if (data.api && !Secret.verifyToken(data.api)) {
      this.s.logger.warn('Local api token expired!');

      this.apitoken = null;
    } else {
      this.apitoken = data.api;
    }

    if (data.user && !Secret.verifyToken(data.user)) {
      this.s.logger.warn('Local user token expired!');

      this.usertoken = null;
    } else {
      this.usertoken = data.user;
    }
  }

  async writeToFile(): Promise<void> {
    const path = this.s.c.path.user.secret;

    const data: SecretFile = {
      api: this.apitoken,
      user: this.usertoken,
    };

    await this.s.fs.writeObject(path, data);
  }
}
